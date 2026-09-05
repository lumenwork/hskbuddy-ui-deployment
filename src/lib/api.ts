export type User = {
  id: string;
  email: string;
  email_verified_at: string | null;
  timezone: string;
  daily_goal_minutes: number;
};

export type LessonBlock =
  | { type: "vocabulary"; hanzi: string; pinyin: string; meaning: string; audio_url?: string }
  | { type: "grammar"; title: string; explanation: string }
  | { type: "example"; hanzi: string; pinyin: string; translation: string; audio_url?: string }
  | { type: "audio"; label: string; audio_url?: string }
  | { type: "retrieval"; prompt: string; item_id?: string };

export type Lesson = { id: string; title: string; course_id: string; revision_id: string; blocks: LessonBlock[]; is_sample: boolean };
export type LessonSummary = { id: string; title: string; slug: string; is_sample: boolean };
export type Course = { id: string; title: string; description: string; level_code: string; units: { id: string; title: string; position: number; lessons: LessonSummary[] }[] };
export type CourseSummary = { id: string; title: string; description: string; syllabus_id: string; level_id: string; level_code: string; level_title: string };
export type Syllabus = { id: string; title: string; levels: { id: string; code: string; title: string }[] };
export type LexemeSummary = { id: string; revision_id: string; hanzi: string; pinyin: string; vietnamese_gloss: string };
export type Lexeme = LexemeSummary & { sense_key: string; example_hanzi: string; example_pinyin: string; example_translation: string; audio_url: string | null };
export type ReviewCard = { id: string; lexeme_id: string; hanzi: string; pinyin: string; meaning: string; direction: "recognition" | "recall"; due_at: string; stage: number; revision: number };
export type PracticeItem = { revision_id: string; item_id: string; type: "choice"; prompt: { text?: string; audio_url?: string }; options: { id: string; text: string }[]; topic: string; skill: string };
export type PracticeSession = { id: string; course_id: string | null; items: PracticeItem[]; created_at: string };
export type PracticeResponse = { id: string; item_revision_id: string; attempt_number: number; correct: boolean; explanation: string; answer: { selected_option_id?: string }; created_at: string };
export type Mistake = { id: string; item_revision_id: string; state: "open" | "resolved"; prompt: { text?: string }; explanation: string; created_at: string; resolved_at: string | null };

export class ApiError extends Error {
  constructor(public code: string, public status: number) { super(code); }
}

function csrfToken() {
  return document.cookie.split("; ").find((part) => part.startsWith("hsk_csrf="))?.slice("hsk_csrf=".length);
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (init.method && init.method !== "GET") {
    const token = csrfToken();
    if (token) headers.set("X-CSRF-Token", token);
  }
  const response = await fetch(`/api/v1${path}`, { ...init, headers, credentials: "include" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ code: "NETWORK_ERROR" }));
    throw new ApiError(body.code ?? "NETWORK_ERROR", response.status);
  }
  if (response.status === 204 || response.status === 202) return undefined as T;
  return response.json() as Promise<T>;
}
