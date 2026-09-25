import type { SpeechAnalysisResponse } from "./api";

/**
 * 스피치 분석 결과를 제출 화면 → 결과 화면으로 넘기기 위한 임시 보관소.
 *
 * 분석 결과는 POST /speech-practices/questions/{id}/submissions 응답에만 실려 오고,
 * submission_id 로 다시 조회하는 GET 엔드포인트가 아직 없다. 그래서 응답을 직접 들고 간다.
 *
 * sessionStorage 를 쓰는 이유: 같은 탭에서 새로고침해도 살아남기 때문이다.
 * (탭을 닫거나 새 탭에서 주소를 열면 사라진다 — 결과 화면이 그 경우를 안내한다.)
 * 서버에 조회 API 가 생기면 이 파일을 지우고 그쪽으로 갈아끼우면 된다.
 */

const KEY_PREFIX = "innerlog:speech-analysis:";

// useSyncExternalStore 의 getSnapshot 은 호출할 때마다 같은 참조를 돌려줘야 한다.
// JSON.parse 결과를 그대로 주면 매번 새 객체라 무한 리렌더가 된다.
const cache = new Map<string, SpeechAnalysisResponse | null>();

export function saveSpeechAnalysis(result: SpeechAnalysisResponse): void {
  try {
    cache.set(result.submission_id, result);
    sessionStorage.setItem(
      KEY_PREFIX + result.submission_id,
      JSON.stringify(result)
    );
  } catch {
    // 저장 실패(용량 초과, 프라이빗 모드 등)해도 제출 자체는 성공이므로 막지 않는다.
  }
}

export function loadSpeechAnalysis(
  submissionId: string | null
): SpeechAnalysisResponse | null {
  if (!submissionId) return null;

  const cached = cache.get(submissionId);
  if (cached !== undefined) return cached;

  let value: SpeechAnalysisResponse | null = null;
  try {
    const raw = sessionStorage.getItem(KEY_PREFIX + submissionId);
    if (raw) value = JSON.parse(raw) as SpeechAnalysisResponse;
  } catch {
    value = null;
  }

  cache.set(submissionId, value);
  return value;
}

/** 한 번 읽고 끝이라 구독할 변경이 없다. useSyncExternalStore 규약을 맞추기 위한 no-op. */
export function subscribeSpeechAnalysis(): () => void {
  return () => {};
}
