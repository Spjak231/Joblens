import React, { useEffect, useState } from 'react';
import { coordinatorAPI } from '../../services/api';
import { Card, Badge, Table, Tr, Td, LoadingPage, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';
const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'DS'];
const BATCHES = [2026, 2027, 2028, 2029];
// ── Notify Page ──────
export function NotifyPage() {
  const [form, setForm] = useState({ subject: '', message: '', batch: '', branch: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(null);
  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.message) return toast.error('Subject and message are required');
    setLoading(true);
    try {
      const res = await coordinatorAPI.sendNotification(form);
      setSent(res.data.data.recipientCount);
      toast.success(`Email dispatched to ${res.data.data.recipientCount} students!`);
      setForm({ subject: '', message: '', batch: '', branch: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally { setLoading(false); }
  };
  const inputStyle = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', padding: '10px 14px', fontSize: '14px' };
  const labelStyle = { display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800 }}>Send Notification</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Broadcast email to filtered students</p>
      </div>
      {sent && (
        <div style={{ padding: '16px', background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: 'var(--radius)', color: 'var(--accent-green)' }}>
          ✅ Notification sent to <strong>{sent}</strong> students
        </div>
      )}
      <Card>
        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Audience Filter */}
          <div>
            <p style={{ ...labelStyle, marginBottom: '12px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>Target Audience</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={labelStyle}>Batch</label>
                <select style={inputStyle} value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })}>
                  <option value="">All Batches</option>
                  {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={labelStyle}>Branch</label>
                <select style={inputStyle} value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })}>
                  <option value="">All Branches</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Leave blank to send to all students
            </p>
          </div>

          <div>
            <label style={labelStyle}>Email Subject *</label>
            <input style={inputStyle} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. TCS Drive — Registration Open" />
          </div>

          <div>
            <label style={labelStyle}>Message *</label>
            <textarea
              style={{ ...inputStyle, minHeight: '180px', resize: 'vertical' }}
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              placeholder="Write your notification message here..."
            />
          </div>

          <button type="submit" disabled={loading}
            style={{ padding: '13px', background: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? '📧 Sending...' : '📢 Send Notification'}
          </button>
        </form>
      </Card>
    </div>
  );
}
// ── Audit Logs Page ───────
export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');

  const ACTION_COLORS = {
    DRIVE_CREATED: 'primary',
    DRIVE_UPDATED: 'warning',
    DRIVE_DELETED: 'danger',
    ROUND_CREATED: 'purple',
    ROUND_UPDATED: 'warning',
    ELIGIBLE_LIST_UPLOADED: 'primary',
    ATTENDED_LIST_UPLOADED: 'warning',
    RESULTS_PUBLISHED: 'success',
    NOTIFICATION_SENT: 'default',
  };

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (actionFilter) params.action = actionFilter;
      const res = await coordinatorAPI.getAuditLogs(params);
      setLogs(res.data.data.logs);
      setTotal(res.data.data.pagination.total);
      setPage(p);
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchLogs(1); }, [actionFilter]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800 }}>Audit Logs</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>All coordinator actions — {total} entries</p>
        </div>
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', padding: '8px 14px', fontSize: '13px' }}
        >
          <option value="">All Actions</option>
          {Object.keys(ACTION_COLORS).map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <LoadingPage text="Loading logs..." /> : logs.length === 0 ? (
          <EmptyState icon="📋" title="No audit logs" description="Actions will appear here" />
        ) : (
          <>
            <Table headers={['Action', 'Entity', 'Details', 'By', 'Time']}>
              {logs.map(log => (
                <Tr key={log._id}>
                  <Td><Badge variant={ACTION_COLORS[log.action] || 'default'} size="sm">{log.action}</Badge></Td>
                  <Td><span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{log.entity}</span></Td>
                  <Td>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {log.details ? Object.entries(log.details).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' · ') : '—'}
                    </span>
                  </Td>
                  <Td><span style={{ fontSize: '12px' }}>{log.user?.email || '—'}</span></Td>
                  <Td>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </Td>
                </Tr>
              ))}
            </Table>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', padding: '16px', borderTop: '1px solid var(--border)' }}>
              <button disabled={page <= 1} onClick={() => fetchLogs(page - 1)}
                style={{ padding: '6px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
                ← Prev
              </button>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', alignSelf: 'center' }}>Page {page} · {total} total</span>
              <button disabled={page * 20 >= total} onClick={() => fetchLogs(page + 1)}
                style={{ padding: '6px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: page * 20 >= total ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page * 20 >= total ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
                Next →
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}