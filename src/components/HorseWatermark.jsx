import { T } from "../theme";

// Original angular horse silhouette — same rearing-horse spirit as classic
// motorsport crests, drawn with straight faceted segments (not a traced
// copy of any brand's artwork) to match this app's industrial style.
// Rendered as a low-opacity watermark with a diagonal light-streak behind
// it, fixed in place so it shows through consistently across every page.
export default function HorseWatermark() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 260,
        height: 340,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -60,
          width: 360,
          height: 90,
          background: `linear-gradient(100deg, transparent, ${T.accent}55, transparent)`,
          transform: "rotate(35deg)",
        }}
      />
      <svg
        width="260"
        height="340"
        viewBox="0 0 200 200"
        style={{ position: "absolute", top: -10, right: -40, opacity: 0.16 }}
      >
        <g fill="none" stroke={T.accent} strokeWidth="9" strokeLinejoin="miter" strokeLinecap="square">
          <polyline points="145,175 135,145 122,110 95,85 85,45 70,38" />
          <polyline points="85,90 60,80 40,68 25,55" />
          <polyline points="90,95 68,90 50,80 35,70" />
          <polyline points="122,110 105,140 100,162 96,175" />
          <polyline points="122,110 145,105 158,120 152,135" />
        </g>
        <g fill={T.accent}>
          <polygon points="78,40 86,32 85,48" />
          <polygon points="93,80 104,76 95,88" />
          <polygon points="89,68 100,64 91,76" />
          <polygon points="86,56 97,52 88,64" />
          <polygon points="152,135 168,132 154,148" />
        </g>
      </svg>
    </div>
  );
}
