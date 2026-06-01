"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopBar from "@/components/topbar";
import ApplicationDetailModal from "@/components/application-detail-modal";

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

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("innerlog_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

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
            <button
              onClick={() => router.push("/retrospective")}
              className="w-full bg-[#034078] rounded-2xl px-8 py-6 flex items-center justify-between gap-6 hover:bg-[#023456] transition-colors cursor-pointer text-left"
            >
              <div className="text-white flex-1">
                <p className="font-bold text-lg leading-tight">토스뱅크 1차 면접</p>
                <p className="font-bold text-lg leading-tight mt-1">회고하러 가볼까요?</p>
              </div>
              <div className="bg-white text-[#034078] font-semibold text-base px-6 py-3 rounded-xl shrink-0">
                회고 시작하기
              </div>
            </button>

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
              {MOCK_APPLICATIONS.map((app) => (
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
          company={selectedApp.company}
          position={selectedApp.company}
          currentStage={selectedApp.statusLine1}
          stageStatus={selectedApp.statusLine2}
        />
      )}
    </div>
  );
}
