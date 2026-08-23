import { useEffect } from "react";

export default function ConfirmDialog({ open, title, body, confirmLabel = "CONFIRM", cancelLabel = "GO BACK", busy = false, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === "Escape" && !busy) onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;
  return (
    <div className="dlg-overlay" onClick={() => { if (!busy) onCancel(); }}>
      <div className="dlg" role="alertdialog" aria-modal="true" aria-label={title}>
        <h3>{title}</h3>
        {body && <p>{body}</p>}
        <div className="dlg-actions">
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button type="button" className="btn dlg-danger" onClick={onConfirm} disabled={busy}>
            {busy ? "WORKING…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
