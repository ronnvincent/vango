export default function Skeleton({ w = "100%", h = "1rem", style }) {
  return <span className="skel" aria-hidden="true" style={{ width: w, height: h, ...style }} />;
}

export function SkelNote({ children = "Loading…" }) {
  return <div className="skel-label">{children}</div>;
}

export function TableSkeleton({ rows = 4, label = "Loading…" }) {
  return (
    <div role="status" aria-label={label}>
      <SkelNote>{label}</SkelNote>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skel-row">
          <Skeleton w="16%" />
          <Skeleton w="34%" />
          <Skeleton w="22%" />
          <Skeleton w="12%" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton({ label = "Loading…" }) {
  return (
    <div className="panel" role="status" aria-label={label}>
      <SkelNote>{label}</SkelNote>
      <Skeleton w="45%" h="1.15rem" />
      <div className="skel-stack">
        <Skeleton h=".95rem" />
        <Skeleton w="86%" h=".95rem" />
        <Skeleton w="74%" h=".95rem" />
        <Skeleton w="80%" h=".95rem" />
        <Skeleton w="60%" h=".95rem" />
      </div>
      <Skeleton w="38%" h="2.2rem" />
    </div>
  );
}

export function CardsSkeleton({ n = 3, label = "Loading…" }) {
  return (
    <div role="status" aria-label={label}>
      <div className="kpi-grid">
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="panel kpi-card">
            <Skeleton w="55%" h=".85rem" />
            <div style={{ marginTop: ".7rem" }}>
              <Skeleton w="42%" h="1.9rem" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
