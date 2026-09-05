import type { LessonBlock } from "../../lib/api";
import type { Body, Revision } from "./contract.generated";
import { control, Field } from "./ui";

export function newBlock(type: LessonBlock["type"]): LessonBlock {
  switch (type) {
    case "vocabulary":
      return { type, hanzi: "", pinyin: "", meaning: "" };
    case "grammar":
      return { type, title: "", explanation: "" };
    case "example":
      return { type, hanzi: "", pinyin: "", translation: "" };
    case "audio":
      return { type, label: "" };
    case "retrieval":
      return { type, prompt: "", item_id: "" };
  }
}
export function BlockFields({
  block,
  onChange,
  questions,
}: {
  block: LessonBlock;
  onChange: (b: LessonBlock) => void;
  questions: Revision[];
}) {
  const labels: Record<string, string> = {
    hanzi: "Chữ Hán",
    pinyin: "Pinyin có dấu",
    meaning: "Nghĩa tiếng Việt",
    title: "Tiêu đề",
    explanation: "Giải thích tiếng Việt",
    translation: "Bản dịch",
    label: "Nhãn âm thanh",
    prompt: "Lời nhắc",
  };
  return (
    <>
      {Object.entries(block)
        .filter(([k]) => k !== "type" && k !== "item_id" && k !== "audio_url")
        .map(([key, value]) => (
          <Field key={key} label={labels[key] ?? key}>
            <textarea
              required
              lang={
                key === "hanzi"
                  ? "zh-Hans"
                  : key === "pinyin"
                    ? "zh-Latn-pinyin"
                    : "vi"
              }
              className={control}
              value={String(value)}
              onChange={(e) => onChange({ ...block, [key]: e.target.value })}
            />
          </Field>
        ))}
      {block.type === "retrieval" && (
        <Field label="Câu hỏi đã xuất bản">
          <select
            required
            className={control}
            value={block.item_id}
            onChange={(e) => onChange({ ...block, item_id: e.target.value })}
          >
            <option value="">Chọn câu hỏi</option>
            {questions.map((q) => (
              <option key={q.id} value={q.document_id}>
                {q.body.title} · bản {q.revision_number}
              </option>
            ))}
          </select>
        </Field>
      )}
    </>
  );
}
export function Preview({ body, kind }: { body: Body; kind: string }) {
  return (
    <div className="mt-4 space-y-3 leading-relaxed">
      <h3 className="text-xl font-bold">{body.title}</h3>
      {kind === "lexeme" && body.lexeme ? (
        <>
          <p lang="zh-Hans" className="font-hanzi text-xl">
            {body.lexeme.hanzi}
          </p>
          <p lang="zh-Latn-pinyin">{body.lexeme.pinyin}</p>
          <p>{body.lexeme.vietnamese_gloss}</p>
          <p lang="zh-Hans">{body.lexeme.example_hanzi}</p>
          <p lang="zh-Latn-pinyin">{body.lexeme.example_pinyin}</p>
          <p>{body.lexeme.example_translation}</p>
        </>
      ) : kind === "question" ? (
        <>
          <p>{body.prompt}</p>
          <ul>
            {body.options.map((o) => (
              <li lang="zh-Hans" key={o.id}>
                {o.id}. {o.text}
              </li>
            ))}
          </ul>
        </>
      ) : (
        ((body.blocks ?? []) as LessonBlock[]).map((b, i) => (
          <div className="border-t border-line py-3" key={i}>
            {Object.entries(b)
              .filter(
                ([k]) => k !== "type" && k !== "item_id" && k !== "audio_url",
              )
              .map(([k, v]) => (
                <p
                  key={k}
                  lang={
                    k === "hanzi"
                      ? "zh-Hans"
                      : k === "pinyin"
                        ? "zh-Latn-pinyin"
                        : "vi"
                  }
                  className={k === "hanzi" ? "font-hanzi text-xl" : ""}
                >
                  {v}
                </p>
              ))}
          </div>
        ))
      )}
    </div>
  );
}
