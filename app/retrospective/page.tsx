"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TopBar from "@/components/topbar";
import { chatRetrospect, startRetrospect, getApplicationDetail } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

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

export default function RetrospectivePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId");

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [appInfo, setAppInfo] = useState<ApplicationInfo | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const token = getAccessToken();
        if (!token || !applicationId) {
          router.push("/");
          return;
        }

        const appDetail = await getApplicationDetail(applicationId, token);
        setAppInfo({
          company_name: appDetail.company_name,
          position: appDetail.position,
          stage: appDetail.current_stage,
        });

        const response = await startRetrospect(
          {
            application_id: applicationId,
            level: "MEDIUM_HIGH",
            memo: `${appDetail.company_name} ${appDetail.position} - ${appDetail.current_stage} 면접 회고`,
          },
          token
        );

        setSessionId(response.session_id);
        setIsSessionActive(true);

        const initialMessage: Message = {
          id: 1,
          sender: "ai",
          content: response.message || "안녕하세요! 면접 회고를 시작하겠습니다.",
          timestamp: new Date(),
        };

        setMessages([initialMessage]);
      } catch (error) {
        console.error("Failed to initialize session:", error);
        const errorMessage: Message = {
          id: 1,
          sender: "ai",
          content: "회고 세션을 시작할 수 없습니다. 다시 시도해주세요.",
          timestamp: new Date(),
        };
        setMessages([errorMessage]);
        setIsSessionActive(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [applicationId, router]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId) return;

    const messageText = inputValue;

    const userMessage: Message = {
      id: messages.length + 1,
      sender: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
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

      const aiMessage: Message = {
        id: messages.length + 2,
        sender: "ai",
        content: response.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsSessionActive(!response.is_done);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        id: messages.length + 2,
        sender: "ai",
        content: "메시지 전송에 실패했습니다. 다시 시도해주세요.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
                <div className="text-right">
                  <p className="text-xs text-gray-500">면접 회고</p>
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
                    {message.content}
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

            {isLoading && (
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
            <div className="flex gap-3">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
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
        </div>
      </main>
    </div>
  );
}
