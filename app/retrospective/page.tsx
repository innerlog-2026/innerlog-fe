"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TopBar from "@/components/topbar";
import MarkdownText from "@/components/markdown-text";
import {
  ApiError,
  chatRetrospect,
  getApplicationDetail,
  getRetrospect,
  getRetrospects,
  isRetrospectFinished,
  startRetrospect,
  summarizeRetrospect,
  type RetrospectType,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { isInterviewStage } from "@/lib/stage";

interface Message {
  id: number;
  sender: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface ApplicationInfo {
  company_name: string;
  position: string;
  stage: string;
}

/** 대화 단계가 DONE 이면 요약까지 끝난 상태다. */
const DONE_STAGE = "DONE";

/**
 * 회고 대화는 FACT → INTERPRETATION → STRATEGY → DONE 순서로만 끝난다.
 * AI 가 중간에 요약처럼 보이는 답을 내놓아도 DONE 에 닿기 전엔 분석을 만들 수 없어서,
 * "얼마나 남았는지"를 화면에 보여준다.
 */
const CHAT_STAGES = [
  { key: "FACT", label: "사실 확인" },
  { key: "INTERPRETATION", label: "원인 해석" },
  { key: "STRATEGY", label: "전략 세우기" },
] as const;

/**
 * useSearchParams 를 쓰는 화면은 Suspense 경계 안에 둔다. 경계가 없으면 이 위쪽
 * 트리까지 클라이언트 렌더로 끌려가면서, 첫 렌더에 쿼리스트링이 비어 보이는
 * (= applicationId 가 없는 것처럼 동작하는) 순간이 생긴다.
 */
export default function RetrospectivePage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-gray-50" />}>
      <RetrospectiveChat />
    </Suspense>
  );
}

function RetrospectiveChat() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const stageParam = searchParams.get("stage");
  const sessionIdParam = searchParams.get("sessionId");

  // 어느 면접의 회고인지. 빠지면 서버가 "현재 전형 단계"로 정해버려
  // 1차 회고를 눌러도 2차 회고가 열린다.
  const retrospectType: RetrospectType | null =
    stageParam && isInterviewStage(stageParam) ? stageParam : null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [appInfo, setAppInfo] = useState<ApplicationInfo | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [chatStage, setChatStage] = useState<string>("FACT");
  const [isFinishing, setIsFinishing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // StrictMode 개발 모드의 이펙트 2회 실행으로 회고가 두 번 시작되지 않도록 막는다.
  const initializedRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const goToAnalysis = useCallback(
    (id: string) => router.replace(`/retrospective/${id}/analysis`),
    [router]
  );

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    /** 이미 있는 세션을 이어서 연다. 끝난 회고면 분석 페이지로 보낸다. */
    const resume = async (id: string, token: string): Promise<boolean> => {
      const detail = await getRetrospect(id, token);

      if (detail.stage === DONE_STAGE || detail.status === "COMPLETED") {
        goToAnalysis(id);
        return true;
      }

      setSessionId(id);
      setIsSessionActive(true);
      setChatStage(detail.stage);
      setMessages(
        detail.chats.map((chat, idx) => ({
          id: idx + 1,
          sender: chat.sender.toUpperCase() === "USER" ? "user" : "ai",
          content: chat.message,
          timestamp: new Date(),
        }))
      );
      return false;
    };

    const initializeSession = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          router.push("/login");
          return;
        }

        // sessionId 로 바로 들어온 경우엔 applicationId 없이도 이어서 열 수 있다.
        if (sessionIdParam) {
          await resume(sessionIdParam, token);
          return;
        }

        if (!applicationId) {
          router.push("/");
          return;
        }

        const appDetail = await getApplicationDetail(applicationId, token);
        // current_stage 는 아직 어느 단계에도 도달하지 않았으면 null 이다.
        const stage = appDetail.current_stage ?? "";
        const targetStage = retrospectType ?? stage;
        setAppInfo({
          company_name: appDetail.company_name,
          position: appDetail.position,
          stage: targetStage,
        });

        try {
          const response = await startRetrospect(
            {
              application_id: applicationId,
              ...(retrospectType ? { type: retrospectType } : {}),
              level: "MEDIUM_HIGH",
              memo: `${appDetail.company_name} ${appDetail.position} - ${targetStage} 면접 회고`,
            },
            token
          );

          setSessionId(response.session_id);
          setIsSessionActive(true);
          setMessages([
            {
              id: 1,
              sender: "ai",
              content: response.message || "안녕하세요! 면접 회고를 시작하겠습니다.",
              timestamp: new Date(),
            },
          ]);
        } catch (error) {
          // 409 = 이 면접 단계의 회고가 이미 있다. 새로 만들 수 없을 뿐,
          // 기존 회고를 이어서 열거나(진행중) 분석으로 보내면 된다(완료).
          if (!(error instanceof ApiError) || error.status !== 409) throw error;

          const list = await getRetrospects(applicationId, token);
          const existing = list.sessions?.find(
            (session) => session.type === (retrospectType ?? targetStage)
          );

          if (!existing) throw error;

          if (isRetrospectFinished(existing)) {
            goToAnalysis(existing.session_id);
            return;
          }

          await resume(existing.session_id, token);
        }
      } catch (error) {
        console.error("Failed to initialize session:", error);
        setMessages([
          {
            id: 1,
            sender: "ai",
            content:
              error instanceof Error
                ? `회고 세션을 열 수 없습니다. ${error.message}`
                : "회고 세션을 시작할 수 없습니다. 다시 시도해주세요.",
            timestamp: new Date(),
          },
        ]);
        setIsSessionActive(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [applicationId, retrospectType, sessionIdParam, router, goToAnalysis]);

  // 새로고침·뒤로가기로 applicationId/stage 가 URL 에서 사라져도 이어서 열 수 있도록,
  // 세션이 잡히면 주소에 sessionId 를 남긴다.
  useEffect(() => {
    if (!sessionId || sessionIdParam === sessionId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("sessionId", sessionId);
    if (applicationId) params.set("applicationId", applicationId);
    if (stageParam) params.set("stage", stageParam);
    window.history.replaceState(null, "", `/retrospective?${params.toString()}`);
  }, [sessionId, sessionIdParam, searchParams, applicationId, stageParam]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId || isSendingMessage) return;

    const messageText = inputValue;

    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        sender: "user",
        content: messageText,
        timestamp: new Date(),
      },
    ]);
    setInputValue("");
    setIsSendingMessage(true);

    try {
      const token = getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await chatRetrospect(
        sessionId,
        { message: messageText },
        token
      );

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          sender: "ai",
          content: response.message,
          timestamp: new Date(),
        },
      ]);

      // is_done 과 stage 는 서버에서 같은 사실을 두 방식으로 내려준다.
      // 한쪽만 보면 플래그가 빠졌을 때 분석 버튼이 영영 안 뜬다.
      setChatStage(response.stage);
      const done = response.is_done || response.stage === DONE_STAGE;
      setIsSessionActive(!done);
      setIsDone(done);
    } catch (error) {
      console.error("Failed to send message:", error);

      // 이미 DONE 에 도달한 세션은 더 이상 채팅을 받지 않는다(409).
      // 이때는 실패가 아니라 "요약으로 넘어갈 차례"다.
      if (error instanceof ApiError && error.status === 409) {
        setIsDone(true);
        setIsSessionActive(false);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            sender: "ai",
            content: "메시지 전송에 실패했습니다. 다시 시도해주세요.",
            timestamp: new Date(),
          },
        ]);
      }
    } finally {
      setIsSendingMessage(false);
    }
  };

  /**
   * 요약이 이미 나왔는데 완료 플래그만 안 온 경우를 위한 탈출구.
   * summarize 는 멱등이라 눌러도 안전하고, 아직 이르면 서버가 막아준다.
   */
  const handleFinish = async () => {
    if (!sessionId || isFinishing) return;
    setIsFinishing(true);
    try {
      const token = getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }
      await summarizeRetrospect(sessionId, token);
      goToAnalysis(sessionId);
    } catch (error) {
      alert(
        error instanceof ApiError && error.status === 409
          ? "아직 회고가 끝나지 않았어요. 대화를 조금 더 이어가 주세요."
          : error instanceof Error
          ? error.message
          : "분석을 생성하지 못했어요."
      );
    } finally {
      setIsFinishing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <TopBar />
      <main className="flex-1 flex flex-col bg-gray-50">
        {/* Header with application info */}
        {appInfo && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{appInfo.company_name}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {appInfo.position} · {appInfo.stage}
                  </p>
                </div>
                {/* 진행 단계 — 왜 아직 "분석내용 보기"가 안 뜨는지 보이게 한다 */}
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-2">면접 회고</p>
                  <div className="flex items-center gap-1.5">
                    {CHAT_STAGES.map((stage, idx) => {
                      const currentIdx = CHAT_STAGES.findIndex(
                        (item) => item.key === chatStage
                      );
                      // DONE 이면 currentIdx 가 -1 이라 전부 지나간 것으로 친다.
                      const passed = isDone || currentIdx > idx;
                      const active = !isDone && currentIdx === idx;
                      return (
                        <span
                          key={stage.key}
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                            active
                              ? "bg-[#034078] text-white"
                              : passed
                              ? "bg-[#43AA8B] text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {stage.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat container */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col p-6 gap-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.sender === "user"
                      ? "bg-[#034078] text-white"
                      : "bg-white text-gray-900 border border-gray-200"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    <MarkdownText text={message.content} />
                  </p>
                  <p
                    className={`text-xs mt-2 ${
                      message.sender === "user"
                        ? "text-blue-200"
                        : "text-gray-400"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {(isLoading || isSendingMessage) && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 border border-gray-200 px-4 py-3 rounded-2xl">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-2xl w-full mx-auto p-6">
            {isDone ? (
              // Analysis button when retrospect is done
              <button
                onClick={handleFinish}
                disabled={isFinishing}
                className="w-full bg-[#034078] hover:bg-[#023456] disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {isFinishing ? "분석 정리 중..." : "분석내용 보기"}
              </button>
            ) : (
              // Chat input when retrospect is ongoing
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                    rows={3}
                    className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#034078] resize-none"
                    disabled={!isSessionActive}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isSendingMessage || !isSessionActive}
                    className="bg-[#034078] hover:bg-[#023456] disabled:bg-gray-300 text-white font-semibold px-6 py-3 rounded-xl transition-colors self-end shrink-0 flex items-center justify-center min-w-24"
                  >
                    {isSendingMessage ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                        <span>전송 중</span>
                      </>
                    ) : (
                      "전송"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
