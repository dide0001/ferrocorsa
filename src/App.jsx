import { useState } from "react";
import GlobalStyle from "./GlobalStyle";
import { T } from "./theme";
import { useRestTimer } from "./useRestTimer";
import { usePush } from "./usePush";
import BottomNav, { NAV_HEIGHT } from "./components/BottomNav";
import RestTimerBar from "./components/RestTimerBar";
import HorseWatermark from "./components/HorseWatermark";
import Home from "./pages/Home";
import Workouts from "./pages/Workouts";
import WorkoutDetail from "./pages/WorkoutDetail";
import Progress from "./pages/Progress";
import Garage from "./pages/Garage";
import Profile from "./pages/Profile";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null);

  const { timer, startTimer, toggleTimer, adjustTimer, dismissTimer } = useRestTimer();
  const { notifPermission, pushSubscription, pushError, enablePush } = usePush();

  function openWorkout(id) {
    setSelectedWorkoutId(id);
    setActiveTab("workouts");
  }

  function changeTab(tab) {
    if (tab === "workouts") setSelectedWorkoutId(null);
    setActiveTab(tab);
  }

  function renderPage() {
    switch (activeTab) {
      case "home":
        return (
          <Home
            onOpenWorkout={openWorkout}
            notifPermission={notifPermission}
            pushSubscription={pushSubscription}
            pushError={pushError}
            enablePush={enablePush}
          />
        );
      case "workouts":
        return selectedWorkoutId ? (
          <WorkoutDetail
            workoutId={selectedWorkoutId}
            onBack={() => setSelectedWorkoutId(null)}
            startTimer={startTimer}
            pushSubscription={pushSubscription}
          />
        ) : (
          <Workouts onOpenWorkout={openWorkout} />
        );
      case "progress":
        return <Progress />;
      case "garage":
        return <Garage />;
      case "profile":
        return <Profile notifPermission={notifPermission} pushSubscription={pushSubscription} />;
      default:
        return null;
    }
  }

  const bottomReserve = `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom) + ${timer ? 90 : 0}px)`;

  return (
    <div style={{ minHeight: "100%", background: T.bg, color: T.text, display: "flex", justifyContent: "center" }}>
      <GlobalStyle />
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          minHeight: "100vh",
          position: "relative",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
          paddingBottom: bottomReserve,
          backgroundImage: `radial-gradient(ellipse 480px 340px at 50% -6%, ${T.accent}33, transparent 70%)`,
          backgroundRepeat: "no-repeat",
          overflow: "hidden",
        }}
      >
        <HorseWatermark />
        <div style={{ position: "relative", zIndex: 1 }}>{renderPage()}</div>
      </div>

      {timer && <RestTimerBar timer={timer} onToggle={toggleTimer} onAdjust={adjustTimer} onDismiss={dismissTimer} />}
      <BottomNav active={activeTab} onChange={changeTab} />
    </div>
  );
}
