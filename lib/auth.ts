const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "innerlog_user";

interface User {
  name: string;
  profileImage?: string;
}

export function saveTokens(accessToken: string, refreshToken: string, userName?: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (userName) {
      const user: User = {
        name: userName,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }
}

export function getAccessToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
}

export function getRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
}

export function getUser(): User | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function clearTokens() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

let refreshPromise: Promise<boolean> | null = null;

async function requestRefresh(): Promise<boolean> {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (!data.access_token || !data.refresh_token) return false;

    saveTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    // 네트워크 장애 등으로 갱신 자체가 불가능한 경우
    return false;
  }
}

/**
 * 액세스 토큰을 갱신한다.
 * 여러 요청이 동시에 401을 받아도 갱신 요청은 한 번만 나가도록 in-flight 프라미스를 공유한다.
 */
export async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = requestRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}
