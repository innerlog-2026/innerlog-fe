"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/topbar";

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
  progress: "bg-teal-400",
  fail: "bg-rose-400",
  pass: "bg-blue-500",
};

export default function Home() {
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

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      <TopBar />
      <main className="flex-1 flex justify-center py-8 px-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col gap-6">
            {/* Greeting */}
            <div>
              <p className="text-lg font-semibold text-gray-900">
                안녕하세요 {user ? `${user.name}님` : "OO님"}
              </p>
              <p className="text-base text-gray-600">오늘도 기록해볼까요?</p>
            </div>

            {/* Banner */}
            <div className="bg-[#1e3a6e] rounded-2xl px-6 py-5 flex items-center justify-between gap-4">
              <div className="text-white">
                <p className="font-bold text-base leading-tight">토스뱅크 1차 면접</p>
                <p className="font-bold text-base leading-tight mt-1">회고하러 가볼까요?</p>
              </div>
              <button className="bg-white text-[#1e3a6e] font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors shrink-0 cursor-pointer">
                회고 시작하기
              </button>
            </div>

            {/* Applications section */}
            <div className="flex flex-col gap-3">
              <p className="text-base font-semibold text-gray-800">최근 지원 현황</p>

              {/* Add new application */}
              <button className="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 flex items-center justify-center gap-1.5 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors text-sm font-medium cursor-pointer">
                <span className="text-lg leading-none font-normal">+</span>
                새 지원 추가하기
              </button>

              {/* Application cards */}
              {MOCK_APPLICATIONS.map((app) => (
                <div
                  key={app.id}
                  className="border border-gray-100 rounded-xl shadow-sm px-6 py-4 flex items-center justify-between"
                >
                  <span className="font-semibold text-gray-900">{app.company}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`${STATUS_BADGE_COLORS[app.statusType]} text-white text-xs font-medium rounded-xl px-3 py-1.5 text-center leading-snug`}
                    >
                      {app.statusLine1}
                      <br />
                      {app.statusLine2}
                    </span>
                    <button
                      className={`text-white text-sm font-semibold rounded-xl px-4 py-2 transition-colors cursor-pointer ${
                        app.reviewed
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : "bg-orange-400 hover:bg-orange-500"
                      }`}
                    >
                      {app.reviewed ? "회고완료" : "회고전"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
