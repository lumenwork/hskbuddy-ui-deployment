import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../lib/api";
import type { LessonBlock } from "../../lib/api";
import type { Asset, Body, Clip, Revision } from "./contract.generated";
import { control, button, states, Field, errorText, post } from "./ui";
import { LexemeFields } from "./LexemeEditor";
import { newBlock, BlockFields, Preview } from "./LessonEditor";

type Catalog = {
  course_id: string;
  title: string;
  level: string;
  syllabus: string;
  unit_id: string;
  unit_title: string;
  approved: boolean;
};
function emptyBody(): Body {
  return {
    lexeme: null,
    title: "",
    unit_id: "",
    position: 1,
    slug: "",
    blocks: [],
    prompt: "",
    options: [
      { id: "a", text: "" },
      { id: "b", text: "" },
    ],
    answer: "a",
    explanation: "",
    topic: "",
    skill: "",
    sources: [],
    audio: [],
  };
}

export function Editor({
  canReview,
  onDirty,
}: {
  canReview: boolean;
  onDirty: (value: boolean) => void;
}) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [catalog, setCatalog] = useState<Catalog[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [selected, setSelected] = useState<Revision>();
  const [body, setBody] = useState<Body>(emptyBody);
  const [kind, setKind] = useState("question");
  const [course, setCourse] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [evidence, setEvidence] = useState("");
  const [checks, setChecks] = useState({
    language: false,
    key: false,
    rights: false,
  });
  const [history, setHistory] = useState<
    { actor_id: string; action: string; evidence: string; created_at: string }[]
  >([]);
  const editable = !selected || selected.state === "draft";
  useEffect(() => {
    function preventUnsavedNavigation(event: MouseEvent) {
      if (!dirty || !(event.target instanceof Element)) return;
      const link = event.target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      const destination = new URL(link.href, window.location.href);
      if (
        destination.origin === window.location.origin &&
        destination.pathname !== window.location.pathname
      ) {
        event.preventDefault();
        event.stopPropagation();
        setError("Hãy lưu hoặc bỏ thay đổi chưa lưu trước khi rời bản soạn.");
      }
    }
    document.addEventListener("click", preventUnsavedNavigation, true);
    return () =>
      document.removeEventListener("click", preventUnsavedNavigation, true);
  }, [dirty]);

  useEffect(() => {
    onDirty(dirty);
    return () => onDirty(false);
  }, [dirty, onDirty]);
  async function refresh() {
    const [r, c, a, cl] = await Promise.all([
      api<Revision[]>("/admin/revisions"),
      api<Catalog[]>("/admin/catalog"),
      api<Asset[]>("/admin/assets"),
      api<Clip[]>("/admin/clips"),
    ]);
    setRevisions(r);
    setCatalog(c);
    setAssets(a);
    setClips(cl);
  }
  useEffect(() => {
    refresh().catch((e) => setError(errorText(e)));
  }, []);
  useEffect(() => {
    let active = true;
    setHistory([]);
    if (selected)
      api<typeof history>(`/admin/history?id=${selected.id}`)
        .then((v) => {
          if (active) setHistory(v);
        })
        .catch((e) => {
          if (active) setError(errorText(e));
        });
    return () => {
      active = false;
    };
  }, [selected]);
  useEffect(() => {
    function leave(e: BeforeUnloadEvent) {
      if (dirty) e.preventDefault();
    }
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [dirty]);
  function update<K extends keyof Body>(key: K, value: Body[K]) {
    setBody((b) => ({ ...b, [key]: value }));
    setDirty(true);
    setNote("");
  }
  function load(r?: Revision) {
    setSelected(r);
    setBody(r ? structuredClone(r.body) : emptyBody());
    setKind(r?.kind ?? "question");
    setCourse(r?.course_id ?? "");
    setDirty(false);
    setEvidence("");
    setChecks({ language: false, key: false, rights: false });
    setNote("");
    setError("");
  }
  async function action(action: string) {
    setBusy(true);
    setError("");
    setNote("");
    try {
      const r = selected
        ? await post<Revision>(`revision?id=${selected.id}`, {
            version: selected.version,
            action,
            body: action === "save" ? body : null,
            evidence,
            ...checks,
          })
        : await post<Revision>("revisions", { kind, course_id: course, body });
      load(r);
      setNote("Đã lưu trên máy chủ.");
      await refresh();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  const blocks = (body.blocks ?? []) as LessonBlock[];
  function setBlocks(v: LessonBlock[]) {
    update("blocks", v);
  }
  function mapClip(index: number, id: string) {
    const audio = body.audio.filter((a) => a.block_index !== index);
    if (id) audio.push({ clip_id: id, block_index: index });
    const sources = [...body.sources];
    const clip = clips.find((c) => c.id === id);
    if (clip && !sources.some((s) => s.asset_id === clip.asset_id))
      sources.push({ asset_id: clip.asset_id, page: 0 });
    setBody((b) => ({ ...b, audio, sources }));
    setDirty(true);
  }
  function clipSelect(index: number) {
    return (
      <Field label="Đoạn âm thanh">
        <select
          className={control}
          value={body.audio.find((a) => a.block_index === index)?.clip_id ?? ""}
          onChange={(e) => mapClip(index, e.target.value)}
        >
          <option value="">Chưa gắn âm thanh</option>
          {clips.map((c) => (
            <option value={c.id} key={c.id}>
              {c.label} ({c.start_ms}–{c.end_ms} ms)
            </option>
          ))}
        </select>
      </Field>
    );
  }
  const previous =
    selected &&
    revisions.find(
      (r) =>
        r.document_id === selected.document_id &&
        r.revision_number === selected.revision_number - 1,
    );
  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="space-y-3 border-b border-line pb-4 lg:border-b-0 lg:border-r lg:pr-4">
        <button
          className={button}
          disabled={dirty || busy}
          onClick={() => load()}
        >
          Soạn nội dung mới
        </button>
        {dirty && (
          <p className="text-sm text-ink-muted">
            Lưu hoặc bỏ thay đổi trước khi mở bản khác.
          </p>
        )}
        <ul className="space-y-2">
          {revisions.map((r) => (
            <li key={r.id}>
              <button
                disabled={dirty || busy}
                className={`${button} w-full break-words text-left ${selected?.id === r.id ? "bg-ink text-paper" : ""}`}
                onClick={() => load(r)}
              >
                {r.body.title}
                <span className="block text-sm font-normal">
                  Bản {r.revision_number} · {states[r.state]}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {revisions.length === 0 && <p>Chưa có bản soạn.</p>}
      </aside>
      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">
            {selected
              ? `${states[selected.state]} · Phiên bản ${selected.revision_number}`
              : "Bản soạn mới"}
          </h2>
          <span role="status">{dirty ? "Có thay đổi chưa lưu" : note}</span>
        </div>
        {error && (
          <p role="alert" className="text-seal">
            {error}
          </p>
        )}
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (editable) void action("save");
          }}
          className="space-y-4"
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing && e.key === "Enter")
              e.preventDefault();
          }}
        >
          <fieldset disabled={busy || !editable} className="space-y-4">
            <Field label="Loại nội dung">
              <select
                className={control}
                disabled={!!selected}
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value);
                  setBody(emptyBody());
                  setDirty(true);
                }}
              >
                <option value="question">Câu hỏi lựa chọn</option>
                <option value="lesson">Bài học</option>
                <option value="lexeme">Từ vựng / nghĩa từ</option>
              </select>
            </Field>
            <Field label="Khóa học và giáo trình">
              <select
                required
                className={control}
                disabled={!!selected}
                value={course}
                onChange={(e) => {
                  setCourse(e.target.value);
                  update("unit_id", "");
                }}
              >
                <option value="">Chọn khóa học</option>
                {catalog
                  .filter(
                    (v, i, a) =>
                      a.findIndex((x) => x.course_id === v.course_id) === i,
                  )
                  .map((c) => (
                    <option key={c.course_id} value={c.course_id}>
                      {c.title} · {c.syllabus} · {c.level}
                    </option>
                  ))}
              </select>
            </Field>
            {catalog.length === 0 && (
              <p>
                Chưa có khóa học/đơn vị trong cơ sở dữ liệu. Cần chuẩn bị cấu
                trúc giáo trình trước khi soạn.
              </p>
            )}
            <Field label="Tên nội dung">
              <input
                required
                className={control}
                value={body.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </Field>
            {kind === "lexeme" ? (
              <>
                <LexemeFields
                  value={body.lexeme}
                  onChange={(l) => update("lexeme", l)}
                />
                {clipSelect(0)}
              </>
            ) : kind === "question" ? (
              <>
                <Field label="Câu hỏi">
                  <textarea
                    required
                    className={control}
                    value={body.prompt}
                    onChange={(e) => update("prompt", e.target.value)}
                  />
                </Field>
                <fieldset className="space-y-2">
                  <legend className="font-semibold">
                    Lựa chọn và đáp án (chỉ giáo viên)
                  </legend>
                  {body.options.map((o, i) => (
                    <div key={o.id} className="flex items-center gap-3">
                      <input
                        aria-label={`Đáp án ${o.id}`}
                        type="radio"
                        checked={body.answer === o.id}
                        onChange={() => update("answer", o.id)}
                      />
                      <Field label={`Lựa chọn ${o.id}`}>
                        <input
                          required
                          lang="zh-Hans"
                          className={control}
                          value={o.text}
                          onChange={(e) =>
                            update(
                              "options",
                              body.options.map((x, j) =>
                                j === i ? { ...x, text: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </Field>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={button}
                    disabled={body.options.length >= 8}
                    onClick={() =>
                      update("options", [
                        ...body.options,
                        {
                          id: String.fromCharCode(97 + body.options.length),
                          text: "",
                        },
                      ])
                    }
                  >
                    Thêm lựa chọn
                  </button>
                </fieldset>
                <Field label="Giải thích đáp án bằng tiếng Việt">
                  <textarea
                    required
                    className={control}
                    value={body.explanation}
                    onChange={(e) => update("explanation", e.target.value)}
                  />
                </Field>
                <Field label="Chủ đề">
                  <input
                    className={control}
                    value={body.topic}
                    onChange={(e) => update("topic", e.target.value)}
                  />
                </Field>
                <Field label="Kỹ năng">
                  <input
                    className={control}
                    value={body.skill}
                    onChange={(e) => update("skill", e.target.value)}
                  />
                </Field>
                {clipSelect(0)}
              </>
            ) : (
              <>
                <Field label="Đơn vị bài học">
                  <select
                    required
                    className={control}
                    value={body.unit_id}
                    onChange={(e) => update("unit_id", e.target.value)}
                  >
                    <option value="">Chọn đơn vị</option>
                    {catalog
                      .filter((c) => c.course_id === course)
                      .map((c) => (
                        <option value={c.unit_id} key={c.unit_id}>
                          {c.unit_title}
                        </option>
                      ))}
                  </select>
                </Field>
                <Field label="Vị trí trong đơn vị">
                  <input
                    type="number"
                    min={1}
                    required
                    className={control}
                    value={body.position}
                    onChange={(e) => update("position", Number(e.target.value))}
                  />
                </Field>
                <Field label="Tên đường dẫn (chữ thường, số và dấu gạch ngang)">
                  <input
                    required
                    pattern="[a-z0-9][a-z0-9-]{0,99}"
                    className={control}
                    value={body.slug}
                    onChange={(e) => update("slug", e.target.value)}
                  />
                </Field>
                {blocks.map((block, index) => (
                  <fieldset
                    key={index}
                    className="space-y-3 border-t border-line pt-4"
                  >
                    <legend className="font-semibold">Phần {index + 1}</legend>
                    <BlockFields
                      block={block}
                      onChange={(b) =>
                        setBlocks(blocks.map((x, i) => (i === index ? b : x)))
                      }
                      questions={revisions.filter(
                        (r) =>
                          r.kind === "question" &&
                          r.course_id === course &&
                          r.state === "published",
                      )}
                    />
                    {["vocabulary", "example", "audio"].includes(block.type) &&
                      clipSelect(index)}
                    <button
                      type="button"
                      className={button}
                      onClick={() => {
                        setBody((b) => ({
                          ...b,
                          blocks: blocks.filter((_, i) => i !== index),
                          audio: b.audio
                            .filter((a) => a.block_index !== index)
                            .map((a) => ({
                              ...a,
                              block_index:
                                a.block_index > index
                                  ? a.block_index - 1
                                  : a.block_index,
                            })),
                        }));
                        setDirty(true);
                      }}
                    >
                      Xóa phần này
                    </button>
                  </fieldset>
                ))}
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["vocabulary", "Từ vựng"],
                      ["grammar", "Ngữ pháp"],
                      ["example", "Ví dụ"],
                      ["audio", "Nghe"],
                      ["retrieval", "Tự kiểm tra"],
                    ] as const
                  ).map(([type, label]) => (
                    <button
                      className={button}
                      key={type}
                      type="button"
                      onClick={() => setBlocks([...blocks, newBlock(type)])}
                    >
                      Thêm {label.toLowerCase()}
                    </button>
                  ))}
                </div>
              </>
            )}
            <fieldset className="space-y-3 border-t border-line pt-4">
              <legend className="font-semibold">Nguồn và quyền sử dụng</legend>
              {body.sources.map((ref, i) => (
                <div
                  key={i}
                  className="grid items-end gap-2 sm:grid-cols-[1fr_6rem_auto]"
                >
                  <Field label="Tệp nguồn">
                    <select
                      required
                      className={control}
                      value={ref.asset_id}
                      onChange={(e) =>
                        update(
                          "sources",
                          body.sources.map((x, j) =>
                            j === i
                              ? {
                                  asset_id: e.target.value,
                                  page:
                                    assets.find((a) => a.id === e.target.value)
                                      ?.media_type === "application/pdf"
                                      ? 1
                                      : 0,
                                }
                              : x,
                          ),
                        )
                      }
                    >
                      <option value="">Chọn nguồn</option>
                      {assets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title} ·{" "}
                          {a.rights_status === "permitted"
                            ? "Có bằng chứng quyền"
                            : "Chưa rõ quyền"}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Trang PDF">
                    <input
                      className={control}
                      type="number"
                      min={0}
                      value={ref.page}
                      onChange={(e) =>
                        update(
                          "sources",
                          body.sources.map((x, j) =>
                            j === i
                              ? { ...x, page: Number(e.target.value) }
                              : x,
                          ),
                        )
                      }
                    />
                  </Field>
                  <button
                    type="button"
                    className={button}
                    onClick={() =>
                      update(
                        "sources",
                        body.sources.filter((_, j) => i !== j),
                      )
                    }
                  >
                    Bỏ nguồn
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={button}
                onClick={() =>
                  update("sources", [
                    ...body.sources,
                    { asset_id: "", page: 0 },
                  ])
                }
              >
                Thêm nguồn
              </button>
              <p className="text-sm text-ink-muted">
                Trang đánh số từ 1 cho PDF, 0 cho âm thanh. Nguồn của đoạn âm
                thanh được thêm tự động.
              </p>
            </fieldset>
          </fieldset>
          <div className="flex flex-wrap gap-2">
            {editable && (
              <button
                disabled={busy}
                className={`${button} bg-ink text-paper`}
                type="submit"
              >
                {busy ? "Đang lưu…" : "Lưu bản nháp"}
              </button>
            )}
            {dirty && (
              <button
                type="button"
                className={button}
                disabled={busy}
                onClick={() => load(selected)}
              >
                Bỏ thay đổi chưa lưu
              </button>
            )}
          </div>
        </form>
        {selected && (
          <section className="space-y-3 border-t border-line pt-4">
            <h3 className="font-bold">Duyệt và xuất bản</h3>
            <p className="break-all text-sm text-ink-muted">
              Mã nội dung: {selected.document_id}
            </p>
            <Field label="Ghi chú / bằng chứng kiểm tra">
              <textarea
                className={control}
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
              />
            </Field>
            {canReview && selected.state === "submitted" && (
              <fieldset className="space-y-2">
                <legend className="font-semibold">
                  Xác nhận kiểm tra thực tế
                </legend>
                {(
                  [
                    ["language", "Đã kiểm tra ngôn ngữ"],
                    ["key", "Đã kiểm tra đáp án / bài tập"],
                    ["rights", "Đã kiểm tra quyền và âm thanh"],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    className="flex min-h-control items-center gap-2"
                    key={key}
                  >
                    <input
                      type="checkbox"
                      checked={checks[key]}
                      onChange={(e) =>
                        setChecks((c) => ({ ...c, [key]: e.target.checked }))
                      }
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
            )}
            <div className="flex flex-wrap gap-2">
              {selected.state === "draft" && (
                <button
                  className={button}
                  disabled={busy || dirty}
                  onClick={() => action("submit")}
                >
                  Gửi duyệt
                </button>
              )}
              {["submitted", "reviewed"].includes(selected.state) && (
                <button
                  className={button}
                  disabled={busy || dirty}
                  onClick={() => action("return")}
                >
                  Trả về bản nháp
                </button>
              )}
              {canReview && selected.state === "submitted" && (
                <button
                  className={button}
                  disabled={
                    busy ||
                    dirty ||
                    !Object.values(checks).every(Boolean) ||
                    !evidence.trim()
                  }
                  onClick={() => action("review")}
                >
                  Ghi nhận duyệt
                </button>
              )}
              {canReview && selected.state === "reviewed" && (
                <button
                  className={`${button} bg-ink text-paper`}
                  disabled={busy || dirty}
                  onClick={() => action("publish")}
                >
                  Xuất bản
                </button>
              )}
              {["published", "retired"].includes(selected.state) && (
                <button
                  className={button}
                  disabled={busy || dirty}
                  onClick={() => action("revise")}
                >
                  Tạo phiên bản mới
                </button>
              )}
              {canReview && selected.state === "published" && (
                <button
                  className={button}
                  disabled={busy || dirty || !evidence.trim()}
                  onClick={() => action("retire")}
                >
                  Ngừng sử dụng
                </button>
              )}
              <button
                className={button}
                disabled={dirty || busy}
                onClick={async () => {
                  try {
                    load(
                      await api<Revision>(`/admin/revision?id=${selected.id}`),
                    );
                    await refresh();
                  } catch (e) {
                    setError(errorText(e));
                  }
                }}
              >
                Tải lại bản đã lưu
              </button>
            </div>
          </section>
        )}
        <details className="border-t border-line pt-4">
          <summary className="focus-paper cursor-pointer font-bold">
            Xem trước nội dung {dirty ? "chưa lưu" : "đã lưu"}
          </summary>
          <Preview body={body} kind={kind} />
          {body.audio.map((a) => (
            <audio
              className="mt-3 w-full"
              key={a.block_index}
              aria-label={`Nghe phần ${a.block_index + 1}`}
              controls
              preload="none"
              src={`/api/v1/media/clips/${a.clip_id}`}
            />
          ))}
        </details>
        {previous && (
          <details>
            <summary className="focus-paper cursor-pointer font-bold">
              Đối chiếu phiên bản {previous.revision_number}
            </summary>
            <Preview body={previous.body} kind={previous.kind} />
          </details>
        )}
        {history.length > 0 && (
          <details>
            <summary className="focus-paper cursor-pointer font-bold">
              Lịch sử thao tác và bằng chứng
            </summary>
            <ul>
              {history.map((h, i) => (
                <li
                  className="break-words border-b border-line py-3 text-sm"
                  key={i}
                >
                  {h.action} · {h.created_at}
                  <p>{h.evidence || "Không có ghi chú"}</p>
                  <p className="break-all text-ink-muted">
                    Tài khoản: {h.actor_id}
                  </p>
                </li>
              ))}
            </ul>
          </details>
        )}
        {canReview &&
          course &&
          !catalog.find((c) => c.course_id === course)?.approved && (
            <details>
              <summary className="focus-paper cursor-pointer font-bold">
                Ghi nhận quyết định giáo trình B04
              </summary>
              <p className="my-3 text-sm">
                Chỉ ghi nhận sau khi chủ sản phẩm và giáo viên đã chọn giáo
                trình và kiểm tra bản đồ phạm vi. Điền đường dẫn bằng chứng và
                người duyệt vào ghi chú ở trên.
              </p>
              <button
                className={button}
                disabled={busy || !evidence.trim()}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await post("course-approval", {
                      course_id: course,
                      evidence,
                    });
                    await refresh();
                    setNote("Đã ghi nhận quyết định giáo trình.");
                  } catch (e) {
                    setError(errorText(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Ghi nhận quyết định
              </button>
            </details>
          )}
      </div>
    </div>
  );
}
