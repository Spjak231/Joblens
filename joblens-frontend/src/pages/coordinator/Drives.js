import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { onCampusAPI, offCampusAPI } from '../../services/api';
import { Card, Badge, Button, Modal, Input, Select, Textarea, Tabs, Table, Tr, Td, EmptyState, LoadingPage, Spinner } from '../../components/ui';
import toast from 'react-hot-toast';

const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'DS'];
const BATCHES = [2026, 2027, 2028, 2029];

function statusBadge(drive) {
  if (drive.isFrozen) return <Badge variant="default">🔒 Frozen</Badge>;
  if (drive.status === 'active') return <Badge variant="primary">● Active</Badge>;
  return <Badge variant="default">{drive.status}</Badge>;
}
export default function CoordinatorDrives() {
  const [tab, setTab] = useState('oncampus');
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const batchFilter = params.get('batch') || '';

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const res = tab === 'oncampus'
        ? await onCampusAPI.getAll({ batch: batchFilter, limit: 50 })
        : await offCampusAPI.getAll({ batch: batchFilter, limit: 50 });
      setDrives(res.data.data.drives || []);
    } catch { toast.error('Failed to fetch drives'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDrives(); }, [tab, batchFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800 }}>Drive Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            {batchFilter ? `Batch ${batchFilter}` : 'All Batches'}
          </p>
        </div>
        <Button
          onClick={() => { setSelected(null); setShowForm(true); }}
          style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)', padding: '10px 20px', borderRadius: 'var(--radius)', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          + New Drive
        </Button>
      </div>

      <Tabs
        tabs={[{ value: 'oncampus', label: '🏢 On-Campus' }, { value: 'offcampus', label: '🌐 Off-Campus' }]}
        active={tab}
        onChange={setTab}
      />

      {loading ? <LoadingPage /> : (
        drives.length === 0 ? (
          <EmptyState icon="🏢" title="No drives yet" description="Create the first drive for students" action={<Button onClick={() => setShowForm(true)} style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)', padding: '10px 20px', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 600 }}>+ Create Drive</Button>} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {drives.map(drive => (
              <DriveCard
                key={drive._id}
                drive={drive}
                type={tab}
                onEdit={() => { setSelected(drive); setShowForm(true); }}
                onView={() => navigate(`/coordinator/drives/${drive._id}`)}
                onRefresh={fetchDrives}
              />
            ))}
          </div>
        )
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={selected ? `Edit — ${selected.companyName}` : `New ${tab === 'oncampus' ? 'On-Campus' : 'Off-Campus'} Drive`}
        width="680px"
      >
        {tab === 'oncampus'
          ? <OnCampusForm drive={selected} onSuccess={() => { setShowForm(false); fetchDrives(); }} />
          : <OffCampusForm drive={selected} onSuccess={() => { setShowForm(false); fetchDrives(); }} />
        }
      </Modal>
    </div>
  );
}

function DriveCard({ drive, type, onEdit, onView, onRefresh }) {
  const navigate = useNavigate();
  return (
    <Card style={{ transition: 'var(--transition)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>{drive.companyName}</h3>
            {statusBadge(drive)}
            {drive.isFrozen && drive.selectionRatio && (
              <Badge variant="success">Selected: {drive.selectionRatio}</Badge>
            )}
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {drive.minPackage && <span style={{ fontSize: '12px', color: 'var(--accent-green)' }}>💰 {drive.minPackage}–{drive.maxPackage} LPA</span>}
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>🎓 Batch: {(drive.eligibleBatches || []).join(', ')}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>🌿 CGPA ≥ {drive.cgpaCutOff}</span>
            {drive.rounds?.length > 0 && <span style={{ fontSize: '12px', color: 'var(--accent-primary)' }}>🔄 {drive.rounds.length} Round(s)</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={onView} style={{ padding: '8px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>
            View Details
          </button>
          {!drive.isFrozen && (
            <button onClick={onEdit} style={{ padding: '8px 14px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '8px', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '12px' }}>
              Edit
            </button>
          )}
          {type === 'oncampus' && !drive.isFrozen && (
            <button
              onClick={() => navigate(`/coordinator/rounds?driveId=${drive._id}&company=${drive.companyName}`)}
              style={{ padding: '8px 14px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '8px', color: '#a78bfa', cursor: 'pointer', fontSize: '12px' }}
            >
              + Round
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

function OnCampusForm({ drive, onSuccess }) {
  const [form, setForm] = useState({
    companyName: drive?.companyName || '',
    eligibleBatches: drive?.eligibleBatches?.join(',') || '',
    eligibleBranches: drive?.eligibleBranches || [],
    cgpaCutOff: drive?.cgpaCutOff || '',
    backlogsAllowed: drive?.backlogsAllowed ?? 0,
    description: drive?.description || '',
    minPackage: drive?.minPackage || '',
    maxPackage: drive?.maxPackage || '',
    registrationDeadline: drive?.registrationDeadline ? drive.registrationDeadline.split('T')[0] : '',
    registrationLink: drive?.registrationLink || '',
    status: drive?.status || 'active',
  });
  const [loading, setLoading] = useState(false);
  const [docFile, setDocFile] = useState(null);

  const toggleBranch = (b) => {
    setForm(f => ({
      ...f,
      eligibleBranches: f.eligibleBranches.includes(b)
        ? f.eligibleBranches.filter(x => x !== b)
        : [...f.eligibleBranches, b],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.companyName || !form.eligibleBatches || !form.eligibleBranches.length || form.cgpaCutOff === '') {
      return toast.error('Please fill required fields');
    }
    setLoading(true);
    try {
      const fd = new FormData();
      const batches = form.eligibleBatches.split(',').map(b => Number(b.trim())).filter(Boolean);
      Object.entries({ ...form, eligibleBatches: JSON.stringify(batches), eligibleBranches: JSON.stringify(form.eligibleBranches) }).forEach(([k, v]) => fd.append(k, v));
      if (docFile) fd.append('document', docFile);

      if (drive) {
        await onCampusAPI.update(drive._id, fd);
        toast.success('Drive updated!');
      } else {
        await onCampusAPI.create(fd);
        toast.success('Drive created!');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const inputStyle = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', padding: '10px 14px', fontSize: '14px' };
  const labelStyle = { display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Company Name *</label>
          <input style={inputStyle} value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="e.g. TCS" />
        </div>
        <div>
          <label style={labelStyle}>Eligible Batches * (comma separated)</label>
          <input style={inputStyle} value={form.eligibleBatches} onChange={e => setForm({ ...form, eligibleBatches: e.target.value })} placeholder="2026, 2027" />
        </div>
        <div>
          <label style={labelStyle}>CGPA Cut-off *</label>
          <input type="number" step="0.1" min="0" max="10" style={inputStyle} value={form.cgpaCutOff} onChange={e => setForm({ ...form, cgpaCutOff: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Backlogs Allowed</label>
          <input type="number" min="0" style={inputStyle} value={form.backlogsAllowed} onChange={e => setForm({ ...form, backlogsAllowed: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Min Package (LPA)</label>
          <input type="number" style={inputStyle} value={form.minPackage} onChange={e => setForm({ ...form, minPackage: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Max Package (LPA)</label>
          <input type="number" style={inputStyle} value={form.maxPackage} onChange={e => setForm({ ...form, maxPackage: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Registration Deadline</label>
          <input type="date" style={inputStyle} value={form.registrationDeadline} onChange={e => setForm({ ...form, registrationDeadline: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Eligible Branches *</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {BRANCHES.map(b => (
            <button
              key={b} type="button"
              onClick={() => toggleBranch(b)}
              style={{
                padding: '6px 14px', borderRadius: '999px', fontSize: '12px', cursor: 'pointer',
                background: form.eligibleBranches.includes(b) ? 'rgba(0,212,255,0.15)' : 'var(--bg-elevated)',
                border: `1px solid ${form.eligibleBranches.includes(b) ? 'rgba(0,212,255,0.4)' : 'var(--border)'}`,
                color: form.eligibleBranches.includes(b) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                transition: 'var(--transition)',
              }}
            >{b}</button>
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Registration Link</label>
        <input style={inputStyle} value={form.registrationLink} onChange={e => setForm({ ...form, registrationLink: e.target.value })} placeholder="https://company.com/apply" />
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>

      <div>
        <label style={labelStyle}>Upload PDF/Doc (optional)</label>
        <input type="file" accept=".pdf,.doc,.docx" onChange={e => setDocFile(e.target.files[0])}
          style={{ ...inputStyle, padding: '8px' }} />
      </div>

      <button type="submit" disabled={loading}
        style={{ padding: '13px', background: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        {loading && <Spinner size={16} color="var(--bg-primary)" />}
        {drive ? 'Update Drive' : 'Create Drive'}
      </button>
    </form>
  );
}
function OffCampusForm({ drive, onSuccess }) {
  const [form, setForm] = useState({
    companyName: drive?.companyName || '',
    driveName: drive?.driveName || '',
    driveCategory: drive?.driveCategory || 'internship',
    eligibleBatches: drive?.eligibleBatches?.join(',') || '',
    eligibleBranches: drive?.eligibleBranches || [],
    description: drive?.description || '',
    applyLink: drive?.applyLink || '',
    lastDateToApply: drive?.lastDateToApply ? drive.lastDateToApply.split('T')[0] : '',
    appliedCount: drive?.appliedCount || 0,
    selectedCount: drive?.selectedCount || 0,
  });
  const [loading, setLoading] = useState(false);

  const toggleBranch = (b) => setForm(f => ({
    ...f,
    eligibleBranches: f.eligibleBranches.includes(b) ? f.eligibleBranches.filter(x => x !== b) : [...f.eligibleBranches, b],
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const batches = form.eligibleBatches.split(',').map(b => Number(b.trim())).filter(Boolean);
      const payload = { ...form, eligibleBatches: JSON.stringify(batches), eligibleBranches: JSON.stringify(form.eligibleBranches) };
      if (drive) { await offCampusAPI.update(drive._id, payload); toast.success('Updated!'); }
      else { await offCampusAPI.create(payload); toast.success('Created!'); }
      onSuccess();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const inputStyle = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', padding: '10px 14px', fontSize: '14px' };
  const labelStyle = { display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div><label style={labelStyle}>Company Name *</label><input style={inputStyle} value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} /></div>
        <div><label style={labelStyle}>Drive Name *</label><input style={inputStyle} value={form.driveName} onChange={e => setForm({ ...form, driveName: e.target.value })} /></div>
        <div>
          <label style={labelStyle}>Category *</label>
          <select style={inputStyle} value={form.driveCategory} onChange={e => setForm({ ...form, driveCategory: e.target.value })}>
            <option value="internship">Internship</option>
            <option value="hackathon">Hackathon</option>
            <option value="job">Job</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div><label style={labelStyle}>Eligible Batches *</label><input style={inputStyle} value={form.eligibleBatches} onChange={e => setForm({ ...form, eligibleBatches: e.target.value })} placeholder="2026, 2027" /></div>
        <div><label style={labelStyle}>Apply Link *</label><input style={inputStyle} value={form.applyLink} onChange={e => setForm({ ...form, applyLink: e.target.value })} /></div>
        <div><label style={labelStyle}>Last Date to Apply</label><input type="date" style={inputStyle} value={form.lastDateToApply} onChange={e => setForm({ ...form, lastDateToApply: e.target.value })} /></div>
        <div><label style={labelStyle}>Applied Count</label><input type="number" style={inputStyle} value={form.appliedCount} onChange={e => setForm({ ...form, appliedCount: e.target.value })} /></div>
        <div><label style={labelStyle}>Selected Count</label><input type="number" style={inputStyle} value={form.selectedCount} onChange={e => setForm({ ...form, selectedCount: e.target.value })} /></div>
      </div>
      <div>
        <label style={labelStyle}>Eligible Branches</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {BRANCHES.map(b => (
            <button key={b} type="button" onClick={() => toggleBranch(b)}
              style={{ padding: '5px 12px', borderRadius: '999px', fontSize: '12px', cursor: 'pointer', background: form.eligibleBranches.includes(b) ? 'rgba(0,212,255,0.15)' : 'var(--bg-elevated)', border: `1px solid ${form.eligibleBranches.includes(b) ? 'rgba(0,212,255,0.4)' : 'var(--border)'}`, color: form.eligibleBranches.includes(b) ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
            >{b}</button>
          ))}
        </div>
      </div>
      <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      <button type="submit" disabled={loading}
        style={{ padding: '13px', background: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
        {loading ? 'Saving...' : drive ? 'Update Drive' : 'Create Drive'}
      </button>
    </form>
  );
}
