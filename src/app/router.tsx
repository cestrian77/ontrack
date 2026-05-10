import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/app/AppLayout";
import { OnboardingLayout } from "@/app/OnboardingLayout";
import Welcome from "@/routes/Welcome";
import OnboardingYou from "@/routes/onboarding/You";
import OnboardingPensions from "@/routes/onboarding/Pensions";
import OnboardingISA from "@/routes/onboarding/ISA";
import OnboardingProperty from "@/routes/onboarding/Property";
import OnboardingBTL from "@/routes/onboarding/BTL";
import OnboardingPartnerYou from "@/routes/onboarding/PartnerYou";
import OnboardingPartnerPensions from "@/routes/onboarding/PartnerPensions";
import OnboardingPartnerISA from "@/routes/onboarding/PartnerISA";
import OnboardingReview from "@/routes/onboarding/Review";
import Dashboard from "@/routes/Dashboard";
import Fire from "@/routes/Fire";
import Scenarios from "@/routes/Scenarios";
import Property from "@/routes/Property";
import Tax from "@/routes/Tax";
import Insights from "@/routes/Insights";
import Settings from "@/routes/Settings";
import Help from "@/routes/Help";
import ReportBuilder from "@/routes/ReportBuilder";

export const router = createBrowserRouter([
  { path: "/", element: <Welcome /> },
  {
    path: "/onboard",
    element: <OnboardingLayout />,
    children: [
      { index: true, element: <Navigate to="you" replace /> },
      { path: "you", element: <OnboardingYou /> },
      { path: "pensions", element: <OnboardingPensions /> },
      { path: "isa", element: <OnboardingISA /> },
      { path: "property", element: <OnboardingProperty /> },
      { path: "btl", element: <OnboardingBTL /> },
      { path: "partner-you", element: <OnboardingPartnerYou /> },
      { path: "partner-pensions", element: <OnboardingPartnerPensions /> },
      { path: "partner-isa", element: <OnboardingPartnerISA /> },
      { path: "review", element: <OnboardingReview /> },
    ],
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "fire", element: <Fire /> },
      { path: "scenarios", element: <Scenarios /> },
      { path: "property", element: <Property /> },
      { path: "tax", element: <Tax /> },
      { path: "insights", element: <Insights /> },
      { path: "help", element: <Help /> },
      { path: "reports/builder", element: <ReportBuilder /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);
