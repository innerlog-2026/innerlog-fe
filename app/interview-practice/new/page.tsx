"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/topbar";

interface QuestionSet {
  id: string;
  question: string;
  answer: string;
}

export default function NewInterviewPracticePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    company: "",
    position: "",
  });
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([
    { id: "1", question: "", answer: "" },
  ]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company.trim()) {
      alert("기업명을 입력하세요");
      return;
    }

    if (!formData.position.trim()) {
      alert("지원직무를 입력하세요");
      return;
    }

    const filledQuestions = questionSets.filter(
      (qs) => qs.question.trim() && qs.answer.trim()
    );

    if (filledQuestions.length === 0) {
      alert("자기소개서 문항을 최소 1개 이상 입력하세요");
      return;
    }

    const interviewId = Date.now().toString();
    // TODO: Save to backend
    router.push(`/interview-practice/${interviewId}`);
  };

  const handleCancel = () => {
    router.back();
  };

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
                새로운 면접 연습 시작하기
              </h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Company Name */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-900">
                  기업명
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="기업명을 입력하세요"
                  className="w-full bg-gray-100 rounded-lg px-4 py-3 text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#034078] focus:bg-white transition-colors"
                />
              </div>

              {/* Position */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-900">
                  지원직무
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="지원 직무를 입력하세요"
                  className="w-full bg-gray-100 rounded-lg px-4 py-3 text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#034078] focus:bg-white transition-colors"
                />
              </div>

              {/* Self-introduction Section */}
              <div className="flex flex-col gap-4">
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
                          className="w-full bg-gray-100 rounded-lg px-4 py-3 text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#034078] focus:bg-white resize-none transition-colors"
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
                          className="w-full bg-gray-100 rounded-lg px-4 py-3 text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#034078] focus:bg-white resize-none transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#034078] text-white font-semibold py-3 rounded-lg hover:bg-[#023456] transition-colors"
                >
                  면접 연습 시작하기
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
