"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/topbar";

export default function InterviewAnalysisPage() {
  const router = useRouter();
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

  return (
    <div className="flex-1 flex flex-col bg-white">
      <TopBar />
      <main className="flex-1 flex justify-center py-12 px-6">
        <div className="w-full max-w-4xl">
          <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">
                면접 스피치 분석 결과
              </h1>
              <button
                onClick={handleOpenModal}
                className="bg-[#99CEFF] text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-400 transition-colors"
              >
                진행 결과 수정
              </button>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 말 속도 */}
              <div className="border border-gray-300 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">말 속도</h3>
                <div className="text-[#034078] text-sm space-y-1">
                  <div className="font-semibold">빠른 편</div>
                  <div>분당 약 2800어절</div>
                  <div className="text-[#034078]">(평균 2300어절)</div>
                </div>
              </div>

              {/* 필러워드 */}
              <div className="border border-gray-300 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">필러워드</h3>
                <ul className="text-[#034078] text-sm space-y-1">
                  <li>• "어" 7회</li>
                  <li>• "음" 5회</li>
                  <li>• "어" 4회</li>
                </ul>
              </div>

              {/* 침묵 구간 */}
              <div className="border border-gray-300 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">침묵 구간</h3>
                <div className="text-[#034078] text-sm space-y-1">
                  <div>n초 이상 침묵 n회</div>
                  <div>→ 질문 직후, 질문 중간</div>
                </div>
              </div>

              {/* 담변 구조 */}
              <div className="border border-gray-300 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">담변 구조</h3>
                <ul className="text-[#034078] text-sm space-y-1">
                  <li>• 두서 없음 같지</li>
                  <li>• 결론이 먼저 나오지 않음</li>
                </ul>
              </div>

              {/* 담변 길이 */}
              <div className="border border-gray-300 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">담변 길이</h3>
                <div className="text-[#034078] text-sm space-y-1">
                  <div>약 n어절</div>
                  <div className="text-gray-600">권장 : 80-85어절</div>
                </div>
              </div>

              {/* 총평 */}
              <div className="border border-gray-300 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">총평</h3>
                <div className="text-[#034078] text-sm">
                  <div>총평</div>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => router.back()}
                className="text-[#034078] font-semibold hover:underline"
              >
                뒤로 가기
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center px-6 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              토스뱅크 진행 결과 수정
            </h2>

            {/* Current Stage */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-900 block mb-2">
                현재 진행 단계
              </label>
              <input
                type="text"
                value={currentStage}
                onChange={(e) => setCurrentStage(e.target.value)}
                placeholder="현재 진행 단계를 선택하세요"
                className="w-full bg-gray-100 rounded-lg px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#034078] focus:bg-white transition-colors"
              />
            </div>

            {/* Pass Status */}
            <div className="mb-8">
              <label className="text-sm font-semibold text-gray-900 block mb-2">
                합격 여부
              </label>
              <input
                type="text"
                value={passStatus}
                onChange={(e) => setPassStatus(e.target.value)}
                placeholder="합격 여부를 선택하세요"
                className="w-full bg-gray-100 rounded-lg px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#034078] focus:bg-white transition-colors"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleCloseModal}
                className="flex-1 border-1 border-[#034078] text-[#034078] font-semibold py-3 rounded-xl hover:bg-blue-50 transition-colors"
              >
                취소하기
              </button>
              <button
                onClick={handleSaveChanges}
                className="flex-1 bg-[#034078] text-white font-semibold py-3 rounded-xl hover:bg-[#023456] transition-colors"
              >
                수정하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
