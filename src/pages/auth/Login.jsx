import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth, homeFor } from "../../hooks/useAuth";

const friendlyAuthError = m =>
  m?.includes("Invalid login credentials") ? "Wrong email or password."
  : m?.includes("Email not confirmed") ? "Confirm your email first — check your inbox."
  : m?.includes("rate limit") ? "Too many attempts — wait a minute and try again."
  : m;

export default function Login() {
  const { signIn, session, profile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (session && profile) return <Navigate to={homeFor(profile.role)} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn({ email, password });
    if (error) setError(friendlyAuthError(error.message));
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="wordmark"><img src="/logo.png" alt="VanGo Logo" /></Link>
        <div className="panel">
          <form onSubmit={handleSubmit}>
            <div className="sec-head" style={{ marginTop: 0 }}>
              <div>
                <span className="idx">SECURE</span>
                <h2 style={{ fontSize: "1.6rem" }}>Sign In</h2>
              </div>
            </div>
            {error && <div className="auth-error">▲ {error}</div>}
            <div className="field">
              <label htmlFor="login-email">Email</label>
              <input id="login-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
            </div>
            <div className="field">
              <label htmlFor="login-password">Password</label>
              <input id="login-password" type="password" required value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
            </div>
            <button type="submit" className="btn btn-solid" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
              {loading ? "Authenticating…" : "Sign In →"}
            </button>
          </form>
          <Link to="/signup" className="auth-link">Don't have an account? Sign up</Link>
          <p className="lbl help-line">Trouble signing in? Call dispatch — <a href="tel:+15550000000">+1 (555) 000-0000</a>.</p>
        </div>
      </div>
    </div>
  );
}
