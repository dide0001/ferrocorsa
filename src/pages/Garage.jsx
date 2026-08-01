import { T } from "../theme";
import ComingSoon from "../components/ComingSoon";

const PLANNED_ACHIEVEMENTS = [
  { name: "Scuderia Starter", hint: "Gennemfør din første workout" },
  { name: "Pit Stop", hint: "Gennemfør 5 workouts" },
  { name: "Podium Finisher", hint: "Gennemfør 20 workouts" },
  { name: "Ferrari Champion", hint: "Gennemfør 50 workouts" },
];

export default function Garage() {
  return (
    <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 32px" }}>
      <h1 className="disp" style={{ fontSize: 22, margin: 0 }}>Garage</h1>
      <ComingSoon icon="🏆" text="Achievements bliver rigtige (og aflåste/oplåste) i en senere omgang. Her er hvad der er planlagt:" />

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {PLANNED_ACHIEVEMENTS.map((a) => (
          <div
            key={a.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: T.surface,
              border: `1px solid ${T.line}`,
              padding: "12px 14px",
              opacity: 0.7,
            }}
          >
            <span style={{ fontSize: 16 }}>🔒</span>
            <div>
              <div className="disp" style={{ fontSize: 13 }}>{a.name}</div>
              <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 2 }}>{a.hint}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
