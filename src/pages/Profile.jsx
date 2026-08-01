import { T } from "../theme";
import ComingSoon from "../components/ComingSoon";

export default function Profile({ notifPermission, pushSubscription }) {
  return (
    <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 32px" }}>
      <h1 className="disp" style={{ fontSize: 22, margin: 0 }}>Profile</h1>
      <ComingSoon icon="👤" text="Kontoindstillinger og mål (fx ugentligt træningsmål) kommer i en senere omgang." />

      <div style={{ marginTop: 16, background: T.surface, border: `1px solid ${T.line}`, padding: 14 }}>
        <Row label="Push-notifikationer" value={pushSubscription ? "Aktiveret" : "Ikke aktiveret"} />
        <Row label="Notifikations-tilladelse" value={notifPermission} />
        <Row label="App" value="Ferro Corsa" />
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13, borderBottom: `1px solid ${T.line}` }}>
      <span style={{ color: T.textMuted }}>{label}</span>
      <span className="mono">{value}</span>
    </div>
  );
}
