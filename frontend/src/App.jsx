import React, { useState } from "react";
import { RouterProvider, useRouter, Link } from "./context/RouterContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LandingPage from "./views/LandingPage";
import TracerPage from "./views/TracerPage";
import LearnPage from "./views/LearnPage";
import "./index.css";

function AppContent() {
  const { pathname } = useRouter();
  const [lastUserTrace, setLastUserTrace] = useState(null);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "var(--bg-canvas)",
      }}
    >
      <Navbar />

      <main style={{ flex: 1 }}>
        {pathname === "/" && <LandingPage lastUserTrace={lastUserTrace} />}

        {pathname.startsWith("/trace") && (
          <TracerPage
            onTraceCompleted={(trace) => setLastUserTrace(trace)}
            lastUserTrace={lastUserTrace}
          />
        )}

        {pathname.startsWith("/learn") && (
          <LearnPage lastUserTrace={lastUserTrace} />
        )}

        {pathname !== "/" && !pathname.startsWith("/trace") && !pathname.startsWith("/learn") && (
          <div
            className="layout-container"
            style={{ padding: "80px 20px", textAlign: "center" }}
          >
            <div className="hairline-card" style={{ padding: "40px", maxWidth: "480px", margin: "0 auto" }}>
              <div className="badge badge-maroon" style={{ marginBottom: "12px" }}>
                HTTP 404
              </div>
              <h2 className="font-serif" style={{ fontSize: "24px", color: "var(--color-primary)", marginBottom: "8px" }}>
                Page Not Found
              </h2>
              <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginBottom: "20px" }}>
                The requested URL path does not exist in dnstrace.
              </p>
              <Link to="/" className="btn-primary">
                Return to Overview →
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}
