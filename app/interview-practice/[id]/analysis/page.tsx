"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TopBar from "@/components/topbar";
import {
  loadSpeechAnalysis,
  subscribeSpeechAnalysis,
} from "@/lib/speech-analysis-store";
import { hasStarAnalysis } from "@/lib/api";
import type { SpeechAnalysisResponse, StarItem } from "@/lib/api";

const STAR_ITEMS = [
  { key: "situation", label: "Situation", sublabel: "상황 설명" },
  { key: "task", label: "Task", sublabel: "본인 역할" },
  { key: "action", label: "Action", sublabel: "구체적 행동" },
  { key: "result", label: "Result", sublabel: "결과" },
] as const;

function formatNumber(value: number | null, fractionDigits = 0): string {
  if (value === null || Number.isNaN(value)) return "-";
  return value.toFixed(fractionDigits);
}

export default function InterviewAnalysisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submissionId");

  // sessionStorage 는 서버에 없으므로 서버 스냅샷은 undefined = "아직 모름"으로 두고,
  // 클라이언트에서 읽은 뒤 결과(객체) 또는 없음(null)으로 확정한다.
  const data = useSyncExternalStore<SpeechAnalysisResponse | null | undefined>(
    subscribeSpeechAnalysis,
    () => loadSpeechAnalysis(submissionId),
    () => undefined
  );
  const isLoading = data === undefined;

  const [showModal, setShowModal] = useState(false);
  const [currentStage, setCurrentStage] = useState("");
  const [passStatus, setPassStatus] = useState("");

  const handleSaveChanges = () => {
    if (!currentStage.trim() || !passStatus.trim()) {
      alert("모든 항목을 선택해주세요");
      return;
    }
    alert(`진행 단계: ${currentStage}, 합격 여부: ${passStatus}로 저장되었습니다`);
    setShowModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <TopBar />
        <main className="flex-1 flex justify-center items-center py-12 px-6 bg-gray-50">
          <p className="text-gray-500">분석 결과를 불러오는 중...</p>
        </main>
      </div>
    );
  }

  // 결과는 제출 응답에만 실려 오므로, 탭을 새로 열면 되살릴 방법이 없다.
  if (!data) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <TopBar />
        <main className="flex-1 flex justify-center items-center py-12 px-6 bg-gray-50">
          <div role="alert" className="max-w-md text-center">
            <p className="text-base font-medium text-gray-900">
              분석 결과를 불러올 수 없어요
            </p>
            <p className="text-sm text-gray-600 mt-2">
              결과는 답변을 제출한 탭에서만 볼 수 있어요. 다시 연습해보시겠어요?
            </p>
            <button
              type="button"
              onClick={() => router.back()}
              className="mt-4 text-sm font-medium text-[#034078] underline"
            >
              뒤로 가기
            </button>
          </div>
        </main>
      </div>
    );
  }

  const { acoustic, content, feedback } = data;
  const star = content.star_score;
  const showStar = hasStarAnalysis(content);
  const fillerWords = Object.entries(acoustic.filler_words ?? {});
  const keywordRepeat = Object.entries(content.keyword_repeat ?? {});
  const overall = feedback.overall ?? content.overall ?? null;

  const isBehavioral = content.question_type === "행동형";
  const typeBadgeColor = isBehavioral
    ? "bg-blue-50 text-[#034078]"
    : "bg-orange-50 text-orange-700";

  return (
    <div className="flex-1 flex flex-col bg-white">
      <TopBar />
      <main className="flex-1 flex justify-center py-8 px-6 bg-gray-50">
        <div className="w-full max-w-4xl">
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">분석 결과</h1>
              {content.question_type && (
                <span
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full ${typeBadgeColor}`}
                >
                  {content.question_type} 질문
                </span>
              )}
            </div>

            {/* Acoustic Analysis */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-5">
                음향 분석
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-2">말 속도</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(acoustic.speed_wpm, 1)}
                    <span className="text-xs text-gray-600 font-normal ml-1">
                      어절/분
                    </span>
                  </div>
                  {acoustic.speed_label && (
                    <div className="mt-3 text-xs text-gray-700 leading-relaxed">
                      {acoustic.speed_label}
                    </div>
                  )}
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-2">답변 길이</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(acoustic.word_count)}
                    <span className="text-xs text-gray-600 font-normal ml-1">
                      어절
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-gray-600">
                    {formatNumber(acoustic.duration_sec, 1)}초 분량
                  </div>
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-2">필러워드</div>
                  {fillerWords.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {fillerWords.map(([word, count]) => (
                        <span
                          key={word}
                          className="text-xs font-medium px-2 py-1 bg-gray-200 text-gray-700 rounded-full"
                        >
                          {word} ×{count}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 mt-2">
                      사용하지 않았어요
                    </div>
                  )}
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-2">침묵 구간</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(acoustic.silence_count)}
                    <span className="text-xs text-gray-600 font-normal ml-1">회</span>
                  </div>
                  <div className="mt-3 text-xs text-gray-600">1.5초 이상 기준</div>
                </div>
              </div>
            </div>

            {/* Content Analysis */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-5">
                {showStar ? "STAR 구조 분석" : "내용 분석"}
              </h2>

              {showStar && star ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  {STAR_ITEMS.map((item) => {
                    const value: StarItem | null = star[item.key];
                    return (
                      <div
                        key={item.key}
                        className={`rounded-lg p-4 border ${
                          value?.present
                            ? "bg-blue-50 border-[#034078]"
                            : "bg-gray-50 border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {item.label}
                            </div>
                            <div className="text-xs text-gray-600">
                              {item.sublabel}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                              value?.present
                                ? "bg-[#034078] text-white"
                                : "bg-gray-300 text-gray-700"
                            }`}
                          >
                            {value?.present ? "포함" : "미흡"}
                          </span>
                        </div>
                        {value?.comment && (
                          <div className="text-xs text-gray-700 leading-relaxed">
                            {value.comment}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg mb-5">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {content.question_type ?? "이 유형의"} 질문은 STAR 구조보다{" "}
                    <strong>주장 → 근거 → 사례</strong>의 흐름이 중요해요. STAR
                    체크리스트 대신 아래 종합 피드백을 참고하세요.
                  </p>
                </div>
              )}

              {feedback.star_overall && (
                <div className="mb-5 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {feedback.star_overall}
                  </p>
                </div>
              )}

              {/* Coherence */}
              <div className="border-t border-gray-200 pt-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  논리 흐름
                </h3>
                {content.coherence?.summary && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 border border-gray-300 bg-white">
                    {content.coherence.summary}
                  </div>
                )}
                {(feedback.coherence_detail ?? content.coherence?.detail) && (
                  <p className="text-sm text-gray-700 leading-relaxed mt-3">
                    {feedback.coherence_detail ?? content.coherence?.detail}
                  </p>
                )}
              </div>

              {/* 반복 키워드 */}
              {keywordRepeat.length > 0 && (
                <div className="border-t border-gray-200 pt-5 mt-5">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    반복된 표현
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {keywordRepeat.map(([word, count]) => (
                      <span
                        key={word}
                        className="text-xs font-medium px-2 py-1 bg-gray-200 text-gray-700 rounded-full"
                      >
                        {word} ×{count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 약점 노출 표현 */}
              {content.negative_reframe?.detected && (
                <div className="border-t border-gray-200 pt-5 mt-5">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    다시 말해보면 좋을 표현
                  </h3>
                  {content.negative_reframe.expressions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {content.negative_reframe.expressions.map((expression) => (
                        <span
                          key={expression}
                          className="text-xs font-medium px-2 py-1 bg-orange-50 text-orange-700 rounded-full"
                        >
                          {expression}
                        </span>
                      ))}
                    </div>
                  )}
                  {content.negative_reframe.feedback && (
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {content.negative_reframe.feedback}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Comprehensive Feedback */}
            {overall && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-5">
                  종합 피드백
                </h2>
                <p className="text-sm text-gray-800 leading-relaxed">{overall}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => router.back()}
                className="flex-1 border border-gray-300 text-gray-900 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                뒤로 가기
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex-1 bg-[#034078] text-white font-semibold py-3 rounded-lg hover:bg-[#023456] transition-colors"
              >
                진행 결과 수정
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center px-6 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-6">진행 결과 수정</h2>

            <div className="mb-5">
              <label className="text-sm font-semibold text-gray-900 block mb-2">
                현재 진행 단계
              </label>
              <input
                type="text"
                value={currentStage}
                onChange={(e) => setCurrentStage(e.target.value)}
                placeholder="진행 단계를 입력하세요"
                className="w-full bg-gray-100 rounded-lg px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#034078] focus:bg-white transition-colors"
              />
            </div>

            <div className="mb-7">
              <label className="text-sm font-semibold text-gray-900 block mb-2">
                합격 여부
              </label>
              <input
                type="text"
                value={passStatus}
                onChange={(e) => setPassStatus(e.target.value)}
                placeholder="합격 여부를 입력하세요"
                className="w-full bg-gray-100 rounded-lg px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#034078] focus:bg-white transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-300 text-gray-900 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveChanges}
                className="flex-1 bg-[#034078] text-white font-semibold py-3 rounded-lg hover:bg-[#023456] transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
