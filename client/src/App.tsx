import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Landing } from "@/pages/Landing";
import { Login } from "@/pages/Login";
import { Signup } from "@/pages/Signup";
import { GoogleCallback } from "@/pages/GoogleCallback";
import { Dashboard } from "@/pages/Dashboard";
import { Chat } from "@/pages/Chat";
import { Invoices } from "@/pages/Invoices";
import { Expenses } from "@/pages/Expenses";
import { Analytics } from "@/pages/Analytics";
import { Settings } from "@/pages/Settings";
import { NotFound } from "@/pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route
            path="/dashboard"
            element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/chat"
            element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/invoices"
            element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <Invoices />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/expenses"
            element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <Expenses />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/analytics"
            element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/settings"
            element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
