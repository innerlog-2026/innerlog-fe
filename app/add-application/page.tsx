"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/topbar";
import { createApplication } from "@/lib/api";

interface ApplicationData {
  company: string;
  position: string;
  date: string;
  stage: string;
  status: string;
}

export default function AddApplicationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ApplicationData>({
    company: "",
    position: "",
    date: "",
    stage: "서류전형",
    status: "PREPARING",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.company || !formData.position || !formData.date) {
      alert("필수 필드를 모두 입력해주세요");
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("로그인이 필요합니다");
        router.push("/login");
        return;
      }

      await createApplication(
        {
          company_name: formData.company,
          position: formData.position,
          date: formData.date,
          stage: formData.stage,
          status: formData.status as "PREPARING" | "IN_PROGRESS" | "COMPLETED",
        },
        token
      );

      alert("지원이 추가되었습니다");
      router.push("/");
    } catch (error) {
      alert(error instanceof Error ? error.message : "지원 추가 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      company: "",
      position: "",
      date: "",
      stage: "서류전형",
      status: "PREPARING",
    });
    router.back();
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <TopBar />
      <main className="flex-1 flex justify-center py-12 px-6">
        <div className="w-full max-w-2xl">
          <div className="bg-gradient-to-r from-blue-50 to-blue-25 rounded-t-3xl px-8 py-8 border border-gray-200 border-b-0">
            <h1 className="text-3xl font-bold text-gray-900">새 지원 추가하기</h1>
          </div>

          <div className="bg-white border border-gray-200 border-t-0 rounded-b-3xl px-8 py-8">
            <div className="flex flex-col gap-8">
              {/* Company */}
              <div>
                <label className="text-base font-semibold text-gray-900 mb-3 block">
                  기업명
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="회사명을 입력하세요"
                  className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#034078]"
                />
              </div>

              {/* Position */}
              <div>
                <label className="text-base font-semibold text-gray-900 mb-3 block">
                  지원직무
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="지원 직무를 입력하세요"
                  className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#034078]"
                />
              </div>

              {/* Application Date */}
              <div>
                <label className="text-base font-semibold text-gray-900 mb-3 block">
                  지원 날짜
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Stage */}
              <div>
                <label className="text-base font-semibold text-gray-900 mb-3 block">
                  현재 진행 단계
                </label>
                <select
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="서류전형">서류전형</option>
                  <option value="코딩테스트">코딩테스트</option>
                  <option value="1차면접">1차면접</option>
                  <option value="2차면접">2차면접</option>
                  <option value="최종면접">최종면접</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-base font-semibold text-gray-900 mb-3 block">
                  상태
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PREPARING">준비 중</option>
                  <option value="IN_PROGRESS">진행 중</option>
                  <option value="COMPLETED">완료</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 bg-[#034078] hover:bg-[#023456] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "추가 중..." : "추가하기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
