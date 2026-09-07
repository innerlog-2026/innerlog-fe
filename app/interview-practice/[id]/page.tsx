"use client";

import { useState, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import TopBar from "@/components/topbar";
import { analyzeSpeech } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

export default function SpeechPracticePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const questionId = params.id;
  const applicationId = searchParams.get("applicationId");
  const questionText = searchParams.get("question") || "질문을 불러오는 중...";

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const file = new File([audioBlob], "recorded-audio.wav", {
          type: "audio/wav",
        });
        setUploadedFile(file);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      alert("마이크 권한을 허용해주세요");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => {
        track.stop();
      });
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const handleSubmit = async () => {
    if (!uploadedFile) {
      alert("음성 파일을 먼저 준비해주세요");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = getAccessToken();
      if (!token) {
        alert("로그인이 필요합니다");
        router.push("/login");
        return;
      }

      const inputType = uploadedFile.name.startsWith("recorded-audio")
        ? "RECORDING"
        : "UPLOAD";

      const result = await analyzeSpeech(
        questionId as string,
        uploadedFile,
        token,
        inputType
      );

      // 분석 결과 페이지로 이동
      router.push(
        `/interview-practice/${questionId}/analysis?submissionId=${result.submission_id}`
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "음성 분석 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <TopBar />
      <main className="flex-1 flex justify-center py-12 px-6">
        <div className="w-full max-w-2xl">
          <div className="flex flex-col gap-8">
            {/* Title */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                면접 연습 답변하기
              </h1>
              <p className="text-sm text-gray-500">
                아래 질문에 대해 답변해주세요
              </p>
            </div>

            {/* Question Box */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <p className="text-lg font-semibold text-gray-900">
                {(() => {
                  try {
                    return decodeURIComponent(questionText);
                  } catch {
                    return questionText;
                  }
                })()}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                자연스럽게 답변해주세요 (최소 30초 이상)
              </p>
            </div>

            {/* Recording Section */}
            <div className="border border-gray-200 rounded-xl p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">
                음성 녹음 또는 파일 업로드
              </h3>

              {/* Recording Status */}
              {isRecording && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 font-semibold text-center">
                    🔴 녹음 중... {String(Math.floor(recordingTime / 60)).padStart(2, "0")}:
                    {String(recordingTime % 60).padStart(2, "0")}
                  </p>
                </div>
              )}

              {/* Microphone Button */}
              <div className="flex flex-col items-center gap-4 mb-8">
                <button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  disabled={isSubmitting}
                  className={`flex items-center justify-center transition-all ${
                    isRecording ? "scale-110" : "hover:scale-105"
                  }`}
                >
                  <div
                    className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                      isRecording
                        ? "bg-red-500 shadow-lg animate-pulse-scale"
                        : "bg-white border-2 border-gray-300"
                    }`}
                  >
                    <Image
                      src="/mic.svg"
                      alt={isRecording ? "녹음 중지" : "녹음 시작"}
                      width={50}
                      height={50}
                      className={isRecording ? "brightness-0 invert" : ""}
                    />
                    {isRecording && (
                      <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75"></div>
                    )}
                  </div>
                </button>
                {isRecording && (
                  <button
                    onClick={handleStopRecording}
                    disabled={isSubmitting}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-full transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ⏹ 녹음 중지
                  </button>
                )}
              </div>

              {/* File Upload */}
              <div className="mb-8">
                <h3 className="text-base font-bold text-gray-900 mb-4 text-center">
                  또는 파일 업로드
                </h3>
                <label className="w-full bg-gray-100 rounded-2xl p-6 text-center cursor-pointer hover:bg-gray-150 transition-colors block mb-4 border border-dashed border-gray-300">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    disabled={isSubmitting}
                    className="hidden"
                  />
                  <p className="text-gray-600 text-sm font-medium">
                    {uploadedFile
                      ? `✓ ${uploadedFile.name}`
                      : "음성 파일을 선택하세요 (100MB 이하, MP3/WAV)"}
                  </p>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="flex-1 border border-gray-300 text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!uploadedFile || isSubmitting}
                  className={`flex-1 font-semibold py-3 rounded-xl text-white transition-colors ${
                    uploadedFile
                      ? "bg-[#034078] hover:bg-[#023456]"
                      : "bg-gray-400 cursor-not-allowed"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSubmitting ? "분석 중..." : "분석하기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
