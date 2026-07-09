"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import TopBar from "@/components/topbar";

interface VoiceRecording {
  questionId: number;
  fileName?: string;
}

const QUESTIONS = [
  "본인의 장단점은 무엇인가요?",
  "이전 직무에서 어려웠던 경험을 말씀해주세요",
  "왜 우리 회사에 지원했나요?",
  "팀 프로젝트에서의 역할은 무엇이었나요?",
  "스트레스를 어떻게 관리하나요?",
  "5년 후의 자신의 모습을 그려보세요",
  "본인의 가장 큰 성취는 무엇인가요?",
];

const ITEMS_PER_PAGE = 7;

export default function InterviewPracticePage() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id;

  const [currentPage, setCurrentPage] = useState(1);
  const [voiceRecordings, setVoiceRecordings] = useState<VoiceRecording[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalPages = Math.ceil(QUESTIONS.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentQuestions = QUESTIONS.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handleQuestionClick = (questionIdx: number) => {
    setSelectedQuestion(questionIdx);
    setShowModal(true);
    setUploadedFile(null);
    setIsRecording(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

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

  const handleSubmitVoice = () => {
    if (!selectedQuestion && selectedQuestion !== 0) return;

    const hasRecording = voiceRecordings.some(
      (r) => r.questionId === selectedQuestion
    );

    if (hasRecording) {
      setVoiceRecordings((prev) =>
        prev.map((r) =>
          r.questionId === selectedQuestion
            ? { ...r, fileName: uploadedFile?.name || "음성파일" }
            : r
        )
      );
    } else {
      setVoiceRecordings((prev) => [
        ...prev,
        {
          questionId: selectedQuestion,
          fileName: uploadedFile?.name || "음성파일",
        },
      ]);
    }

    setShowModal(false);
    setUploadedFile(null);
  };

  const handleAnalysis = () => {
    if (voiceRecordings.length !== QUESTIONS.length) {
      alert("모든 질문에 대한 음성 녹음이 필요합니다");
      return;
    }
    router.push(`/interview-practice/${interviewId}/analysis`);
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (isRecording && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const hasAllRecordings = voiceRecordings.length === QUESTIONS.length;

  return (
    <div className="flex-1 flex flex-col bg-white">
      <TopBar />
      <main className="flex-1 flex justify-center py-12 px-6">
        <div className="w-full max-w-4xl">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              면접 예상 질문 리스트
            </h1>
            <p className="text-gray-600 text-sm">
              면접에서 자주 묻는 질문을 확인하고 답변을 준비해보세요.
            </p>
          </div>

          {/* Questions List */}
          <div className="border border-gray-300 rounded-xl overflow-hidden mb-8">
            {currentQuestions.map((question, idx) => {
              const absoluteIdx = startIdx + idx;
              const hasRecording = voiceRecordings.some(
                (r) => r.questionId === absoluteIdx
              );

              return (
                <button
                  key={absoluteIdx}
                  onClick={() => handleQuestionClick(absoluteIdx)}
                  className="w-full flex items-center justify-between p-6 border-b border-gray-200 hover:bg-blue-50 transition-colors text-left last:border-b-0"
                >
                  <div className="flex items-center gap-6 flex-1">
                    <span className="text-lg font-bold text-[#034078] min-w-12">
                      {String(absoluteIdx + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-gray-900 font-medium">{question}</p>
                      {hasRecording && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ 음성 등록됨
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-400 text-xl">›</span>
                </button>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 mb-8">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-gray-600 disabled:text-gray-300"
            >
              ‹‹
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-gray-600 disabled:text-gray-300"
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 ${
                  page === currentPage
                    ? "text-[#034078] font-bold"
                    : "text-gray-600"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-gray-600 disabled:text-gray-300"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-gray-600 disabled:text-gray-300"
            >
              ››
            </button>
          </div>

          {/* Analysis Button */}
          <button
            onClick={handleAnalysis}
            disabled={!hasAllRecordings}
            className={`w-full py-4 rounded-lg font-semibold text-white transition-colors ${
              hasAllRecordings
                ? "bg-[#034078] hover:bg-[#023456]"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            면접 연습 스피치 분석 받기
          </button>
        </div>
      </main>

      {/* Modal */}
      {showModal && selectedQuestion !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-6 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              면접 연습 스피치 분석 방법
            </h2>
            <p className="text-gray-900 font-semibold mb-4">
              {QUESTIONS[selectedQuestion]}
            </p>
            <p className="text-gray-600 text-sm mb-6">
              질문에 대한 답변 녹음하거나 파일을 업로드 하세요.
            </p>

            {/* Recording Status */}
            {isRecording && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 font-semibold text-center">
                  🔴 녹음 중... {String(Math.floor(recordingTime / 60)).padStart(2, "0")}:{String(recordingTime % 60).padStart(2, "0")}
                </p>
              </div>
            )}

            {/* Microphone Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`flex items-center justify-center transition-all ${
                  isRecording
                    ? "scale-110"
                    : "hover:scale-105"
                }`}
              >
                <div className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-red-500 shadow-lg animate-pulse"
                    : "bg-blue-50"
                }`}>
                  <Image
                    src="/mic.svg"
                    alt={isRecording ? "녹음 중지" : "녹음 시작"}
                    width={60}
                    height={60}
                    className={isRecording ? "brightness-0 invert" : ""}
                  />
                  {isRecording && (
                    <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75"></div>
                  )}
                </div>
              </button>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-900 block mb-2">
                파일 업로드
              </label>
              <label className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <p className="text-sm text-gray-600">
                  {uploadedFile
                    ? `✓ ${uploadedFile.name}`
                    : "음성 파일을 업로드하세요 (100MB 이하, MP3/WAV)"}
                </p>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (isRecording) handleStopRecording();
                  setShowModal(false);
                }}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소하기
              </button>
              <button
                onClick={handleSubmitVoice}
                disabled={!uploadedFile}
                className={`flex-1 font-semibold py-3 rounded-lg text-white transition-colors ${
                  uploadedFile
                    ? "bg-[#034078] hover:bg-[#023456]"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                제출하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
