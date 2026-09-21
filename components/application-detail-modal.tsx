"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateStageResult, getApplicationDetail, getRetrospects } from "@/lib/api";
import type { ApplicationDetailResponse } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { buildStageResult, getNextStageLabel } from "@/lib/stage";

interface Stage {
  id: number;
  name: string;
  status: "합격" | "탈락" | "진행중" | "대기";
}

interface RecordItem {
  id: number;
  title: string;
  description: string;
}

interface ApplicationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string | number;
  company: string;
  position: string;
  currentStage: string;
  stageStatus: string;
}

const ALL_STAGES = ["서류전형", "코딩테스트", "1차면접", "2차면접", "최종면접"];

// 예상 질문과 스피치 연습은 지원 현황(application_id) 단위로 저장되므로 전형 단계와 무관하다.
// 단계별로 쪼개면 같은 질문 목록이 단계 수만큼 중복 노출되므로 지원 현황당 하나씩만 둔다.
const EXTRACT_QUESTIONS_ID = 1001;
const PRACTICE_INTERVIEW_ID = 1002;

const EXTRACT_QUESTIONS_ITEM: RecordItem = {
  id: EXTRACT_QUESTIONS_ID,
  title: "예상 질문 추출하기",
  description: "자기소개서로 예상 질문을 만들어요",
};

const PRACTICE_INTERVIEW_ITEM: RecordItem = {
  id: PRACTICE_INTERVIEW_ID,
  title: "면접 연습하기",
  description: "추출한 질문으로 연습해요",
};

// 회고는 면접 회차(1차/2차/최종)마다 별도 세션이라 단계별로 유지한다.
const STAGE_RECORDS: { [key: string]: RecordItem[] } = {
  서류전형: [],
  코딩테스트: [],
  "1차면접": [{ id: 12, title: "1차 면접 회고", description: "지난 면접을 회고해요" }],
  "2차면접": [{ id: 16, title: "2차 면접 회고", description: "지난 면접을 회고해요" }],
  "최종면접": [{ id: 19, title: "최종 면접 회고", description: "지난 면접을 회고해요" }],
};

// 서버 타임라인(PASS/FAIL/IN_PROGRESS 또는 한글)을 화면용 단계 목록으로 변환한다.
function mapTimelineToStages(
  timeline: Array<{ stage: string; status: string }>
): Stage[] {
  return ALL_STAGES.map((stageName, idx) => {
    const raw = timeline.find((t) => t.stage === stageName)?.status ?? "";
    const normalized = raw.toUpperCase();

    let status: Stage["status"] = "대기";
    if (normalized === "PASS" || normalized === "합격") {
      status = "합격";
    } else if (normalized === "FAIL" || normalized === "탈락") {
      status = "탈락";
    } else if (normalized === "IN_PROGRESS" || normalized.includes("진행")) {
      status = "진행중";
    }

    return { id: idx + 1, name: stageName, status };
  });
}

const stageColorMap = {
  "합격": "bg-[#43AA8B]",
  "탈락": "bg-[#EE6055]",
  "진행중": "bg-[#F7B538]",
  "대기": "bg-gray-300",
};

export default function ApplicationDetailModal({
  isOpen,
  onClose,
  applicationId,
  company,
  position,
  currentStage,
  stageStatus,
}: ApplicationDetailModalProps) {
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>([]);
  const [displayStage, setDisplayStage] = useState(currentStage);
  const [displayStatus, setDisplayStatus] = useState<string | null>(stageStatus);
  // 기능 활성화/분기 판단은 전부 서버가 내려준 플래그를 따른다.
  const [detail, setDetail] = useState<ApplicationDetailResponse | null>(null);
  const [completedItems, setCompletedItems] = useState<{
    [key: string]: boolean;
  }>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const loadApplicationDetail = async () => {
      try {
        const token = getAccessToken();
        if (!token) return;

        const detail = await getApplicationDetail(applicationId.toString(), token);

        setDetail(detail);
        setStages(mapTimelineToStages(detail.timeline));
        setDisplayStage(detail.current_stage ?? currentStage);
        setDisplayStatus(detail.status);

        // 회고 완료 상태 반영
        const newCompletedItems: { [key: number]: boolean } = {};
        if (detail.first_retrospect_completed) {
          newCompletedItems[12] = true; // 1차 면접 회고
        }
        if (detail.second_retrospect_completed) {
          newCompletedItems[16] = true; // 2차 면접 회고
        }
        if (detail.final_retrospect_completed) {
          newCompletedItems[19] = true; // 최종 면접 회고
        }
        setCompletedItems(newCompletedItems);
      } catch (error) {
        console.error("Failed to load application detail:", error);

        // 폴백: props 데이터로 기본 타임라인 생성
        const currentIdx = ALL_STAGES.indexOf(currentStage);
        const newStages = ALL_STAGES.map((stageName, idx) => {
          let status: "합격" | "탈락" | "진행중" | "대기";
          if (idx < currentIdx) {
            status = "합격";
          } else if (idx === currentIdx) {
            status = stageStatus === "진행중" ? "진행중" : "합격";
          } else {
            status = "대기";
          }
          return { id: idx + 1, name: stageName, status };
        });
        setStages(newStages);
      }
    };

    if (isOpen && applicationId) {
      loadApplicationDetail();
    }
  }, [isOpen, applicationId, currentStage, stageStatus]);

  // 현재 stage 이하의 모든 stage가 활성화되도록 변경
  const getActivatedStages = (): string[] => {
    const currentIdx = ALL_STAGES.indexOf(currentStage);
    if (currentIdx === -1) return [];
    return ALL_STAGES.slice(0, currentIdx + 1);
  };

  // 스피치 게이팅은 서버 판정을 그대로 따른다.
  // 화면에서 다시 계산하면 버튼은 열려 있는데 호출은 403/409 나는 상태가 생긴다.
  const speechAvailable = detail?.speech_practice_available ?? false;
  const questionsCreated = detail?.speech_practice_created ?? false;

  // 회고 활성화: 완료된(합격/탈락) 단계
  const isRetrospectActive = (stageName: string): boolean => {
    if (!getActivatedStages().includes(stageName)) return false;
    const stageObj = stages.find((s) => s.name === stageName);
    if (!stageObj) return false;
    return stageObj.status === "합격" || stageObj.status === "탈락";
  };

  const handleRetrospectClick = async (stageName: string, itemId: number) => {
    // 이미 끝낸 회고는 분석 페이지로 보낸다.
    if (completedItems[itemId]) {
      try {
        const token = getAccessToken();
        if (!token) {
          alert("로그인이 필요합니다");
          return;
        }

        const retrospects = await getRetrospects(applicationId.toString(), token);
        const completedSession = retrospects.sessions?.find(
          (session) => session.stage === stageName && session.ended_at
        );

        if (!completedSession) {
          alert("회고 세션을 찾을 수 없습니다");
          return;
        }

        router.push(`/retrospective/${completedSession.session_id}/analysis`);
      } catch (error) {
        alert(error instanceof Error ? error.message : "분석 페이지 이동 실패");
      }
      return;
    }

    setCompletedItems((prev) => ({ ...prev, [itemId]: true }));
    router.push(`/retrospective?applicationId=${applicationId}`);
  };

  interface DisplayRecord {
    key: string;
    stageLabel?: string;
    item: RecordItem;
    isDisabled: boolean;
    isCompleted: boolean;
    disabledReason: string;
    onSelect: () => void;
  }

  const buildRecords = (): DisplayRecord[] => {
    const unavailable = "현재 전형 단계에서는 사용할 수 없어요";

    // 지원 현황 단위 항목: 단계와 무관하게 한 번만 노출한다.
    const records: DisplayRecord[] = [
      {
        key: "extract-questions",
        item: EXTRACT_QUESTIONS_ITEM,
        // 추출은 최초 1회뿐이다. 이미 질문이 있으면 완료로 접고 다시 누르지 못하게 한다.
        isDisabled: !speechAvailable || questionsCreated,
        isCompleted: questionsCreated,
        disabledReason: questionsCreated ? "이미 예상 질문을 추출했어요" : unavailable,
        onSelect: () =>
          router.push(`/applications/${applicationId}/extract-questions`),
      },
      {
        key: "practice-interview",
        item: PRACTICE_INTERVIEW_ITEM,
        // 연습은 질문이 있어야 하고, 횟수 제한이 없으므로 완료로 접지 않는다.
        isDisabled: !speechAvailable || !questionsCreated,
        isCompleted: false,
        disabledReason: !speechAvailable
          ? unavailable
          : "예상 질문을 먼저 추출해주세요",
        onSelect: () =>
          router.push(`/interview-practice?applicationId=${applicationId}`),
      },
    ];

    // 단계별 항목(회고)
    getActivatedStages().forEach((stageName) => {
      (STAGE_RECORDS[stageName] ?? []).forEach((item) => {
        records.push({
          key: `${stageName}-${item.id}`,
          stageLabel: stageName,
          item,
          isDisabled: !isRetrospectActive(stageName),
          isCompleted: Boolean(completedItems[item.id]),
          disabledReason: unavailable,
          onSelect: () => handleRetrospectClick(stageName, item.id),
        });
      });
    });

    return records;
  };

  const handleEditStage = () => {
    setShowEditModal(true);
  };

  const handleUpdateStage = () => {
    setShowEditModal(false);
    setShowPassModal(true);
  };

  const handlePassSelection = async (selectedResult: "합격" | "탈락") => {
    setIsUpdating(true);

    try {
      const token = getAccessToken();
      if (!token) {
        return;
      }

      await updateStageResult(
        applicationId.toString(),
        buildStageResult(displayStage, selectedResult === "합격"),
        token
      );

      // 서버가 계산한 타임라인/현재 단계를 그대로 따른다
      const updatedDetail = await getApplicationDetail(
        applicationId.toString(),
        token
      );

      setDetail(updatedDetail);
      setStages(mapTimelineToStages(updatedDetail.timeline));
      setDisplayStage(updatedDetail.current_stage ?? currentStage);
      setDisplayStatus(updatedDetail.status);
      setShowPassModal(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "단계 업데이트 실패");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStageClick = async (stageId: number) => {
    const stageIndex = stageId - 1;
    const clickedStage = ALL_STAGES[stageIndex];
    const clickedStageObj = stages.find((s) => s.id === stageId);

    if (!clickedStageObj) return;

    // 다음 상태 결정
    let nextStatus: "대기" | "진행중" | "합격" | "탈락";
    if (clickedStageObj.status === "대기") {
      nextStatus = "진행중";
    } else if (clickedStageObj.status === "진행중") {
      nextStatus = "합격";
    } else {
      nextStatus = "대기";
    }

    // '대기'는 저장하지 않는다 (행이 없으면 대기)
    if (nextStatus === "대기") return;

    try {
      const token = getAccessToken();
      if (!token) {
        return;
      }

      await updateStageResult(
        applicationId.toString(),
        { stage: clickedStage, status: nextStatus },
        token
      );

      // 포인터 이동 규칙은 서버가 판단하므로 응답을 다시 읽어 반영한다
      const updatedDetail = await getApplicationDetail(
        applicationId.toString(),
        token
      );

      setDetail(updatedDetail);
      setStages(mapTimelineToStages(updatedDetail.timeline));
      setDisplayStage(updatedDetail.current_stage ?? currentStage);
      setDisplayStatus(updatedDetail.status);
    } catch (error) {
      alert(error instanceof Error ? error.message : "단계 업데이트 실패");
    }
  };

  const generateGradient = () => {
    const completedCount = stages.filter((s) => s.status === "합격").length;
    const ongoingCount = stages.filter((s) => s.status === "진행중").length;
    const totalStages = stages.length;

    const completedPercent = (completedCount / totalStages) * 100;
    const ongoingPercent = ((completedCount + (ongoingCount > 0 ? 1 : 0)) / totalStages) * 100;

    const colors = [
      `rgb(67, 170, 139) 0%`,
      `rgb(67, 170, 139) ${completedPercent}%`,
      ongoingCount > 0
        ? `rgb(247, 181, 56) ${completedPercent}%`
        : `rgb(209, 213, 219) ${completedPercent}%`,
      ongoingCount > 0
        ? `rgb(247, 181, 56) ${ongoingPercent}%`
        : `rgb(209, 213, 219) ${ongoingPercent}%`,
      `rgb(209, 213, 219) ${ongoingPercent}%`,
      `rgb(209, 213, 219) 100%`,
    ];

    return `linear-gradient(to bottom, ${colors.join(", ")})`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#034078] to-[#023456] px-8 py-8 flex items-center justify-between rounded-t-3xl">
          <div>
            <p className="text-white text-2xl font-bold">{company}</p>
            <p className="text-blue-100 text-lg mt-1">{position}</p>
          </div>
          <button
            onClick={handleEditStage}
            disabled={stages.find((s) => s.name === currentStage)?.status === "탈락"}
            className="bg-white text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-sm disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-600"
          >
            진행 단계 수정
          </button>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-white text-2xl hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex gap-8">
          {/* Left: Stage progress */}
          <div className="flex-shrink-0 w-80">
            <h3 className="text-lg font-bold text-gray-900 mb-8">전형 진행 단계</h3>
            <div className="relative">
              {/* Timeline background line - dynamic based on stages */}
              <div
                className="absolute left-5 top-0 bottom-0 w-1"
                style={{
                  backgroundImage: generateGradient(),
                }}
              />

              {/* Stage items */}
              <div className="flex flex-col">
                {stages.map((stage, idx) => (
                  <button
                    key={stage.id}
                    onClick={() => handleStageClick(stage.id)}
                    className="flex items-start gap-6 pb-8 relative hover:opacity-80 transition-opacity text-left"
                  >
                    {/* Dot */}
                    <div
                      className={`${stageColorMap[stage.status]} w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 shadow-md cursor-pointer`}
                    >
                      {(stage.status === "합격") && (
                        <span className="text-white font-bold text-lg">✓</span>
                      )}
                    </div>

                    {/* Stage info */}
                    <div className="pt-1 flex-1">
                      <p className="text-gray-900 font-bold text-base">{stage.name}</p>
                      <div className="mt-2">
                        {stage.status === "합격" && (
                          <span className="inline-block text-xs bg-green-100 text-[#43AA8B] px-3 py-1.5 rounded-full font-semibold">
                            합격
                          </span>
                        )}
                        {stage.status === "탈락" && (
                          <span className="inline-block text-xs bg-red-100 text-[#EE6055] px-3 py-1.5 rounded-full font-semibold">
                            탈락
                          </span>
                        )}
                        {stage.status === "진행중" && (
                          <span className="inline-block text-xs bg-amber-100 text-[#F7B538] px-3 py-1.5 rounded-full font-semibold">
                            진행중
                          </span>
                        )}
                        {stage.status === "대기" && (
                          <span className="inline-block text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-semibold">
                            예정
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Recording section */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-6">기록하기</h3>

            {(() => {
              const records = buildRecords();
              const ongoing = records.filter((r) => !r.isCompleted);
              const completed = records.filter((r) => r.isCompleted);

              const renderRecord = (record: DisplayRecord) => (
                <button
                  key={record.key}
                  onClick={() => !record.isDisabled && record.onSelect()}
                  disabled={record.isDisabled}
                  className={`border rounded-xl p-4 transition-colors text-left ${
                    record.isDisabled
                      ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-50"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                  title={record.isDisabled ? record.disabledReason : ""}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      {record.stageLabel && (
                        <p className="text-xs text-gray-500 mb-1">
                          {record.stageLabel}
                        </p>
                      )}
                      <p className="font-semibold text-gray-900">
                        {record.item.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {record.item.description}
                      </p>
                    </div>
                    {record.isCompleted ? (
                      <span className="shrink-0 text-xs bg-blue-100 text-[#034078] px-3 py-1.5 rounded-full font-semibold">
                        완료
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xl">›</span>
                    )}
                  </div>
                </button>
              );

              return (
                <>
                  <div className="flex flex-col gap-4 mb-8">
                    {ongoing.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        지금 할 수 있는 활동이 없습니다.
                      </p>
                    ) : (
                      ongoing.map(renderRecord)
                    )}
                  </div>

                  {completed.length > 0 && (
                    <>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        완료된 기록
                      </h3>
                      <div className="flex flex-col gap-4">
                        {completed.map(renderRecord)}
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center px-6 z-[60]">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {company}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              현재 단계: {displayStage}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                다음 단계로 진행하려면 현재 단계를 완료로 표시해주세요.
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {displayStage} → {getNextStageLabel(displayStage)}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isUpdating}
                className="flex-1 border border-gray-300 text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                onClick={handleUpdateStage}
                disabled={isUpdating}
                className="flex-1 bg-[#034078] text-white font-semibold py-3 rounded-xl hover:bg-[#023456] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? "진행중..." : "완료 표시"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pass/Fail Modal */}
      {showPassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center px-6 z-[60]">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {company}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {displayStage} 결과를 선택해주세요
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => handlePassSelection("합격")}
                disabled={isUpdating}
                className="flex-1 bg-[#43AA8B] text-white font-semibold py-3 rounded-xl hover:bg-[#3a9a7a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="pass-button"
              >
                합격
              </button>
              <button
                onClick={() => handlePassSelection("탈락")}
                disabled={isUpdating}
                className="flex-1 bg-[#EE6055] text-white font-semibold py-3 rounded-xl hover:bg-[#dd5447] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="fail-button"
              >
                탈락
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
