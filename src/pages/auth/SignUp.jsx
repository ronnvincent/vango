import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth, homeFor } from "../../hooks/useAuth";

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
    const { error } = await signUp(formData);
    if (error) setError(error.message);
    else setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="wordmark">VAN<i>—</i>GO</Link>
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
                <label>Full Name</label>
                <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} disabled={loading} />
              </div>
              <div className="field">
                <label>Phone</label>
                <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={loading} />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={loading} />
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} disabled={loading} />
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