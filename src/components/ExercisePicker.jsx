import { useEffect, useState } from "react";
import { T } from "../theme";
import { getExerciseIndex } from "../api";

// Search-as-you-type picker against the imported exercise library —
// used when building a workout so user-created ones reference the same
// real exercise records (name/image/instructions) as the seeded ones.
export default function ExercisePicker({ value, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      getExerciseIndex({ q: query.trim() })
        .then((r) => !cancelled && setResults(r.slice(0, 8)))
        .catch(() => !cancelled && setResults([]));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  if (value) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flex: 1,
          background: T.surfaceRaised,
          border: `1px solid ${T.line}`,
          borderRadius: T.radiusSm,
          padding: "6px 8px",
        }}
      >
        {value.thumbnail && (
          <img src={value.thumbnail} alt="" style={{ width: 26, height: 26, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
        )}
        <span style={{ flex: 1, fontSize: 13 }}>{value.name}</span>
        <button type="button" onClick={() => onSelect(null)} style={{ background: "none", border: "none", color: T.textFaint, fontSize: 11.5 }}>
          Skift
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", flex: 1 }}>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Søg øvelse…"
        style={{
          width: "100%",
          background: T.surfaceRaised,
          border: `1px solid ${T.line}`,
          borderRadius: T.radiusSm,
          color: T.text,
          padding: "7px 8px",
          fontSize: 13,
        }}
      />
      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 10,
            background: T.surfaceRaised,
            border: `1px solid ${T.lineBright}`,
            borderRadius: T.radiusSm,
            marginTop: 4,
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                onSelect(r);
                setQuery("");
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "7px 8px",
                background: "none",
                border: "none",
                textAlign: "left",
              }}
            >
              {r.thumbnail && (
                <img src={r.thumbnail} alt="" style={{ width: 24, height: 24, borderRadius: 5, objectFit: "cover", flexShrink: 0 }} />
              )}
              <span style={{ flex: 1, fontSize: 12.5 }}>{r.name}</span>
              {r.primaryMuscles?.[0] && (
                <span className="mono" style={{ fontSize: 9.5, color: T.textFaint, flexShrink: 0 }}>{r.primaryMuscles[0]}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
