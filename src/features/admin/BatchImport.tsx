import { useState } from "react";
import type { Revision, Validation } from "./contract.generated";
import { control, button, Field, errorText, post } from "./ui";

export function Import() {
  const [text, setText] = useState("");
  const [validation, setValidation] = useState<Validation>();
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  function change(value: string) {
    setText(value);
    setValidation(undefined);
    setNote("");
    setError("");
  }
  async function validate() {
    setBusy(true);
    setValidation(undefined);
    setNote("");
    setError("");
    try {
      setValidation(
        await post<Validation>("imports/validate", JSON.parse(text)),
      );
    } catch (e) {
      setError(
        e instanceof SyntaxError ? "Tệp JSON chưa đúng cú pháp." : errorText(e),
      );
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    if (!validation) return;
    setBusy(true);
    setError("");
    try {
      const result = await post<Revision[]>("imports/commit", {
        id: validation.id,
        checksum: validation.checksum,
      });
      setNote(
        `Đã nhập ${result.length} bản nháp. Chưa có nội dung nào được xuất bản.`,
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="max-w-3xl space-y-4">
      <h2 className="text-xl font-bold">Nhập nội dung theo lô</h2>
      <p>
        Tệp UTF-8 JSON, định dạng hskbuddy.editorial.v1, tối đa 100 dòng và 1
        MiB. Đăng ký nguồn và đoạn âm thanh trước, rồi dùng mã đã lưu trong tệp.
        Mỗi lô chỉ tạo bản nháp.
      </p>
      <Field label="Chọn tệp JSON">
        <input
          disabled={busy}
          className={control}
          type="file"
          accept=".json,application/json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setValidation(undefined);
            setNote("");
            if (file.size > 1024 * 1024) {
              setValidation(undefined);
              setError("Tệp vượt quá 1 MiB.");
              return;
            }
            setBusy(true);
            try {
              change(
                new TextDecoder("utf-8", { fatal: true }).decode(
                  await file.arrayBuffer(),
                ),
              );
            } catch {
              setError(
                "Không thể đọc tệp UTF-8. Hãy kiểm tra bảng mã của tệp.",
              );
            } finally {
              setBusy(false);
            }
          }}
        />
      </Field>
      <Field label="Nội dung tệp">
        <textarea
          disabled={busy}
          rows={16}
          className={`${control} font-mono text-sm`}
          value={text}
          onChange={(e) => change(e.target.value)}
          spellCheck={false}
        />
      </Field>
      {error && (
        <p role="alert" className="text-seal">
          {error}
        </p>
      )}
      <button
        className={button}
        disabled={busy || !text.trim()}
        onClick={validate}
      >
        {busy ? "Đang xử lý…" : "Kiểm tra lô"}
      </button>
      {validation && (
        <section className="space-y-3 border-t border-line pt-4">
          <p role="status">
            {validation.count} dòng · {validation.errors.length} lỗi
          </p>
          {validation.errors.length > 0 ? (
            <ul className="text-seal">
              {validation.errors.map((e) => (
                <li key={`${e.row}-${e.code}`}>
                  Dòng {e.row} ({e.external_id}):{" "}
                  {e.code === "DUPLICATE_OR_MISSING_ID"
                    ? "Trùng hoặc thiếu mã"
                    : e.code === "ALREADY_IMPORTED"
                      ? "Mã này đã được nhập"
                      : "Nội dung hoặc tham chiếu chưa hợp lệ"}
                </li>
              ))}
            </ul>
          ) : (
            <>
              <p className="break-all text-sm text-ink-muted">
                Mã kiểm tra: {validation.checksum}
              </p>
              <button
                className={`${button} bg-ink text-paper`}
                disabled={busy}
                onClick={commit}
              >
                Nhập lô đã kiểm tra thành bản nháp
              </button>
            </>
          )}
        </section>
      )}
      {note && (
        <p role="status" className="text-jade">
          {note}
        </p>
      )}
    </section>
  );
}
