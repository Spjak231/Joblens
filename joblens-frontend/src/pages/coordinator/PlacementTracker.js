import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Sidebar, Topbar, Spinner, EmptyState, StatusBadge } from '../../components/shared';
import { coordinatorAPI, onCampusAPI } from '../../services/api';
export default function PlacementTracker() {
  const [searchParams] = useSearchParams();
  const [batch, setBatch]     = useState(searchParams.get('batch') || '2026');
  const [stats, setStats]     = useState(null);
  const [drives, setDrives]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('oncampus');
  useEffect(() => {
    setLoading(true);
    Promise.all([
      coordinatorAPI.getPlacementStats(batch).catch(() => ({ data:{ data:{} } })),
      onCampusAPI.getAll({ batch }).catch(() => ({ data:{ data:[] } })),
    ]).then(([statsRes, drivesRes]) => {
      setStats(statsRes.data.data);
      setDrives(drivesRes.data.data || []);
    }).finally(() => setLoading(false));
  }, [batch]);
  const placedData = stats?.branchWise?.map(b => ({ name:b.branch, placed:b.placed, total:b.total })) || [];
  return (
    <div className="app-layout">
      <Sidebar role="coordinator" />
      <div className="main-content">
        <Topbar title="Placement Tracker" />
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">Placement Tracker</h1>
              <p className="page-subtitle">Detailed placement analytics per batch</p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {[2026,2027,2028,2029].map(b => (
                <button key={b} onClick={() => setBatch(String(b))}
                  className={`btn ${String(b)===batch?'btn-primary':'btn-secondary'} btn-sm`}>{b}</button>
              ))}
            </div>
          </div>
          {loading ? <Spinner text="Loading placement data..." /> : (
            <>
              {/* Summary stats */}
              <div className="grid-4" style={{ marginBottom:24 }}>
                {[
                  { icon:'👥', label:'Total Students',   value:stats?.total??0,    color:'var(--info-bg)',    ic:'var(--info)' },
                  { icon:'✅', label:'Placed',           value:stats?.placed??0,   color:'var(--success-bg)', ic:'var(--success)' },
                  { icon:'❌', label:'Unplaced',         value:stats?.unplaced??0, color:'var(--danger-bg)',  ic:'var(--danger)' },
                  { icon:'📊', label:'Placement %',      value:`${stats?.pct??0}%`, color:'var(--brand-bg)',   ic:'var(--brand)' },
                ].map(s => (
                  <div key={s.label} className="stat-card">
                    <div className="stat-card-icon" style={{ background:s.color, color:s.ic }}>{s.icon}</div>
                    <div>
                      <div className="stat-card-value">{s.value}</div>
                      <div className="stat-card-label">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Charts */}
              {placedData.length > 0 && (
                <div className="card" style={{ marginBottom:24 }}>
                  <h3 style={{ fontFamily:'var(--font-display)', marginBottom:16 }}>Branch-wise Placement ({batch})</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={placedData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fill:'var(--text-secondary)', fontSize:12 }} />
                      <YAxis tick={{ fill:'var(--text-secondary)', fontSize:12 }} />
                      <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8 }} />
                      <Bar dataKey="placed" fill="var(--success)" radius={[4,4,0,0]} name="Placed" />
                      <Bar dataKey="total"  fill="var(--bg-elevated)" radius={[4,4,0,0]} name="Total" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {/* Drives list */}
              <div className="card">
                <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                  {['oncampus','offcampus'].map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`tab-btn${tab===t?' active':''}`}>
                      {t==='oncampus'?'🏢 On-Campus':'🌐 Off-Campus'}
                    </button>
                  ))}
                </div>
                {tab === 'oncampus' && (
                  drives.length === 0 ? (
                    <EmptyState icon="🏢" title="No drives for this batch" />
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      {drives.map(d => (
                        <div key={d._id} style={{
                          padding:'16px', background:'var(--bg-elevated)',
                          borderRadius:'var(--radius)', border:'1px solid var(--border)',
                          display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12
                        }}>
                          <div>
                            <div style={{ fontWeight:700, fontFamily:'var(--font-display)' }}>{d.companyName}</div>
                            <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:2 }}>
                              Rounds: {d.rounds?.length || 0} · CGPA ≥ {d.cgpaCutOff}
                            </div>
                          </div>
                          <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                            {d.maxPackage && (
                              <span style={{ fontSize:'0.875rem', color:'var(--success)', fontWeight:700 }}>
                                💰 {d.minPackage}–{d.maxPackage} LPA
                              </span>
                            )}
                            {d.isFrozen && d.selectionRatio && (
                              <span className="badge badge-success">✓ {d.selectionRatio}</span>
                            )}
                            <StatusBadge status={d.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}+
                {tab === 'offcampus' && (
                  <EmptyState icon="🌐" title="Off-campus tracking" msg="Track off-campus drives in the Off-Campus section." />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}