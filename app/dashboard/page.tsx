"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/topbar";
import { getApplications, getRetrospects } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

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
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<StatCard[]>([
    { label: "지원 횟수", value: 0 },
    { label: "완료된 회고", value: 0 },
    { label: "자기비난 감지", value: 0 },
    { label: "많이 막히는 단계", value: "-" },
  ]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [stageProgress, setStageProgress] = useState<StageProgress[]>([]);
  const [emotionData, setEmotionData] = useState<EmotionData>({
    neutral: 0,
    positive: 0,
    negative: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          router.push("/login");
          return;
        }

        const stored = localStorage.getItem("innerlog_user");
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch {
            // ignore
          }
        }

        const appResponse = await getApplications(token);
        const applications = appResponse.items;

        // 1. 지원 횟수 계산
        const totalApplications = applications.length;

        // 2. 전형 단계별 합격 현황 수집 & 회고 데이터 수집
        const stageCountMap: Record<string, { passed: number; total: number }> = {};
        const allWeaknesses: Map<string, number> = new Map();
        let completedRetrospects = 0;
        let totalSelfBlame = 0;
        let emotionCounts = { neutral: 0, positive: 0, negative: 0 };

        // 모든 지원에 대해 회고 데이터 조회
        for (const app of applications) {
          try {
            const retrospectResponse = await getRetrospects(app.application_id, token);
            const sessions = retrospectResponse.sessions;

            // 각 세션의 상태 확인
            for (const session of sessions) {
              if (session.status === "COMPLETED") {
                completedRetrospects++;
                // TODO: 실제 분석 데이터에서 weaknesses와 감정톤 수집
              }
            }

            // 전형 단계별 통계
            if (app.stage) {
              if (!stageCountMap[app.stage]) {
                stageCountMap[app.stage] = { passed: 0, total: 0 };
              }
              stageCountMap[app.stage].total += 1;

              // 합격 상태인 경우
              if (app.status === "COMPLETED") {
                stageCountMap[app.stage].passed += 1;
              }
            }
          } catch (error) {
            console.error(`Failed to load retrospects for application ${app.application_id}:`, error);
          }
        }

        // 3. 통계 업데이트
        setStats([
          { label: "지원 횟수", value: totalApplications },
          { label: "완료된 회고", value: completedRetrospects },
          { label: "자기비난 감지", value: totalSelfBlame },
          { label: "많이 막히는 단계", value: applications[0]?.stage || "-" },
        ]);

        // 4. 전형 단계별 합격 현황
        const colorMap: Record<number, "blue" | "orange" | "red"> = { 0: "blue", 1: "orange", 2: "red" };
        const stages = Object.entries(stageCountMap).map(([stage, counts], idx) => ({
          stage,
          count: counts.passed,
          total: counts.total,
          color: colorMap[idx % 3] || "blue",
        }));
        setStageProgress(stages);

        // 5. 약점 키워드 (회고 완료 시에만 표시)
        if (completedRetrospects > 0 && allWeaknesses.size > 0) {
          const sortedWeaknesses = Array.from(allWeaknesses.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
          const colorArray: ("orange" | "red" | "blue")[] = ["orange", "red", "blue"];
          const keywords: Keyword[] = sortedWeaknesses.map(([text, _], idx) => ({
            id: idx,
            text,
            color: colorArray[idx % 3],
          }));
          setKeywords(keywords);
        } else {
          setKeywords([]);
        }

        // 6. 감정톤 데이터 (회고 완료 시에만 표시, 기본값은 0)
        if (completedRetrospects > 0) {
          const total = Object.values(emotionCounts).reduce((a, b) => a + b, 0);
          if (total > 0) {
            setEmotionData({
              neutral: Math.round((emotionCounts.neutral / total) * 100),
              positive: Math.round((emotionCounts.positive / total) * 100),
              negative: Math.round((emotionCounts.negative / total) * 100),
            });
          } else {
            setEmotionData({ neutral: 0, positive: 0, negative: 0 });
          }
        } else {
          setEmotionData({ neutral: 0, positive: 0, negative: 0 });
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [router]);

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

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <TopBar />
        <main className="flex-1 flex justify-center items-center py-12 px-6 bg-gray-50">
          <p className="text-gray-500">데이터를 불러오는 중...</p>
        </main>
      </div>
    );
  }

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
                {keywords.length > 0 ? (
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
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-gray-400 text-sm">회고를 완료해주세요</p>
                  </div>
                )}
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

              {emotionData.neutral !== 0 || emotionData.positive !== 0 || emotionData.negative !== 0 ? (
                <>
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
                </>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-400 text-sm">회고를 완료해주세요</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
