import { Navigate, Route, Routes } from "react-router-dom";
import { Box } from "@mui/material";
import NavBar from "./components/NavBar";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RecruiterDashboardPage from "./pages/RecruiterDashboardPage";
import JobDetailPage from "./pages/JobDetailPage";
import CandidateInvitePage from "./pages/CandidateInvitePage";
import CandidateLivePage from "./pages/CandidateLivePage";
import CandidateReportPage from "./pages/CandidateReportPage";
import ProtectedRoute from "./routes/ProtectedRoute";

const App = () => {
  return (
    <Box sx={{ minHeight: "100vh" }}>
      <NavBar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Navigate to="/app" replace />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <RecruiterDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/jobs/:jobId"
          element={
            <ProtectedRoute>
              <JobDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="/c/:inviteId" element={<CandidateInvitePage />} />
        <Route path="/c/:inviteId/live/:sessionId" element={<CandidateLivePage />} />
        <Route path="/c/:inviteId/report/:sessionId" element={<CandidateReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  );
};

export default App;
