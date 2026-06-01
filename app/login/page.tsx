"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { saveTokens } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { access_token, refresh_token } = await login({ email, password });

      // JWT 토큰에서 사용자 정보 추출 (email 기반으로 이름 표시)
      // 실제로는 백엔드에서 사용자 정보를 받아야 하지만,
      // 임시로 이메일 주소를 사용하거나 별도 API 호출 필요
      const userName = email.split("@")[0];

      saveTokens(access_token, refresh_token, userName);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <Image
          src="/logo.svg"
          alt="innerlog"
          width={120}
          height={80}
          priority
        />

        <div className="w-full bg-white rounded-2xl shadow-md px-8 py-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-800">
                이메일
              </label>
              <input
                type="email"
                placeholder="이메일 주소를 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-gray-100 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-800">
                비밀번호
              </label>
              <input
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-gray-100 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 w-full bg-[#034078] hover:bg-[#023456] active:bg-[#001a35] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors cursor-pointer"
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            계정이 없으신가요?{" "}
            <Link
              href="/signup"
              className="text-blue-600 font-semibold hover:underline"
            >
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
