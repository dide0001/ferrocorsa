import { T } from "../theme";

const ICONS = {
  home: (
    <path d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h4v-5h2v5h4a1 1 0 0 0 1-1v-9" />
  ),
  workouts: (
    <path d="M6 7v10M4 9v6M20 7v10M22 9v6M8 12h8" />
  ),
  progress: (
    <path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6" />
  ),
  garage: (
    <path d="M4 17h16M5 17v-4l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13v4M7 17v2M17 17v2M7 12h10" />
  ),
  profile: (
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0" />
  ),
};

const TABS = [
  { id: "home", label: "Home" },
  { id: "workouts", label: "Workouts" },
  { id: "progress", label: "Progress" },
  { id: "garage", label: "Garage" },
  { id: "profile", label: "Profile" },
];

export const NAV_HEIGHT = 60;

export default function BottomNav({ active, onChange }) {
  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        margin: "0 auto",
        width: "100%",
        maxWidth: 480,
        height: NAV_HEIGHT,
        paddingBottom: "env(safe-area-inset-bottom)",
        background: T.surface,
        borderTop: `2px solid ${T.accent}`,
        boxShadow: "0 -3px 0 0 #000",
        display: "flex",
        zIndex: 30,
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        const color = isActive ? T.accent : T.textMuted;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-current={isActive ? "page" : undefined}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              color,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {ICONS[tab.id]}
            </svg>
            <span style={{ fontSize: 9.5, letterSpacing: "0.04em", textTransform: "uppercase" }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
