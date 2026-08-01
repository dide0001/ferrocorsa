import { T } from "../theme";

// Original shield mark — same visual language as the PWA icon and the
// HorseWatermark (dark ground, red accent, angled notch, faceted horse).
// Used in place of a car-brand logo.
export default function Badge({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path
        d="M20 2 L36 8 V20 C36 30 29 36 20 38 C11 36 4 30 4 20 V8 Z"
        fill={T.bg}
        stroke={T.accent}
        strokeWidth="2"
      />
      <path d="M20 2 L36 8 V16 L20 20 Z" fill={T.accent} />
      <g fill="none" stroke={T.accent} strokeWidth="1.7" strokeLinejoin="miter" strokeLinecap="square">
        <polyline points="33,32 30,26 26,20 19,15 16,7 12,6" />
        <polyline points="19,16 13,14 9,11 6,8" />
        <polyline points="20,17 15,16 11,14 8,12" />
        <polyline points="26,20 22,25 21,29 20,32" />
        <polyline points="26,20 32,19 35,22 34,25" />
      </g>
      <text
        x="20"
        y="35.5"
        textAnchor="middle"
        fontFamily="Arial Black, Arial, sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="7.5"
        fill={T.text}
      >
        FC
      </text>
    </svg>
  );
}
