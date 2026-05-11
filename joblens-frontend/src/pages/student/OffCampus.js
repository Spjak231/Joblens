import React, { useEffect, useState } from 'react';
import { studentAPI } from '../../services/api';
import { Card, Badge, LoadingPage, EmptyState, Tabs } from '../../components/ui';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  internship: 'primary', hackathon: 'purple', job: 'success', other: 'default',
};
// Cybersecurity: Fake Job Detection heuristics
function analyzeJobSafety(drive) {
  const risks = [];
  const warnings = [];
  const url = drive.applyLink || '';
  const company = drive.companyName || '';
  // Check for suspicious URL patterns
  if (url && !url.startsWith('https://')) risks.push('Link is not HTTPS — data may not be encrypted');
  if (url && /bit\.ly|tinyurl|t\.co|goo\.gl/.test(url)) risks.push('Shortened URL detected — destination unknown');
  if (url && /apply-now|job-offer|urgent-hiring/.test(url.toLowerCase())) warnings.push('Suspicious keywords in URL');
  if (url && !/\.(com|org|in|io|net|edu|gov)/.test(url)) warnings.push('Unusual domain extension');
  // Check company name patterns
  const knownLegit = ['google','microsoft','amazon','tcs','infosys','wipro','deloitte','accenture','ibm','cognizant','zoho','flipkart'];
  const compLower = company.toLowerCase().replace(/\s/g, '');
  const isKnown = knownLegit.some(k => compLower.includes(k));
  if (!isKnown && company.length < 3) risks.push('Company name seems incomplete');
  if (/urgent|immediate|guaranteed|100k/.test(company.toLowerCase())) warnings.push('Urgency language in company name');
  // Check description
  const desc = (drive.description || '').toLowerCase();
  if (/no experience needed|work from home guaranteed|earn \$/.test(desc)) warnings.push('Too-good-to-be-true claims in description');
  if (desc.length < 20 && drive.driveCategory !== 'hackathon') warnings.push('Very short or missing description');
  const score = 100 - risks.length * 30 - warnings.length * 10;
  return {
    score: Math.max(0, Math.min(100, score)),
    risks,
    warnings,
    isKnown,
    verdict: score >= 80 ? 'SAFE' : score >= 50 ? 'CAUTION' : 'HIGH RISK',
    color: score >= 80 ? 'var(--accent-green)' : score >= 50 ? 'var(--accent-orange)' : 'var(--accent-red)',
  };
}
export default function OffCampusDrives() {
  const [drives, setDrives]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const fetchDrives = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 9 };
      if (category) params.category = category;
      const res = await studentAPI.getOffCampusFeed(params);
      setDrives(res.data.data.drives);
      setTotal(res.data.data.pagination.total);
      setPage(p);
    } catch { toast.error('Failed to load drives'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchDrives(1); }, [category]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800 }}>Off-Campus Opportunities</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Verified drives — {total} available for your batch & branch</p>
      </div>
      {/* Category Filter */}
      <Tabs
        tabs={[
          { value: '', label: '🌐 All' },
          { value: 'internship', label: '💼 Internships' },
          { value: 'hackathon', label: '⚡ Hackathons' },
          { value: 'job', label: '🏢 Jobs' },
          { value: 'other', label: '📌 Other' },
        ]}
        active={category}
        onChange={setCategory}
      />
      {loading ? <LoadingPage /> : drives.length === 0 ? (
        <EmptyState icon="🌐" title="No drives available" description="Check back later for new opportunities" />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {drives.map(drive => {
              const safety = analyzeJobSafety(drive);
              const isExpanded = expanded === drive._id;
              return (
                <Card key={drive._id} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                        {drive.companyName}
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{drive.driveName}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <Badge variant={CATEGORY_COLORS[drive.driveCategory]} size="sm">
                        {drive.driveCategory}
                      </Badge>
                      {/* Safety Badge */}
                      <span style={{
                        fontSize: '10px', padding: '2px 8px', borderRadius: '999px', fontWeight: 700,
                        color: safety.color, background: `${safety.color}15`, border: `1px solid ${safety.color}30`,
                      }}>
                        🛡 {safety.verdict}
                      </span>
                    </div>
                  </div>
                  {/* Safety Score */}
                  <div style={{ padding: '10px', background: 'var(--bg-elevated)', borderRadius: '8px', border: `1px solid ${safety.color}20` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Authenticity Score</span>
                      <span style={{ fontSize: '12px', color: safety.color, fontWeight: 700 }}>{safety.score}/100</span>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: '999px', height: '6px' }}>
                      <div style={{ width: `${safety.score}%`, height: '100%', background: safety.color, borderRadius: '999px', transition: 'width 0.5s' }} />
                    </div>
                    {(safety.risks.length > 0 || safety.warnings.length > 0) && (
                      <div style={{ marginTop: '8px' }}>
                        {safety.risks.map((r, i) => (
                          <div key={i} style={{ fontSize: '11px', color: 'var(--accent-red)', display: 'flex', gap: '4px' }}>
                            <span>⚠</span><span>{r}</span>
                          </div>
                        ))}
                        {safety.warnings.map((w, i) => (
                          <div key={i} style={{ fontSize: '11px', color: 'var(--accent-orange)', display: 'flex', gap: '4px' }}>
                            <span>ℹ</span><span>{w}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {safety.isKnown && (
                      <p style={{ fontSize: '11px', color: 'var(--accent-green)', marginTop: '6px' }}>✓ Recognized company name</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>🎓 {(drive.eligibleBatches||[]).join(', ')}</span>
                    {drive.lastDateToApply && (
                      <span style={{ fontSize: '12px', color: new Date(drive.lastDateToApply) < new Date() ? 'var(--accent-red)' : 'var(--accent-orange)' }}>
                        ⏰ {new Date(drive.lastDateToApply) < new Date() ? 'Deadline passed' : `Apply by ${new Date(drive.lastDateToApply).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>
                  {drive.appliedCount > 0 && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Applied: {drive.appliedCount}</span>
                      {drive.selectedCount > 0 && <span style={{ fontSize: '12px', color: 'var(--accent-green)' }}>Selected: {drive.selectedCount}</span>}
                    </div>
                  )}
                  {isExpanded && drive.description && (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{drive.description}</p>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button onClick={() => setExpanded(isExpanded ? null : drive._id)}
                      style={{ flex: 1, padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>
                      {isExpanded ? 'Less ↑' : 'Details ↓'}
                    </button>
                    <a
                      href={drive.applyLink}
                      target="_blank" rel="noreferrer"
                      style={{
                        flex: 2, padding: '8px', background: safety.verdict === 'HIGH RISK' ? 'rgba(255,71,87,0.1)' : 'var(--accent-primary)',
                        border: safety.verdict === 'HIGH RISK' ? '1px solid rgba(255,71,87,0.3)' : 'none',
                        borderRadius: '8px',
                        color: safety.verdict === 'HIGH RISK' ? 'var(--accent-red)' : 'var(--bg-primary)',
                        cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        textDecoration: 'none',
                      }}
                    >
                      {safety.verdict === 'HIGH RISK' ? '⚠ Apply with Caution' : 'Apply Now →'}
                    </a>
                  </div>
                </Card>
              );
            })}
          </div>
          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button disabled={page <= 1} onClick={() => fetchDrives(page - 1)}
              style={{ padding: '8px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
              ← Prev
            </button>
            <span style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>Page {page} · {total} total</span>
            <button disabled={page * 9 >= total} onClick={() => fetchDrives(page + 1)}
              style={{ padding: '8px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: page * 9 >= total ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page * 9 >= total ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}