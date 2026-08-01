import { T } from "../theme";

export default function ComingSoon({ icon, text }) {
  return (
    <div
      style={{
        marginTop: 18,
        padding: "16px 14px",
        background: T.surface,
        border: `1px dashed ${T.lineBright}`,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <p style={{ margin: 0, fontSize: 13, color: T.textMuted, lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}
