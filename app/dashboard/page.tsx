"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/topbar";
import { getDashboard, NetworkError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

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

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<StatCard[]>([
    { label: "지원 횟수", value: 0 },
    { label: "완료된 회고", value: 0 },
    { label: "자기비난 감지", value: 0 },
    { label: "많이 막히는 단계", value: "-" },
  ]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [stageProgress, setStageProgress] = useState<StageProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          router.push("/login");
          return;
        }

        // 집계는 서버(GET /dashboard)가 조회 시점 기준으로 해서 내려준다.
        const dashboard = await getDashboard(token);

        setStats([
          { label: "지원 횟수", value: dashboard.application_count },
          { label: "완료된 회고", value: dashboard.completed_retrospect_count },
          { label: "자기비난 감지", value: dashboard.self_blame_count },
          { label: "많이 막히는 단계", value: dashboard.most_failed_stage ?? "-" },
        ]);

        // 전형 단계별 합격 현황 — 서버가 전형 순서대로, 도달한 단계만 준다.
        const colorArray: ("blue" | "orange" | "red")[] = ["blue", "orange", "red"];
        setStageProgress(
          dashboard.stage_results.map((result, idx) => ({
            stage: result.stage,
            count: result.pass_count,
            total: result.total_count,
            color: colorArray[idx % 3],
          }))
        );

        // 반복 보완 키워드 — 서버가 많이 나온 순 상위 3개만 준다.
        const keywordColors: ("orange" | "red" | "blue")[] = ["orange", "red", "blue"];
        setKeywords(
          dashboard.weakness_keywords.map((item, idx) => ({
            id: idx,
            text: item.keyword,
            color: keywordColors[idx % 3],
          }))
        );

        setLoading(false);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        // 401(세션 만료)은 lib/api.ts에서 갱신 시도 후 로그인 페이지로 보낸다.
        setLoadError(
          error instanceof NetworkError
            ? error.message
            : error instanceof Error
            ? error.message
            : "대시보드 데이터를 불러오지 못했습니다."
        );
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

  if (loadError) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <TopBar />
        <main className="flex-1 flex justify-center items-center py-12 px-6 bg-gray-50">
          <div role="alert" className="max-w-md text-center">
            <p className="text-base font-medium text-[#B23B32]">{loadError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 text-sm font-medium text-[#034078] underline"
            >
              다시 시도
            </button>
          </div>
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
                <p className="text-sm text-gray-500 mb-5">
                  단계별로 지원이 얼마나 통과했는지 보여줘요
                </p>
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
          </div>
        </div>
      </main>
    </div>
  );
}
