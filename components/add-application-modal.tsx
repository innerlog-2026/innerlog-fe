"use client";

import { useState } from "react";

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: ApplicationData) => void;
}

interface ApplicationData {
  company: string;
  position: string;
  applicationDate: string;
}

export default function AddApplicationModal({
  isOpen,
  onClose,
  onAdd,
}: AddApplicationModalProps) {
  const [formData, setFormData] = useState<ApplicationData>({
    company: "",
    position: "",
    applicationDate: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    if (!formData.company || !formData.position || !formData.applicationDate) {
      alert("모든 필드를 입력해주세요");
      return;
    }
    onAdd(formData);
    setFormData({ company: "", position: "", applicationDate: "" });
  };

  const handleCancel = () => {
    setFormData({ company: "", position: "", applicationDate: "" });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-100 to-blue-50 px-8 py-6 rounded-t-3xl border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">새 지원 추가하기</h2>
        </div>

        {/* Form */}
        <div className="p-8">
          <div className="flex flex-col gap-8">
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
                className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Application Date */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-3 block">
                지원 날짜
              </label>
              <input
                type="date"
                name="applicationDate"
                value={formData.applicationDate}
                onChange={handleChange}
                className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              추가하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
