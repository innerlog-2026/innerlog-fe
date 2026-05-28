"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const JOB_OPTIONS = ["프론트엔드", "백엔드", "AI", "데이터"] as const;
type Job = (typeof JOB_OPTIONS)[number];

type FieldErrors = {
  email: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
};

type Touched = Record<keyof FieldErrors, boolean>;

function Logo() {
  return <Image src="/logo.svg" alt="innerlog" width={90} height={60} priority />;
}

function BottomLink() {
  return (
    <p className="text-center text-sm text-gray-500 mt-5">
      이미 아이디가 있으신가요?{" "}
      <Link href="/login" className="text-blue-600 font-semibold hover:underline">
        로그인
      </Link>
    </p>
  );
}

function inputClass(hasError: boolean) {
  return `bg-gray-100 rounded-lg px-4 py-3 text-sm outline-none transition w-full ${
    hasError
      ? "ring-2 ring-red-300 focus:ring-2 focus:ring-red-300"
      : "focus:ring-2 focus:ring-blue-300"
  }`;
}

function validateEmail(value: string): string {
  if (!value) return "이메일을 입력해주세요.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "올바른 이메일 형식이 아닙니다.";
  return "";
}

function validatePassword(value: string): string {
  if (!value) return "비밀번호를 입력해주세요.";
  if (value.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
  return "";
}

function validatePasswordConfirm(value: string, password: string): string {
  if (!value) return "비밀번호 확인을 입력해주세요.";
  if (value !== password) return "비밀번호가 일치하지 않습니다.";
  return "";
}

function validateNickname(value: string): string {
  if (!value) return "닉네임을 입력해주세요.";
  if (value.length < 2) return "닉네임은 2자 이상이어야 합니다.";
  return "";
}

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [errors, setErrors] = useState<FieldErrors>({
    email: "",
    password: "",
    passwordConfirm: "",
    nickname: "",
  });

  const [touched, setTouched] = useState<Touched>({
    email: false,
    password: false,
    passwordConfirm: false,
    nickname: false,
  });

  function handleBlur(field: keyof FieldErrors) {
    setTouched((prev) => ({ ...prev, [field]: true }));

    setErrors((prev) => {
      const next = { ...prev };
      switch (field) {
        case "email":
          next.email = validateEmail(email);
          break;
        case "password":
          next.password = validatePassword(password);
          if (touched.passwordConfirm) {
            next.passwordConfirm = validatePasswordConfirm(passwordConfirm, password);
          }
          break;
        case "passwordConfirm":
          next.passwordConfirm = validatePasswordConfirm(passwordConfirm, password);
          break;
        case "nickname":
          next.nickname = validateNickname(nickname);
          break;
      }
      return next;
    });
  }

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: FieldErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
      passwordConfirm: validatePasswordConfirm(passwordConfirm, password),
      nickname: validateNickname(nickname),
    };

    setErrors(newErrors);
    setTouched({ email: true, password: true, passwordConfirm: true, nickname: true });

    if (Object.values(newErrors).some(Boolean)) return;

    setStep(2);
  }

  function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    // TODO: connect to API
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-xs flex flex-col items-center gap-6">
          <Logo />
          <div className="w-full bg-white rounded-2xl shadow-md px-7 py-7">
            <form onSubmit={handleStep1} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-800">이메일</label>
                <input
                  type="email"
                  placeholder="이메일 주소를 입력하세요"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur("email")}
                  className={inputClass(touched.email && !!errors.email)}
                />
                {touched.email && errors.email && (
                  <p className="text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-800">비밀번호</label>
                <input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur("password")}
                  className={inputClass(touched.password && !!errors.password)}
                />
                {touched.password && errors.password && (
                  <p className="text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-800">비밀번호 확인</label>
                <input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  onBlur={() => handleBlur("passwordConfirm")}
                  className={inputClass(touched.passwordConfirm && !!errors.passwordConfirm)}
                />
                {touched.passwordConfirm && errors.passwordConfirm && (
                  <p className="text-xs text-red-500">{errors.passwordConfirm}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-800">닉네임</label>
                <input
                  type="text"
                  placeholder="닉네임을 입력하세요"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onBlur={() => handleBlur("nickname")}
                  className={inputClass(touched.nickname && !!errors.nickname)}
                />
                {touched.nickname && errors.nickname && (
                  <p className="text-xs text-red-500">{errors.nickname}</p>
                )}
              </div>

              <button
                type="submit"
                className="mt-1 w-full bg-[#1e3a6e] hover:bg-[#162d57] active:bg-[#0f2040] text-white font-medium py-3 rounded-lg transition-colors cursor-pointer"
              >
                회원가입
              </button>
            </form>
            <BottomLink />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <Logo />
        <div className="w-full bg-white rounded-2xl shadow-md px-7 py-7">
          <form onSubmit={handleStep2} className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                aria-label="이전 단계로"
                className="text-gray-400 hover:text-gray-600 text-sm transition-colors cursor-pointer"
              >
                ←
              </button>
              <p className="font-bold text-gray-900 text-base">희망직군 (택1)</p>
            </div>
            <div className="flex flex-col gap-2">
              {JOB_OPTIONS.map((job) => (
                <button
                  key={job}
                  type="button"
                  onClick={() => setSelectedJob(job)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors cursor-pointer ${
                    selectedJob === job
                      ? "border-blue-400 bg-blue-50 text-blue-700 font-medium"
                      : "border-gray-200 bg-white text-gray-800 hover:border-gray-300"
                  }`}
                >
                  {job}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={!selectedJob}
              className="mt-1 w-full bg-[#1e3a6e] hover:bg-[#162d57] active:bg-[#0f2040] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors cursor-pointer"
            >
              회원가입
            </button>
          </form>
          <BottomLink />
        </div>
      </div>
    </div>
  );
}
