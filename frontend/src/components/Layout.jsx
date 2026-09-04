import React, { useEffect, useState, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { 
  Bell, 
  ClipboardList, 
  FileText, 
  HeartPulse, 
  Home, 
  LogOut, 
  Map, 
  Users, 
  UserPlus, 
  BarChart3, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Menu,
  ChevronDown,
  UserCheck
} from "lucide-react";
import { useAuth } from "../auth";
import { socket } from "../socket";
import api from "../api";
import { useToast } from "./Toast";

const DEMO_ROLES = [
  { role: "HOSPITAL", label: "Hospital Staff", email: "hospital@otcs.local", desc: "Donors & candidate intake" },
  { role: "COORDINATOR", label: "Transplant Coordinator", email: "coordinator@otcs.local", desc: "Compatibility & allocations" },
  { role: "TRANSPORT", label: "Transport Dispatcher", email: "transport@otcs.local", desc: "Logistics & organ transit" },
  { role: "OPO", label: "OPO Officer", email: "opo@otcs.local", desc: "Procurement & compliance" },
  { role: "AUDITOR", label: "Regulatory Auditor", email: "auditor@otcs.local", desc: "Audit trail & compliance" },
  { role: "ADMIN", label: "System Administrator", email: "admin@otcs.local", desc: "User provisioning & security" }
];

export default function Layout() {
  const { user, login, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const notifRef = useRef(null);
  const roleRef = useRef(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (!user) return;
    api.get("/notifications")
      .then(r => setNotifications(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});

    socket.connect();
    socket.emit("join-user", user.id || user._id);

    const handler = row => {
      setNotifications(prev => [row, ...prev]);
      showToast({
        title: row.title || "New Notification",
        message: row.message,
        type: row.type === "SUCCESS" ? "success" : row.type === "ALERT" || row.type === "ERROR" ? "error" : "info"
      });
    };

    socket.on("notification", handler);
    return () => {
      socket.off("notification", handler);
      socket.disconnect();
    };
  }, [user, showToast]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setOpenNotifications(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target)) {
        setRoleMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unread = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleSwitchRole = async (targetRole) => {
    try {
      await login(targetRole.email, "Password@123");
      setRoleMenuOpen(false);
      showToast({
        title: "Perspective switched",
        message: `Now operating as ${targetRole.label}`,
        type: "success"
      });
      navigate("/dashboard");
    } catch (err) {
      showToast({
        title: "Switch failed",
        message: "Could not switch perspective",
        type: "error"
      });
    }
  };

  const markAsRead = async (notif) => {
    if (!notif.read) {
      try {
        await api.patch(`/notifications/${notif._id}/read`);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
      } catch (e) {
        console.error("Could not mark notification as read:", e);
      }
    }
    setOpenNotifications(false);

    if (notif.entityType === "MATCH" || notif.type === "SUCCESS") {
      navigate("/matches");
    } else if (notif.entityType === "TRANSPORT" || notif.type === "ALERT") {
      navigate("/transports");
    } else if (notif.entityType === "DONOR") {
      navigate("/donors");
    } else if (notif.entityType === "RECIPIENT") {
      navigate("/recipients");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showToast({ title: "Updated", message: "All notifications marked as read", type: "info" });
    } catch (e) {
      console.error("Could not mark all notifications as read:", e);
    }
  };

  const link = (to, label, Icon) => (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
      onClick={() => setMenuOpen(false)}
    >
      <Icon size={18} /> {label}
    </NavLink>
  );

  const role = user?.role || "";
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="app-shell">
      <div
        className={`sidebar-backdrop${menuOpen ? " open" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
      <aside className={`sidebar${menuOpen ? " open" : ""}`}>
        <div className="brand">
          <div className="brand-icon"><HeartPulse size={22} /></div>
          <div>
            <strong>OTCS</strong>
            <span>Coordination</span>
          </div>
        </div>
        <nav>
          {link("/dashboard", "Dashboard", Home)}
          {(role === "HOSPITAL" || role === "ADMIN" || role === "COORDINATOR") && link("/donors", "Donors", UserPlus)}
          {(role === "HOSPITAL" || role === "ADMIN" || role === "COORDINATOR") && link("/recipients", "Recipients", Users)}
          {(role === "COORDINATOR" || role === "OPO" || role === "ADMIN") && link("/matches", "Matching", ClipboardList)}
          {(role === "TRANSPORT" || role === "COORDINATOR" || role === "ADMIN") && link("/transports", "Transport", Map)}
          {link("/documents", "Documents", FileText)}
          {(role === "COORDINATOR" || role === "OPO" || role === "AUDITOR" || role === "ADMIN") && link("/analytics", "Analytics", BarChart3)}
          {(role === "COORDINATOR" || role === "OPO" || role === "AUDITOR" || role === "ADMIN") && link("/reports", "Compliance", ShieldCheck)}
          {role === "ADMIN" && link("/users", "Users", Users)}
        </nav>
        <div className="sidebar-bottom">
          <div className="role-switcher-wrap" ref={roleRef}>
            <button
              type="button"
              className="role-badge-btn"
              onClick={() => setRoleMenuOpen(prev => !prev)}
              title="Switch demo role perspective"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <UserCheck size={14} color="#14b8a6" />
                <span style={{ fontWeight: 600 }}>Switch Role</span>
              </div>
              <ChevronDown size={13} style={{ transform: roleMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>

            {roleMenuOpen && (
              <div className="role-dropdown-menu">
                <div style={{ padding: "4px 8px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                    Select Demo Perspective
                  </span>
                </div>
                {DEMO_ROLES.map(r => (
                  <button
                    key={r.role}
                    type="button"
                    className={`role-dropdown-item${r.role === role ? " active" : ""}`}
                    onClick={() => handleSwitchRole(r)}
                  >
                    <div>
                      <div style={{ fontWeight: r.role === role ? 700 : 500 }}>{r.label}</div>
                      <div style={{ fontSize: 9, opacity: 0.7 }}>{r.desc}</div>
                    </div>
                    {r.role === role && <CheckCircle2 size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="user-mini">
            <div className="avatar">{(user?.name?.[0] || "U").toUpperCase()}</div>
            <div>
              <strong>{user?.name || "User"}</strong>
              <span>{role}</span>
            </div>
          </div>
          <button className="logout" onClick={handleLogout}>
            <LogOut size={17}/> Logout
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="menu-toggle" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <Menu size={18} />
            </button>
            <div>
              <span className="eyebrow">ORGAN TRANSPLANT COORDINATION</span>
              <h1>Welcome back, {firstName}.</h1>
            </div>
          </div>
          <div className="top-actions" ref={notifRef}>
            <button 
              className="icon-button" 
              title={`${unread} unread notifications`}
              onClick={() => setOpenNotifications(prev => !prev)}
              aria-expanded={openNotifications}
            >
              <Bell size={20}/>
              {unread > 0 && <span className="notification-dot">{unread}</span>}
            </button>

            {openNotifications && (
              <div className="notif-panel">
                <div className="notif-head">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong style={{ fontSize: 14 }}>Notifications</strong>
                    {unread > 0 && <span className="notif-count">{unread} new</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {unread > 0 && (
                      <button className="ghost-btn" onClick={markAllAsRead}>Mark all read</button>
                    )}
                    <button className="icon-ghost" onClick={() => setOpenNotifications(false)} title="Close">
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No notifications right now</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n._id}
                        className={`notif-item${n.read ? "" : " unread"}`}
                        onClick={() => markAsRead(n)}
                      >
                        <div style={{ marginTop: 2, flexShrink: 0 }}>
                          {n.type === "SUCCESS" && <CheckCircle2 size={16} color="#0f7a58" />}
                          {n.type === "ALERT" && <AlertTriangle size={16} color="#c47a12" />}
                          {n.type === "ERROR" && <AlertTriangle size={16} color="#be3a3a" />}
                          {(!n.type || n.type === "INFO") && <Bell size={16} color="#0d9488" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
                            <strong style={{ fontSize: 13 }}>{n.title}</strong>
                            <span style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>
                              {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                            </span>
                          </div>
                          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)", lineHeight: 1.4, wordBreak: "break-word" }}>
                            {n.message}
                          </p>
                        </div>
                        {!n.read && <div className="notif-dot" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>
        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
