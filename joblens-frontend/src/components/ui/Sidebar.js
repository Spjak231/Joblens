import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const coordinatorNav = [
  { path: '/coordinator/dashboard', icon: '⬡', label: 'Dashboard' },
  { path: '/coordinator/drives', icon: '🏢', label: 'Drives' },
  { path: '/coordinator/students', icon: '👥', label: 'Students' },
  { path: '/coordinator/rounds', icon: '🔄', label: 'Rounds' },
  { path: '/coordinator/offcampus', icon: '🌐', label: 'Off-Campus' },
  { path: '/coordinator/notify', icon: '📢', label: 'Notify' },
  { path: '/coordinator/audit', icon: '📋', label: 'Audit Logs' },
];

const studentNav = [
  { path: '/student/dashboard', icon: '⬡', label: 'Dashboard' },
  { path: '/student/drives', icon: '🏢', label: 'On-Campus' },
  { path: '/student/offcampus', icon: '🌐', label: 'Off-Campus' },
  { path: '/student/profile', icon: '👤', label: 'Profile' },
  { path: '/student/feedback', icon: '💬', label: 'Feedback' },
  { path: '/student/ai', icon: '🤖', label: 'AI Tools' },
];

export default function Sidebar({ collapsed, setCollapsed }) {

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const nav =
    user?.role === 'coordinator'
      ? coordinatorNav
      : studentNav;

  return (

    <aside
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      style={{
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 100,
      }}
    >

      {/* LOGO */}

      <div
        style={{
          padding: collapsed ? '20px 18px' : '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: '12px',
        }}
      >

        {!collapsed && (
          <div>

            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 800,
                background:
                  'linear-gradient(135deg, var(--accent-primary), #7c3aed)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              JobLens
            </div>

            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              {user?.role === 'coordinator'
                ? 'Coordinator'
                : 'Student Portal'}
            </div>

          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            padding: '6px 8px',
            cursor: 'pointer',
            fontSize: '14px',
            flexShrink: 0,
          }}
        >
          {collapsed ? '→' : '←'}
        </button>

      </div>

      {/* NAVIGATION */}

      <nav
        style={{
          flex: 1,
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >

        {nav.map((item) => {

          const active =
            location.pathname.startsWith(item.path);

          return (

            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: collapsed ? '10px' : '10px 14px',
                borderRadius: '10px',
                background: active
                  ? 'rgba(0,212,255,0.1)'
                  : 'transparent',
                color: active
                  ? 'var(--accent-primary)'
                  : 'var(--text-secondary)',
                border: active
                  ? '1px solid rgba(0,212,255,0.2)'
                  : '1px solid transparent',
                justifyContent: collapsed
                  ? 'center'
                  : 'flex-start',
                fontSize: '13px',
                fontWeight: active ? 600 : 400,
                transition: 'var(--transition)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >

              <span
                style={{
                  fontSize: '16px',
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </span>

              {!collapsed && item.label}

            </button>
          );
        })}
      </nav>

      {/* USER + LOGOUT */}

      <div
        style={{
          padding: '16px 12px',
          borderTop: '1px solid var(--border)',
        }}
      >

        {!collapsed && (
          <div
            style={{
              padding: '10px 14px',
              background: 'var(--bg-elevated)',
              borderRadius: '10px',
              marginBottom: '8px',
            }}
          >

            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.email}
            </div>

            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginTop: '2px',
                textTransform: 'capitalize',
              }}
            >
              {user?.role}
            </div>

          </div>
        )}

        <button
          onClick={logout}
          title={collapsed ? 'Logout' : ''}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '10px',
            background: 'rgba(255,71,87,0.08)',
            border: '1px solid rgba(255,71,87,0.15)',
            color: 'var(--accent-red)',
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed
              ? 'center'
              : 'flex-start',
            gap: '10px',
            transition: 'var(--transition)',
          }}
        >

          <span>⏻</span>

          {!collapsed && 'Logout'}

        </button>

      </div>

    </aside>
  );
}