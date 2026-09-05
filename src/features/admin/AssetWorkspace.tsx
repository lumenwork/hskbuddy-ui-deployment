import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../lib/api";
import type { Asset, Clip } from "./contract.generated";
import { control, button, Field, errorText, post } from "./ui";

export function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File>();
  const [meta, setMeta] = useState({
    title: "",
    creator: "",
    provenance: "",
    rights_status: "unknown",
    permission_evidence: "",
    attribution: "",
    usage_scope: "",
    page_count: 1,
  });
  const [clip, setClip] = useState({
    asset_id: "",
    label: "",
    start_ms: 0,
    end_ms: 1000,
  });
  async function refresh() {
    const [a, c] = await Promise.all([
      api<Asset[]>("/admin/assets"),
      api<Clip[]>("/admin/clips"),
    ]);
    setAssets(a);
    setClips(c);
  }
  useEffect(() => {
    refresh().catch((e) => setError(errorText(e)));
  }, []);
  async function upload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    setNote("");
    try {
      if (file.size > 20 * 1024 * 1024) {
        setError("Tệp vượt quá 20 MiB.");
        return;
      }
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await post("assets", { ...meta, data });
      await refresh();
      setNote(
        "Đã lưu tệp và bằng chứng nguồn. Tệp vẫn chỉ dành cho giáo viên.",
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function addClip(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await post("clips", clip);
      await refresh();
      setNote("Đã lưu đoạn âm thanh.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Đăng ký tệp nguồn</h2>
        <p className="text-ink-muted">
          PDF, WAV PCM và WMA/ASF gốc (tối đa 20 MiB). Máy chủ xác định thời
          lượng WAV; WMA chỉ được lưu làm bản gốc để truy xuất nguồn. Số trang
          PDF do người nhập khai báo và cần kiểm tra khi duyệt. Muốn cắt WMA,
          hãy đăng ký thêm một bản WAV PCM dẫn xuất có quyền sử dụng rõ ràng.
        </p>
        {error && (
          <p role="alert" className="text-seal">
            {error}
          </p>
        )}
        {note && (
          <p role="status" className="text-jade">
            {note}
          </p>
        )}
        <form onSubmit={upload} className="space-y-3">
          <fieldset disabled={busy} className="space-y-3">
            <Field label="Tệp PDF, WAV PCM hoặc WMA/ASF">
              <input
                required
                type="file"
                accept=".pdf,.wav,.wma,audio/x-ms-wma"
                className={control}
                onChange={(e) => setFile(e.target.files?.[0])}
              />
            </Field>
            {(
              [
                ["title", "Tên nguồn"],
                ["creator", "Tác giả / người thu âm"],
                ["provenance", "Nguồn gốc / đường dẫn gốc"],
                ["permission_evidence", "Bằng chứng cho phép sử dụng"],
                ["attribution", "Ghi công"],
                ["usage_scope", "Phạm vi sử dụng được cho phép"],
              ] as const
            ).map(([key, label]) => (
              <Field label={label} key={key}>
                <textarea
                  required={
                    ["title", "creator", "provenance"].includes(key) ||
                    (meta.rights_status === "permitted" &&
                      ["permission_evidence", "usage_scope"].includes(key))
                  }
                  className={control}
                  value={meta[key]}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, [key]: e.target.value }))
                  }
                />
              </Field>
            ))}
            <Field label="Trạng thái quyền">
              <select
                className={control}
                value={meta.rights_status}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, rights_status: e.target.value }))
                }
              >
                <option value="unknown">
                  Chưa rõ quyền — chỉ lưu bản nháp
                </option>
                <option value="permitted">Có bằng chứng cho phép</option>
              </select>
            </Field>
            <Field label="Số trang PDF (bỏ qua với tệp âm thanh)">
              <input
                required
                type="number"
                min={1}
                className={control}
                value={meta.page_count}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, page_count: Number(e.target.value) }))
                }
              />
            </Field>
            <button className={`${button} bg-ink text-paper`} type="submit">
              {busy ? "Đang lưu…" : "Lưu nguồn"}
            </button>
          </fieldset>
        </form>
        <h2 className="pt-4 text-xl font-bold">Tạo đoạn âm thanh</h2>
        <form onSubmit={addClip} className="space-y-3">
          <fieldset disabled={busy} className="space-y-3">
            <Field label="Bản thu gốc">
              <select
                required
                className={control}
                value={clip.asset_id}
                onChange={(e) =>
                  setClip((c) => ({ ...c, asset_id: e.target.value }))
                }
              >
                <option value="">Chọn WAV</option>
                {assets
                  .filter((a) => a.media_type === "audio/wav")
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} · {a.duration_ms} ms
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Tên đoạn">
              <input
                required
                className={control}
                value={clip.label}
                onChange={(e) =>
                  setClip((c) => ({ ...c, label: e.target.value }))
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["start_ms", "Bắt đầu (ms)"],
                  ["end_ms", "Kết thúc (ms)"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    required
                    type="number"
                    min={0}
                    className={control}
                    value={clip[key]}
                    onChange={(e) =>
                      setClip((c) => ({ ...c, [key]: Number(e.target.value) }))
                    }
                  />
                </Field>
              ))}
            </div>
            <button className={button} type="submit">
              Lưu đoạn âm thanh
            </button>
          </fieldset>
        </form>
      </div>
      <div className="min-w-0 space-y-5">
        <h2 className="text-xl font-bold">Nguồn đã đăng ký</h2>
        {assets.length === 0 && <p>Chưa có nguồn.</p>}
        <ul>
          {assets.map((a) => (
            <li
              key={a.id}
              className="space-y-2 break-words border-b border-line py-4"
            >
              <h3 className="font-bold">{a.title}</h3>
              <p>
                {a.creator} ·{" "}
                {a.rights_status === "permitted"
                  ? "Có bằng chứng quyền"
                  : "Chưa rõ quyền"}
              </p>
              <p className="text-sm">{a.provenance}</p>
              <details>
                <summary className="focus-paper cursor-pointer">
                  Bằng chứng và thông tin tệp
                </summary>
                <p>{a.permission_evidence || "Chưa có bằng chứng"}</p>
                <p>{a.attribution}</p>
                <p>{a.usage_scope}</p>
                <p>
                  {a.media_type} · {a.size_bytes} byte ·{" "}
                  {a.media_type === "audio/wav"
                    ? `${a.duration_ms} ms`
                    : a.media_type === "application/pdf"
                      ? `${a.page_count} trang khai báo`
                      : "bản gốc; cần WAV PCM để tạo đoạn"}
                </p>
                <p className="break-all text-sm">SHA-256: {a.checksum}</p>
                <p className="break-all text-sm">Mã nguồn: {a.id}</p>
              </details>
              <a
                className="focus-paper inline-block min-h-control underline"
                href={`/api/v1/admin/asset-file?id=${a.id}`}
              >
                Tải bản gốc
              </a>
            </li>
          ))}
        </ul>
        <h2 className="text-xl font-bold">Đoạn âm thanh</h2>
        {clips.map((c) => (
          <div className="space-y-2 border-b border-line py-3" key={c.id}>
            <h3 className="font-semibold">{c.label}</h3>
            <p>
              {c.start_ms}–{c.end_ms} ms
            </p>
            <p className="break-all text-sm text-ink-muted">Mã đoạn: {c.id}</p>
            <audio
              className="w-full"
              controls
              preload="none"
              aria-label={c.label}
              src={`/api/v1/media/clips/${c.id}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
