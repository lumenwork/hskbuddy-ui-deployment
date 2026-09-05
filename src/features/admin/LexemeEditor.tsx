import type { LexemeBody } from "./contract.generated";
import { Field, control } from "./ui";
const blank: LexemeBody = {
  sense_key: "",
  hanzi: "",
  pinyin: "",
  vietnamese_gloss: "",
  example_hanzi: "",
  example_pinyin: "",
  example_translation: "",
};
export function LexemeFields({
  value,
  onChange,
}: {
  value: LexemeBody | null;
  onChange: (value: LexemeBody) => void;
}) {
  const fields = [
    ["sense_key", "Mã nghĩa / cách đọc"],
    ["hanzi", "Chữ Hán"],
    ["pinyin", "Pinyin có dấu"],
    ["vietnamese_gloss", "Nghĩa tiếng Việt"],
    ["example_hanzi", "Ví dụ tiếng Trung"],
    ["example_pinyin", "Pinyin của ví dụ"],
    ["example_translation", "Bản dịch ví dụ"],
  ] as const;
  return (
    <fieldset className="space-y-3">
      <legend className="font-semibold">Nghĩa từ và ví dụ</legend>
      {fields.map(([key, label]) => (
        <Field key={key} label={label}>
          <textarea
            required
            className={control}
            lang={
              key.includes("hanzi")
                ? "zh-Hans"
                : key.includes("pinyin")
                  ? "zh-Latn-pinyin"
                  : "vi"
            }
            value={value?.[key] ?? ""}
            onChange={(e) =>
              onChange({ ...blank, ...value, [key]: e.target.value })
            }
          />
        </Field>
      ))}
    </fieldset>
  );
}
