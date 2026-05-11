import React, { useState, useEffect } from 'react';
import { Sidebar, Topbar, Spinner, EmptyState, Modal, StatusBadge, toast } from '../../components/shared';
import { studentAPI } from '../../services/api';
const DriveDetailModal = ({ drive, onClose, onApply }) => {
  const [applying, setApplying] = useState(false);
  const apply = async () => {
    setApplying(true);
    try {
      await onApply(drive._id);
      toast('Applied successfully!');
      onClose();
    } catch (ex) { toast(ex.response?.data?.message || 'Could not apply', 'danger'); }
    finally { setApplying(false); }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Meta badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <StatusBadge status={drive.status} />
        {drive.maxPackage && <span className="badge badge-success">💰 {drive.minPackage}–{drive.maxPackage} LPA</span>}
        <span className="badge badge-info">🎓 CGPA ≥ {drive.cgpaCutOff}</span>
        <span className="badge badge-muted">Backlogs ≤ {drive.backlogsAllowed}</span>
      </div>
      {/* Description */}
      {drive.description && (
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '16px' }}>
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.9rem' }}>About the Drive</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>{drive.description}</p>
        </div>
      )}
      {/* Eligibility */}
      <div>
        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.9rem' }}>Eligibility</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(drive.eligibleBranches || []).map(b => (
            <span key={b} className="badge badge-brand">{b}</span>
          ))}
          {(drive.eligibleBatches || []).map(b => (
            <span key={b} className="badge badge-muted">{b}</span>
          ))}
        </div>
      </div>
      {/* Deadline */}
      {drive.registrationDeadline && (
        <div style={{ padding: '10px 14px', background: 'var(--warning-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--warning)', fontSize: '0.875rem', color: 'var(--warning)' }}>
          ⏰ Registration Deadline: {new Date(drive.registrationDeadline).toLocaleDateString()}
        </div>
      )}
      {/* Apply */}
      {drive.status === 'active' && (
        <div style={{ display: 'flex', gap: 10 }}>
          {drive.registrationLink && (
            <a href={drive.registrationLink} target="_blank" rel="noreferrer" className="btn btn-secondary">
              🔗 External Link
            </a>
          )}
          <button className="btn btn-primary" onClick={apply} disabled={applying} style={{ flex: 1 }}>
            {applying ? <><span className="spinner" /> Applying...</> : '→ Apply Now'}
          </button>
        </div>
      )}
    </div>
  );
};

const RoundStatusBadge = ({ status }) => {
  const map = {
    'NOT_SHORTLISTED': { color: 'var(--danger)', bg: 'var(--danger-bg)', label: 'Not Shortlisted Round 1' },
    'ROUND_1_ATTENDED': { color: 'var(--info)', bg: 'var(--info-bg)', label: 'Round 1 Attended' },
    'NOT_QUALIFIED': { color: 'var(--danger)', bg: 'var(--danger-bg)', label: 'Not Qualified' },
    'NOT_ATTENDED': { color: 'var(--warning)', bg: 'var(--warning-bg)', label: 'Not Attended' },
    'SELECTED': { color: 'var(--success)', bg: 'var(--success-bg)', label: '✓ SELECTED' },
  };
  const s = map[status] || { color: 'var(--text-muted)', bg: 'var(--bg-elevated)', label: status };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 'var(--radius-sm)', padding: '3px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
      {s.label}
    </span>
  );
};

export default function StudentOnCampus() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    studentAPI.getOnCampus()
      .then(r => setDrives(r.data.data || []))
      .catch(() => setDrives([]))
      .finally(() => setLoading(false));
  }, []);

  const active = drives.filter(d => d.visibility === 'active' || d.status === 'active');
  const past = drives.filter(d => d.visibility === 'past' || d.status !== 'active');
  const displayed = tab === 'active' ? active : past;
  return (
    <div className="app-layout">
      <Sidebar role="student" />
      <div className="main-content">
        <Topbar title="On-Campus Drives" />
        <div className="page-body">

          <div className="page-header">
            <div>
              <h1 className="page-title">On-Campus Drives</h1>
              <p className="page-subtitle">All drives you are eligible for</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className="badge badge-success">{active.length} Active</span>
              <span className="badge badge-muted">{past.length} Past</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: 20 }}>
            <button className={`tab-btn${tab === 'active' ? ' active' : ''}`} onClick={() => setTab('active')}>
              🔥Active Drives ({active.length})
            </button>
            <button className={`tab-btn${tab === 'past' ? ' active' : ''}`} onClick={() => setTab('past')}>
              📁 Past Drives ({past.length})
            </button>
          </div>
          {loading ? <Spinner text="Loading drives..." /> :
            displayed.length === 0 ? (
              <EmptyState
                icon={tab === 'active' ? '🔍' : '📁'}
                title={tab === 'active' ? 'No active drives' : 'No past drives'}
                msg={tab === 'active' ? 'Check back later for new on-campus opportunities.' : 'Your past drives will appear here.'}
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 16 }}>
                {displayed.map(drive => {
                  const isSelected = drive.applicationStatus === 'SELECTED';
                  return (
                    <div key={drive._id}
                      className={`drive-card${isSelected ? ' selected-green' : ''}`}
                      onClick={() => setSelected(drive)}>
                      {isSelected && (
                        <div style={{
                          position: 'absolute', top: 0, right: 0, background: 'var(--success)', color: '#fff',
                          padding: '4px 12px', borderRadius: '0 var(--radius-lg) 0 var(--radius)',
                          fontSize: '0.75rem', fontWeight: 700
                        }}>
                          ✓ SELECTED
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div className="drive-company">{drive.companyName}</div>
                        <StatusBadge status={drive.status} />
                      </div>
                      {drive.description && (
                        <p style={{
                          fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5,
                          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                        }}>
                          {drive.description}
                        </p>
                      )}
                      <div className="drive-meta">
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🎓 CGPA ≥ {drive.cgpaCutOff}</span>
                        {drive.maxPackage && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
                            💰 {drive.minPackage}–{drive.maxPackage} LPA
                          </span>
                        )}
                      </div>
                      {drive.applicationStatus && (
                        <div style={{ marginTop: 10 }}>
                          <RoundStatusBadge status={drive.applicationStatus} />
                        </div>
                      )}
                      {tab === 'past' && drive.roundRejectedAt && (
                        <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--danger)' }}>
                          ✕ Eliminated at {drive.roundRejectedAt}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button className="btn btn-primary btn-sm" style={{ flex: 1 }}
                          onClick={e => { e.stopPropagation(); setSelected(drive); }}>
                          View Details →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.companyName} size="lg">
        {selected && (
          <DriveDetailModal
            drive={selected}
            onClose={() => setSelected(null)}
            onApply={studentAPI.applyToDrive}
          />
        )}
      </Modal>
    </div>
  );
}