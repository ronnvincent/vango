import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "../../components/Toast";

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("settings").select("*").eq("id", 1).single()
      .then(({ data }) => setSettings(data));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from("settings").update({ 
      base_fare: settings.base_fare, 
      free_cancel_hours: settings.free_cancel_hours 
    }).eq("id", 1);
    toast("[ OK ] Global settings updated.");
    setSaving(false);
  };

  if (!settings) return <div className="lbl">Loading…</div>;

  return (
    <div className="panel" style={{ maxWidth: "480px" }}>
      <form onSubmit={handleSave}>
        <div className="field">
          <label>Base Fare ($)</label>
          <input 
            type="number" step="0.01" required 
            value={settings.base_fare} 
            onChange={e => setSettings({...settings, base_fare: Number(e.target.value)})} 
          />
        </div>
        <div className="field">
          <label>Free Cancellation Window (Hours)</label>
          <input 
            type="number" required min="1" max="72"
            value={settings.free_cancel_hours} 
            onChange={e => setSettings({...settings, free_cancel_hours: Number(e.target.value)})} 
          />
        </div>
        <button type="submit" className="btn btn-solid" style={{ marginTop: "1rem" }} disabled={saving}>
          {saving ? "SAVING…" : "SAVE SETTINGS"}
        </button>
      </form>
    </div>
  );
}