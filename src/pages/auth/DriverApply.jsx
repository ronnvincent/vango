import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import { submitApplication, stashPendingApplication } from "../../lib/driverApplication";

export default function DriverApply() {
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [yearsExperience, setYearsExperience] = useState(0);
  const [file, setFile] = useState(null);

  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingApp, setExistingApp] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!session?.user?.id) return;
    supabase.from("driver_applications").select("status, reviewer_note, created_at")
      .eq("applicant", session.user.id).maybeSingle()
      .then(({ data }) => setExistingApp(data));
  }, [session?.user?.id]);

  // Already a driver? Nothing to apply for.
  if (profile?.role === "driver") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="panel" style={{ textAlign: "center", padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>You're already driving with us.</h2>
            <Link to="/driver" className="btn btn-solid">Go to your manifest</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!session && password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    if (licenseExpiry && licenseExpiry <= today) {
      return setError("Your license must not be expired.");
    }

    setLoading(true);

    try {
      let userId = session?.user?.id;

      // Fresh applicants: create the auth account first.
      if (!userId) {
        const { data, error: sErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName, phone },
            emailRedirectTo: `${window.location.origin}/welcome`,
          },
        });
        if (sErr) throw new Error(sErr.message);

        if (!data.session) {
          // Email confirmation required — stash the details; they are
          // submitted automatically right after the first login.
          stashPendingApplication({ licenseNumber, licenseExpiry, yearsExperience });
          setDone("confirm-email");
          setLoading(false);
          return;
        }
        userId = data.user.id;
      }

      const { error: aErr } = await submitApplication(
        userId,
        { licenseNumber, licenseExpiry, yearsExperience },
        file
      );
      if (aErr) throw new Error(aErr.message);

      setDone(true);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (done === true || existingApp) {
    const status = done ? "pending" : existingApp?.status;
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="panel" style={{ textAlign: "center", padding: "2.5rem" }}>
            <span className={`badge ${status === "approved" ? "badge-completed" : status === "rejected" ? "badge-cancelled" : "badge-pending"}`}>
              Application {status}
            </span>
            <h2 style={{ fontSize: "1.4rem", margin: "1.2rem 0 .8rem" }}>
              {status === "approved"
                ? "You're in — welcome aboard!"
                : status === "rejected"
                ? "Application declined"
                : "Application received."}
            </h2>
            {status === "pending" && (
              <p className="lbl" style={{ textTransform: "none" }}>
                Our dispatch team reviews applications within 24 hours. You can keep booking trips in the meantime.
              </p>
            )}
            {status === "rejected" && existingApp?.reviewer_note && (
              <p className="lbl" style={{ textTransform: "none", marginBottom: "1rem" }}>Note from dispatch: {existingApp.reviewer_note}</p>
            )}
            {status === "approved" && (
              <button className="btn btn-solid" onClick={() => navigate("/driver")}>Open driver dashboard</button>
            )}
            {!done && !session && <Link to="/login" className="auth-link">Sign in</Link>}
            {!done && session && <Link to="/app" className="auth-link">Back to my trips</Link>}
          </div>
        </div>
      </div>
    );
  }

  if (done === "confirm-email") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="panel">
            <div className="auth-success">
              Almost there!<br /><br />
              Check your email and confirm your address.<br />
              Your application will be submitted automatically<br />
              the first time you sign in.
              <br /><br />
              <Link to="/login" className="btn btn-solid">Go to Login</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "520px" }}>
        <Link to="/" className="wordmark"><img src="/logo.png" alt="VanGo Logo" /></Link>
        <div className="panel">
          <form onSubmit={handleSubmit}>
            <div className="sec-head" style={{ marginTop: 0 }}>
              <div>
                <span className="idx">NOW HIRING</span>
                <h2 style={{ fontSize: "1.6rem" }}>Drive with VanGo</h2>
              </div>
            </div>

            {error && <div className="auth-error">▲ {error}</div>}

            {!session && (
              <>
                <p className="lbl" style={{ textTransform: "none", color: "rgba(23,21,18,.75)", marginBottom: "1.4rem" }}>
                  Step 1 — Create your account. Step 2 — Tell us about your driving experience. Dispatch reviews every application.
                </p>
                <div className="field">
                  <label htmlFor="da-name">Full Name</label>
                  <input id="da-name" type="text" name="name" autoComplete="name" required value={fullName} onChange={e => setFullName(e.target.value)} disabled={loading} />
                </div>
                <div className="field">
                  <label htmlFor="da-phone">Phone</label>
                  <input id="da-phone" type="tel" name="tel" autoComplete="tel" required value={phone} onChange={e => setPhone(e.target.value)} disabled={loading} />
                </div>
                <div className="field">
                  <label htmlFor="da-email">Email</label>
                  <input id="da-email" type="email" name="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
                </div>
                <div className="field">
                  <label htmlFor="da-password">Password</label>
                  <input id="da-password" type="password" name="new-password" autoComplete="new-password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
                </div>
              </>
            )}

            <p className="lbl" style={{ textTransform: "none", color: "rgba(23,21,18,.75)", margin: "1.4rem 0" }}>
              Requirements — a valid driver's license and your personal details. Dispatch may ask for originals on your first day.
            </p>

            <div className="field">
              <label htmlFor="da-licno">Driver's License Number</label>
              <input id="da-licno" type="text" required value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} disabled={loading} placeholder="e.g. D01-00-123456" />
            </div>
            <div className="duo">
              <div className="field">
                <label htmlFor="da-licexp">License Expiry</label>
                <input id="da-licexp" type="date" min={today} required value={licenseExpiry} onChange={e => setLicenseExpiry(e.target.value)} disabled={loading} />
              </div>
              <div className="field">
                <label htmlFor="da-years">Years of Experience</label>
                <input id="da-years" type="number" min={0} max={60} required value={yearsExperience} onChange={e => setYearsExperience(e.target.value)} disabled={loading} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="da-doc">Upload License Photo (optional)</label>
              <input
                id="da-doc"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={e => setFile(e.target.files?.[0] || null)}
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-solid" style={{ width: "100%", marginTop: "1rem", padding: "1.1rem" }} disabled={loading}>
              {loading ? "Submitting…" : "Submit Application"}
            </button>
            <p className="lbl help-line">Questions first? Call dispatch — <a href="tel:+15550000000">+1 (555) 000-0000</a>.</p>
            {!session && <Link to="/login" className="auth-link">Already have an account? Sign in</Link>}
          </form>
        </div>
      </div>
    </div>
  );
}
