import React, { useState, useRef, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Tabs, Spinner, ProgressBar, Alert } from '../../components/ui';
import toast from 'react-hot-toast';
export default function AITools() {
  const [tab, setTab] = useState('chatbot');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800 }}>
          🤖 AI Tools
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Powered by AI — Resume Match, Job Links, Drive Chatbot, Job Verifier
        </p>
      </div>
      <Tabs
        tabs={[
          { value: 'chatbot',     label: '💬 Drive Chatbot'  },
          { value: 'resume',      label: '📄 Resume Match'   },
          { value: 'joblinks',    label: '🔗 Job Search Links'},
          { value: 'jobverifier', label: '🛡️ Job Verifier'  },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'chatbot'     && <DriveChatbot />}
      {tab === 'resume'      && <ResumeMatch />}
      {tab === 'joblinks'    && <JobLinks />}
      {tab === 'jobverifier' && <JobVerifier />}
    </div>
  );
}
// Drive Chatbot
// Drive Chatbot
// Drive Chatbot
function DriveChatbot() {
  const { profile } = useAuth();

  const welcomeMsg = {
    role: 'assistant',
    content: `Hi ${profile?.name?.split(' ')[0] || 'there'}! 👋 I'm your placement assistant. Ask me anything about upcoming drives, company details, eligibility, exam dates, or preparation tips!`,
  };

  const [messages, setMessages]           = useState([welcomeMsg]);
  const [input, setInput]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chats, setChats]                 = useState([]);
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px';
    }
  }, [input]);

  // Fetch chat history list
  const fetchChats = async () => {
    try {
      const res = await studentAPI.getChatHistory();
      setChats(res.data.data || []);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchChats(); }, []);

  const handleNewChat = () => {
    setMessages([welcomeMsg]);
    setCurrentChatId(null);
    setInput('');
  };

  const handleSelectChat = async (chatId) => {
    try {
      const res = await studentAPI.getChatById(chatId);
      setMessages(res.data.data.messages || [welcomeMsg]);
      setCurrentChatId(chatId);
    } catch { /* silent */ }
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    try {
      await studentAPI.deleteChatHistory(chatId);
      setChats(prev => prev.filter(c => c._id !== chatId));
      if (currentChatId === chatId) handleNewChat();
    } catch { /* silent */ }
  };

  const formatDate = (dateStr) => {
    const d    = new Date(dateStr);
    const now  = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7)  return `${diff} days ago`;
    return d.toLocaleDateString();
  };

  const QUICK = [
    'What companies are coming?',
    'What skills does TCS require?',
    'How to prepare for Infosys?',
    'What is the selection ratio?',
    'Tell me about off-campus drives',
  ];

  const sendMessage = async (text) => {
  const msg = (text || input).trim();
  if (!msg || loading) return;
  setInput('');
  setMessages(prev => [...prev, { role: 'user', content: msg }]);
  setLoading(true);
  try {
    const res = await studentAPI.chatbotMessage({
      message: msg,
      profile,
      chatId: currentChatId || null,   // ← always send current chat id
    });
    const { reply, chatId: returnedChatId } = res.data.data;
    setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

    if (returnedChatId) {
      setCurrentChatId(returnedChatId); // ← lock onto this chat for all future messages
      fetchChats();                      // ← refresh sidebar list
    }
  } catch {
    setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again shortly." }]);
  } finally {
    setLoading(false);
  }
};

  const isNewChat = messages.length <= 1;

  return (
    <div style={{ display: 'flex', height: '80vh', borderRadius: '12px', overflow: 'hidden', border: '1px solid #2d2d2d', background: '#212121' }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: sidebarOpen ? '260px' : '0',
        minWidth: sidebarOpen ? '260px' : '0',
        background: '#171717',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.25s ease',
        overflow: 'hidden',
        borderRight: '1px solid #2d2d2d',
      }}>
        {sidebarOpen && (
          <>
            {/* Sidebar header */}
            <div style={{ padding: '16px', borderBottom: '1px solid #2d2d2d' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <button onClick={() => setSidebarOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9b9b9b', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                  title="Close sidebar"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                </button>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#ececec' }}>Placement Bot</span>
              </div>
              {/* New Chat button */}
              <button onClick={handleNewChat}
                style={{ width: '100%', padding: '10px 14px', background: '#2d2d2d', border: '1px solid #404040', borderRadius: '8px', color: '#ececec', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#363636'}
                onMouseLeave={e => e.currentTarget.style.background = '#2d2d2d'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New Chat
              </button>
            </div>

            {/* Chat history list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {chats.length === 0 ? (
                <p style={{ color: '#6b6b6b', fontSize: '13px', padding: '12px', textAlign: 'center' }}>No chats yet</p>
              ) : chats.map(chat => (
                <div key={chat._id} onClick={() => handleSelectChat(chat._id)}
                  style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: currentChatId === chat._id ? '#2d2d2d' : 'transparent', transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (currentChatId !== chat._id) e.currentTarget.style.background = '#222'; }}
                  onMouseLeave={e => { if (currentChatId !== chat._id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: '13px', color: '#ececec', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                      {chat.title}
                    </p>
                    <p style={{ fontSize: '11px', color: '#6b6b6b' }}>{formatDate(chat.updatedAt)}</p>
                  </div>
                  <button onClick={e => handleDeleteChat(e, chat._id)}
                    className="chatbot-del-btn"
                    title="Delete"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6b6b', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Sidebar footer */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #2d2d2d' }}>
              <p style={{ fontSize: '11px', color: '#6b6b6b', textAlign: 'center' }}>JobLens Placement Assistant</p>
            </div>
          </>
        )}
      </div>

      {/* ── CHAT AREA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #2d2d2d', background: '#212121', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Hamburger — show when sidebar closed */}
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9b9b9b', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          )}
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10a37f', boxShadow: '0 0 6px #10a37f' }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#ececec' }}>Placement Assistant</span>
          <span style={{ fontSize: '12px', color: '#6b6b6b', marginLeft: '4px' }}>Powered by Gemini · Live DB</span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
          {isNewChat ? (
            /* Welcome screen */
            <div style={{ maxWidth: '560px', margin: '40px auto 0', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, #10a37f, #0d8a6e)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: '24px' }}>🎓</div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ececec', marginBottom: '8px' }}>How can I help you today?</h2>
              <p style={{ color: '#9b9b9b', fontSize: '13px', marginBottom: '28px', lineHeight: 1.6 }}>
                Ask me about placement drives, salary packages, eligibility, exam dates and more.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {QUICK.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    style={{ padding: '9px 15px', background: '#2d2d2d', border: '1px solid #404040', borderRadius: '20px', color: '#ececec', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.target.style.background = '#363636'; e.target.style.borderColor = '#10a37f'; }}
                    onMouseLeave={e => { e.target.style.background = '#2d2d2d'; e.target.style.borderColor = '#404040'; }}
                  >{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '16px', gap: '10px', alignItems: 'flex-start' }}>
                  {msg.role === 'assistant' && (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #10a37f, #0d8a6e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', fontSize: '14px' }}>🤖</div>
                  )}
                  <div style={{ maxWidth: '72%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: msg.role === 'user' ? '#2563eb' : '#2d2d2d', color: '#ececec', fontSize: '14px', lineHeight: 1.6, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                      {profile?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              ))}
              {/* Typing indicator */}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #10a37f, #0d8a6e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>🤖</div>
                  <div style={{ padding: '14px 18px', background: '#2d2d2d', borderRadius: '18px 18px 18px 4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {[0,1,2].map(i => (
                      <span key={i} style={{ width: '7px', height: '7px', background: '#6b6b6b', borderRadius: '50%', display: 'inline-block', animation: 'chatbotBounce 1.2s infinite', animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div style={{ padding: '14px 18px 18px', background: '#212121', borderTop: '1px solid #2d2d2d' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto', background: '#2d2d2d', borderRadius: '12px', border: '1px solid #404040', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '10px 12px' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask about any placement drive..."
              rows={1}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#ececec', fontSize: '14px', resize: 'none', lineHeight: 1.6, maxHeight: '140px', overflowY: 'auto', fontFamily: 'inherit' }}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
              style={{ width: '34px', height: '34px', borderRadius: '8px', border: 'none', background: input.trim() && !loading ? '#10a37f' : '#404040', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', flexShrink: 0 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#6b6b6b', marginTop: '8px' }}>Enter to send · Shift+Enter for new line</p>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes chatbotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        .chatbot-del-btn { opacity: 0 !important; }
        div:hover > .chatbot-del-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
// Resume Match
function ResumeMatch() {
  const { profile } = useAuth();
  const [jobDesc, setJobDesc]     = useState('');
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult]   = useState(null);
  const runBasicMatch = async () => {
    if (!jobDesc.trim()) return toast.error('Paste a job description');
    setLoading(true);
    try {
      const res = await studentAPI.resumeMatch({ jobDescription: jobDesc });
      setResult(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };
  const runAiMatch = async () => {
    if (!jobDesc.trim()) return toast.error('Paste a job description');
    if (!profile?.resume?.url && !profile?.skills?.length) return toast.error('Please update your profile with skills first');
    setAiLoading(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: 'You are an expert career counselor and ATS specialist. Analyze resumes against job descriptions and provide specific, actionable feedback. Always respond in valid JSON.',
          messages: [{
            role: 'user',
            content: `Analyze this student profile against the job description and return ONLY a JSON object:\n\nStudent Profile:\n- Branch: ${profile?.branch}\n- CGPA: ${profile?.cgpa}\n- Skills: ${(profile?.skills || []).join(', ')}\n- Projects: ${(profile?.projects || []).map(p => p.title).join(', ')}\n- Internships: ${(profile?.internships || []).map(i => `${i.role} at ${i.company}`).join(', ')}\n- Certifications: ${(profile?.certifications || []).join(', ')}\n\nJob Description:\n${jobDesc}\n\nReturn JSON with these exact keys:\n{\n  "fitScore": <0-100 number>,\n  "matchedSkills": ["skill1"],\n  "missingSkills": ["skill1"],\n  "strengths": ["strength1"],\n  "gaps": ["gap1"],\n  "atsKeywords": ["kw1"],\n  "preparationPlan": ["step1"],\n  "summary": "2-3 sentence overall assessment"\n}`,
          }],
        }),
      });
      const data   = await response.json();
      const text   = data.content?.[0]?.text || '{}';
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      setAiResult(parsed);
    } catch {
      toast.error('AI analysis failed. Check your connection.');
    } finally { setAiLoading(false); }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', marginBottom: '14px' }}>Paste Job Description</h3>
        <textarea
          value={jobDesc} onChange={e => setJobDesc(e.target.value)}
          placeholder="Paste the complete job description here..."
          style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', padding: '12px 14px', fontSize: '13px', minHeight: '160px', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
          <button onClick={runBasicMatch} disabled={loading}
            style={{ padding: '10px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center' }}>
            {loading && <Spinner size={14} />}Quick Match
          </button>
          <button onClick={runAiMatch} disabled={aiLoading}
            style={{ padding: '10px 24px', background: 'linear-gradient(135deg, var(--accent-primary), #7c3aed)', border: 'none', borderRadius: 'var(--radius)', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', gap: '8px', alignItems: 'center' }}>
            {aiLoading && <Spinner size={14} color="white" />}🤖 Deep AI Analysis
          </button>
        </div>
      </Card>
      {result && (
        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', marginBottom: '16px' }}>Quick Match Result</h3>
          <ProgressBar value={result.jobFitScore} label="Job Fit Score" color={result.jobFitScore >= 70 ? 'var(--accent-green)' : result.jobFitScore >= 40 ? 'var(--accent-orange)' : 'var(--accent-red)'} />
          <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>MATCHED SKILLS</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {result.matchedSkills?.map(s => <Badge key={s} variant="success" size="sm">{s}</Badge>)}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>NOT IN JD</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {result.missingInJD?.map(s => <Badge key={s} variant="default" size="sm">{s}</Badge>)}
              </div>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '14px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px' }}>{result.suggestion}</p>
        </Card>
      )}
      {aiResult && (
        <Card glow>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>🤖 AI Deep Analysis</h3>
            <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-display)', color: aiResult.fitScore >= 70 ? 'var(--accent-green)' : aiResult.fitScore >= 40 ? 'var(--accent-orange)' : 'var(--accent-red)' }}>
              {aiResult.fitScore}/100
            </div>
          </div>
          <ProgressBar value={aiResult.fitScore} label="AI Fit Score" color={aiResult.fitScore >= 70 ? 'var(--accent-green)' : aiResult.fitScore >= 40 ? 'var(--accent-orange)' : 'var(--accent-red)'} />
          {aiResult.summary && (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '16px', padding: '14px', background: 'var(--bg-elevated)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              {aiResult.summary}
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '16px' }}>
            {[
              { key: 'matchedSkills', label: '✅ Matched Skills', variant: 'success' },
              { key: 'missingSkills', label: '❌ Missing Skills', variant: 'danger' },
              { key: 'strengths',     label: '💪 Strengths',      variant: 'primary' },
              { key: 'gaps',          label: '⚠ Gaps',            variant: 'warning' },
            ].map(({ key, label, variant }) => (
              <div key={key}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{label}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(aiResult[key] || []).map((item, i) => <Badge key={i} variant={variant} size="sm">{item}</Badge>)}
                </div>
              </div>
            ))}
          </div>
          {aiResult.atsKeywords?.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>🎯 ATS Keywords to Add to Resume</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {aiResult.atsKeywords.map((kw, i) => <Badge key={i} variant="purple" size="sm">{kw}</Badge>)}
              </div>
            </div>
          )}
          {aiResult.preparationPlan?.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>📋 Preparation Plan</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {aiResult.preparationPlan.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
// Job Search Links
function JobLinks() {
  const [form, setForm]     = useState({ role: '', location: '', experience: '0' });
  const [links, setLinks]   = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async (e) => {
    e.preventDefault();
    if (!form.role) return toast.error('Enter a role');
    setLoading(true);
    try {
      const res = await studentAPI.generateJobLinks(form);
      setLinks(res.data.data.links);
    } catch { toast.error('Failed to generate links'); }
    finally { setLoading(false); }
  };
  const PLATFORMS = [
    { key: 'linkedin',    icon: '💼', label: 'LinkedIn',    color: '#0077b5' },
    { key: 'naukri',      icon: '🎯', label: 'Naukri',      color: '#ff7555' },
    { key: 'unstop',      icon: '⚡', label: 'Unstop',      color: '#7c3aed' },
    { key: 'indeed',      icon: '🔍', label: 'Indeed',      color: '#003A9B' },
    { key: 'internshala', icon: '🎓', label: 'Internshala', color: '#02a2a2' },
    { key: 'glassdoor',   icon: '🌿', label: 'Glassdoor',   color: '#0caa41' },
    { key: 'wellfound',   icon: '🚀', label: 'Wellfound',   color: '#f97316' },
    { key: 'hirist',      icon: '💡', label: 'Hirist',      color: '#e91e63' },
  ];
  const inputStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', padding: '10px 14px', fontSize: '14px' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', marginBottom: '16px' }}>🔗 Generate Job Search Links</h3>
        <form onSubmit={generate} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>ROLE *</label>
            <input style={inputStyle} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Software Engineer" />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>LOCATION</label>
            <input style={inputStyle} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Hyderabad" />
          </div>
          <div style={{ minWidth: '120px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>EXPERIENCE</label>
            <select style={inputStyle} value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })}>
              <option value="0">Fresher</option>
              <option value="1">1 Year</option>
              <option value="2">2 Years</option>
            </select>
          </div>
          <button type="submit" disabled={loading}
            style={{ padding: '10px 24px', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius)', color: 'var(--bg-primary)', cursor: 'pointer', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
            {loading && <Spinner size={14} color="var(--bg-primary)" />}Generate Links
          </button>
        </form>
      </Card>
      {links && (
        <div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Showing links for <strong style={{ color: 'var(--text-primary)' }}>{form.role}</strong> {form.location && `in ${form.location}`}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {PLATFORMS.map(({ key, icon, label, color }) => (
              links[key] && (
                <a key={key} href={links[key]} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--bg-card)', border: `1px solid ${color}25`, borderRadius: '12px', textDecoration: 'none', color: 'var(--text-primary)', transition: 'var(--transition)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.borderColor = `${color}50`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = `${color}25`; e.currentTarget.style.transform = 'none'; }}
                >
                  <span style={{ fontSize: '24px' }}>{icon}</span>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600 }}>{label}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Search →</p>
                  </div>
                </a>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
// JOB VERIFIER — New Feature
function JobVerifier() {
  const [form, setForm]       = useState({ companyName: '', jobLink: '', jobDescription: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [histLoading, setHistLoading] = useState(false);
  const handleChange = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  const handleCheck = async () => {
    if (!form.companyName.trim() && !form.jobDescription.trim() && !form.jobLink.trim()) {
      return toast.error('Please provide at least a company name, job link, or description.');
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await studentAPI.checkJobAuthenticity(form);
      setResult(res.data.data);
      if (res.data.data.riskLevel === 'HIGH') {
        toast.error('⚠️ High risk detected! This posting shows scam indicators.', { duration: 5000 });
      } else if (res.data.data.riskLevel === 'MEDIUM') {
        toast('🔶 Suspicious posting — verify through official channels.', { duration: 4000 });
      } else {
        toast.success('✅ Posting appears legitimate. Always verify independently.', { duration: 4000 });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally { setLoading(false); }
  };
  const loadHistory = async () => {
    if (showHistory) { setShowHistory(false); return; }
    setHistLoading(true);
    try {
      const res = await studentAPI.getJobVerifierHistory();
      setHistory(res.data.data.history || []);
      setShowHistory(true);
    } catch {
      toast.error('Could not load history.');
    } finally { setHistLoading(false); }
  };
  const handleReset = () => { setForm({ companyName: '', jobLink: '', jobDescription: '' }); setResult(null); };
  // Style constants matching existing UI
  const inputStyle = {
    width: '100%', background: 'var(--bg-elevated)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    color: 'var(--text-primary)', padding: '10px 14px', fontSize: '14px',
    boxSizing: 'border-box', outline: 'none',
    transition: 'border-color 0.2s',
  };
  const labelStyle = { display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' };

  const RISK_COLORS = {
    green:  { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',   text: 'var(--success)',  badge: 'rgba(34,197,94,0.15)'  },
    yellow: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  text: 'var(--warning)',  badge: 'rgba(245,158,11,0.15)' },
    red:    { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   text: 'var(--danger)',   badge: 'rgba(239,68,68,0.15)'  },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Info Banner */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px',
        background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 'var(--radius)', padding: '14px 18px',
      }}>
        <span style={{ fontSize: '22px', flexShrink: 0 }}>🛡️</span>
        <div>
          <p style={{ fontWeight: 700, color: 'var(--info)', fontSize: '14px', marginBottom: '2px' }}>
            Cyber Security Feature
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Detect potentially fake or scam job postings using AI pattern analysis and heuristic checks.
            Powered by Claude AI + Google Safe Browsing + 30+ scam signal detectors.
          </p>
        </div>
      </div>

      {/* Input Card */}
      <Card>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
          Check Job Authenticity
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Company Name */}
          <div>
            <label style={labelStyle}>Company Name</label>
            <input
              style={inputStyle}
              value={form.companyName}
              onChange={handleChange('companyName')}
              placeholder="e.g. TCS, Infosys, XYZ Corp"
              onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border)'}
              disabled={loading}
            />
          </div>
          {/* Job Link */}
          <div>
            <label style={labelStyle}>Job Link / URL</label>
            <input
              style={inputStyle}
              value={form.jobLink}
              onChange={handleChange('jobLink')}
              placeholder="https://company.com/careers/..."
              onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border)'}
              disabled={loading}
            />
          </div>
          {/* Job Description */}
          <div>
            <label style={labelStyle}>Job Description / Post Content</label>
            <textarea
              style={{ ...inputStyle, minHeight: '160px', resize: 'vertical', lineHeight: 1.6 }}
              value={form.jobDescription}
              onChange={handleChange('jobDescription')}
              placeholder="Paste the job description or WhatsApp message here..."
              onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border)'}
              disabled={loading}
            />
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={handleCheck} disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '11px 28px',
                background: loading ? 'var(--bg-elevated)' : 'linear-gradient(135deg, var(--brand), #7c3aed)',
                border: 'none', borderRadius: 'var(--radius)',
                color: loading ? 'var(--text-muted)' : 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '14px',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(124,58,237,0.35)',
                transition: 'var(--transition)',
              }}>
              {loading ? <><Spinner size={16} color="var(--text-muted)" />Analyzing...</> : '🔍 Check for Scams'}
            </button>
            {result && (
              <button onClick={handleReset}
                style={{ padding: '11px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                Check Another
              </button>
            )}
            <button onClick={loadHistory} disabled={histLoading}
              style={{ padding: '11px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center', marginLeft: 'auto' }}>
              {histLoading && <Spinner size={14} />}{showHistory ? '▲ Hide' : '📋 History'}
            </button>
          </div>
        </div>
      </Card>
      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Verdict Header */}
          {(() => {
            const rc = RISK_COLORS[result.color] || RISK_COLORS.yellow;
            return (
              <div style={{ background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Score Ring */}
                <div style={{ flexShrink: 0, textAlign: 'center' }}>
                  <ScoreRing score={result.overallScore} color={rc.text} />
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Authenticity Score</p>
                </div>
                {/* Verdict text */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: rc.badge, border: `1px solid ${rc.border}`, borderRadius: '999px', padding: '5px 16px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '18px' }}>
                      {result.color === 'green' ? '✅' : result.color === 'yellow' ? '⚠️' : '🚨'}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '14px', color: rc.text, letterSpacing: '0.05em' }}>
                      {result.verdict}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {result.aiAnalysis}
                  </p>
                  {result.heuristicSummary && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
                      Pattern analysis: {result.heuristicSummary}
                    </p>
                  )}
                </div>
                {/* Risk Badge */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>RISK LEVEL</p>
                  <div style={{ padding: '6px 18px', background: rc.badge, border: `1px solid ${rc.border}`, borderRadius: '8px', fontWeight: 800, fontSize: '16px', color: rc.text }}>
                    {result.riskLevel}
                  </div>
                </div>
              </div>
            );
          })()}
          {/* URL Safety */}
          {result.urlSafety && (
            <Card>
              <h4 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px' }}>🔗 URL Safety Check</h4>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: '8px',
                background: result.urlSafety.safe ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${result.urlSafety.safe ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{result.urlSafety.safe ? '✅' : '🚨'}</span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '13px', color: result.urlSafety.safe ? 'var(--success)' : 'var(--danger)' }}>
                      {result.urlSafety.safe ? 'URL appears safe' : 'Suspicious or dangerous URL detected'}
                    </p>
                    {result.urlSafety.threats?.length > 0 && (
                      <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>
                        Threats: {result.urlSafety.threats.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <code style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: '4px' }}>
                  {result.urlSafety.domain}
                </code>
              </div>
            </Card>
          )}
          {/* Red Flags */}
          {result.redFlags?.length > 0 && (
            <Card>
              <h4 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px', color: 'var(--danger)' }}>
                Red Flags Detected ({result.redFlags.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.redFlags.map((flag, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '9px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '1px' }}>✗</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{flag}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {/* Green Flags */}
          {result.greenFlags?.length > 0 && (
            <Card>
              <h4 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px', color: 'var(--success)' }}>
                ✅ Positive Indicators ({result.greenFlags.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.greenFlags.map((flag, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '9px 12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--success)', flexShrink: 0, marginTop: '1px' }}>✓</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{flag}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {/* Score Breakdown */}
          <Card>
            <h4 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '16px' }}>📊 Score Breakdown</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: '🔎 Pattern Analysis',  value: result.scoreBreakdown?.heuristic, weight: '40%' },
                { label: '🔗 URL Safety',         value: result.scoreBreakdown?.urlSafety, weight: '20%' },
                { label: '🤖 Claude AI Analysis', value: result.scoreBreakdown?.ai,        weight: '40%' },
              ].filter(r => r.value !== null && r.value !== undefined).map(({ label, value, weight }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{weight}</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: value >= 72 ? 'var(--success)' : value >= 48 ? 'var(--warning)' : 'var(--danger)' }}>{Math.round(value)}/100</span>
                    </div>
                  </div>
                  <ProgressBar value={value} color={value >= 72 ? 'var(--success)' : value >= 48 ? 'var(--warning)' : 'var(--danger)'} />
                </div>
              ))}
              {/* Divider + Overall */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>🏆 Overall Score</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: result.overallScore >= 72 ? 'var(--success)' : result.overallScore >= 48 ? 'var(--warning)' : 'var(--danger)' }}>
                    {result.overallScore}/100
                  </span>
                </div>
                <ProgressBar value={result.overallScore} color={result.overallScore >= 72 ? 'var(--success)' : result.overallScore >= 48 ? 'var(--warning)' : 'var(--danger)'} />
              </div>
            </div>
          </Card>
          {/* Disclaimer */}
          <Alert type="warning">
            ⚠️ This tool is AI-powered and may not be 100% accurate. Always verify job offers through the company's official website and never share personal/banking information without thorough verification.
          </Alert>
        </div>
      )}
      {/* History */}
      {showHistory && (
        <Card>
          <h4 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '16px' }}>📋 Recent Checks</h4>
          {history.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
              No verification history yet. Check your first job posting above!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.map((item, i) => {
                const rc = RISK_COLORS[item.riskLevel === 'LOW' ? 'green' : item.riskLevel === 'HIGH' ? 'red' : 'yellow'] || RISK_COLORS.yellow;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.companyName || item.jobLink || 'Unknown posting'}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {new Date(item.checkedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: rc.text }}>{item.overallScore}/100</span>
                      <span style={{ fontSize: '11px', padding: '2px 10px', background: rc.badge, color: rc.text, borderRadius: '999px', fontWeight: 600, border: `1px solid ${rc.border}` }}>
                        {item.riskLevel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
// Score Ring SVG
function ScoreRing({ score, color }) {
  const r    = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width="90" height="90" viewBox="0 0 90 90">
      <circle cx="45" cy="45" r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
      <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 45 45)"
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <text x="45" y="49" textAnchor="middle" fill="var(--text-primary)" fontSize="16" fontWeight="800">
        {score}
      </text>
    </svg>
  );
}