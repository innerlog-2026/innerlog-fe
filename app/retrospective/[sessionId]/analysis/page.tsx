"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import TopBar from "@/components/topbar";
import { summarizeRetrospect } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

interface AnalysisData {
  company: string;
  role: string;
  interview_type: string;
  analysis: {
    summary: string;
    hypothesis: string;
    strengths: string[];
    weaknesses: string[];
    gap_analysis: string;
    actions: string[];
  };
}

export default function AnalysisPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          router.push("/login");
          return;
        }

        const data = await summarizeRetrospect(sessionId, token);
        setAnalysis({
          company: data.company,
          role: data.role,
          interview_type: data.interview_type,
          analysis: data.analysis,
        });
      } catch (err) {
        console.error("Failed to load analysis:", err);
        setError("분석 결과를 불러올 수 없습니다");
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      loadAnalysis();
    }
  }, [sessionId, router]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <TopBar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">로딩 중...</div>
        </main>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <TopBar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-900 font-bold mb-4">{error || "분석 결과를 찾을 수 없습니다"}</p>
            <button
              onClick={() => router.back()}
              className="bg-[#034078] hover:bg-[#023456] text-white font-semibold px-6 py-3 rounded-xl"
            >
              돌아가기
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
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="bg-white rounded-3xl p-8 mb-6 border border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI회고 분석 결과</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-4">
              <span>{analysis.company}</span>
              <span>{analysis.role}</span>
              <span>{analysis.interview_type || "미정"}</span>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-3xl p-8 mb-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">면접 총평</h2>
            <p className="text-gray-700 leading-relaxed">
              {analysis.analysis.summary || "분석 결과가 없습니다"}
            </p>
          </div>

          {/* Grid: Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Strengths */}
            <div className="bg-emerald-50 rounded-3xl p-8 border-2 border-[#43AA8B]">
              <h2 className="text-lg font-bold text-gray-900 mb-4">강점</h2>
              <ul className="space-y-3">
                {(() => {
                  const strengths = Array.isArray(analysis.analysis.strengths)
                    ? analysis.analysis.strengths
                    : typeof analysis.analysis.strengths === 'string'
                    ? (analysis.analysis.strengths as string).split('. ').filter((s) => s.trim())
                    : [];

                  return strengths.length > 0 ? (
                    strengths.map((strength, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-[#034078] font-bold flex-shrink-0">•</span>
                        <span className="text-gray-700">{strength.replace(/\.$/, '')}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500">데이터 없음</li>
                  );
                })()}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-rose-50 rounded-3xl p-8 border-2 border-[#EE6055]">
              <h2 className="text-lg font-bold text-gray-900 mb-4">약점</h2>
              <ul className="space-y-3">
                {(() => {
                  const weaknesses = Array.isArray(analysis.analysis.weaknesses)
                    ? analysis.analysis.weaknesses
                    : typeof analysis.analysis.weaknesses === 'string'
                    ? (analysis.analysis.weaknesses as string).split('. ').filter((s) => s.trim())
                    : [];

                  return weaknesses.length > 0 ? (
                    weaknesses.map((weakness, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-[#EE6055] font-bold flex-shrink-0">•</span>
                        <span className="text-gray-700">{weakness.replace(/\.$/, '')}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500">데이터 없음</li>
                  );
                })()}
              </ul>
            </div>
          </div>

          {/* Gap Analysis */}
          <div className="bg-white rounded-3xl p-8 mb-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">부족한 부분</h2>
            <p className="text-gray-700 leading-relaxed">
              {analysis.analysis.gap_analysis || "분석 결과가 없습니다"}
            </p>
          </div>

          {/* Action Items */}
          <div className="bg-white rounded-3xl p-8 mb-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">다음 단계 / 개선 방안</h2>
            <ol className="space-y-3">
              {(() => {
                const actions = Array.isArray(analysis.analysis.actions)
                  ? analysis.analysis.actions
                  : typeof analysis.analysis.actions === 'string'
                  ? (analysis.analysis.actions as string).split('. ').filter((s) => s.trim())
                  : [];

                return actions.length > 0 ? (
                  actions.map((action, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="text-[#034078] font-bold flex-shrink-0">{idx + 1}.</span>
                      <span className="text-gray-700">{action.replace(/\.$/, '')}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">데이터 없음</li>
                );
              })()}
            </ol>
          </div>

          {/* Back Button */}
          <div className="flex gap-3 pt-6">
            <button
              onClick={() => router.back()}
              className="flex-1 border border-gray-300 text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              돌아가기
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex-1 bg-[#034078] hover:bg-[#023456] text-white font-semibold py-3 rounded-xl transition-colors"
            >
              홈으로
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
