"use client";

import { useState, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import TopBar from "@/components/topbar";
import { analyzeSpeech, ApiError, NetworkError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { encodeRecordingToWav, validateAudioFile } from "@/lib/audio";
import { saveSpeechAnalysis } from "@/lib/speech-analysis-store";

/** 제출 실패 원인을 사용자가 할 수 있는 행동으로 바꿔 설명한다. */
function describeSubmitError(error: unknown): string {
  if (error instanceof NetworkError) return error.message;

  if (error instanceof ApiError) {
    switch (error.status) {
      case 413:
        // 서버 한도는 100MB 지만 앞단 프록시가 더 낮게 잡혀 있으면 여기서 잘린다.
        return "녹음이 너무 길어 업로드가 거부됐어요. 30초 이내로 짧게 녹음해 보시고, 계속 실패하면 담당자에게 알려주세요.";
      case 400:
        return "MP3 또는 WAV 파일만 올릴 수 있어요.";
      case 502:
      case 503:
      case 504:
        return "분석 서버가 응답하지 않아요. 잠시 후 다시 시도해주세요.";
      default:
        return error.message;
    }
  }

  return error instanceof Error ? error.message : "음성 분석에 실패했어요.";
}

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
  const [isPreparing, setIsPreparing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 서버는 확장자로만 판단해 mp3/wav 외에는 400 을 준다. 업로드 전에 먼저 거른다.
    const message = validateAudioFile(file);
    if (message) {
      setFileError(message);
      setUploadedFile(null);
      e.target.value = ""; // 같은 파일을 다시 고를 수 있도록 초기화
      return;
    }

    setFileError(null);
    setUploadedFile(file);
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

      mediaRecorder.onstop = async () => {
        // MediaRecorder 는 브라우저별로 webm/mp4 를 내놓고 wav 는 지원하지 않는다.
        // 이름만 .wav 로 붙이면 서버에 다른 포맷이 저장되므로 실제 WAV 로 변환한다.
        setIsPreparing(true);
        setFileError(null);
        try {
          const file = await encodeRecordingToWav(
            audioChunksRef.current,
            mediaRecorder.mimeType || "audio/webm"
          );

          const message = validateAudioFile(file);
          if (message) {
            setFileError(message);
            setUploadedFile(null);
            return;
          }

          setUploadedFile(file);
        } catch (error) {
          console.error("녹음 변환 실패:", error);
          setFileError(
            error instanceof Error
              ? error.message
              : "녹음을 변환하지 못했어요. 다시 녹음해주세요."
          );
          setUploadedFile(null);
        } finally {
          setIsPreparing(false);
        }
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

    setFileError(null);
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

      // 분석 결과는 이 응답에만 실려 오므로(재조회 API 없음) 넘겨주고 이동한다.
      saveSpeechAnalysis(result);
      router.push(
        `/interview-practice/${questionId}/analysis?submissionId=${result.submission_id}`
      );
    } catch (error) {
      console.error("음성 분석 실패:", error);
      setFileError(describeSubmitError(error));
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
                  disabled={isSubmitting || isPreparing}
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
                    disabled={isSubmitting || isPreparing}
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
                    accept=".mp3,.wav,audio/mpeg,audio/wav"
                    onChange={handleFileUpload}
                    disabled={isSubmitting || isPreparing}
                    className="hidden"
                  />
                  <p className="text-gray-600 text-sm font-medium">
                    {uploadedFile
                      ? `✓ ${uploadedFile.name}`
                      : "음성 파일을 선택하세요 (100MB 이하, MP3/WAV)"}
                  </p>
                </label>

                {isPreparing && (
                  <p className="text-sm text-gray-500 text-center">
                    녹음을 변환하는 중이에요...
                  </p>
                )}

                {fileError && (
                  <p role="alert" className="text-sm text-[#B23B32] text-center">
                    {fileError}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => router.back()}
                  disabled={isSubmitting || isPreparing}
                  className="flex-1 border border-gray-300 text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!uploadedFile || isSubmitting || isPreparing}
                  className={`flex-1 font-semibold py-3 rounded-xl text-white transition-colors ${
                    uploadedFile
                      ? "bg-[#034078] hover:bg-[#023456]"
                      : "bg-gray-400 cursor-not-allowed"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSubmitting
                    ? "분석 중..."
                    : isPreparing
                    ? "변환 중..."
                    : "분석하기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
