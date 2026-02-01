import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import NavBar from "./components/NavBar";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import JobsPage from "./pages/JobsPage";
import JobsCreatePage from "./pages/JobsCreatePage";
import JobDetailPage from "./pages/JobDetailPage";
import JobsEditPage from "./pages/JobsEditPage";
import CandidateInvitePage from "./pages/interview/CandidateInvitePage";
import CandidateLivePage from "./pages/interview/CandidateLivePage";
import CandidateReportPage from "./pages/interview/CandidateReportPage";
import DeviceSetupPage from "./pages/interview/DeviceSetupPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import RecruiterLayout from "./layouts/RecruiterLayout";
import CandidateResultPage from "./pages/CandidateResultPage";
import JobPreviewPage from "./pages/JobPreviewPage";
import StyleGuidePage from "./pages/StyleGuidePage";
import LegalTermsPage from "./pages/LegalTermsPage";
import LegalPrivacyPage from "./pages/LegalPrivacyPage";

const App = () => {
  const location = useLocation();
  const showPublicNav =
    !location.pathname.startsWith("/app") &&
    !location.pathname.startsWith("/c/") &&
    !location.pathname.startsWith("/preview");
  const showStyleGuide = import.meta.env.VITE_ENABLE_STYLE_GUIDE === "true";

  return (
    <Box sx={{ minHeight: "100vh" }}>
      {showPublicNav ? <NavBar /> : null}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <RecruiterLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/new" element={<JobsCreatePage />} />
          <Route path="jobs/:jobId" element={<JobDetailPage />} />
          <Route path="jobs/:jobId/edit" element={<JobsEditPage />} />
          <Route path="jobs/:jobId/candidates/:candidateId" element={<CandidateResultPage />} />
        </Route>
        <Route path="/c/:inviteId" element={<CandidateInvitePage />} />
        <Route path="/c/:inviteId/setup" element={<DeviceSetupPage />} />
        <Route path="/c/:inviteId/live/:sessionId" element={<CandidateLivePage />} />
        <Route path="/c/:inviteId/report/:sessionId" element={<CandidateReportPage />} />
        <Route path="/terms" element={<LegalTermsPage />} />
        <Route path="/privacy" element={<LegalPrivacyPage />} />
        <Route path="/preview/jobs/:jobId" element={<JobPreviewPage />} />
        {showStyleGuide ? <Route path="/styleguide" element={<StyleGuidePage />} /> : null}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  );
};

export default App;
