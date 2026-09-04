import { NavLink } from "react-router-dom";

import { ui } from "../locales/vi/ui";

const destinations = [
  { to: "/", label: ui.today },
  { to: "/learn", label: ui.learn },
  { to: "/review", label: ui.review },
  { to: "/mock-exams", label: ui.mockExam },
  { to: "/profile", label: ui.profile },
] as const;

export function MainNavigation({ placement }: { placement: "desktop" | "mobile" }) {
  return (
    <nav aria-label={ui.navigationLabel} className={placement === "desktop" ? "hidden md:block" : "md:hidden"}>
      <ul className={placement === "desktop" ? "flex items-center gap-1" : "grid grid-cols-5"}>
        {destinations.map(({ to, label }) => (
          <li key={to} className="min-w-0">
            <NavLink
              className={({ isActive }) =>
                placement === "desktop"
                  ? `focus-paper inline-flex min-h-control items-center border-b-2 px-3 text-sm font-semibold no-underline transition-colors hover:text-ink ${
                      isActive ? "border-ink text-ink" : "border-transparent text-ink-muted"
                    }`
                  : `focus-paper flex min-h-[4.25rem] items-center justify-center border-t-2 px-1 text-center text-[0.75rem] leading-4 font-semibold no-underline transition-colors ${
                      isActive ? "border-ink bg-paper text-ink" : "border-transparent text-ink-muted"
                    }`
              }
              end={to === "/"}
              to={to}
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
