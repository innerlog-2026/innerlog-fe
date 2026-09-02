"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateStageResult, getApplicationDetail } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

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

const STAGE_RECORDS: {
  [key: string]: {
    ongoing: RecordItem[];
    completed: RecordItem[];
  };
} = {
  서류전형: {
    ongoing: [
      { id: 1, title: "예상 질문 추출하기", description: "예상되는 질문들을 미리 준비해요" },
      { id: 2, title: "1차 면접 연습", description: "면접을 대비해 연습해요" },
    ],
    completed: [
      { id: 3, title: "예상 질문 추출하기", description: "예상되는 질문들을 미리 준비해요" },
      { id: 4, title: "1차 면접 연습", description: "면접을 대비해 연습해요" },
    ],
  },
  코딩테스트: {
    ongoing: [
      { id: 5, title: "예상 질문 추출하기", description: "예상되는 질문들을 미리 준비해요" },
      { id: 6, title: "1차 면접 연습", description: "면접을 대비해 연습해요" },
    ],
    completed: [
      { id: 7, title: "예상 질문 추출하기", description: "예상되는 질문들을 미리 준비해요" },
      { id: 8, title: "1차 면접 연습", description: "면접을 대비해 연습해요" },
    ],
  },
  "1차면접": {
    ongoing: [
      { id: 9, title: "예상 질문 추출하기", description: "예상되는 질문들을 미리 준비해요" },
      { id: 10, title: "1차 면접 연습", description: "면접을 대비해 연습해요" },
    ],
    completed: [
      { id: 11, title: "예상 질문 추출하기", description: "예상되는 질문들을 미리 준비해요" },
      { id: 12, title: "1차 면접 회고", description: "지난 면접을 회고해요" },
      { id: 13, title: "2차 면접 연습", description: "다음 면접을 대비해요" },
    ],
  },
  "2차면접": {
    ongoing: [
      { id: 14, title: "예상 질문 추출하기", description: "예상되는 질문들을 미리 준비해요" },
      { id: 15, title: "2차 면접 연습", description: "면접을 대비해 연습해요" },
    ],
    completed: [
      { id: 16, title: "2차 면접 회고", description: "지난 면접을 회고해요" },
    ],
  },
  "최종면접": {
    ongoing: [
      { id: 17, title: "예상 질문 추출하기", description: "예상되는 질문들을 미리 준비해요" },
      { id: 18, title: "최종 면접 연습", description: "면접을 대비해 연습해요" },
    ],
    completed: [
      { id: 19, title: "최종 면접 회고", description: "지난 면접을 회고해요" },
    ],
  },
};

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
  const [displayStatus, setDisplayStatus] = useState(stageStatus);
  const [completedItems, setCompletedItems] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    const loadApplicationDetail = async () => {
      try {
        const token = getAccessToken();
        if (!token) return;

        const detail = await getApplicationDetail(applicationId.toString(), token);
        console.log("API Response:", detail);
        console.log("Timeline:", detail.timeline);

        // timeline 데이터로부터 stages 생성
        const newStages = ALL_STAGES.map((stageName, idx) => {
          const timelineItem = detail.timeline.find(t => t.stage === stageName);
          console.log(`Stage: ${stageName}, TimelineItem:`, timelineItem);

          // API 응답의 status 값을 한글로 변환 (PASS→합격, FAIL→탈락, IN_PROGRESS→진행중)
          let status: "합격" | "탈락" | "진행중" | "대기" = "대기";
          if (timelineItem?.status) {
            const apiStatus = timelineItem.status.toUpperCase();
            if (apiStatus === "PASS") {
              status = "합격";
            } else if (apiStatus === "FAIL") {
              status = "탈락";
            } else if (apiStatus === "IN_PROGRESS") {
              status = "진행중";
            } else if (apiStatus === "진행중") {
              status = "진행중";
            } else if (apiStatus === "합격") {
              status = "합격";
            } else if (apiStatus === "탈락") {
              status = "탈락";
            }
          }

          return { id: idx + 1, name: stageName, status };
        });

        console.log("Generated stages:", newStages);
        setStages(newStages);
        setDisplayStage(detail.current_stage);
        setDisplayStatus(
          detail.status === "IN_PROGRESS"
            ? "진행중"
            : detail.status === "COMPLETED"
            ? "완료"
            : "준비중"
        );
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

  const handleRecordItemClick = (itemTitle: string) => {
    if (itemTitle === "예상 질문 추출하기") {
      router.push(`/applications/${applicationId}/extract-questions`);
    } else if (itemTitle.includes("연습")) {
      router.push(`/interview-practice?applicationId=${applicationId}`);
    } else if (itemTitle.includes("회고")) {
      router.push(`/retrospective?applicationId=${applicationId}`);
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

    try {
      const token = getAccessToken();
      if (!token) {
        return;
      }

      // API 호출로 상태 업데이트 (대기는 저장하지 않음)
      if (nextStatus === "대기") {
        return;
      }

      const statusMap: Record<"진행중" | "합격" | "탈락", string> = {
        "진행중": "IN_PROGRESS",
        "합격": "PASS",
        "탈락": "FAIL",
      };

      await updateStageResult(
        applicationId.toString(),
        {
          stage: clickedStage,
          status: statusMap[nextStatus],
        },
        token
      );

      // UI 업데이트
      setStages((prevStages) =>
        prevStages.map((stage) => {
          if (stage.id === stageId) {
            return { ...stage, status: nextStatus };
          } else if (stage.id < stageId && nextStatus === "합격") {
            return { ...stage, status: "합격" };
          } else if (stage.id > stageId && nextStatus === "진행중") {
            return { ...stage, status: "진행중" };
          }
          return stage;
        })
      );

      // 디스플레이 업데이트
      if (nextStatus === "진행중") {
        const nextOngoingStage = stages.find((s) => s.status === "진행중");
        if (nextOngoingStage) {
          setDisplayStage(nextOngoingStage.name);
          setDisplayStatus("진행중");
        }
      } else {
        setDisplayStage(clickedStage);
        setDisplayStatus(nextStatus);
      }
    } catch (error) {
      console.error("Failed to update stage:", error);
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
          <div className="bg-white rounded-2xl px-6 py-3 flex flex-col items-center">
            <p className="text-sm font-semibold text-gray-700">{displayStage}</p>
            <p className="text-base font-bold text-[#034078]">{displayStatus}</p>
          </div>
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
            <div className="flex flex-col gap-4 mb-8">
              {(() => {
                const ongoingStage = stages.find((s) => s.status === "진행중");
                if (!ongoingStage) return null;
                const records =
                  STAGE_RECORDS[ongoingStage.name]?.ongoing || [];
                return records.map((item) => {
                  const isDisabled =
                    item.title.includes("연습") &&
                    !completedItems["예상 질문 추출하기"];
                  return (
                    <button
                      key={item.id}
                      onClick={() => !isDisabled && handleRecordItemClick(item.title)}
                      disabled={isDisabled}
                      className={`border rounded-xl p-4 transition-colors text-left ${
                        isDisabled
                          ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-50"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                        </div>
                        <span className="text-gray-400 text-xl">›</span>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>

            {/* Completed records section */}
            {(() => {
              const completedStages = stages.filter((s) => s.status === "합격");
              if (completedStages.length === 0) return null;
              const lastCompletedStage = completedStages[completedStages.length - 1];
              const records =
                STAGE_RECORDS[lastCompletedStage.name]?.completed || [];
              return (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">완료된 기록</h3>
                  <div className="flex flex-col gap-4">
                    {records.map((item) => {
                      const isDisabled =
                        item.title.includes("연습") &&
                        !completedItems["예상 질문 추출하기"];
                      return (
                        <button
                          key={item.id}
                          onClick={() =>
                            !isDisabled && handleRecordItemClick(item.title)
                          }
                          disabled={isDisabled}
                          className={`border rounded-xl p-4 transition-colors text-left ${
                            isDisabled
                              ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-50"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {item.title}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {item.description}
                              </p>
                            </div>
                            <span className="text-gray-400 text-xl">›</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
