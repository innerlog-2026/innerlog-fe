"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/topbar";

interface User {
  name: string;
}

interface StatCard {
  label: string;
  value: string | number;
  unit?: string;
}

interface Keyword {
  id: number;
  text: string;
  color: "orange" | "red" | "blue";
}

interface StageProgress {
  stage: string;
  count: number;
  total: number;
  color: "blue" | "orange" | "red";
}

interface EmotionData {
  neutral: number;
  positive: number;
  negative: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("innerlog_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  const stats: StatCard[] = [
    { label: "지원 횟수", value: 10 },
    { label: "완료된 회고", value: 7 },
    { label: "자기비난 감지", value: 3 },
    { label: "많이 막히는 단계", value: "1차 면접" },
  ];

  const keywords: Keyword[] = [
    { id: 1, text: "임베딩 구조", color: "orange" },
    { id: 2, text: "React 설정", color: "red" },
    { id: 3, text: "구체적 수치", color: "blue" },
  ];

  const stageProgress: StageProgress[] = [
    { stage: "서류 전형", count: 8, total: 10, color: "blue" },
    { stage: "1차 면접", count: 4, total: 7, color: "orange" },
    { stage: "2차 면접", count: 1, total: 3, color: "red" },
  ];

  const emotionData: EmotionData = {
    neutral: 30,
    positive: 50,
    negative: 20,
  };

  const keywordColorMap = {
    orange: "bg-[#F7B538]",
    red: "bg-[#EE6055]",
    blue: "bg-[#8ECAE6]",
  };

  const stageColorMap = {
    blue: "bg-[#034078]",
    orange: "bg-[#F7B538]",
    red: "bg-[#EE6055]",
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <TopBar />
      <main className="flex-1 flex justify-center py-12 px-6 bg-gray-50">
        <div className="w-full max-w-4xl">
          <div className="flex flex-col gap-8">
            {/* Page title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">나의 회고 데이터</h1>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-3"
                >
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-[#034078]">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Keywords and stage progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Keywords section */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">반복 보완 키워드</h3>
                <p className="text-sm text-gray-500 mb-5">
                  회고에서 반복적으로 나온 보완점이에요
                </p>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <div
                      key={keyword.id}
                      className={`${keywordColorMap[keyword.color]} text-white text-sm font-semibold px-4 py-2 rounded-full`}
                    >
                      {keyword.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage progress section */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">전형 단계별 합격 현황</h3>
                <p className="text-sm text-gray-500 mb-5">7일 스티키 노트 평균</p>
                <div className="flex flex-col gap-4">
                  {stageProgress.map((stage, idx) => {
                    const percentage = (stage.count / stage.total) * 100;
                    return (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            {stage.stage}
                          </span>
                          <span className="text-xs text-gray-500">
                            {stage.count}/{stage.total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`${stageColorMap[stage.color]} h-2.5 rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Emotion tone section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">전체 회고 평균 감정톤</h3>
              <p className="text-sm text-gray-500 mb-5">7일 스티키 노트 평균</p>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 bg-gray-200 rounded-full h-8 flex overflow-hidden">
                  <div
                    className="bg-[#D9D9D9]"
                    style={{ width: `${emotionData.neutral}%` }}
                  />
                  <div
                    className="bg-[#43AA8B]"
                    style={{ width: `${emotionData.positive}%` }}
                  />
                  <div
                    className="bg-[#EE6055]"
                    style={{ width: `${emotionData.negative}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#D9D9D9]" />
                  <span className="text-sm text-gray-700">
                    중립 <span className="font-semibold">{emotionData.neutral}%</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#43AA8B]" />
                  <span className="text-sm text-gray-700">
                    긍정 <span className="font-semibold">{emotionData.positive}%</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#EE6055]" />
                  <span className="text-sm text-gray-700">
                    부정 <span className="font-semibold">{emotionData.negative}%</span>
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-4">전체적으로 긍정적인 감정 톤이에요.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
