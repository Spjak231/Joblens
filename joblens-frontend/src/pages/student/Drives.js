import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI, feedbackAPI } from '../../services/api';
import { Card, Badge, Modal, Tabs, LoadingPage, EmptyState, Alert } from '../../components/ui';
import toast from 'react-hot-toast';
const STATUS_META = {
  registered:      { label: 'Registered', variant: 'warning',  icon: '📝' },
  shortlisted:     { label: 'Shortlisted for Round 1', variant: 'primary', icon: '⭐' },
  in_progress:     { label: 'In Progress', variant: 'primary', icon: '⚡' },
  selected:        { label: 'SELECTED 🎉', variant: 'success', icon: '🏆' },
  rejected:        { label: 'Not Qualified', variant: 'danger', icon: '❌' },
  not_shortlisted: { label: 'Not Shortlisted', variant: 'danger', icon: '❌' },
};
export default function StudentDrives() {
  const [tab, setTab]           = useState('active');
  const [drives, setDrives]     = useState({ activeDrives: [], pastDrives: [] });
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null); // drive for detail modal
  const [feedbackDrive, setFeedbackDrive] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    studentAPI.getOnCampusDrives()
      .then(res => setDrives(res.data.data))
      .catch(() => toast.error('Failed to load drives'))
      .finally(() => setLoading(false));
  }, []);
  const handleApply = async (driveId, companyName) => {
    try {
      await studentAPI.applyToDrive(driveId);
      toast.success(`Successfully applied to ${companyName}!`);
      // Refresh
      const res = await studentAPI.getOnCampusDrives();
      setDrives(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application failed');
    }
  };
  const currentList = tab === 'active' ? drives.activeDrives : drives.pastDrives;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800 }}>On-Campus Drives</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            {drives.activeDrives.length} active · {drives.pastDrives.length} past
          </p>
        </div>
        <button
          onClick={() => navigate('/student/feedback?tab=browse')}
          style={{ padding: '9px 18px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 'var(--radius)', color: '#a78bfa', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
        >
          💬 View Company Feedback
        </button>
      </div>
      <Tabs
        tabs={[
          { value: 'active', label: `🟢 Active Drives (${drives.activeDrives.length})` },
          { value: 'past',   label: `📁 Past Drives (${drives.pastDrives.length})` },
        ]}
        active={tab}
        onChange={setTab}
      />
      {loading ? <LoadingPage /> : currentList.length === 0 ? (
        <EmptyState
          icon={tab === 'active' ? '🏢' : '📁'}
          title={tab === 'active' ? 'No active drives' : 'No past drives'}
          description={tab === 'active' ? 'New drives will appear here when posted' : 'Completed drives will show here'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {currentList.map(drive => (
            <DriveCard
              key={drive._id}
              drive={drive}
              isPast={tab === 'past'}
              onView={() => setSelected(drive)}
              onApply={() => handleApply(drive._id, drive.companyName)}
              onFeedback={() => setFeedbackDrive(drive)}
            />
          ))}
        </div>
      )}
      {/* Drive Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.companyName || 'Drive Details'} width="640px">
        {selected && <DriveDetail drive={selected} onClose={() => setSelected(null)} />}
      </Modal>
      {/* Feedback Modal */}
      <Modal open={!!feedbackDrive} onClose={() => setFeedbackDrive(null)} title={`Feedback — ${feedbackDrive?.companyName}`} width="600px">
        {feedbackDrive && (
          <FeedbackForm
            drive={feedbackDrive}
            onSuccess={() => { setFeedbackDrive(null); toast.success('Feedback submitted anonymously!'); }}
          />
        )}
      </Modal>
    </div>
  );
}
function DriveCard({ drive, isPast, onView, onApply, onFeedback }) {
  const meta = STATUS_META[drive.overallStatus] || {};
  const isSelected = drive.overallStatus === 'selected';
  return (
    <Card style={{
      border: isSelected ? '1px solid rgba(0,230,118,0.3)' : '1px solid var(--border)',
      background: isSelected ? 'rgba(0,230,118,0.03)' : 'var(--bg-card)',
      transition: 'var(--transition)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>
              {isSelected && '🏆 '}{drive.companyName}
            </h3>
            {drive.overallStatus && (
              <Badge variant={meta.variant || 'default'} size="sm">
                {meta.icon} {meta.label}
              </Badge>
            )}
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {drive.minPackage && <span style={{ fontSize: '12px', color: 'var(--accent-green)' }}>💰 {drive.minPackage}–{drive.maxPackage} LPA</span>}
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>🎓 CGPA ≥ {drive.cgpaCutOff}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>📋 Max Backlogs: {drive.backlogsAllowed}</span>
            {drive.registrationDeadline && (
              <span style={{ fontSize: '12px', color: 'var(--accent-orange)' }}>
                ⏰ Deadline: {new Date(drive.registrationDeadline).toLocaleDateString()}
              </span>
            )}
          </div>
          {/* Round Statuses */}
          {drive.roundStatuses?.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {drive.roundStatuses.map((rs, i) => (
                <span key={i} style={{
                  fontSize: '11px', padding: '3px 10px', borderRadius: '999px',
                  background: rs.status === 'qualified' ? 'rgba(0,230,118,0.1)' : rs.status === 'not_qualified' || rs.status === 'not_attended' ? 'rgba(255,71,87,0.1)' : 'rgba(0,212,255,0.1)',
                  color: rs.status === 'qualified' ? 'var(--accent-green)' : rs.status === 'not_qualified' || rs.status === 'not_attended' ? 'var(--accent-red)' : 'var(--accent-primary)',
                  border: '1px solid currentColor',
                }}>
                  R{rs.roundNumber}: {rs.status.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
          {/* Visibility Reason */}
          {isPast && drive.visibilityReason && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              i {drive.visibilityReason}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', alignItems: 'flex-end' }}>
          <button onClick={onView}
            style={{ padding: '8px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>
            View Details
          </button>
          {!isPast && !drive.overallStatus && (
            <button onClick={onApply}
              style={{ padding: '8px 16px', background: 'var(--accent-primary)', border: 'none', borderRadius: '8px', color: 'var(--bg-primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
              Apply Now
            </button>
          )}
          {isPast && drive.feedbackPending && (
            <button onClick={onFeedback}
              style={{ padding: '8px 16px', background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: '8px', color: 'var(--accent-orange)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
              Give Feedback
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
function DriveDetail({ drive, onClose }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[
          ['Company', drive.companyName],
          ['Package', drive.minPackage ? `${drive.minPackage}–${drive.maxPackage} LPA` : 'N/A'],
          ['CGPA Cut-off', drive.cgpaCutOff],
          ['Backlogs Allowed', drive.backlogsAllowed],
          ['Eligible Batches', (drive.eligibleBatches||[]).join(', ')],
          ['Eligible Branches', (drive.eligibleBranches||[]).join(', ')],
          ['Status', drive.status],
          ['Registration Link', drive.registrationLink || 'N/A'],
        ].map(([label, value]) => (
          <div key={label} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '10px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</p>
            <p style={{ fontSize: '13px', fontWeight: 500 }}>{value}</p>
          </div>
        ))}
      </div>
      {drive.description && (
        <div>
          <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Description</h4>
          <p style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-primary)' }}>{drive.description}</p>
        </div>
      )}
      {drive.rounds?.length > 0 && (
        <div>
          <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>Rounds</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {drive.rounds.map((r, i) => (
              <div key={i} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '10px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                  {r.roundNumber}
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>{r.roundName}</p>
                  {r.venue && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📍 {r.venue}</p>}
                  {r.date && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📅 {new Date(r.date).toLocaleDateString()}</p>}
                  {r.description && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{r.description}</p>}
                  {r.eligibleList?.uploadedAt && (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Eligible list uploaded: {new Date(r.eligibleList.uploadedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
function FeedbackForm({ drive, onSuccess }) {
  const [form, setForm] = useState({
    role: '', outcome: '',
    rounds: [{ roundName: '', description: '', challenges: '' }],
  });
  const [loading, setLoading] = useState(false);

  const addRound = () => setForm(f => ({ ...f, rounds: [...f.rounds, { roundName: '', description: '', challenges: '' }] }));
  const removeRound = (i) => setForm(f => ({ ...f, rounds: f.rounds.filter((_, idx) => idx !== i) }));
  const updateRound = (i, field, value) => setForm(f => {
    const rounds = [...f.rounds];
    rounds[i] = { ...rounds[i], [field]: value };
    return { ...f, rounds };
  });
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await feedbackAPI.submit({
        driveId: drive._id,
        driveType: 'on-campus',
        companyName: drive.companyName,
        role: form.role,
        outcome: form.outcome,
        rounds: form.rounds,
      });
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setLoading(false); }
  };
  const inputStyle = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', padding: '9px 12px', fontSize: '13px' };
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Alert type="info">Your feedback is completely anonymous — your identity is never stored.</Alert>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Role Applied For</label>
          <input style={inputStyle} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Systems Engineer" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Outcome</label>
          <select style={inputStyle} value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })}>
            <option value="">Select</option>
            <option value="selected">Selected</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      {form.rounds.map((round, i) => (
        <div key={i} style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-primary)' }}>Round {i + 1}</span>
            {i > 0 && (
              <button type="button" onClick={() => removeRound(i)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '12px' }}>✕ Remove</button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input style={inputStyle} placeholder="Round Name" value={round.roundName} onChange={e => updateRound(i, 'roundName', e.target.value)} />
            <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} placeholder="What happened in this round?" value={round.description} onChange={e => updateRound(i, 'description', e.target.value)} />
            <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} placeholder="Challenges faced?" value={round.challenges} onChange={e => updateRound(i, 'challenges', e.target.value)} />
          </div>
        </div>
      ))}
      <button type="button" onClick={addRound}
        style={{ padding: '8px', background: 'var(--bg-elevated)', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>
        + Add Round
      </button>
      <button type="submit" disabled={loading}
        style={{ padding: '12px', background: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 'var(--radius)', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
        {loading ? 'Submitting...' : 'Submit Anonymous Feedback'}
      </button>
    </form>
  );
}