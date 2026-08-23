import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LogOut, Home, User, Plus, Truck, Users, LayoutDashboard, Settings, BarChart, Menu, X } from "lucide-react";

export default function DashLayout({ role }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

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
      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)} />}
      <aside className={`side ${menuOpen ? 'open' : ''}`}>
        <div className="wordmark" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <img src="/logo.png" alt="VanGo Logo" />
          <button className="mobile-close-btn" onClick={() => setMenuOpen(false)}><X size={24} /></button>
        </div>
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
          <button className="mobile-menu-btn" onClick={() => setMenuOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="lbl" style={{ fontSize: "1rem" }}>{role.toUpperCase()} DISPATCH</div>
          <div className="lbl" style={{ marginLeft: "auto" }}>{today}</div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}