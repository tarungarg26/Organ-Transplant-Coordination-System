import { NavLink, Outlet } from "react-router-dom";
import { Bell, ClipboardList, FileText, HeartPulse, Home, LogOut, Map, Users, UserPlus, BarChart3, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { socket } from "../socket";
import api from "../api";

export default function Layout() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;
    api.get("/notifications").then(r => setNotifications(r.data));
    socket.connect();
    socket.emit("join-user", user.id);
    const handler = row => setNotifications(prev => [row, ...prev]);
    socket.on("notification", handler);
    return () => {
      socket.off("notification", handler);
      socket.disconnect();
    };
  }, [user]);

  const unread = notifications.filter(n => !n.read).length;
  const link = (to, label, Icon) => (
    <NavLink to={to} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
      <Icon size={18} /> {label}
    </NavLink>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><HeartPulse size={24} /></div>
          <div><strong>OTCS</strong><span>Coordination System</span></div>
        </div>
        <nav>
          {link("/", "Dashboard", Home)}
          {(user.role === "HOSPITAL" || user.role === "ADMIN") && link("/donors", "Donors", UserPlus)}
          {(user.role === "HOSPITAL" || user.role === "ADMIN" || user.role === "COORDINATOR") && link("/recipients", "Recipients", Users)}
          {(user.role === "COORDINATOR" || user.role === "OPO" || user.role === "ADMIN") && link("/matches", "Matching", ClipboardList)}
          {(user.role === "TRANSPORT" || user.role === "COORDINATOR" || user.role === "ADMIN") && link("/transports", "Transport", Map)}
          {link("/documents", "Documents", FileText)}
          {(user.role === "COORDINATOR" || user.role === "OPO" || user.role === "AUDITOR" || user.role === "ADMIN") && link("/analytics", "Analytics", BarChart3)}
          {(user.role === "COORDINATOR" || user.role === "OPO" || user.role === "AUDITOR" || user.role === "ADMIN") && link("/reports", "Compliance", ShieldCheck)}
          {user.role === "ADMIN" && link("/users", "Users", Users)}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-mini"><div className="avatar">{user.name?.[0]}</div><div><strong>{user.name}</strong><span>{user.role}</span></div></div>
          <button className="logout" onClick={logout}><LogOut size={17}/> Logout</button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">ORGAN TRANSPLANT COORDINATION</span>
            <h1>Time-critical coordination, one workspace.</h1>
          </div>
          <div className="top-actions">
            <button className="icon-button" title={`${unread} unread notifications`}><Bell size={20}/>{unread > 0 && <span className="notification-dot">{unread}</span>}</button>
          </div>
        </header>
        <section className="content"><Outlet /></section>
      </main>
    </div>
  );
}
