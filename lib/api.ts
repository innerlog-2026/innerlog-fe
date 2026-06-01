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
