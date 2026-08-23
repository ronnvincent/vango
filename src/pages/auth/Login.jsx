import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth, homeFor } from "../../hooks/useAuth";
import { completePendingApplication } from "../../lib/driverApplication";
import GoogleG from "../../components/GoogleG";

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
  const [googleLoading, setGoogleLoading] = useState(false);

  if (session && profile) return <Navigate to={homeFor(profile.role)} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error } = await signIn({ email: email.trim(), password });
    if (error) setError(friendlyAuthError(error.message));
    else await completePendingApplication(data.session);
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      // land back on /login so its session->dashboard redirect kicks in
      options: { redirectTo: window.location.origin + "/login" },
    });
    if (error) {
      setError(error.message.includes("Provider") || error.message.includes("provider")
        ? "Google sign-in isn't enabled yet — ask the site admin to enable it in Supabase."
        : friendlyAuthError(error.message));
      setGoogleLoading(false);
    }
    // on success the browser redirects to Google, then back here
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
              <input id="login-email" type="email" name="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
            </div>
            <div className="field">
              <label htmlFor="login-password">Password</label>
              <input id="login-password" type="password" name="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
            </div>
            <button type="submit" className="btn btn-solid" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
              {loading ? "Authenticating…" : "Sign In →"}
            </button>
            <div className="auth-divider">or</div>
            <button type="button" className="btn-google" onClick={handleGoogle} disabled={loading || googleLoading}>
              <GoogleG />
              <span>{googleLoading ? "Redirecting to Google…" : "Continue with Google"}</span>
            </button>
          </form>
          <Link to="/signup" className="auth-link">Don't have an account? Sign up</Link>
          <Link to="/apply" className="auth-link" style={{ color: "var(--accent)" }}>Want to drive with us? Apply here</Link>
          <p className="lbl help-line">Trouble signing in? Call dispatch — <a href="tel:+15550000000">+1 (555) 000-0000</a>.</p>
        </div>
      </div>
    </div>
  );
}
