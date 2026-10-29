// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { AppLayout } from "./components/Layout/AppLayout";
import { HomeTab } from "./components/Tabs/HomeTab";
import { GoalsTab } from "./components/Tabs/GoalsTab";
import { MyPlanTab } from "./components/Tabs/MyPlanTab";
import { CalendarTab } from "./components/Tabs/CalendarTab";
import { ProgressTab } from "./components/Tabs/ProgressTab";
import { CreateGoalModal } from "./components/Modals/CreateGoalModal";
import { GoalDetailsModal } from "./components/Modals/GoalDetailsModal";
import { OnboardingModal } from "./components/Onboarding/OnboardingModal";
import { AssistantModal } from "./components/Assistant/AssistantModal";
import { useButtonSound } from "./components/Common/useButtonSound";

const AppContent: React.FC = () => {
  const { activeTab, selectedGoalId, setSelectedGoalId, preferences } = useApp();
  const playButtonSound = useButtonSound(preferences.soundEnabled);

  return (
    <div className={`delux-app ${preferences.reducedMotion ? "reduce-motion" : ""}`} onClickCapture={playButtonSound}>
      <AppLayout>
        {activeTab === "home" && <HomeTab />}
        {activeTab === "goals" && <GoalsTab />}
        {activeTab === "plan" && <MyPlanTab />}
        {activeTab === "calendar" && <CalendarTab />}
        {activeTab === "progress" && <ProgressTab />}
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
