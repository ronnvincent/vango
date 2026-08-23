import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth, homeFor } from "../../hooks/useAuth";

const friendlyAuthError = m =>
  m?.includes("already registered") ? "That email already has an account — sign in instead."
  : m?.includes("rate limit") ? "Too many attempts — wait a minute and try again."
  : m?.includes("Password") || m?.includes("password") ? "Password too weak — use at least 6 characters."
  : m;

export default function SignUp() {
  const { signUp, session, profile } = useAuth();
  const [formData, setFormData] = useState({ fullName: "", phone: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (session && profile) return <Navigate to={homeFor(profile.role)} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signUp({ ...formData, email: formData.email.trim() });
    if (error) setError(friendlyAuthError(error.message));
    else setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="wordmark"><img src="/logo.png" alt="VanGo Logo" /></Link>
        <div className="panel">
          {success ? (
            <div className="auth-success">
              Check your email to confirm.<br/><br/>
              <Link to="/login" className="btn btn-solid">Go to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="sec-head" style={{ marginTop: 0 }}>
                <div>
                  <span className="idx">SECURE</span>
                  <h2 style={{ fontSize: "1.6rem" }}>Sign Up</h2>
                </div>
              </div>
              {error && <div className="auth-error">▲ {error}</div>}
              <div className="field">
                <label htmlFor="su-name">Full Name</label>
                <input id="su-name" type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} disabled={loading} />
              </div>
              <div className="field">
                <label htmlFor="su-phone">Phone</label>
                <input id="su-phone" type="tel" name="tel" autoComplete="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={loading} />
              </div>
              <div className="field">
                <label htmlFor="su-email">Email</label>
                <input id="su-email" type="email" name="email" autoComplete="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={loading} />
              </div>
              <div className="field">
                <label htmlFor="su-password">Password</label>
                <input id="su-password" type="password" name="new-password" autoComplete="new-password" minLength={6} required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} disabled={loading} />
              </div>
              <button type="submit" className="btn btn-solid" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
                {loading ? "Creating Account…" : "Sign Up →"}
              </button>
            </form>
          )}
          {!success && <Link to="/login" className="auth-link">Already have an account? Sign in</Link>}
        </div>
      </div>
    </div>
  );
}
