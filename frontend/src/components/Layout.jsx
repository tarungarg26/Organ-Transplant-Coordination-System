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
  X
} from "lucide-react";
import { useAuth } from "../auth";
import { socket } from "../socket";
import api from "../api";

export default function Layout() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [openNotifications, setOpenNotifications] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    api.get("/notifications")
      .then(r => setNotifications(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});

    socket.connect();
    socket.emit("join-user", user.id || user._id);
    const handler = row => setNotifications(prev => [row, ...prev]);
    socket.on("notification", handler);
    return () => {
      socket.off("notification", handler);
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setOpenNotifications(false);
      }
    };
    if (openNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openNotifications]);

  const unread = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
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
    } catch (e) {
      console.error("Could not mark all notifications as read:", e);
    }
  };

  const link = (to, label, Icon) => (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
    >
      <Icon size={18} /> {label}
    </NavLink>
  );

  const role = user?.role || "";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><HeartPulse size={24} /></div>
          <div>
            <strong>OTCS</strong>
            <span>Coordination System</span>
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
          <div>
            <span className="eyebrow">ORGAN TRANSPLANT COORDINATION</span>
            <h1>Time-critical coordination, one workspace.</h1>
          </div>
          <div className="top-actions" ref={notifRef} style={{ position: "relative" }}>
            <button 
              className="icon-button" 
              title={`${unread} unread notifications`}
              onClick={() => setOpenNotifications(prev => !prev)}
              aria-expanded={openNotifications}
              style={{ cursor: "pointer" }}
            >
              <Bell size={20}/>
              {unread > 0 && <span className="notification-dot">{unread}</span>}
            </button>

            {openNotifications && (
              <div style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 10px)",
                width: "360px",
                maxHeight: "440px",
                background: "#ffffff",
                border: "1px solid var(--line)",
                borderRadius: "14px",
                boxShadow: "0 12px 35px rgba(15, 23, 42, 0.15)",
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}>
                <div style={{
                  padding: "14px 18px",
                  borderBottom: "1px solid var(--line)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#fafbfc"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ fontSize: "14px", color: "var(--ink)" }}>Notifications</strong>
                    {unread > 0 && (
                      <span style={{
                        background: "#fee2e2",
                        color: "#dc2626",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: "99px"
                      }}>
                        {unread} new
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {unread > 0 && (
                      <button
                        onClick={markAllAsRead}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--brand)",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: 0
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setOpenNotifications(false)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--muted)",
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                        padding: "2px"
                      }}
                      title="Close"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ overflowY: "auto", flex: 1, maxHeight: "360px" }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "36px 20px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                      No notifications right now
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n._id}
                        onClick={() => markAsRead(n)}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid #f1f5f9",
                          cursor: "pointer",
                          background: n.read ? "#ffffff" : "#f0f7ff",
                          display: "flex",
                          gap: "12px",
                          alignItems: "flex-start",
                          transition: "background 0.15s ease"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = n.read ? "#f8fafc" : "#e0efff"}
                        onMouseLeave={e => e.currentTarget.style.background = n.read ? "#ffffff" : "#f0f7ff"}
                      >
                        <div style={{ marginTop: "2px", flexShrink: 0 }}>
                          {n.type === "SUCCESS" && <CheckCircle2 size={16} color="#16a34a" />}
                          {n.type === "ALERT" && <AlertTriangle size={16} color="#eab308" />}
                          {n.type === "ERROR" && <AlertTriangle size={16} color="#dc2626" />}
                          {(!n.type || n.type === "INFO") && <Bell size={16} color="#2563eb" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "6px" }}>
                            <strong style={{ fontSize: "13px", color: n.read ? "#334155" : "#0f172a" }}>
                              {n.title}
                            </strong>
                            <span style={{ fontSize: "10px", color: "var(--muted)", flexShrink: 0 }}>
                              {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                            </span>
                          </div>
                          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)", lineHeight: 1.4, wordBreak: "break-word" }}>
                            {n.message}
                          </p>
                        </div>
                        {!n.read && (
                          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#2563eb", marginTop: "6px", flexShrink: 0 }} />
                        )}
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
