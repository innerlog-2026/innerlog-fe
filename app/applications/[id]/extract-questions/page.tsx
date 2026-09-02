"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import TopBar from "@/components/topbar";
import { getAccessToken } from "@/lib/auth";
import { getApplicationDetail, createSpeechPractice } from "@/lib/api";

interface QuestionSet {
  id: string;
  question: string;
  answer: string;
}

interface ApplicationData {
  company_name: string;
  position: string;
}

export default function ExtractQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id;

  const [applicationData, setApplicationData] = useState<ApplicationData | null>(
    null
  );
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([
    { id: "1", question: "", answer: "" },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadApplicationData = async () => {
      try {
        const token = getAccessToken();
        if (!token || !applicationId) {
          router.push("/login");
          return;
        }

        const response = await getApplicationDetail(
          applicationId.toString(),
          token
        );
        setApplicationData({
          company_name: response.company_name,
          position: response.position,
        });
      } catch (err) {
        console.error("Failed to load application data:", err);
        setError("지원 정보를 불러올 수 없습니다");
      } finally {
        setIsLoading(false);
      }
    };

    loadApplicationData();
  }, [applicationId, router]);

  const handleQuestionChange = (
    id: string,
    field: "question" | "answer",
    value: string
  ) => {
    setQuestionSets((prev) =>
      prev.map((qs) => (qs.id === id ? { ...qs, [field]: value } : qs))
    );
  };

  const handleAddQuestion = () => {
    const newId = Date.now().toString();
    setQuestionSets((prev) => [
      ...prev,
      { id: newId, question: "", answer: "" },
    ]);
  };

  const handleSubmit = async () => {
    const filledQuestions = questionSets.filter(
      (qs) => qs.question.trim() && qs.answer.trim()
    );

    if (filledQuestions.length === 0) {
      setError("자기소개서 문항을 최소 1개 이상 입력하세요");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const token = getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }

      if (!applicationData) {
        setError("지원 정보를 불러올 수 없습니다");
        return;
      }

      const response = await createSpeechPractice(
        {
          application_id: applicationId.toString(),
          company_name: applicationData.company_name,
          position: applicationData.position,
          personal_statements: filledQuestions.map((qs) => ({
            question: qs.question,
            content: qs.answer,
          })),
        },
        token
      );

      // 예상 질문 추출 완료 후 면접 연습 페이지로 이동
      router.push(`/interview-practice?applicationId=${applicationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "예상 질문 추출 실패");
    } finally {
      setIsLoading(false);
    }
  };

  if (!applicationData) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <TopBar />
        <main className="flex-1 flex justify-center items-center py-12 px-6">
          <div className="text-gray-600">로딩 중...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <TopBar />
      <main className="flex-1 flex justify-center py-12 px-6">
        <div className="w-full max-w-3xl">
          <div
            className="border-2 border-dashed border-blue-400 rounded-lg p-8"
            style={{ borderColor: "#034078" }}
          >
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                예상 면접 질문 추출
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                자기소개서를 기반으로 예상되는 면접 질문을 추출합니다
              </p>
            </div>

            {/* Application Info - Read Only */}
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    기업명
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {applicationData.company_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    지원직무
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {applicationData.position}
                  </p>
                </div>
              </div>
            </div>

            {/* Self-introduction Section */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-900">
                  자기소개서 입력
                </label>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1"
                  style={{ color: "#034078" }}
                >
                  + 새로운 질문 추가하기
                </button>
              </div>

              {/* Question Sets */}
              <div className="flex flex-col gap-6">
                {questionSets.map((qs, index) => (
                  <div key={qs.id} className="flex flex-col gap-4">
                    {/* Question */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-900">
                        질문
                      </label>
                      <textarea
                        value={qs.question}
                        onChange={(e) =>
                          handleQuestionChange(qs.id, "question", e.target.value)
                        }
                        placeholder="자기소개서 문항을 입력하세요"
                        rows={3}
                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#034078] resize-none transition-colors"
                      />
                    </div>

                    {/* Answer */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-900">
                        내용
                      </label>
                      <textarea
                        value={qs.answer}
                        onChange={(e) =>
                          handleQuestionChange(qs.id, "answer", e.target.value)
                        }
                        placeholder="자기소개서 내용을 입력하세요"
                        rows={5}
                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#034078] resize-none transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => router.back()}
                disabled={isLoading}
                className="flex-1 bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 bg-[#034078] text-white font-semibold py-3 rounded-lg hover:bg-[#023456] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "추출 중..." : "예상 질문 추출하기"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
