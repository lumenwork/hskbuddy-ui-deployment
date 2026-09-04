import { Link, Route, Routes } from "react-router-dom";

import { MainNavigation } from "../components/MainNavigation";
import { ui } from "../locales/vi/ui";

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper font-sans text-ink">
      <a className="skip-link focus-inverse" href="#main-content">
        {ui.skipToContent}
      </a>
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-page">
          <Link aria-label={ui.brand} className="focus-paper text-lg font-bold tracking-tight text-ink" to="/">
            {ui.brand}
          </Link>
          <MainNavigation placement="desktop" />
        </div>
      </header>
      <main id="main-content" className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-page py-section pb-24 md:py-12 md:pb-12">
        {children}
      </main>
      <footer className="fixed inset-x-0 bottom-0 border-t border-line bg-paper-raised/95 backdrop-blur md:hidden">
        <MainNavigation placement="mobile" />
      </footer>
    </div>
  );
}

function TodayPage() {
  return (
    <section aria-labelledby="welcome-title" className="mx-auto max-w-study space-y-6">
      <div className="space-y-3">
        <p className="text-meta font-medium text-ink-muted">{ui.today}</p>
        <h1 id="welcome-title" className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {ui.welcomeTitle}
        </h1>
        <p className="text-base leading-relaxed text-ink-muted">{ui.welcomeBody}</p>
      </div>
      <aside aria-label={ui.languageExampleLabel} className="rounded-paper border border-card-border bg-paper-raised p-4">
        <p className="text-meta font-medium text-ink-muted">{ui.languageExampleLabel}</p>
        <p className="mt-3 font-hanzi text-hanzi-inline font-medium text-ink" lang="zh-Hans">
          {ui.languageExampleHanzi}
        </p>
        <p className="mt-1 font-pinyin text-sm leading-relaxed text-ink" lang="zh-Latn-pinyin">
          {ui.languageExamplePinyin}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">{ui.languageExampleMeaning}</p>
      </aside>
    </section>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section aria-labelledby="placeholder-title" className="mx-auto max-w-study space-y-3">
      <p className="text-meta font-medium text-ink-muted">{title}</p>
      <h1 id="placeholder-title" className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {ui.unavailableTitle}
      </h1>
      <p className="text-base leading-relaxed text-ink-muted">{ui.unavailableBody}</p>
    </section>
  );
}

function NotFound() {
  return (
    <section aria-labelledby="not-found-title" className="mx-auto max-w-study space-y-3">
      <h1 id="not-found-title" className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {ui.notFoundTitle}
      </h1>
      <Link className="focus-paper font-semibold text-ink underline underline-offset-4" to="/">
        {ui.backToToday}
      </Link>
    </section>
  );
}

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/learn" element={<PlaceholderPage title={ui.learn} />} />
        <Route path="/review" element={<PlaceholderPage title={ui.review} />} />
        <Route path="/mock-exams" element={<PlaceholderPage title={ui.mockExam} />} />
        <Route path="/profile" element={<PlaceholderPage title={ui.profile} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}
