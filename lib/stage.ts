export const ALL_STAGES = [
  "서류전형",
  "코딩테스트",
  "1차면접",
  "2차면접",
  "최종면접",
] as const;

export const FINAL_STAGE = ALL_STAGES[ALL_STAGES.length - 1];

export type StageStatus = "진행중" | "합격" | "탈락";

export interface StageResultRequest {
  stage: string;
  status: StageStatus;
}

/**
 * 바로 다음 전형 단계. 최종면접(마지막)이면 null.
 * 단계를 건너뛰는 회사(코테 없음 등)는 호출부에서 nextStage를 직접 지정한다.
 */
export function getNextStage(stage: string): string | null {
  const idx = ALL_STAGES.indexOf(stage as (typeof ALL_STAGES)[number]);
  if (idx === -1 || idx === ALL_STAGES.length - 1) return null;
  return ALL_STAGES[idx + 1];
}

/**
 * "완료 > 합격/불합격" 선택을 PATCH /applications/{id}/stage-result 본문으로 변환한다.
 *
 * 서버는 지정한 단계 이전 단계들을 합격으로 시딩하므로, 합격은 현재 단계가 아니라
 * 다음 단계를 진행중으로 요청한다. 최종면접 합격만 예외로 자기 자신을 합격 처리한다.
 *
 *   1차면접 진행중 + 합격 -> {2차면접, 진행중}
 *   1차면접 진행중 + 불합격 -> {1차면접, 탈락}
 *   최종면접 진행중 + 합격 -> {최종면접, 합격}
 *
 * @param nextStage 단계를 건너뛸 때 지정 (예: 코테 없는 회사에서 서류 합격 -> 1차면접)
 */
export function buildStageResult(
  currentStage: string,
  isPass: boolean,
  nextStage?: string
): StageResultRequest {
  if (!isPass) {
    return { stage: currentStage, status: "탈락" };
  }

  const next = nextStage ?? getNextStage(currentStage);
  if (!next) {
    return { stage: currentStage, status: "합격" };
  }

  return { stage: next, status: "진행중" };
}

/**
 * 다음 단계를 화면에 표시할 때 쓰는 라벨.
 * 최종면접 다음은 별도 전형이 아니므로 "결과확정"으로 표시하고,
 * 알 수 없는 단계는 그대로 돌려준다.
 */
export function getNextStageLabel(stage: string): string {
  if (stage === FINAL_STAGE) return "결과확정";
  return getNextStage(stage) ?? stage;
}
