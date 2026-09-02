"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopBar from "@/components/topbar";
import ApplicationDetailModal from "@/components/application-detail-modal";
import { getApplications } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

interface User {
  name: string;
}

interface Application {
  id: number;
  company: string;
  statusLine1: string;
  statusLine2: string;
  statusType: "progress" | "fail" | "pass";
  reviewed: boolean;
}

const MOCK_APPLICATIONS: Application[] = [
  {
    id: 1,
    company: "토스 뱅크",
    statusLine1: "서류전형",
    statusLine2: "진행중",
    statusType: "progress",
    reviewed: false,
  },
  {
    id: 2,
    company: "토스 뱅크",
    statusLine1: "서류전형",
    statusLine2: "진행중",
    statusType: "progress",
    reviewed: false,
  },
  {
    id: 3,
    company: "토스 뱅크",
    statusLine1: "최종면접",
    statusLine2: "탈락",
    statusType: "fail",
    reviewed: true,
  },
];

const STATUS_BADGE_COLORS: Record<Application["statusType"], string> = {
  progress: "bg-[#8ECAE6]",
  fail: "bg-[#EE6055]",
  pass: "bg-[#43AA8B]",
};

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [mounted, setMounted] = useState(false);
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);

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

        const response = await getApplications(token);
        const displayApps: Application[] = response.items.map((item) => {
          // status 값에 따라 상태 표시
          let statusLine2: string;
          let statusType: "progress" | "fail" | "pass";

          if (item.status === "COMPLETED") {
            statusLine2 = "합격";
            statusType = "pass";
          } else if (item.status === "PREPARING") {
            statusLine2 = "준비중";
            statusType = "fail";
          } else {
            // IN_PROGRESS
            statusLine2 = "진행중";
            statusType = "progress";
          }

          return {
            id: item.application_id,
            company: item.company_name,
            statusLine1: item.stage,
            statusLine2,
            statusType,
            reviewed: false, // TODO: 실제 회고 완료 여부 확인
          };
        });
        setApplications(displayApps);
      } catch (error) {
        console.error("Failed to load applications:", error);
        // 토큰 오류면 로그인 페이지로
        if (error instanceof Error && error.message.includes("401")) {
          router.push("/login");
        }
      }
    };

    loadData();
  }, [router]);

  const getNextAction = (app: Application) => {
    // 회고가 완료되지 않았으면 회고하러 가기
    if (!app.reviewed && app.statusType === "progress") {
      return {
        title: app.company,
        action: `회고하러 가볼까요?`,
        button: "회고 시작하기",
        href: `/retrospective?applicationId=${app.id}`,
      };
    }

    // 회고가 완료되었거나 상태가 진행 중이 아니면 다음 작업
    return {
      title: app.company,
      action: `예상 질문을 추출해볼까요?`,
      button: "예상 질문 추출하기",
      href: `/applications/${app.id}/extract-questions`,
    };
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <TopBar />
      <main className="flex-1 flex justify-center py-12 px-6">
        <div className="w-full max-w-4xl">
          <div className="flex flex-col gap-6">
            {/* Greeting */}
            <div className="pt-4">
              <p className="text-2xl font-bold text-gray-900">
                {mounted && user ? `안녕하세요 ${user.name}님` : "안녕하세요 OO님"}
              </p>
              <p className="text-base text-gray-500 mt-2">오늘도 기록해볼까요?</p>
            </div>

            {/* Banner */}
            {(() => {
              const firstApp = applications[0];
              if (!firstApp) return null;
              const nextAction = getNextAction(firstApp);
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
                <button
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
                    <button
                      className={`text-white text-sm font-bold rounded-lg transition-colors cursor-pointer w-20 h-10 flex items-center justify-center ${
                        app.reviewed
                          ? "bg-[#43AA8B]"
                          : "bg-[#EE6055]"
                      }`}
                    >
                      <div className="text-center">
                        {app.reviewed ? "회고완료" : "회고전"}
                      </div>
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {selectedApp && (
        <ApplicationDetailModal
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          applicationId={selectedApp.id}
          company={selectedApp.company}
          position={selectedApp.company}
          currentStage={selectedApp.statusLine1}
          stageStatus={selectedApp.statusLine2}
        />
      )}
    </div>
  );
}
