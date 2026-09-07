"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/topbar";

interface AcousticAnalysis {
  speechRate: number;
  answerLength: number;
  answerDuration: number;
  fillerWords: Record<string, number>;
  silenceSections: number;
}

interface STARAnalysis {
  situation: { present: boolean; comment: string };
  task: { present: boolean; comment: string };
  action: { present: boolean; comment: string };
  result: { present: boolean; comment: string };
}

interface AnalysisData {
  questionType: "behavioral" | "opinion";
  question: string;
  acoustic: AcousticAnalysis;
  star?: STARAnalysis;
  coherence: "good" | "bad";
  feedback: string;
}

const mockData: AnalysisData = {
  questionType: "behavioral",
  question: "팀 프로젝트에서 갈등을 해결한 경험이 있나요?",
  acoustic: {
    speechRate: 87.5,
    answerLength: 90,
    answerDuration: 62,
    fillerWords: { "음": 2, "어": 1 },
    silenceSections: 1,
  },
  star: {
    situation: {
      present: true,
      comment: "백엔드와 프론트엔드 간 API 설계 방향 충돌이라는 구체적인 상황이 명확하게 제시되었습니다.",
    },
    task: {
      present: false,
      comment: "갈등 상황에서 본인이 맡은 구체적인 역할이나 책임이 명확히 드러나지 않았습니다.",
    },
    action: {
      present: true,
      comment: "팀 회의 소집과 중재 역할을 직접 수행했다는 구체적인 행동이 잘 서술되었습니다.",
    },
    result: {
      present: true,
      comment: "합의안 도출과 프로젝트 성공적 완료라는 결과가 명확하게 제시되었습니다.",
    },
  },
  coherence: "good",
  feedback:
    "경험을 구조적으로 잘 서술하셨습니다. 본인의 구체적인 역할(Task)을 더 명확히 언급하면 더욱 설득력 있는 답변이 될 것입니다. \"팀 중재자로서 제가 먼저 ~을 제안했습니다\"와 같이 주도적 역할을 강조해보세요.",
};

export default function InterviewAnalysisPage() {
  const router = useRouter();
  const [data] = useState<AnalysisData>(mockData);
  const [showModal, setShowModal] = useState(false);
  const [currentStage, setCurrentStage] = useState("");
  const [passStatus, setPassStatus] = useState("");

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleSaveChanges = () => {
    if (!currentStage.trim() || !passStatus.trim()) {
      alert("모든 항목을 선택해주세요");
      return;
    }
    alert(`진행 단계: ${currentStage}, 합격 여부: ${passStatus}로 저장되었습니다`);
    setShowModal(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const typeBadgeColor =
    data.questionType === "behavioral"
      ? "bg-blue-50 text-[#034078]"
      : "bg-orange-50 text-orange-700";

  const typeLabel = data.questionType === "behavioral" ? "🎯 행동형 질문" : "💬 의견형 질문";

  const starItems = [
    { key: "situation", label: "Situation", sublabel: "상황 설명" },
    { key: "task", label: "Task", sublabel: "본인 역할" },
    { key: "action", label: "Action", sublabel: "구체적 행동" },
    { key: "result", label: "Result", sublabel: "결과" },
  ];

  return (
    <div className="flex-1 flex flex-col bg-white">
      <TopBar />
      <main className="flex-1 flex justify-center py-8 px-6 bg-gray-50">
        <div className="w-full max-w-4xl">
          <div className="flex flex-col gap-6">
            {/* Question Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                {data.question}
              </h1>
            </div>

            {/* Acoustic Analysis */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-5">
                음향 분석
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Speech Rate */}
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-2">말 속도</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.acoustic.speechRate}
                    <span className="text-xs text-gray-600 font-normal ml-1">
                      어절/분
                    </span>
                  </div>
                  <div className="mt-3 h-1 bg-gray-300 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#034078] rounded-full"
                      style={{ width: "60%" }}
                    />
                  </div>
                  <div className="mt-2 text-xs font-semibold text-gray-600 bg-gray-200 inline-block px-2 py-1 rounded-full">
                    적절
                  </div>
                </div>

                {/* Answer Length */}
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-2">답변 길이</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.acoustic.answerLength}
                    <span className="text-xs text-gray-600 font-normal ml-1">
                      어절
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-gray-600">
                    {data.acoustic.answerDuration}초 분량
                  </div>
                </div>

                {/* Filler Words */}
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-2">필러워드</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(data.acoustic.fillerWords).map(([word, count]) => (
                      <span
                        key={word}
                        className="text-xs font-medium px-2 py-1 bg-gray-200 text-gray-700 rounded-full"
                      >
                        {word} ×{count}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Silence Sections */}
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-2">침묵 구간</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.acoustic.silenceSections}
                    <span className="text-xs text-gray-600 font-normal ml-1">회</span>
                  </div>
                  <div className="mt-3 text-xs text-gray-600">
                    1.5초 이상 기준
                  </div>
                </div>
              </div>
            </div>

            {/* STAR Analysis (Conditional) */}
            {data.star && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-5">
                  STAR 구조 분석
                </h2>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {starItems.map((item) => {
                    const starData = data.star![item.key as keyof STARAnalysis];
                    const isPresent = starData.present;

                    return (
                      <div
                        key={item.key}
                        className={`rounded-lg p-4 border ${
                          isPresent
                            ? "bg-gray-50 border-gray-300"
                            : "bg-gray-50 border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {item.label}
                            </div>
                            <div className="text-xs text-gray-600">
                              {item.sublabel}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-700 leading-relaxed">
                          {starData.comment}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Coherence */}
                <div className="border-t border-gray-200 pt-5">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    논리 흐름
                  </h3>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 border border-gray-300 bg-white">
                    논리 흐름 양호
                  </div>
                </div>
              </div>
            )}

            {/* Non-behavioral Question Notice */}
            {!data.star && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-5">
                  내용 분석
                </h2>

                <div className="flex items-start gap-3 p-4 bg-gray-100 border border-gray-300 rounded-lg mb-5">
                  <div className="text-xs text-gray-700 leading-relaxed">
                    의견형 질문은 STAR 구조보다 <strong>주장 → 근거 → 사례</strong>
                    의 흐름이 중요합니다. STAR 체크리스트 대신 종합 피드백을
                    참고하세요.
                  </div>
                </div>

                {/* Coherence */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    논리 흐름
                  </h3>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 border border-gray-300 bg-white">
                    논리 흐름 양호
                  </div>
                </div>
              </div>
            )}

            {/* Comprehensive Feedback */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-5">
                종합 피드백
              </h2>

              <div className="p-4">
                <p className="text-sm text-gray-800 leading-relaxed">
                  {data.feedback}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => router.back()}
                className="flex-1 border border-gray-300 text-gray-900 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                뒤로 가기
              </button>
              <button
                onClick={handleOpenModal}
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
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              진행 결과 수정
            </h2>

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
                onClick={handleCloseModal}
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
