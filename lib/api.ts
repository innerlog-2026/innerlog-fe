import { clearTokens, getAccessToken, refreshAccessToken } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** 서버가 응답은 했지만 실패 상태코드를 돌려준 경우 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** 서버에 연결 자체가 되지 않은 경우 (백엔드 다운, 네트워크 끊김 등) */
export class NetworkError extends Error {
  constructor(
    message = "서버에 연결할 수 없습니다. 네트워크 상태를 확인하거나 잠시 후 다시 시도해 주세요."
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

/**
 * 에러 응답 본문에서 사람이 읽을 메시지를 뽑아낸다.
 * 본문이 JSON이 아니거나 비어 있으면 상태코드를 붙인 기본 메시지로 대체한다.
 */
async function parseErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const error = await response.json();
    const detail = error?.detail;

    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (typeof first === "string") return first;
      if (typeof first?.msg === "string") return first.msg;
    }
    if (typeof error?.message === "string") return error.message;
  } catch {
    // 본문이 JSON이 아니거나 비어 있음 — fallback 사용
  }

  return `${fallback} (${response.status} ${response.statusText})`;
}

function redirectToLogin() {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

interface RequestOptions {
  method?: string;
  /** 있으면 Authorization 헤더를 붙이고, 401 시 토큰 갱신 후 재시도한다 */
  token?: string;
  /** JSON 본문 (Content-Type 자동 설정) */
  json?: unknown;
  /** 멀티파트 본문 (Content-Type은 브라우저가 설정) */
  formData?: FormData;
  /** 에러 메시지를 서버에서 못 읽었을 때 쓸 기본 문구 */
  errorMessage: string;
}

/**
 * 모든 API 호출의 공통 경로.
 * - 네트워크 실패는 NetworkError로 구분
 * - 401이면 리프레시 토큰으로 한 번 갱신 후 재시도, 그래도 실패하면 로그인 페이지로
 * - 실패 응답은 서버가 보낸 detail 메시지를 그대로 보존
 */
async function request<T>(path: string, options: RequestOptions): Promise<T> {
  const { method = "GET", json, formData, errorMessage } = options;

  const send = async (token?: string): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (json !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      return await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: formData ?? (json !== undefined ? JSON.stringify(json) : undefined),
      });
    } catch {
      // fetch가 던지는 TypeError = 응답을 받지 못함
      throw new NetworkError();
    }
  };

  let token = options.token;
  let response = await send(token);

  if (response.status === 401 && token) {
    // 1) 이 요청이 나가 있는 동안 다른 요청이 이미 토큰을 갱신해 뒀다면
    //    갱신을 또 요청하지 않고 저장된 새 토큰으로 바로 재시도한다.
    const stored = getAccessToken();
    if (stored && stored !== token) {
      token = stored;
      response = await send(token);
    }

    // 2) 그래도 401이면 직접 갱신한다. 동시 호출은 auth.ts에서 한 번으로 합쳐진다.
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        token = getAccessToken() ?? undefined;
        response = await send(token);
      }

      if (!refreshed || response.status === 401) {
        clearTokens();
        redirectToLogin();
        throw new ApiError("세션이 만료되었습니다. 다시 로그인해 주세요.", 401);
      }
    }
  }

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response, errorMessage), response.status);
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// 인증
// ---------------------------------------------------------------------------

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

interface SignupRequest {
  email: string;
  password: string;
  name: string;
  part: "FRONT" | "BACK" | "AI" | "DATA";
}

interface LoginRequest {
  email: string;
  password: string;
}

export async function signup(body: SignupRequest): Promise<TokenResponse> {
  return request<TokenResponse>("/auth/signup", {
    method: "POST",
    json: body,
    errorMessage: "회원가입 실패",
  });
}

export async function login(body: LoginRequest): Promise<TokenResponse> {
  return request<TokenResponse>("/auth/login", {
    method: "POST",
    json: body,
    errorMessage: "로그인 실패",
  });
}

export async function refreshTokens(
  refresh_token: string
): Promise<TokenResponse> {
  return request<TokenResponse>("/auth/refresh", {
    method: "POST",
    json: { refresh_token },
    errorMessage: "토큰 갱신 실패",
  });
}

// ---------------------------------------------------------------------------
// 지원(applications)
// ---------------------------------------------------------------------------

interface ApplicationCreateRequest {
  company_name: string;
  position: string;
  stage?: string;
  date?: string;
  status: "진행중" | "완료";
}

interface ApplicationResponse {
  application_id: string;
  user_id: string;
  company_name: string;
  stage: string;
  status: string;
}

interface ApplicationListItem {
  application_id: string;
  company_name: string;
  position: string;
  stage: string;
  status: string;
  created_at: string;
}

interface ApplicationListResponse {
  items: ApplicationListItem[];
  page: number;
  size: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
}

/** 타임라인 상태. 미도달 단계는 "대기" (서버에 저장되지 않고 응답에서 파생) */
export type TimelineStatus = "대기" | "진행중" | "합격" | "탈락";

export interface TimelineStageItem {
  stage: string;
  status: TimelineStatus;
}

export interface ApplicationDetailResponse {
  application_id: string;
  company_name: string;
  position: string;
  current_stage: string | null;
  /** 현재 전형 단계의 상태. null = 대기 */
  status: "진행중" | "합격" | "탈락" | null;

  /** 회고: available = 현재 단계가 해당 면접 이상, created = 세션 존재(true면 새로 시작 불가), completed = 요약 완료 */
  first_retrospect_available: boolean;
  first_retrospect_created: boolean;
  first_retrospect_completed: boolean;
  second_retrospect_available: boolean;
  second_retrospect_created: boolean;
  second_retrospect_completed: boolean;
  final_retrospect_available: boolean;
  final_retrospect_created: boolean;
  final_retrospect_completed: boolean;

  /** 예상 질문이 한 번이라도 저장됐는지. true면 POST /speech-practices 는 409 */
  speech_practice_created: boolean;
  /** 현재 단계·상태에서 스피치 연습이 허용되는지 (서버 게이팅과 동일 기준) */
  speech_practice_available: boolean;

  timeline: TimelineStageItem[];
}

interface StageResultUpdateRequest {
  stage: string;
  status: "진행중" | "합격" | "탈락";
}

interface StageResultResponse {
  application_id: string;
  stage: string;
  status: string;
}

export async function createApplication(
  body: ApplicationCreateRequest,
  access_token: string
): Promise<ApplicationResponse> {
  return request<ApplicationResponse>("/applications", {
    method: "POST",
    token: access_token,
    json: body,
    errorMessage: "지원 추가 실패",
  });
}

export async function getApplications(
  access_token: string,
  page: number = 1
): Promise<ApplicationListResponse> {
  return request<ApplicationListResponse>(`/applications?page=${page}`, {
    token: access_token,
    errorMessage: "지원 목록 조회 실패",
  });
}

export async function getApplicationDetail(
  application_id: string,
  access_token: string
): Promise<ApplicationDetailResponse> {
  return request<ApplicationDetailResponse>(`/applications/${application_id}`, {
    token: access_token,
    errorMessage: "지원 정보 조회 실패",
  });
}

export async function updateStageResult(
  application_id: string,
  body: StageResultUpdateRequest,
  access_token: string
): Promise<StageResultResponse> {
  return request<StageResultResponse>(
    `/applications/${application_id}/stage-result`,
    {
      method: "PATCH",
      token: access_token,
      json: body,
      errorMessage: "단계 업데이트 실패",
    }
  );
}

// ---------------------------------------------------------------------------
// 회고(retrospects)
// ---------------------------------------------------------------------------

interface RetrospectStartRequest {
  application_id: string;
  level: "HARD" | "MEDIUM_HIGH" | "MEDIUM_LOW" | "EASY";
  memo?: string;
}

interface RetrospectStartResponse {
  session_id: string;
  application_id: string;
  type?: string;
  stage?: string;
  status?: string;
  message: string;
  started_at?: string;
}

interface RetrospectChatRequest {
  message: string;
}

interface RetrospectChatResponse {
  session_id: string;
  message: string;
  stage: string;
  is_done: boolean;
}

interface RetrospectListResponse {
  application_id: string;
  sessions: Array<{
    session_id: string;
    type: string;
    stage: string;
    status: string;
    started_at: string;
    ended_at?: string;
  }>;
}

interface InterviewAnalysis {
  summary: string;
  hypothesis: string;
  strengths: string[];
  weaknesses: string[];
  gap_analysis: string;
  actions: string[];
}

interface RetrospectSummaryResponse {
  session_id: string;
  company: string;
  role: string;
  interview_type: string;
  analysis: InterviewAnalysis;
}

interface ChatMessage {
  sender: "user" | "ai";
  message: string;
  sequence: number;
}

interface RetrospectDetailResponse {
  session_id: string;
  application_id: string;
  type: string;
  stage: string;
  status: string;
  started_at: string;
  ended_at?: string;
  chats: ChatMessage[];
  analysis?: InterviewAnalysis;
}

export async function startRetrospect(
  body: RetrospectStartRequest,
  access_token: string
): Promise<RetrospectStartResponse> {
  return request<RetrospectStartResponse>("/retrospects", {
    method: "POST",
    token: access_token,
    json: body,
    errorMessage: "회고 시작 실패",
  });
}

export async function chatRetrospect(
  session_id: string,
  body: RetrospectChatRequest,
  access_token: string
): Promise<RetrospectChatResponse> {
  return request<RetrospectChatResponse>(`/retrospects/${session_id}/chat`, {
    method: "POST",
    token: access_token,
    json: body,
    errorMessage: "메시지 전송 실패",
  });
}

export async function getRetrospects(
  application_id: string,
  access_token: string
): Promise<RetrospectListResponse> {
  return request<RetrospectListResponse>(
    `/retrospects?application_id=${application_id}`,
    {
      token: access_token,
      errorMessage: "회고 목록 조회 실패",
    }
  );
}

export async function summarizeRetrospect(
  session_id: string,
  access_token: string
): Promise<RetrospectSummaryResponse> {
  return request<RetrospectSummaryResponse>(
    `/retrospects/${session_id}/summarize`,
    {
      method: "POST",
      token: access_token,
      errorMessage: "회고 요약 생성 실패",
    }
  );
}

export async function getRetrospect(
  session_id: string,
  access_token: string
): Promise<RetrospectDetailResponse> {
  return request<RetrospectDetailResponse>(`/retrospects/${session_id}`, {
    token: access_token,
    errorMessage: "회고 세부사항 조회 실패",
  });
}

// ---------------------------------------------------------------------------
// 말하기 연습(speech-practices)
// ---------------------------------------------------------------------------

interface SpeechQuestionItem {
  question_id: string;
  question: string;
  category: string;
  sequence: number;
}

interface SpeechQuestionsResponse {
  application_id: string;
  total_count: number;
  practiced_count: number;
  questions: SpeechQuestionItem[];
}

interface SpeechAnalysisResponse {
  submission_id: string;
  question_id: string;
  acoustic: Record<string, any>;
  content: Record<string, any>;
}

export async function createSpeechPractice(
  body: {
    application_id: string;
    company_name: string;
    position: string;
    personal_statements: Array<{ question: string; content: string }>;
  },
  access_token: string
): Promise<unknown> {
  return request<unknown>("/speech-practices", {
    method: "POST",
    token: access_token,
    json: body,
    errorMessage: "예상 질문 추출 실패",
  });
}

export async function getSpeechQuestions(
  application_id: string,
  access_token: string
): Promise<SpeechQuestionsResponse> {
  return request<SpeechQuestionsResponse>(
    `/speech-practices/${application_id}/questions`,
    {
      token: access_token,
      errorMessage: "질문 목록 조회 실패",
    }
  );
}

export async function analyzeSpeech(
  questionId: string,
  audioFile: File,
  access_token: string,
  inputType: "RECORDING" | "UPLOAD" = "UPLOAD"
): Promise<SpeechAnalysisResponse> {
  const formData = new FormData();
  formData.append("file", audioFile);
  formData.append("input_type", inputType);

  return request<SpeechAnalysisResponse>(
    `/speech-practices/questions/${questionId}/submissions`,
    {
      method: "POST",
      token: access_token,
      formData,
      errorMessage: "음성 분석 실패",
    }
  );
}
