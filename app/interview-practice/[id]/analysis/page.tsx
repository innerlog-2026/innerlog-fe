"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/topbar";

export default function InterviewAnalysisPage() {
  const router = useRouter();
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = () => {
    setIsSharing(true);
    setTimeout(() => setIsSharing(false), 2000);
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
                onClick={handleShare}
                className="bg-blue-300 text-blue-800 font-semibold px-6 py-2 rounded-lg hover:bg-blue-400 transition-colors"
              >
                {isSharing ? "공유 중..." : "전행 결과 추정"}
              </button>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 말 속도 */}
              <div className="border border-gray-300 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">말 속도</h3>
                <div className="text-gray-700 text-sm space-y-1">
                  <div className="font-semibold">빠른 편</div>
                  <div>분당 약 2800어절</div>
                  <div className="text-gray-600">(평균 2300어절)</div>
                </div>
              </div>

              {/* 필러워드 */}
              <div className="border border-gray-300 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">필러워드</h3>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• "어" 7회</li>
                  <li>• "음" 5회</li>
                  <li>• "어" 4회</li>
                </ul>
              </div>

              {/* 침묵 구간 */}
              <div className="border border-gray-300 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">침묵 구간</h3>
                <div className="text-gray-700 text-sm space-y-1">
                  <div>n초 이상 침묵 n회</div>
                  <div>→ 질문 직후, 질문 중간</div>
                </div>
              </div>

              {/* 담변 구조 */}
              <div className="border border-gray-300 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">담변 구조</h3>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• 두서 없음 같지</li>
                  <li>• 결론이 먼저 나오지 않음</li>
                </ul>
              </div>

              {/* 담변 길이 */}
              <div className="border border-gray-300 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">담변 길이</h3>
                <div className="text-gray-700 text-sm space-y-1">
                  <div>약 n어절</div>
                  <div className="text-gray-600">권장 : 80-85어절</div>
                </div>
              </div>

              {/* 총평 */}
              <div className="border border-gray-300 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">총평</h3>
                <div className="text-gray-700 text-sm">
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
    </div>
  );
}
