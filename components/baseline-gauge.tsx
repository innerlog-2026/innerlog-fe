import type { CSSProperties } from "react";
import type { AcousticBaseline } from "@/lib/api";

interface BaselineGaugeProps {
  value: number;
  baseline: AcousticBaseline;
  /** 왼쪽 끝(p5) 라벨. 예: "느림" */
  minLabel: string;
  /** 오른쪽 끝(p95) 라벨. 예: "빠름" */
  maxLabel: string;
  /** 마커 위 라벨. 예: "나", "나 40초" */
  markerLabel: string;
  /** 평균 눈금 아래 라벨. 예: "평균 90.1" */
  meanLabel: string;
}

/** baseline 이 게이지를 그릴 수 있는 모양인지. 예전 결과에는 필드 자체가 없다. */
export function isDrawableBaseline(
  baseline: AcousticBaseline | null | undefined
): baseline is AcousticBaseline {
  if (!baseline) return false;
  const { p5, p33, p67, p95, mean } = baseline;
  return (
    [p5, p33, p67, p95, mean].every((n) => typeof n === "number" && Number.isFinite(n)) &&
    p95 > p5
  );
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** 끝에 붙은 라벨이 카드 밖으로 넘치지 않도록 정렬 기준을 바꾼다. */
function labelStyle(ratio: number): CSSProperties {
  const left = `${ratio * 100}%`;
  if (ratio < 0.08) return { left, transform: "translateX(-8px)" };
  if (ratio > 0.92) return { left, transform: "translateX(calc(-100% + 8px))" };
  return { left, transform: "translateX(-50%)" };
}

/**
 * 평균 대비 내 위치를 보여주는 가로 게이지.
 * 양 끝 = p5 ~ p95, 보통 범위 띠 = p33 ~ p67, 범위를 벗어난 값은 끝에 고정한다.
 */
export default function BaselineGauge({
  value,
  baseline,
  minLabel,
  maxLabel,
  markerLabel,
  meanLabel,
}: BaselineGaugeProps) {
  const { p5, p33, p67, p95, mean } = baseline;
  const toRatio = (n: number) => clamp01((n - p5) / (p95 - p5));

  const marker = toRatio(value);
  const meanPos = toRatio(mean);
  const bandStart = toRatio(p33);
  const bandEnd = toRatio(p67);
  const bandCenter = (bandStart + bandEnd) / 2;
  // 마커 라벨과 겹치면 "보통 범위" 라벨은 생략한다.
  const showBandLabel = Math.abs(marker - bandCenter) > 0.15;

  return (
    <div className="mt-4" aria-hidden="true">
      <div className="relative h-4 text-[11px] font-semibold text-blue-600">
        {showBandLabel && (
          <span className="absolute whitespace-nowrap" style={labelStyle(bandCenter)}>
            보통 범위
          </span>
        )}
        <span className="absolute whitespace-nowrap" style={labelStyle(marker)}>
          {markerLabel}
        </span>
      </div>

      <div className="relative h-5">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gray-200" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-blue-100"
          style={{
            left: `${bandStart * 100}%`,
            width: `${(bandEnd - bandStart) * 100}%`,
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-0.5 h-4 bg-gray-700"
          style={{ left: `${meanPos * 100}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow"
          style={{ left: `${marker * 100}%` }}
        />
      </div>

      <div className="relative h-4 mt-1 text-[11px] text-gray-500">
        <span className="absolute left-0">{minLabel}</span>
        <span
          className="absolute whitespace-nowrap font-semibold text-gray-800"
          style={labelStyle(meanPos)}
        >
          {meanLabel}
        </span>
        <span className="absolute right-0">{maxLabel}</span>
      </div>
    </div>
  );
}
