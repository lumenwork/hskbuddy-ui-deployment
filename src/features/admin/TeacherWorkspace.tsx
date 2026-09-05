import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { button, errorText } from "./ui";
import { Editor } from "./ContentEditor";
import { Assets } from "./AssetWorkspace";
import { Import } from "./BatchImport";

export default function TeacherWorkspace() {
  const [access, setAccess] = useState<{ edit: boolean; review: boolean }>();
  const [tab, setTab] = useState("content");
  const [unsaved, setUnsaved] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api<{ edit: boolean; review: boolean }>("/admin/access")
      .then((v) => {
        if (active) setAccess(v);
      })
      .catch((e) => {
        if (active) setError(errorText(e));
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Không gian giáo viên</h1>
        <p className="mt-2 text-ink-muted">
          Soạn bài, kiểm tra nguồn và xuất bản từng phiên bản đã duyệt.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-seal">
          {error}{" "}
          <Link className="underline" to="/dang-nhap">
            Đăng nhập
          </Link>
        </p>
      )}
      {!access && !error && <p role="status">Đang kiểm tra quyền truy cập…</p>}
      {access && (
        <>
          <nav aria-label="Công cụ giáo viên" className="flex flex-wrap gap-2">
            {[
              ["content", "Bài học và câu hỏi"],
              ["assets", "Nguồn và âm thanh"],
              ["import", "Nhập theo lô"],
            ].map(([id, label]) => (
              <button
                key={id}
                disabled={unsaved && tab !== id}
                aria-pressed={tab === id}
                className={`${button} ${tab === id ? "bg-ink text-paper" : ""}`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          {tab === "content" ? (
            <Editor canReview={access.review} onDirty={setUnsaved} />
          ) : tab === "assets" ? (
            <Assets />
          ) : (
            <Import />
          )}
        </>
      )}
    </section>
  );
}
