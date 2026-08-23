import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LogOut, Home, User, Plus, Truck, Users, LayoutDashboard, Settings, BarChart } from "lucide-react";

export default function DashLayout({ role }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navLinks = {
    customer: [
      { to: "/app", label: "My Trips", icon: Home },
      { to: "/app/book/new", label: "New Booking", icon: Plus },
      { to: "/app/profile", label: "Profile", icon: User }
    ],
    driver: [
      { to: "/driver", label: "Manifest", icon: Home }
    ],
    admin: [
      { to: "/admin", label: "Overview", icon: LayoutDashboard },
      { to: "/admin/bookings", label: "Bookings", icon: Home },
      { to: "/admin/fleet", label: "Fleet", icon: Truck },
      { to: "/admin/drivers", label: "Drivers", icon: User },
      { to: "/admin/customers", label: "Customers", icon: Users },
      { to: "/admin/settings", label: "Settings", icon: Settings },
      { to: "/admin/reports", label: "Reports", icon: BarChart }
    ]
  };

  const links = navLinks[role] || [];
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="shell">
      <aside className="side">
        <div className="wordmark"><img src="/logo.png" alt="VanGo Logo" /></div>
        <nav className="side-nav">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : "")} end={to === "/app" || to === "/driver" || to === "/admin"}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Icon size={16} />
                {label}
              </span>
            </NavLink>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="lbl" style={{ marginBottom: "0.5rem" }}>{profile?.full_name}</div>
          <button className="signout-btn" onClick={handleSignOut}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="lbl" style={{ fontSize: "1rem" }}>{role.toUpperCase()} DISPATCH</div>
          <div className="lbl">{today}</div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

