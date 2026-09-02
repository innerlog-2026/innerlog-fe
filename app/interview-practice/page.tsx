"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/topbar";
import { getSpeechQuestions } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

interface InterviewQuestion {
  id: string;
  question: string;
}

const ITEMS_PER_PAGE = 5;

export default function InterviewPracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId");

  const [currentPage, setCurrentPage] = useState(1);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const token = getAccessToken();
        if (!token || !applicationId) {
          setQuestions([]);
          setIsLoading(false);
          return;
        }

        const response = await getSpeechQuestions(applicationId, token);
        setQuestions(
          response.questions.map((q) => ({
            id: q.question_id,
            question: q.question,
          }))
        );
      } catch (error) {
        console.error("Failed to load questions:", error);
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [applicationId]);

  const totalPages = Math.ceil(questions.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentQuestions = questions.slice(
    startIdx,
    startIdx + ITEMS_PER_PAGE
  );

  if (isLoading) {
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
        <div className="w-full max-w-4xl">
          <div className="flex flex-col gap-8">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                면접 예시 질문 리스트
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                이 질문들로 연습해보세요. 자주 나오는 질문들입니다.
              </p>
            </div>

            {/* Questions List */}
            {questions.length > 0 ? (
              <>
                <div className="flex flex-col gap-3">
                  {currentQuestions.map((item, idx) => (
                    <Link
                      key={item.id}
                      href={`/interview-practice/${item.id}?applicationId=${applicationId}`}
                    >
                      <div className="w-full border border-gray-200 rounded-xl bg-white hover:bg-gray-50 px-6 py-5 flex items-center justify-between cursor-pointer transition-colors">
                        <div className="flex items-center gap-4 flex-1">
                          <span className="text-lg font-bold text-[#034078] min-w-12">
                            {String(startIdx + idx + 1).padStart(2, "0")}
                          </span>
                          <span className="text-gray-800 font-medium">
                            {item.question}
                          </span>
                        </div>
                        <span className="text-gray-400 text-xl">›</span>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                            page === currentPage
                              ? "bg-[#034078] text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">질문이 없습니다.</p>
              </div>
            )}

            {/* CTA Button */}
            <div className="flex justify-center mt-6">
              <Link
                href="/add-application"
                className="bg-[#034078] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#023456] transition-colors"
              >
                새로운 면접 등록하기
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
