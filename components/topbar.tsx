"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearTokens } from "@/lib/auth";

interface User {
  name: string;
  profileImage?: string;
}

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
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

  const handleLogout = () => {
    clearTokens();
    setUser(null);
    router.push("/login");
  };

  return (
    <header className="relative flex items-center justify-between px-6 h-16 bg-white border-b border-gray-200 shrink-0">
      <Link href="/" className="flex items-center">
        <Image
          src="/logo.svg"
          alt="innerlog"
          width={42}
          height={44}
          priority
          className="object-contain"
        />
      </Link>

      <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-8 text-sm font-medium">
        <Link
          href="/"
          className={`transition-colors ${
            pathname === "/" ? "text-[#034078] font-semibold" : "text-gray-700 hover:text-[#034078]"
          }`}
        >
          홈
        </Link>
        <Link
          href="/dashboard"
          className={`transition-colors ${
            pathname === "/dashboard"
              ? "text-[#034078] font-semibold"
              : "text-gray-700 hover:text-[#034078]"
          }`}
        >
          대시보드
        </Link>
      </nav>

      <div className="flex items-center gap-4 justify-end">
        {mounted &&
          (user ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gray-400 overflow-hidden flex items-center justify-center text-white text-sm font-semibold shrink-0">
                  {user.profileImage ? (
                    <Image
                      src={user.profileImage}
                      alt={user.name}
                      width={36}
                      height={36}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    user.name[0]
                  )}
                </div>
                <span className="text-sm font-medium text-gray-800">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-700 px-3 py-1.5 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium text-white bg-[#034078] px-4 py-1.5 rounded-lg hover:bg-[#023456] transition-colors"
              >
                회원가입
              </Link>
            </div>
          ))}
      </div>
    </header>
  );
}
