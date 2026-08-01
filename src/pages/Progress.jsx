import { T } from "../theme";
import ComingSoon from "../components/ComingSoon";

export default function Progress() {
  return (
    <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 32px" }}>
      <h1 className="disp" style={{ fontSize: 22, margin: 0 }}>Progress</h1>
      <ComingSoon
        icon="📈"
        text="Fremskridtsgrafer og muskelgruppe-oversigt kommer i en senere omgang, når der er nok historik at vise."
      />
      <div style={{ marginTop: 8, fontSize: 12, color: T.textFaint }}>
        Dine gennemførte workouts logges allerede i baggrunden — denne side får snart et rigtigt overblik over dem.
      </div>
    </div>
  );
}
