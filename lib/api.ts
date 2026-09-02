const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

interface RefreshRequest {
  refresh_token: string;
}

export async function signup(body: SignupRequest): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "회원가입 실패");
  }

  return response.json();
}

export async function login(body: LoginRequest): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "로그인 실패");
  }

  return response.json();
}

export async function refreshTokens(
  refresh_token: string
): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });

  if (!response.ok) {
    throw new Error("토큰 갱신 실패");
  }

  return response.json();
}

interface ApplicationCreateRequest {
  company_name: string;
  position: string;
  stage?: string;
  date?: string;
  status: "PREPARING" | "IN_PROGRESS" | "COMPLETED";
}

interface ApplicationResponse {
  application_id: string;
  user_id: string;
  company_name: string;
  position: string;
  stage?: string;
  date?: string;
  status: string;
  created_at: string;
  updated_at: string;
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

interface TimelineStageItem {
  stage: string;
  status: string;
}

interface ApplicationDetailResponse {
  application_id: string;
  company_name: string;
  position: string;
  current_stage: string;
  status: string;
  first_interview_retrospect_completed: boolean;
  second_interview_retrospect_completed: boolean;
  timeline: TimelineStageItem[];
}

interface StageResultUpdateRequest {
  stage: string;
  status: string;
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
  const response = await fetch(`${API_BASE_URL}/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "지원 추가 실패");
  }

  return response.json();
}

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

export async function startRetrospect(
  body: RetrospectStartRequest,
  access_token: string
): Promise<RetrospectStartResponse> {
  const response = await fetch(`${API_BASE_URL}/retrospects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      const message = typeof error.detail === "string"
        ? error.detail
        : Array.isArray(error.detail)
        ? error.detail[0]
        : error.message || "회고 시작 실패";
      throw new Error(message);
    } catch (e) {
      console.error("회고 시작 실패:", response.status, response.statusText, e);
      throw new Error(`회고 시작 실패 (${response.status} ${response.statusText})`);
    }
  }

  return response.json();
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

export async function chatRetrospect(
  session_id: string,
  body: RetrospectChatRequest,
  access_token: string
): Promise<RetrospectChatResponse> {
  const response = await fetch(`${API_BASE_URL}/retrospects/${session_id}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      const message = typeof error.detail === "string"
        ? error.detail
        : Array.isArray(error.detail)
        ? error.detail[0]
        : error.message || "메시지 전송 실패";
      throw new Error(message);
    } catch (e) {
      throw new Error("메시지 전송 실패");
    }
  }

  return response.json();
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

export async function getRetrospects(
  application_id: string,
  access_token: string
): Promise<RetrospectListResponse> {
  const response = await fetch(
    `${API_BASE_URL}/retrospects?application_id=${application_id}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "회고 목록 조회 실패");
  }

  return response.json();
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

export async function summarizeRetrospect(
  session_id: string,
  access_token: string
): Promise<RetrospectSummaryResponse> {
  const response = await fetch(
    `${API_BASE_URL}/retrospects/${session_id}/summarize`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "회고 요약 생성 실패");
  }

  return response.json();
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

export async function getRetrospect(
  session_id: string,
  access_token: string
): Promise<RetrospectDetailResponse> {
  const response = await fetch(
    `${API_BASE_URL}/retrospects/${session_id}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "회고 세부사항 조회 실패");
  }

  return response.json();
}

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

export async function getApplications(
  access_token: string,
  page: number = 1
): Promise<ApplicationListResponse> {
  const response = await fetch(
    `${API_BASE_URL}/applications?page=${page}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  if (!response.ok) {
    try {
      const error = await response.json();
      const message = typeof error.detail === "string"
        ? error.detail
        : Array.isArray(error.detail)
        ? error.detail[0]
        : error.message || "지원 목록 조회 실패";
      throw new Error(message);
    } catch (e) {
      console.error("지원 목록 조회 실패:", response.status, response.statusText, e);
      throw new Error(`지원 목록 조회 실패 (${response.status} ${response.statusText})`);
    }
  }

  return response.json();
}

export async function getApplicationDetail(
  application_id: string,
  access_token: string
): Promise<ApplicationDetailResponse> {
  const response = await fetch(
    `${API_BASE_URL}/applications/${application_id}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "지원 정보 조회 실패");
  }

  return response.json();
}

export async function updateStageResult(
  application_id: string,
  body: StageResultUpdateRequest,
  access_token: string
): Promise<StageResultResponse> {
  const response = await fetch(
    `${API_BASE_URL}/applications/${application_id}/stage-result`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "단계 업데이트 실패");
  }

  return response.json();
}

export async function createSpeechPractice(
  body: {
    application_id: string;
    company_name: string;
    position: string;
    personal_statements: Array<{ question: string; content: string }>;
  },
  access_token: string
) {
  const response = await fetch(`${API_BASE_URL}/speech-practices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "예상 질문 추출 실패");
  }

  return response.json();
}

export async function getSpeechQuestions(
  application_id: string,
  access_token: string
): Promise<SpeechQuestionsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/speech-practices/${application_id}/questions`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "질문 목록 조회 실패");
  }

  return response.json();
}
