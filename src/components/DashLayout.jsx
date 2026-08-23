import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LogOut, Home, User, Plus, Truck, Users, LayoutDashboard, Settings, BarChart, Menu, X, FileText } from "lucide-react";

export default function DashLayout({ role }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("drawer-lock", menuOpen);
    const onKey = e => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("drawer-lock");
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

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
      { to: "/admin/applications", label: "Applications", icon: FileText },
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
        <div className="wordmark side-head">
          <img src="/logo.png" alt="VanGo Logo" />
          <button className="mobile-close-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={26} /></button>
        </div>
        <nav className="side-nav">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : "")} end={to === "/app" || to === "/driver" || to === "/admin"}>
              <span className="nav-ic">
                <Icon size={16} />
                {label}
              </span>
            </NavLink>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="lbl side-user">{profile?.full_name}</div>
          <button className="signout-btn" onClick={handleSignOut}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <button className="mobile-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}>
            <Menu size={24} />
          </button>
          <div className="lbl topbar-title">{role.toUpperCase()} DISPATCH</div>
          <div className="lbl topbar-date">{today}</div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}