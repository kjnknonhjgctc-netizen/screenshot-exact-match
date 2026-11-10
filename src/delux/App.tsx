// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import React, { lazy, Suspense, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { AppLayout } from "./components/Layout/AppLayout";
import { CreateGoalModal } from "./components/Modals/CreateGoalModal";
import { GoalDetailsModal } from "./components/Modals/GoalDetailsModal";
import { OnboardingModal } from "./components/Onboarding/OnboardingModal";
import { AssistantModal } from "./components/Assistant/AssistantModal";

// Keep each main area in its own chunk so opening one page does not require
// downloading and evaluating every other page up front.
const HomeTab = lazy(() => import("./components/Tabs/HomeTab").then((m) => ({ default: m.HomeTab })));
const GoalsTab = lazy(() => import("./components/Tabs/GoalsTab").then((m) => ({ default: m.GoalsTab })));
const MyPlanTab = lazy(() => import("./components/Tabs/MyPlanTab").then((m) => ({ default: m.MyPlanTab })));
const CalendarTab = lazy(() => import("./components/Tabs/CalendarTab").then((m) => ({ default: m.CalendarTab })));
const ProgressTab = lazy(() => import("./components/Tabs/ProgressTab").then((m) => ({ default: m.ProgressTab })));

const preloadMainTabs = () => {
  void Promise.all([
    import("./components/Tabs/HomeTab"),
    import("./components/Tabs/GoalsTab"),
    import("./components/Tabs/MyPlanTab"),
    import("./components/Tabs/CalendarTab"),
    import("./components/Tabs/ProgressTab"),
  ]);
};

const PageLoading = () => (
  <div className="flex min-h-[42vh] w-full items-center justify-center" role="status" aria-label="Carregando página">
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-delux-action/25 border-t-delux-action" />
  </div>
);

const AppContent: React.FC = () => {
  const { activeTab, selectedGoalId, setSelectedGoalId, preferences } = useApp();

  // Warm the page chunks after the first paint, keeping initial interaction
  // responsive while making subsequent tab changes feel immediate.
  useEffect(() => {
    const timer = window.setTimeout(preloadMainTabs, 700);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className={`delux-app ${preferences.reducedMotion ? "reduce-motion" : ""}`}>
      <AppLayout>
        <Suspense fallback={<PageLoading />}>
          {activeTab === "home" && <HomeTab />}
          {activeTab === "goals" && <GoalsTab />}
          {activeTab === "plan" && <MyPlanTab />}
          {activeTab === "calendar" && <CalendarTab />}
          {activeTab === "progress" && <ProgressTab />}
        </Suspense>
      </AppLayout>

      {/* Global Modals */}
      <CreateGoalModal />
      <GoalDetailsModal goalId={selectedGoalId} onClose={() => setSelectedGoalId(null)} />
      <OnboardingModal />
      <AssistantModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
