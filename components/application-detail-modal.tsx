"use client";

import { ReactNode } from "react";

interface Stage {
  id: number;
  name: string;
  status: "completed" | "ongoing" | "pending";
}

interface RecordItem {
  id: number;
  title: string;
  description: string;
}

interface ApplicationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: string;
  position: string;
  currentStage: string;
  stageStatus: string;
}

const STAGES: Stage[] = [
  { id: 1, name: "서류전형", status: "completed" },
  { id: 2, name: "코딩테스트", status: "completed" },
  { id: 3, name: "1차 면접", status: "ongoing" },
  { id: 4, name: "2차 면접", status: "pending" },
];

const RECORD_ITEMS: RecordItem[] = [
  { id: 1, title: "1차 면접 회고하기", description: "받은 본 면접을 사항 정리해요" },
  { id: 2, title: "예상 질문 추출하기", description: "받은 본 면접을 사항 정리해요" },
  { id: 3, title: "1차 면접 회고하기", description: "받은 본 면접을 사항 정리해요" },
];

const COMPLETED_RECORDS: RecordItem[] = [
  { id: 4, title: "1차 면접 연습", description: "기록" },
];

const stageColorMap = {
  completed: "bg-teal-500",
  ongoing: "bg-orange-400",
  pending: "bg-gray-300",
};

export default function ApplicationDetailModal({
  isOpen,
  onClose,
  company,
  position,
  currentStage,
  stageStatus,
}: ApplicationDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-8 py-8 flex items-center justify-between rounded-t-3xl">
          <div>
            <p className="text-white text-2xl font-bold">{company}</p>
            <p className="text-blue-100 text-lg mt-1">{position}</p>
          </div>
          <div className="bg-white rounded-2xl px-6 py-3 flex flex-col items-center">
            <p className="text-sm font-semibold text-gray-700">{currentStage}</p>
            <p className="text-base font-bold text-blue-900">{stageStatus}</p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-white text-2xl hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex gap-8">
          {/* Left: Stage progress */}
          <div className="flex-shrink-0 w-80">
            <h3 className="text-lg font-bold text-gray-900 mb-8">전형 진행 단계</h3>
            <div className="relative">
              {/* Timeline background line - dynamic based on stages */}
              <div className="absolute left-5 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-500 via-teal-500 via-orange-400 to-gray-300" style={{
                backgroundSize: '100% 100%',
                backgroundImage: 'linear-gradient(to bottom, rgb(20, 184, 166) 0%, rgb(20, 184, 166) 50%, rgb(251, 146, 60) 50%, rgb(251, 146, 60) 75%, rgb(209, 213, 219) 75%, rgb(209, 213, 219) 100%)'
              }} />

              {/* Stage items */}
              <div className="flex flex-col">
                {STAGES.map((stage, idx) => (
                  <div key={stage.id} className="flex items-start gap-6 pb-8 relative">
                    {/* Dot */}
                    <div
                      className={`${stageColorMap[stage.status]} w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 shadow-md`}
                    >
                      {stage.status === "completed" && (
                        <span className="text-white font-bold text-lg">✓</span>
                      )}
                    </div>

                    {/* Stage info */}
                    <div className="pt-1 flex-1">
                      <p className="text-gray-900 font-bold text-base">{stage.name}</p>
                      <div className="mt-2">
                        {stage.status === "completed" && (
                          <span className="inline-block text-xs bg-teal-100 text-teal-700 px-3 py-1.5 rounded-full font-semibold">
                            완료
                          </span>
                        )}
                        {stage.status === "ongoing" && (
                          <span className="inline-block text-xs bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full font-semibold">
                            진행중
                          </span>
                        )}
                        {stage.status === "pending" && (
                          <span className="inline-block text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-semibold">
                            예정
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Recording section */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-6">기록하기</h3>
            <div className="flex flex-col gap-4 mb-8">
              {RECORD_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                    </div>
                    <span className="text-gray-400 text-xl">›</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Completed records section */}
            <h3 className="text-lg font-bold text-gray-900 mb-4">완료된 기록</h3>
            <div className="flex flex-col gap-4">
              {COMPLETED_RECORDS.map((item) => (
                <button
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                    </div>
                    <span className="text-gray-400 text-xl">›</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
