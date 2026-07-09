"use client";

import { useState } from "react";
import Link from "next/link";
import TopBar from "@/components/topbar";

interface InterviewQuestion {
  id: number;
  question: string;
}

const MOCK_QUESTIONS: InterviewQuestion[] = [
  { id: 1, question: "본인의 장점을 무엇인가요?" },
  { id: 2, question: "본인의 단점을 무엇인가요?" },
  { id: 3, question: "본인의 장점을 무엇인가요?" },
  { id: 4, question: "본인의 장점을 무엇인가요?" },
  { id: 5, question: "본인의 장점을 무엇인가요?" },
  { id: 6, question: "본인의 단점을 무엇인가요?" },
  { id: 7, question: "본인 장점을 무엇인가요?" },
];

const ITEMS_PER_PAGE = 5;

export default function InterviewPracticePage() {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(MOCK_QUESTIONS.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentQuestions = MOCK_QUESTIONS.slice(
    startIdx,
    startIdx + ITEMS_PER_PAGE
  );

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
            <div className="flex flex-col gap-3">
              {currentQuestions.map((item) => (
                <Link
                  key={item.id}
                  href={`/interview-practice/interview-id?question=${item.id}`}
                >
                  <div className="w-full border border-gray-200 rounded-xl bg-white hover:bg-gray-50 px-6 py-5 flex items-center justify-between cursor-pointer transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-lg font-bold text-[#034078] min-w-12">
                        {String(startIdx + currentQuestions.indexOf(item) + 1).padStart(2, "0")}
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

            {/* CTA Button */}
            <div className="flex justify-center mt-6">
              <Link
                href="/interview-practice/new"
                className="bg-[#034078] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#023456] transition-colors"
              >
                면정 면접 스피처 시작 할기
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
