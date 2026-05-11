import React, { useState } from 'react';
import { studentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Tabs, Alert, Spinner } from '../../components/ui';
import toast from 'react-hot-toast';
export default function StudentProfile() {
  const { profile, refreshProfile } = useAuth();
  const [tab, setTab] = useState('personal');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const startEdit = () => {
    setForm({
      personalEmail: profile?.personalEmail || '',
      contact: profile?.contact || '',
      address: profile?.address || '',
      profileSummary: profile?.profileSummary || '',
      skills: (profile?.skills || []).join(', '),
      certifications: (profile?.certifications || []).join('\n'),
      academicAchievements: (profile?.academicAchievements || []).join('\n'),
      codingProfiles: {
        github: profile?.codingProfiles?.github || '',
        leetcode: profile?.codingProfiles?.leetcode || '',
        hackerrank: profile?.codingProfiles?.hackerrank || '',
      },
      education: {
        btech: {
          institutionName: profile?.education?.btech?.institutionName || '',
          cgpa: profile?.education?.btech?.cgpa || '',
          percentage: profile?.education?.btech?.percentage || '',
          yearOfCompletion: profile?.education?.btech?.yearOfCompletion || '',
        },
        intermediate: {
          institutionName: profile?.education?.intermediate?.institutionName || '',
          percentage: profile?.education?.intermediate?.percentage || '',
          yearOfCompletion: profile?.education?.intermediate?.yearOfCompletion || '',
        },
        secondary: {
          institutionName: profile?.education?.secondary?.institutionName || '',
          percentage: profile?.education?.secondary?.percentage || '',
          yearOfCompletion: profile?.education?.secondary?.yearOfCompletion || '',
        },
      },
    });
    setEditing(true);
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        certifications: form.certifications.split('\n').map(s => s.trim()).filter(Boolean),
        academicAchievements: form.academicAchievements.split('\n').map(s => s.trim()).filter(Boolean),
      };
      await studentAPI.updateProfile(payload);
      await refreshProfile();
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };
  const handleResumeUpload = async () => {
    if (!resumeFile) return toast.error('Select a PDF file first');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('resume', resumeFile);
      await studentAPI.uploadResume(fd);
      await refreshProfile();
      setResumeFile(null);
      toast.success('Resume uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };
  if (!profile) return <div style={{ color: 'var(--text-secondary)' }}>Loading profile...</div>;
  const inputStyle = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', padding: '9px 12px', fontSize: '13px' };
  const labelStyle = { display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const fieldVal = (label, value) => (
    <div>
      <p style={labelStyle}>{label}</p>
      <p style={{ fontSize: '14px', color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>{value || '—'}</p>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-primary), #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', fontWeight: 800, color: 'var(--bg-primary)',
            fontFamily: 'var(--font-display)',
          }}>
            {profile.name?.charAt(0)}
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800 }}>{profile.name}</h1>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
              <Badge variant="primary" size="sm">{profile.branch}</Badge>
              <Badge variant="default" size="sm">Batch {profile.passedOutYear}</Badge>
              <Badge variant={profile.cgpa >= 8 ? 'success' : 'warning'} size="sm">CGPA {profile.cgpa}</Badge>
              {profile.activeBacklogs > 0 && <Badge variant="danger" size="sm">{profile.activeBacklogs} Backlog(s)</Badge>}
            </div>
          </div>
        </div>
        {editing ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setEditing(false)} style={{ padding: '9px 18px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '9px 18px', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius)', color: 'var(--bg-primary)', cursor: 'pointer', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {saving && <Spinner size={14} color="var(--bg-primary)" />}
              Save Changes
            </button>
          </div>
        ) : (
          <button onClick={startEdit} style={{ padding: '9px 18px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 'var(--radius)', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
            ✏ Edit Profile
          </button>
        )}
      </div>
      {/* Resume Section */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', marginBottom: '4px' }}>📄 Resume</h3>
            {profile.resume?.url ? (
              <p style={{ fontSize: '13px', color: 'var(--accent-green)' }}>
                ✓ Uploaded on {new Date(profile.resume.uploadedAt).toLocaleDateString()}
              </p>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--accent-red)' }}>⚠ No resume uploaded — required to apply for drives</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {profile.resume?.url && (
              <a href={profile.resume.url} target="_blank" rel="noreferrer"
                style={{ padding: '8px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>
                View Resume
              </a>
            )}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="file" accept=".pdf" id="resume-upload" style={{ display: 'none' }} onChange={e => setResumeFile(e.target.files[0])} />
              <label htmlFor="resume-upload" style={{ padding: '8px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>
                {resumeFile ? resumeFile.name.substring(0, 20) + '...' : 'Choose PDF'}
              </label>
              <button onClick={handleResumeUpload} disabled={!resumeFile || uploading}
                style={{ padding: '8px 16px', background: 'var(--accent-primary)', border: 'none', borderRadius: '8px', color: 'var(--bg-primary)', cursor: resumeFile ? 'pointer' : 'not-allowed', opacity: !resumeFile || uploading ? 0.6 : 1, fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {uploading && <Spinner size={12} color="var(--bg-primary)" />}
                Upload
              </button>
            </div>
          </div>
        </div>
      </Card>
      {/* Tabs */}
      <Tabs
        tabs={[
          { value: 'personal', label: '👤 Personal' },
          { value: 'education', label: '🎓 Education' },
          { value: 'professional', label: '💼 Professional' },
          { value: 'coding', label: '💻 Coding' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {/* Personal Tab */}
      {tab === 'personal' && (
        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', marginBottom: '20px' }}>Personal Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {fieldVal('Roll Number', profile.rollNumber)}
            {fieldVal('College Email', profile.collegeEmail)}
            {fieldVal('Branch', profile.branch)}
            {fieldVal('Batch', profile.passedOutYear)}
            {editing ? (
              <>
                <div><label style={labelStyle}>Personal Email</label><input style={inputStyle} value={form.personalEmail} onChange={e => setForm({ ...form, personalEmail: e.target.value })} /></div>
                <div><label style={labelStyle}>Contact</label><input style={inputStyle} value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} /></div>
                <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Address</label><textarea style={{ ...inputStyle, minHeight: '70px' }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Profile Summary</label><textarea style={{ ...inputStyle, minHeight: '100px' }} value={form.profileSummary} onChange={e => setForm({ ...form, profileSummary: e.target.value })} /></div>
              </>
            ) : (
              <>
                {fieldVal('Personal Email', profile.personalEmail)}
                {fieldVal('Contact', profile.contact)}
                {profile.address && <div style={{ gridColumn: '1 / -1' }}>{fieldVal('Address', profile.address)}</div>}
                {profile.profileSummary && <div style={{ gridColumn: '1 / -1' }}>{fieldVal('Profile Summary', profile.profileSummary)}</div>}
              </>
            )}
          </div>
        </Card>
      )}
      {/* Education Tab */}
      {tab === 'education' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { key: 'btech', label: '🎓 B.Tech', showCgpa: true },
            { key: 'intermediate', label: '📚 Intermediate / Diploma', showCgpa: false },
            { key: 'secondary', label: '🏫 Secondary Education (10th)', showCgpa: false },
          ].map(({ key, label, showCgpa }) => (
            <Card key={key}>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', marginBottom: '16px' }}>{label}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                {editing ? (
                  <>
                    <div><label style={labelStyle}>Institution Name</label><input style={inputStyle} value={form.education[key].institutionName} onChange={e => setForm({ ...form, education: { ...form.education, [key]: { ...form.education[key], institutionName: e.target.value } } })} /></div>
                    <div><label style={labelStyle}>Percentage (%)</label><input type="number" style={inputStyle} value={form.education[key].percentage} onChange={e => setForm({ ...form, education: { ...form.education, [key]: { ...form.education[key], percentage: e.target.value } } })} /></div>
                    {showCgpa && <div><label style={labelStyle}>CGPA</label><input type="number" step="0.01" style={inputStyle} value={form.education[key].cgpa} onChange={e => setForm({ ...form, education: { ...form.education, [key]: { ...form.education[key], cgpa: e.target.value } } })} /></div>}
                    <div><label style={labelStyle}>Year of Completion</label><input type="number" style={inputStyle} value={form.education[key].yearOfCompletion} onChange={e => setForm({ ...form, education: { ...form.education, [key]: { ...form.education[key], yearOfCompletion: e.target.value } } })} /></div>
                  </>
                ) : (
                  <>
                    {fieldVal('Institution', profile.education?.[key]?.institutionName)}
                    {fieldVal('Percentage', profile.education?.[key]?.percentage ? `${profile.education[key].percentage}%` : null)}
                    {showCgpa && fieldVal('CGPA', profile.education?.[key]?.cgpa)}
                    {fieldVal('Year', profile.education?.[key]?.yearOfCompletion)}
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Professional Tab */}
      {tab === 'professional' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Card>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', marginBottom: '14px' }}>🛠 Skills</h4>
            {editing ? (
              <textarea style={{ ...inputStyle, minHeight: '80px' }} placeholder="Separate skills with commas" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} />
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(profile.skills || []).map(s => <Badge key={s} variant="primary" size="sm">{s}</Badge>)}
                {!profile.skills?.length && <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No skills added</span>}
              </div>
            )}
          </Card>
          <Card>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', marginBottom: '14px' }}>🏆 Certifications</h4>
            {editing ? (
              <textarea style={{ ...inputStyle, minHeight: '80px' }} placeholder="One certification per line" value={form.certifications} onChange={e => setForm({ ...form, certifications: e.target.value })} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(profile.certifications || []).map((c, i) => <div key={i} style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'flex', gap: '8px' }}><span style={{ color: 'var(--accent-green)' }}>✓</span>{c}</div>)}
                {!profile.certifications?.length && <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No certifications added</span>}
              </div>
            )}
          </Card>
          {profile.internships?.length > 0 && (
            <Card>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', marginBottom: '14px' }}>💼 Internships</h4>
              {profile.internships.map((intern, i) => (
                <div key={i} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '10px', marginBottom: '8px' }}>
                  <p style={{ fontWeight: 600, fontSize: '14px' }}>{intern.role} @ {intern.company}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{intern.duration}</p>
                  {intern.description && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>{intern.description}</p>}
                </div>
              ))}
            </Card>
          )}
          {profile.projects?.length > 0 && (
            <Card>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', marginBottom: '14px' }}>🚀 Projects</h4>
              {profile.projects.map((proj, i) => (
                <div key={i} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '10px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontWeight: 600, fontSize: '14px' }}>{proj.title}</p>
                    {proj.link && <a href={proj.link} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--accent-primary)' }}>View →</a>}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                    {(proj.techStack || []).map(t => <Badge key={t} variant="default" size="sm">{t}</Badge>)}
                  </div>
                  {proj.description && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>{proj.description}</p>}
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
      {/* Coding Tab */}
      {tab === 'coding' && (
        <Card>
          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', marginBottom: '16px' }}>💻 Coding Profiles</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { key: 'github', icon: '🐙', label: 'GitHub' },
              { key: 'leetcode', icon: '⚡', label: 'LeetCode' },
              { key: 'hackerrank', icon: '🎯', label: 'HackerRank' },
            ].map(({ key, icon, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px', width: '32px' }}>{icon}</span>
                {editing ? (
                  <input style={{ ...inputStyle, flex: 1 }} placeholder={`${label} profile URL`} value={form.codingProfiles[key]} onChange={e => setForm({ ...form, codingProfiles: { ...form.codingProfiles, [key]: e.target.value } })} />
                ) : (
                  profile.codingProfiles?.[key]
                    ? <a href={profile.codingProfiles[key]} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', fontSize: '13px' }}>{profile.codingProfiles[key]}</a>
                    : <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Not added</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}