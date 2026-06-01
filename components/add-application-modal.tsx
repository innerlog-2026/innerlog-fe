"use client";

import { useState } from "react";
import { createApplication } from "@/lib/api";

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (data: ApplicationData) => void;
}

interface ApplicationData {
  company: string;
  position: string;
  date: string;
  stage?: string;
  status?: string;
}

export default function AddApplicationModal({
  isOpen,
  onClose,
  onAdd,
}: AddApplicationModalProps) {
  const [formData, setFormData] = useState<ApplicationData>({
    company: "",
    position: "",
    date: "",
    stage: "서류전형",
    status: "PREPARING",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.company || !formData.position || !formData.date) {
      alert("모든 필드를 입력해주세요");
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("로그인이 필요합니다");
        onClose();
        return;
      }

      await createApplication(
        {
          company_name: formData.company,
          position: formData.position,
          date: formData.date,
          stage: formData.stage,
          status: (formData.status || "PREPARING") as "PREPARING" | "IN_PROGRESS" | "COMPLETED",
        },
        token
      );

      alert("지원이 추가되었습니다");
      if (onAdd) {
        onAdd(formData);
      }
      setFormData({
        company: "",
        position: "",
        date: "",
        stage: "서류전형",
        status: "PREPARING",
      });
      onClose();
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-25 px-8 py-6 rounded-t-3xl border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">새 지원 추가하기</h2>
        </div>

        {/* Form */}
        <div className="p-8">
          <div className="flex flex-col gap-6">
            {/* Company */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-3 block">
                기업명
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="회사명을 입력하세요"
                disabled={isLoading}
                className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:opacity-50"
              />
            </div>

            {/* Position */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-3 block">
                지원직무
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="지원 직무를 입력하세요"
                disabled={isLoading}
                className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:opacity-50"
              />
            </div>

            {/* Application Date */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-3 block">
                지원 날짜
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:opacity-50"
              />
            </div>

            {/* Stage */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-3 block">
                진행 단계
              </label>
              <select
                name="stage"
                value={formData.stage || "서류전형"}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:opacity-50"
              >
                <option value="서류전형">서류전형</option>
                <option value="코딩테스트">코딩테스트</option>
                <option value="1차면접">1차면접</option>
                <option value="2차면접">2차면접</option>
                <option value="최종면접">최종면접</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-8 pt-8 border-t border-gray-200">
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
  );
}
