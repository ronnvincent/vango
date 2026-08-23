import { Link } from "react-router-dom";

export default function Welcome() {
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "540px" }}>
        <Link to="/" className="wordmark" style={{ marginBottom: "1.5rem" }}><img src="/logo.png" alt="VanGo Logo" /></Link>
        <div className="panel" style={{ textAlign: "center", padding: "3.5rem 2rem" }}>
          <div className="badge badge-confirmed" style={{ margin: "0 auto 1.5rem", width: "max-content", padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            EMAIL CONFIRMED
          </div>
          <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Welcome to the Manifest.</h2>
          <p style={{ fontFamily: "'IBM Plex Mono'", fontSize: "0.85rem", color: "rgba(23,21,18,.7)", marginBottom: "2.5rem", lineHeight: 1.6 }}>
            Your credentials are authenticated. You now have full clearance to book vans, review your trips, and manage your profile.
          </p>
          <div className="duo" style={{ gap: "1rem" }}>
            <Link to="/login" className="btn btn-solid" style={{ width: "100%", padding: "1rem" }}>Proceed to Login →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
