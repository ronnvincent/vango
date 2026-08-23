import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "../../components/Toast";

export default function Profile() {
  const { session, profile } = useAuth();
  const [name, setName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ full_name: name, phone }).eq("id", session.user.id);
    
    if (password) {
      const { error: pErr } = await supabase.auth.updateUser({ password });
      if (pErr) {
        toast(`Error updating password: ${pErr.message}`);
        setLoading(false);
        return;
      }
      setPassword("");
    }
    
    if (error) toast(`Error: ${error.message}`);
    else toast("[ OK ] Profile updated.");
    setLoading(false);
  };

  return (
    <div className="panel" style={{ maxWidth: "480px" }}>
      <form onSubmit={handleUpdate}>
        <div className="field">
          <label>Email (Read-only)</label>
          <input type="text" value={session?.user?.email || ""} disabled />
        </div>
        <div className="field">
          <label>Role</label>
          <input type="text" value={(profile?.role || "").toUpperCase()} disabled />
        </div>
        <div className="field">
          <label>Full Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required disabled={loading} />
        </div>
        <div className="field">
          <label>Phone</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required disabled={loading} />
        </div>
        <div className="field">
          <label>New Password (Optional)</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} placeholder="Leave blank to keep current" />
        </div>
        <button type="submit" className="btn btn-solid" style={{ marginTop: "1rem" }} disabled={loading}>
          {loading ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}