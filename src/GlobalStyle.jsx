import { T } from "./theme";

const FONT_IMPORT_URL =
  "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap";

export default function GlobalStyle() {
  return (
    <style>{`
      @import url('${FONT_IMPORT_URL}');
      * { box-sizing: border-box; }
      .disp { font-family: 'Archivo Black', system-ui, sans-serif; text-transform: uppercase; font-style: italic; transform: skewX(-4deg); display: inline-block; }
      .mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
      body { font-family: 'Inter', system-ui, sans-serif; color: ${T.text}; }
      input:focus, button:focus-visible { outline: 2px solid ${T.accent}; outline-offset: 2px; }
      button { cursor: pointer; transition: transform 150ms cubic-bezier(.2,.8,.2,1), box-shadow 150ms ease, border-color 150ms ease, background 150ms ease, color 150ms ease; }
      button:hover { transform: translateY(-1px); }
      button:active { transform: translateY(0) scale(0.97); }
      .btn-accent:hover { box-shadow: 0 0 0 1px ${T.accent}, 0 4px 18px -4px ${T.accent}88; }
      .btn-ghost:hover { border-color: ${T.accent} !important; color: ${T.accent} !important; }
      ::selection { background: ${T.accent}; color: ${T.bg}; }

      @keyframes dropIn {
        from { opacity: 0; transform: translateY(-14px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes riseIn {
        from { opacity: 0; transform: translateY(16px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes slideUpBar {
        from { opacity: 0; transform: translateY(24px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes flashPulse {
        0% { box-shadow: inset 0 0 0 0px ${T.accent}00; }
        30% { box-shadow: inset 0 0 0 2px ${T.accent}; background: ${T.accent}14; }
        100% { box-shadow: inset 0 0 0 0px ${T.accent}00; background: transparent; }
      }
      @keyframes pulseRing { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      @keyframes sweepBg { from { background-position: 0 0; } to { background-position: 300px 0; } }

      .mount-header { animation: dropIn 480ms cubic-bezier(.2,.8,.2,1) both; }
      .mount-card { opacity: 0; animation: riseIn 420ms cubic-bezier(.2,.8,.2,1) both; }
      .just-logged { animation: flashPulse 420ms ease-out; }
      .timer-bar-enter { animation: slideUpBar 320ms cubic-bezier(.2,.8,.2,1) both; }
      .speed-sweep { animation: sweepBg 6s linear infinite; }

      @media (prefers-reduced-motion: reduce) {
        .pulse, .mount-header, .mount-card, .just-logged, .timer-bar-enter, .speed-sweep { animation: none !important; }
      }
    `}</style>
  );
}
