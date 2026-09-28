"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopBar from "@/components/topbar";
import ApplicationDetailModal from "@/components/application-detail-modal";
import {
  getApplicationDetail,
  getApplications,
  updateStageResult,
  NetworkError,
  isApplicationCompleted,
  type ApplicationDetailResponse,
  type ApplicationRetrospectStatus,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import {
  buildStageResult,
  getNextStageLabel,
  isInterviewStage,
  INTERVIEW_STAGES,
} from "@/lib/stage";

interface User {
  name: string;
}

/**
 * 회고 카드 배지 상태 (현재 전형 단계 기준). none = 아직 시작 안 함.
 * null = 현재 단계가 면접이 아니라 회고 대상이 아님 → 배지를 숨긴다.
 */
type RetrospectState = "none" | "ongoing" | "done" | null;

interface Application {
  id: string;
  company: string;
  position: string;
  statusLine1: string;
  statusLine2: string;
  statusType: "progress" | "fail" | "pass";
  retrospect: RetrospectState;
  applicationId?: string;
}

const RETROSPECT_BADGE: Record<NonNullable<RetrospectState>, { label: string; color: string }> = {
  none: { label: "회고전", color: "bg-[#EE6055]" },
  ongoing: { label: "진행중", color: "bg-[#F7B538]" },
  done: { label: "회고완료", color: "bg-[#43AA8B]" },
};

const STATUS_BADGE_COLORS: Record<Application["statusType"], string> = {
  progress: "bg-[#8ECAE6]",
  fail: "bg-[#EE6055]",
  pass: "bg-[#43AA8B]",
};

const RETROSPECT_STATE_BY_STATUS: Record<ApplicationRetrospectStatus, NonNullable<RetrospectState>> = {
  회고전: "none",
  회고중: "ongoing",
  회고완료: "done",
};

/** 목록 API 의 retrospect_status 를 카드 배지 상태로 바꾼다. */
function retrospectStateOf(
  status: ApplicationRetrospectStatus | null | undefined
): RetrospectState {
  return status ? RETROSPECT_STATE_BY_STATUS[status] ?? null : null;
}

/**
 * 단계가 바뀐 직후의 회고 배지. 새로 도달한 단계엔 아직 회고 세션이 없으므로
 * 면접 단계면 "회고전", 아니면 회고 대상이 아니다. 단계가 그대로면 기존 값 유지.
 */
function retrospectStateAfterStageChange(
  app: Application,
  nextStage: string
): RetrospectState {
  if (nextStage === app.statusLine1) return app.retrospect;
  return isInterviewStage(nextStage) ? "none" : null;
}

/**
 * 표시할 페이지 번호 목록. 페이지가 많으면 현재 위치 주변만 남기고 "…"로 접는다.
 * 예) 현재 6 / 전체 12 → [1, "…", 5, 6, 7, "…", 12]
 */
function pageItems(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const around = [current - 1, current, current + 1].filter(
    (page) => page > 1 && page < total
  );
  const items: Array<number | "…"> = [1];
  if (around[0] > 2) items.push("…");
  items.push(...around);
  if (around[around.length - 1] < total - 1) items.push("…");
  items.push(total);
  return items;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [mounted, setMounted] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [selectedPass, setSelectedPass] = useState<"pass" | "fail" | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // 서버가 한 페이지에 5건씩 준다. 화면도 같은 단위로 끊어서 보여준다.
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isPageLoading, setIsPageLoading] = useState(false);
  // 상단 배너는 첫 페이지 기준으로 고정한다 — 페이지를 넘길 때마다
  // "다음에 할 일"이 바뀌면 배너가 목록 따라 흔들린다.
  const [bannerApp, setBannerApp] = useState<Application | null>(null);
  // 배너는 "다음에 할 일"을 권하는 자리라, 목록에 없는 게이팅 플래그가 필요하다.
  // (목록 API 에는 없고 상세 API 에만 있어서 배너 대상 1건만 따로 읽는다)
  const [bannerDetail, setBannerDetail] = useState<ApplicationDetailResponse | null>(null);

  /**
   * 지원 목록 한 페이지를 받아 화면을 그 페이지로 교체한다.
   * 회고 배지도 목록 응답(retrospect_status)에 같이 온다.
   */
  const loadPage = async (page: number, token: string) => {
    const response = await getApplications(token, page);

    const pageApps: Application[] = response.items.map((item) => ({
      id: item.application_id,
      company: item.company_name,
      position: item.position,
      statusLine1: item.stage,
      statusLine2: isApplicationCompleted(item.status) ? "완료" : "진행중",
      statusType: isApplicationCompleted(item.status) ? "pass" : "progress",
      retrospect: retrospectStateOf(item.retrospect_status),
      applicationId: item.application_id,
    }));

    setApplications(pageApps);
    setCurrentPage(response.page ?? page);
    // total_pages 가 없으면 has_next 로 최소한의 범위만 안다.
    setTotalPages(response.total_pages || (response.has_next ? page + 1 : page));
    if (page === 1) {
      const banner = pageApps[0] ?? null;
      setBannerApp(banner);
      setBannerDetail(null);
      if (banner) {
        // 배너 하나 때문에 목록 전체를 막지 않도록 실패는 삼킨다 (배너만 안 뜬다).
        getApplicationDetail(banner.id, token)
          .then(setBannerDetail)
          .catch(() => setBannerDetail(null));
      }
    }
  };

  const handlePageChange = async (page: number) => {
    const token = getAccessToken();
    if (!token || page === currentPage || isPageLoading) return;

    setIsPageLoading(true);
    try {
      await loadPage(page, token);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "지원 목록을 불러오지 못했습니다."
      );
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const loadData = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          console.log("No token found, redirecting to login");
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

        await loadPage(1, token);
      } catch (error) {
        console.error("Failed to load applications:", error);
        // 401(세션 만료)은 lib/api.ts에서 토큰 갱신을 시도하고,
        // 갱신까지 실패하면 로그인 페이지로 보내므로 여기서는 안내만 한다.
        setLoadError(
          error instanceof NetworkError
            ? error.message
            : error instanceof Error
            ? error.message
            : "지원 목록을 불러오지 못했습니다."
        );
      }
    };

    loadData();
  }, [router]);

  /**
   * 배너에 권할 "다음 할 일". 없으면 null 이라 배너 자체를 숨긴다.
   *
   * 판단 기준은 전부 상세 API 의 게이팅 플래그다. 예전에는 플래그를 보지 않고
   * 무조건 "예상 질문 추출하기"로 떨어뜨려서, 전형이 끝났거나(최종면접 탈락)
   * 이미 추출한 지원에도 버튼이 떴고 누르면 403/409 가 났다.
   */
  const getNextAction = (app: Application, detail: ApplicationDetailResponse | null) => {
    if (!detail) return null;

    const flags = {
      "1차면접": {
        available: detail.first_retrospect_available,
        completed: detail.first_retrospect_completed,
      },
      "2차면접": {
        available: detail.second_retrospect_available,
        completed: detail.second_retrospect_completed,
      },
      "최종면접": {
        available: detail.final_retrospect_available,
        completed: detail.final_retrospect_completed,
      },
    } as const;

    // 아직 회고 안 한 면접 중 가장 최근 단계를 권한다.
    const pending = [...INTERVIEW_STAGES]
      .reverse()
      .find((stage) => flags[stage].available && !flags[stage].completed);

    if (pending) {
      return {
        title: app.company,
        action: `${pending} 회고하러 가볼까요?`,
        button: "회고 시작하기",
        // stage 를 빼면 서버가 "현재 전형 단계"로 정해버려 엉뚱한 회고가 열린다.
        href: `/retrospective?applicationId=${app.id}&stage=${encodeURIComponent(pending)}`,
      };
    }

    if (!detail.speech_practice_available) return null;

    if (!detail.speech_practice_created) {
      return {
        title: app.company,
        action: `예상 질문을 추출해볼까요?`,
        button: "예상 질문 추출하기",
        href: `/applications/${app.id}/extract-questions`,
      };
    }

    return {
      title: app.company,
      action: `면접 연습을 해볼까요?`,
      button: "면접 연습하기",
      href: `/interview-practice?applicationId=${app.id}`,
    };
  };

  const handleEditStage = (app: Application, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingApp(app);
    setShowEditModal(true);
  };

  const handleUpdateStage = async () => {
    if (!editingApp || !editingApp.applicationId) return;

    setShowEditModal(false);
    setShowPassModal(true);
  };

  const handlePassSelection = async (selectedResult: "합격" | "탈락") => {
    if (!editingApp || !editingApp.applicationId) return;

    setSelectedPass(selectedResult === "합격" ? "pass" : "fail");
    setIsUpdating(true);

    try {
      const token = getAccessToken();
      if (!token) {
        alert("로그인이 필요합니다");
        return;
      }

      const currentStage = editingApp.statusLine1;
      const result = buildStageResult(currentStage, selectedResult === "합격");

      await updateStageResult(editingApp.applicationId, result, token);

      // 요청한 단계/상태가 곧 갱신된 현재 단계다
      setApplications((prev) =>
        prev.map((app) =>
          app.id === editingApp.id
            ? {
                ...app,
                statusLine1: result.stage,
                statusLine2: result.status,
                retrospect: retrospectStateAfterStageChange(app, result.stage),
                statusType:
                  result.status === "탈락"
                    ? "fail"
                    : result.status === "합격"
                    ? "pass"
                    : "progress",
              }
            : app
        )
      );

      alert("진행 단계가 업데이트되었습니다");
      setShowPassModal(false);
      setEditingApp(null);
      setSelectedPass(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "업데이트 실패");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleModalClose = async () => {
    setSelectedApp(null);

    // 모달에서 단계를 바꾸거나 회고를 했을 수 있으니 현재 페이지를 다시 받아
    // 서버 기준 회고 상태로 맞춘다 (페이지 단위 요청 1번).
    const token = getAccessToken();
    if (!token) return;
    try {
      await loadPage(currentPage, token);
    } catch (error) {
      console.error("Failed to refresh applications:", error);
    }
  };

  /** 모달 안에서 단계 결과를 바꾸면 홈 카드도 바로 따라간다 (새로고침 불필요). */
  const handleDetailUpdated = (
    appId: string,
    next: { stage: string; status: string | null }
  ) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === appId
          ? {
              ...app,
              statusLine1: next.stage,
              statusLine2: next.status ?? app.statusLine2,
              retrospect: retrospectStateAfterStageChange(app, next.stage),
              statusType:
                next.status === "탈락"
                  ? "fail"
                  : next.status === "합격"
                  ? "pass"
                  : "progress",
            }
          : app
      )
    );
    setSelectedApp((current) =>
      current && current.id === appId
        ? { ...current, statusLine1: next.stage, statusLine2: next.status ?? current.statusLine2 }
        : current
    );
    setBannerApp((prev) =>
      prev && prev.id === appId
        ? { ...prev, statusLine1: next.stage, statusLine2: next.status ?? prev.statusLine2 }
        : prev
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <TopBar />
      <main className="flex-1 flex justify-center py-12 px-6">
        <div className="w-full max-w-4xl">
          <div className="flex flex-col gap-6">
            {/* 데이터 로드 실패 안내 */}
            {loadError && (
              <div
                role="alert"
                className="rounded-lg border border-[#EE6055] bg-[#FDECEA] px-4 py-3"
              >
                <p className="text-sm font-medium text-[#B23B32]">{loadError}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm font-medium text-[#034078] underline"
                >
                  다시 시도
                </button>
              </div>
            )}

            {/* Greeting */}
            <div className="pt-4">
              <p className="text-2xl font-bold text-gray-900">
                {mounted && user ? `안녕하세요 ${user.name}님` : "안녕하세요 OO님"}
              </p>
              <p className="text-base text-gray-500 mt-2">오늘도 기록해볼까요?</p>
            </div>

            {/* Banner */}
            {(() => {
              if (!bannerApp) return null;
              const nextAction = getNextAction(bannerApp, bannerDetail);
              if (!nextAction) return null;
              return (
                <button
                  onClick={() => router.push(nextAction.href)}
                  className="w-full bg-[#034078] rounded-2xl px-8 py-6 flex items-center justify-between gap-6 hover:bg-[#023456] transition-colors cursor-pointer text-left"
                >
                  <div className="text-white flex-1">
                    <p className="font-bold text-lg leading-tight">
                      {nextAction.title}
                    </p>
                    <p className="font-bold text-lg leading-tight mt-1">
                      {nextAction.action}
                    </p>
                  </div>
                  <div className="bg-white text-[#034078] font-semibold text-base px-6 py-3 rounded-xl shrink-0">
                    {nextAction.button}
                  </div>
                </button>
              );
            })()}


            {/* Applications section */}
            <div className="flex flex-col gap-4 mt-4">
              <p className="text-xl font-bold text-gray-900">최근 지원 현황</p>

              {/* Add new application */}
              <Link
                href="/add-application"
                className="w-full border-2 border-dashed border-gray-300 rounded-xl py-5 flex items-center justify-center gap-2 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors text-base font-medium"
              >
                <span className="text-xl leading-none font-normal">+</span>
                새 지원 추가하기
              </Link>

              {/* Application cards */}
              {applications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className="w-full border border-gray-200 rounded-xl bg-gray-50 px-6 py-5 flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer text-left"
                >
                  <span className="font-semibold text-gray-900 text-base">{app.company}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`${STATUS_BADGE_COLORS[app.statusType]} text-white text-xs font-bold rounded-lg px-2 text-center leading-tight w-20 h-10 flex flex-col justify-center items-center`}
                    >
                      <div>{app.statusLine1}</div>
                      <div>{app.statusLine2}</div>
                    </div>
                    {app.retrospect ? (
                      <button
                        className={`${RETROSPECT_BADGE[app.retrospect].color} text-white text-sm font-bold rounded-lg transition-colors cursor-pointer w-20 h-10 flex items-center justify-center`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-center">
                          {RETROSPECT_BADGE[app.retrospect].label}
                        </div>
                      </button>
                    ) : (
                      // 면접 단계가 아니면 회고 배지 없이 자리만 맞춘다.
                      <div className="w-20 h-10" aria-hidden />
                    )}
                  </div>
                </div>
              ))}

              {/* 서버가 한 페이지에 5건씩 준다 — 같은 단위로 페이지를 넘긴다 */}
              {totalPages > 1 && (
                <nav
                  aria-label="지원 현황 페이지"
                  className="flex items-center justify-center gap-1 pt-2"
                >
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || isPageLoading}
                    aria-label="이전 페이지"
                    className="h-10 w-10 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>

                  {pageItems(currentPage, totalPages).map((item, idx) =>
                    item === "…" ? (
                      <span
                        key={`gap-${idx}`}
                        className="h-10 w-10 flex items-center justify-center text-gray-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handlePageChange(item)}
                        disabled={isPageLoading}
                        aria-current={item === currentPage ? "page" : undefined}
                        className={`h-10 w-10 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                          item === currentPage
                            ? "bg-[#034078] text-white"
                            : "text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || isPageLoading}
                    aria-label="다음 페이지"
                    className="h-10 w-10 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                </nav>
              )}
            </div>
          </div>
        </div>
      </main>

      {selectedApp && (
        <ApplicationDetailModal
          isOpen={!!selectedApp}
          onClose={handleModalClose}
          applicationId={selectedApp.id}
          company={selectedApp.company}
          position={selectedApp.position}
          currentStage={selectedApp.statusLine1}
          stageStatus={selectedApp.statusLine2}
          onUpdated={(next) => handleDetailUpdated(selectedApp.id, next)}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingApp && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center px-6 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {editingApp.company}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              현재 단계: {editingApp.statusLine1}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                다음 단계로 진행하려면 현재 단계를 완료로 표시해주세요.
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {editingApp.statusLine1} → {getNextStageLabel(editingApp.statusLine1)}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isUpdating}
                className="flex-1 border border-gray-300 text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                onClick={handleUpdateStage}
                disabled={isUpdating}
                className="flex-1 bg-[#034078] text-white font-semibold py-3 rounded-xl hover:bg-[#023456] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? "진행중..." : "완료 표시"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pass/Fail Modal */}
      {showPassModal && editingApp && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center px-6 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {editingApp.company}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {editingApp.statusLine1} 결과를 선택해주세요
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => handlePassSelection("합격")}
                disabled={isUpdating}
                className="flex-1 bg-[#034078] text-white font-semibold py-3 rounded-xl hover:bg-[#023456] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                합격
              </button>
              <button
                onClick={() => handlePassSelection("탈락")}
                disabled={isUpdating}
                className="flex-1 border border-gray-300 text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                불합격
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
