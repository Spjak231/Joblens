import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ThemeSwitcher } from "../../components/shared";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErr("Please fill all fields.");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const user = await login(email, password);
      if (user.isFirstLogin) {
        navigate("/change-password");
        return;
      }
      navigate(user.role === "coordinator" ? "/coordinator" : "/student");
    } catch (ex) {
      setErr(ex.response?.data?.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "var(--bg-base)",
      }}
    >
      {/* Left panel – branding */}
      <div
        style={{
          flex: 1,
          background:
            "linear-gradient(135deg, #0a0e1a 0%, #1a2235 50%, #0f172a 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "48px",
          position: "relative",
          overflow: "hidden",
          display: window.innerWidth < 900 ? "none" : "flex",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -80,
            left: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            right: -60,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 500,
            height: 500,
            borderRadius: "50%",
            border: "1px solid rgba(249,115,22,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 340,
            height: 340,
            borderRadius: "50%",
            border: "1px solid rgba(249,115,22,0.05)",
          }}
        />

        <div style={{ position: "relative", textAlign: "center" }}>
          <div
            style={{
              width: 72,
              height: 72,
              background: "linear-gradient(135deg, #f97316, #c2410c)",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              color: "#fff",
              fontWeight: 800,
              margin: "0 auto 24px",
              fontFamily: "var(--font-display)",
              boxShadow: "0 8px 32px rgba(249,115,22,0.4)",
            }}
          >
            JL
          </div>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              fontFamily: "var(--font-display)",
              color: "#f1f5f9",
              marginBottom: 12,
            }}
          >
            JobLens
          </h1>
          <p
            style={{
              color: "#94a3b8",
              fontSize: "1rem",
              maxWidth: 320,
              lineHeight: 1.6,
            }}
          >
            Centralized Campus Placement &amp; Drive Management System
          </p>
          <div
            style={{
              display: "flex",
              gap: 24,
              justifyContent: "center",
              marginTop: 40,
            }}
          >
            {[
              { icon: "🏢", label: "On-Campus Drives" },
              { icon: "🌐", label: "Off-Campus Access" },
              { icon: "🤖", label: "AI-Powered Tools" },
              { icon: "🛡️", label: "Fraud Detection" },
            ].map((f) => (
              <div
                key={f.label}
                style={{
                  background: "rgba(249,115,22,0.08)",
                  border: "1px solid rgba(249,115,22,0.2)",
                  borderRadius: 12,
                  padding: "12px 10px",
                  textAlign: "center",
                  minWidth: 80,
                }}
              >
                <div style={{ fontSize: "1.4rem" }}>{f.icon}</div>
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: "#94a3b8",
                    marginTop: 4,
                    fontWeight: 600,
                  }}
                >
                  {f.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Right panel – form */}
      <div
        style={{
          width: 480,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 40px",
          background: "var(--bg-surface)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        <div style={{ position: "absolute", top: 24, right: 24 }}>
          <ThemeSwitcher />
        </div>
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: 8 }}>
            Welcome back
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Sign in with your college email to continue.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <div className="form-group">
            <label className="form-label">College Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="yourname@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {err && <div className="alert alert-danger">{err}</div>}
          <button
            className="btn btn-primary btn-lg"
            type="submit"
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            {loading ? (
              <>
                <span className="spinner" /> Signing in...
              </>
            ) : (
              "→ Sign In"
            )}
          </button>
          <div style={{ textAlign: "center" }}>
            <a
              href="/forgot-password"
              style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}
            >
              Forgot password?
            </a>
          </div>
        </form>
        <div
          style={{
            marginTop: 40,
            padding: "16px",
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 8,
            }}
          >
            Demo Credentials
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              {
                role: "Coordinator",
                email: "coordinator@college.edu",
                pwd: "Test@123",
              },
              {
                role: "Student",
                email: "student@college.edu",
                pwd: "Test@123",
              },
            ].map((d) => (
              <button
                key={d.role}
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.pwd);
                }}
                style={{
                  background: "none",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "6px 10px",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "var(--text-secondary)",
                  fontSize: "0.8rem",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "var(--brand)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border)")
                }
              >
                <span style={{ fontWeight: 700, color: "var(--brand)" }}>
                  {d.role}:
                </span>{" "}
                {d.email} / {d.pwd}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
