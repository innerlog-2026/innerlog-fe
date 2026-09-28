import { Fragment, type ReactNode } from "react";

/**
 * AI 응답에 섞여 오는 최소한의 마크다운만 렌더링한다.
 * (**굵게**, *기울임*, `코드`)
 *
 * 회고/분석 텍스트는 LLM 이 생성하는 짧은 산문이라 목록·표·링크까지 지원할 필요가
 * 없다. 라이브러리를 새로 붙이는 대신 이 세 가지만 처리하고, 나머지는 원문 그대로
 * 보여준다. 줄바꿈은 호출부의 whitespace-pre-wrap 이 맡는다.
 */
const TOKEN = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;

export default function MarkdownText({ text }: { text: string }) {
  const parts = text.split(TOKEN);

  return (
    <>
      {parts.map((part, idx) => {
        if (!part) return null;
        const key = `${idx}-${part}`;

        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return <strong key={key} className="font-bold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return <em key={key}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code key={key} className="rounded bg-black/10 px-1 py-0.5 text-[0.9em]">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <Fragment key={key}>{part as ReactNode}</Fragment>;
      })}
    </>
  );
}
