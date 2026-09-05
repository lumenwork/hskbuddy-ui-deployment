import type { ReactNode } from "react";
import { api, ApiError } from "../../lib/api";
export const control =
  "focus-paper mt-1 min-h-control w-full rounded-paper border border-ink-muted bg-paper-raised px-3 py-2 text-base";
export const button =
  "focus-paper min-h-control rounded-paper border border-ink px-4 py-2 font-semibold disabled:opacity-50";
export const states: Record<string, string> = {
  draft: "Bản nháp",
  submitted: "Chờ duyệt",
  reviewed: "Đã duyệt",
  published: "Đã xuất bản",
  retired: "Đã ngừng sử dụng",
};
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      {children}
    </label>
  );
}
export function errorText(e: unknown) {
  if (!(e instanceof ApiError))
    return "Không thể kết nối hoặc đọc dữ liệu. Vui lòng thử lại.";
  const text: Record<string, string> = {
    STAFF_FORBIDDEN:
      "Tài khoản chưa có quyền thực hiện thao tác này. Người soạn không thể tự duyệt bản của mình.",
    SESSION_EXPIRED: "Vui lòng đăng nhập để mở không gian giáo viên.",
    EDITORIAL_REVISION_CONFLICT:
      "Bản này đã thay đổi. Tải lại bản đã lưu trước khi tiếp tục.",
    EDITORIAL_INVALID_INPUT:
      "Thông tin hoặc tham chiếu chưa hợp lệ. Kiểm tra các trường, trang PDF và đoạn âm thanh.",
    PUBLICATION_REQUIREMENTS_MISSING:
      "Chưa đủ điều kiện: cần quyết định giáo trình, nguồn được phép sử dụng, duyệt ngôn ngữ/đáp án/quyền và âm thanh bắt buộc.",
    EDITORIAL_REFERENCE_CONFLICT:
      "Tham chiếu bị trùng hoặc đã thay đổi. Kiểm tra vị trí bài học, đường dẫn và mã nhập.",
    EDITORIAL_NOT_FOUND: "Không tìm thấy bản hoặc tệp này.",
  };
  return text[e.code] ?? "Thao tác chưa được lưu. Vui lòng thử lại.";
}
export const post = <T,>(path: string, body: unknown) =>
  api<T>(`/admin/${path}`, { method: "POST", body: JSON.stringify(body) });
