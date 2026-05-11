import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { studentAPI } from '../../services/api';
import { Card, Badge, StatCard, LoadingPage } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  selected: '#00e676',
  rejected: '#ff4757',
  in_progress: '#00d4ff',
  shortlisted: '#7c3aed',
  registered: '#ffd700',
  not_shortlisted: '#666',
};

const STATUS_LABELS = {
  selected: 'Selected',
  rejected: 'Rejected',
  in_progress: 'In Progress',
  shortlisted: 'Shortlisted',
  registered: 'Registered',
  not_shortlisted: 'Not Shortlisted',
};

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    studentAPI
      .getDashboard()
      .then((res) => setData(res.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPage text="Loading your dashboard..." />;
  if (!data) return null;

  const statusData = Object.entries(data.statusBreakdown || {})
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      name: STATUS_LABELS[k] || k,
      value: v,
      fill: STATUS_COLORS[k] || '#00d4ff',
    }));

  const barData = Object.entries(data.statusBreakdown || {}).map(([k, v]) => ({
    name: STATUS_LABELS[k] || k,
    count: v,
    fill: STATUS_COLORS[k] || '#00d4ff',
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Welcome Banner */}
      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(124,58,237,0.08))',
          border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 800,
              marginBottom: '6px',
            }}
          >
            Welcome back, {data.student.name?.split(' ')[0]} 👋
          </h1>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              🎓 {data.student.branch} · Batch {data.student.passedOutYear}
            </span>

            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              📊 CGPA:{' '}
              <span
                style={{
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                }}
              >
                {data.student.cgpa}
              </span>
            </span>

            {!data.student.hasResume && (
              <span
                style={{
                  fontSize: '13px',
                  color: 'var(--accent-orange)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
                onClick={() => navigate('/student/profile')}
              >
                ⚠ Upload your resume to apply for drives
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => navigate('/student/drives')}
          style={{
            padding: '10px 20px',
            background: 'var(--accent-primary)',
            color: 'var(--bg-primary)',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          View Drives →
        </button>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '14px',
        }}
      >
        <StatCard
          label="Applied"
          value={data.stats?.drivesApplied || 0}
          icon="📝"
          color="var(--accent-primary)"
        />

        <StatCard
          label="Selected"
          value={data.stats?.drivesSelected || 0}
          icon="🏆"
          color="var(--accent-green)"
        />

        <StatCard
          label="Rejected"
          value={data.stats?.drivesRejected || 0}
          icon="❌"
          color="var(--accent-red)"
        />

        <StatCard
          label="In Progress"
          value={data.statusBreakdown?.in_progress || 0}
          icon="⚡"
          color="var(--accent-orange)"
        />
      </div>

      {/* Application Status */}
      {data.totalApplications > 0 && (
        <Card>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              marginBottom: '24px',
              fontWeight: 700,
            }}
          >
            Application Status
          </h3>

          {/* Full Circle Status */}
          <div className="dashboard-status-row">
            {statusData.map((item, i) => (
              <div key={i} className="dashboard-status-card">
                <div
                  className="dashboard-status-circle"
                  style={{
                    borderColor: item.fill,
                    color: item.fill,
                    boxShadow: `0 0 20px ${item.fill}30`,
                  }}
                >
                  {item.value}
                </div>

                <p>{item.name}</p>
              </div>
            ))}
          </div>

          {/* Graph Below */}
          <div className="dashboard-graph-box">
            <h4
              style={{
                marginBottom: '18px',
                fontSize: '15px',
                fontWeight: 700,
              }}
            >
              Drive History
            </h4>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} barSize={26}>
                <XAxis
                  dataKey="name"
                  tick={{
                    fill: 'var(--text-muted)',
                    fontSize: 11,
                  }}
                />

                <YAxis
                  tick={{
                    fill: 'var(--text-muted)',
                    fontSize: 11,
                  }}
                />

                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                />

                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Recent Drive History */}
      {data.driveHistory?.length > 0 && (
        <Card>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '16px',
              marginBottom: '16px',
            }}
          >
            Recent Applications
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.driveHistory.slice(0, 5).map((app) => (
              <div
                key={app.applicationId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius)',
                  flexWrap: 'wrap',
                  gap: '8px',
                  border:
                    app.overallStatus === 'selected'
                      ? '1px solid rgba(0,230,118,0.2)'
                      : '1px solid var(--border)',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>
                    {app.companyName}
                  </span>

                  {app.eliminatedAtRound && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        marginLeft: '8px',
                      }}
                    >
                      (Round {app.eliminatedAtRound})
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {app.feedbackPending && (
                    <button
                      onClick={() => navigate('/student/feedback')}
                      style={{
                        padding: '4px 10px',
                        background: 'rgba(255,107,53,0.1)',
                        border: '1px solid rgba(255,107,53,0.2)',
                        borderRadius: '6px',
                        color: 'var(--accent-orange)',
                        cursor: 'pointer',
                        fontSize: '11px',
                      }}
                    >
                      Give Feedback
                    </button>
                  )}

                  <Badge
                    variant={
                      app.overallStatus === 'selected'
                        ? 'success'
                        : app.overallStatus === 'rejected' ||
                          app.overallStatus === 'not_shortlisted'
                        ? 'danger'
                        : app.overallStatus === 'in_progress'
                        ? 'primary'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {STATUS_LABELS[app.overallStatus] || app.overallStatus}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}