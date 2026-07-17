'use client';
import { useState } from 'react';

export default function Home() {
  const [question, setQuestion] = useState('What is Acme pricing?');
  const [mode, setMode] = useState('grounding'); 
  const [output, setOutput] = useState('');
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'Idle' | 'Processing' | 'Finished'>('Idle');
  const [actionState, setActionState] = useState<'Ready' | 'Working' | 'Done'>('Ready');
  const [activeGuideTab, setActiveGuideTab] = useState<'howToUse' | 'howItWorks'>('howToUse');

 
  // 1. Path for RAG: User (120,160) -> DB (320,80) -> LLM (480,160) -> Output (820,160)
  const ragPath = "M 120 160 Q 220 80 320 80 Q 420 80 480 160 L 820 160";

  // 2. Path for Audit (CoVe & Guardrails): User -> LLM -> dips down to Verify/Gate (650, 245) -> Output
  const auditPath = "M 120 160 L 480 160 Q 565 245 650 245 Q 735 245 820 160";

  // 3. Path for Vanilla: Straight line bypassing everything
  const directPath = "M 120 160 L 480 160 L 820 160";

  // Dynamically switch the physical track the blue dot travels on
  const activePath = mode === 'grounding' 
    ? ragPath 
    : (mode === 'cove' || mode === 'guardrail') 
      ? auditPath 
      : directPath;



  const handleSubmit = async () => {
    setLoading(true);
    setStatus('Processing');
    setActionState('Working');
    setOutput('');
    setDebugData(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, mitigationMode: mode }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setOutput(data.output);
        setDebugData(data);
        setStatus('Finished');
        setActionState('Done');
      } else {
        setOutput(`Error: ${data.error || 'Something went wrong.'}`);
        setStatus('Finished');
        setActionState('Ready');
      }
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
      setStatus('Finished');
      setActionState('Ready');
    } finally {
      setLoading(false);
    }
  };

  const isRAGActive = mode === 'grounding';
  const isAuditActive = mode === 'cove' || mode === 'guardrail';

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fcfcfc', color: '#111', fontFamily: 'system-ui, sans-serif', padding: '3rem 2rem' }}>
      
      <style>{`
        @keyframes travel {
          0% { offset-distance: 0%; opacity: 1; }
          100% { offset-distance: 100%; opacity: 0.8; }
        }
      `}</style>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '500', color: '#2c2c2c', margin: 0, letterSpacing: '-0.5px' }}>
              LLM Pipeline Simulator
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#777', fontSize: '14px' }}>
              Test and trace advanced industrial strategies used to mitigate LLM hallucinations.
            </p>
          </div>
          <button 
            onClick={handleSubmit} 
            disabled={loading} 
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: loading ? '#3b82f6' : '#eaeaea',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '14px', color: loading ? '#fff' : '#333' }}>
              {loading ? '⚡' : '▶'}
            </span>
          </button>
        </div>

        {/* =========================================================================
            1. THE STAGGERED NODE DIAGRAM WITH ANIMATED PACKET
            ========================================================================= */}
        <div style={{ position: 'relative', height: '300px', marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2rem' }}>
          
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
            <path 
              d={activePath} 
              fill="none" 
              stroke="#e2e8f0" 
              strokeWidth="3" 
              strokeDasharray="6 6" 
            />
          </svg>

          {/* Animating Blue Data Packet */}
          {loading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              boxShadow: '0 0 12px 4px rgba(59, 130, 246, 0.6)',
              zIndex: 3,
              offsetPath: `path('${activePath}')`,
              animation: 'travel 2.5s infinite linear',
              pointerEvents: 'none'
            }} />
          )}

          {/* Node 1: USER INPUT */}
          <div style={{ ...nodeCard, zIndex: 2, transform: 'translateY(20px)' }}>
            <span style={{ fontSize: '22px', marginBottom: '8px' }}>👤</span>
            <span style={nodeLabel}>USER INPUT</span>
          </div>

          {/* Node 2: CONTEXT DB (RAG) */}
          <div style={{ 
            ...nodeCard, 
            zIndex: 2, 
            transform: 'translateY(-60px)',
            border: isRAGActive ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
            backgroundColor: isRAGActive ? '#fff' : '#f8fafc',
            boxShadow: isRAGActive ? '0 0 15px rgba(59, 130, 246, 0.15)' : 'none',
            opacity: isRAGActive ? 1 : 0.4
          }}>
            <span style={{ fontSize: '22px', marginBottom: '8px' }}>📁</span>
            <span style={nodeLabel}>CONTEXT DB</span>
          </div>

          {/* Node 3: LLM ENGINE */}
          <div style={{ ...nodeCard, zIndex: 2, transform: 'translateY(20px)' }}>
            <span style={{ fontSize: '22px', marginBottom: '8px' }}>🧠</span>
            <span style={nodeLabel}>LLM ENGINE</span>
          </div>

          {/* Node 4: VERIFY/GATE (Audit) */}
          <div style={{ 
            ...nodeCard, 
            zIndex: 2, 
            transform: 'translateY(85px)',
            border: isAuditActive ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
            backgroundColor: isAuditActive ? '#fff' : '#f8fafc',
            boxShadow: isAuditActive ? '0 0 15px rgba(59, 130, 246, 0.15)' : 'none',
            opacity: isAuditActive ? 1 : 0.4
          }}>
            <span style={{ fontSize: '22px', marginBottom: '8px' }}>🛡️</span>
            <span style={nodeLabel}>VERIFY/GATE</span>
          </div>

          {/* Node 5: FINAL OUTPUT */}
          <div style={{ ...nodeCard, zIndex: 2, transform: 'translateY(20px)' }}>
            <span style={{ fontSize: '22px', marginBottom: '8px' }}>📄</span>
            <span style={nodeLabel}>FINAL OUTPUT</span>
          </div>

        </div>

        {/* =========================================================================
            2. STATUS METRICS
            ========================================================================= */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6rem', marginBottom: '4rem', borderTop: '1px solid #f0f0f0', paddingTop: '2.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={metricTitle}>STATUS</span>
            <div style={metricValue}>{status}</div>
          </div>
          <div style={{ width: '1px', backgroundColor: '#e0e0e0', alignSelf: 'stretch' }} />
          <div style={{ textAlign: 'center' }}>
            <span style={metricTitle}>ACTION</span>
            <div style={metricValue}>{actionState}</div>
          </div>
        </div>

        {/* =========================================================================
            3. CONTROLS FORM
            ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '750px', margin: '0 auto 4rem auto' }}>
          
          <div style={formRow}>
            <label style={formLabel}>Query Text</label>
            <input 
              type="text" 
              value={question} 
              onChange={(e) => setQuestion(e.target.value)}
              style={formInput} 
            />
          </div>

          <div style={formRow}>
            <label style={formLabel}>Mitigation Strategy</label>
            <select 
              value={mode} 
              onChange={(e) => setMode(e.target.value)} 
              style={formSelect}
            >
              <option value="vanilla">None (Vanilla LLM - Hallucination Risk)</option>
              <option value="grounding">RAG (Grounding with Top-P & Low Temp)</option>
              <option value="cove">Chain-of-Verification (Self-Correction)</option>
              <option value="guardrail">Post-Generation Guardrails + Confidence Score</option>
            </select>
          </div>

        </div>

        {/* =========================================================================
            4. OUTPUT BLOCK
            ========================================================================= */}
        {(output || loading) && (
          <div style={{ maxWidth: '750px', margin: '0 auto 4rem auto', background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            
            {/* Confidence Score Meter (When available) */}
            {debugData?.confidenceScore && !loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem', background: '#f0fdf4', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '18px' }}>🎯</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534' }}>
                  Safety Guardrail Confidence Score: {debugData.confidenceScore}%
                </span>
                <div style={{ flex: 1, height: '6px', background: '#dcfce7', borderRadius: '3px', overflow: 'hidden', marginLeft: '10px' }}>
                  <div style={{ width: `${debugData.confidenceScore}%`, height: '100%', background: '#22c55e' }} />
                </div>
              </div>
            )}

            <h4 style={{ margin: '0 0 1rem 0', fontWeight: '600', fontSize: '15px', color: '#111' }}>
              {loading ? '⚡ Processing through pipeline...' : 'Processed Pipeline Result:'}
            </h4>
            
            <div style={{ fontSize: '15px', lineHeight: '1.7', color: '#444', whiteSpace: 'pre-wrap', minHeight: '60px' }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '50%', animation: 'pulse 1s infinite alternate' }} />
                  Streaming generation steps...
                </div>
              ) : (
                output
              )}
            </div>

            {debugData && !loading && (
              <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Database & Variable State Trace:</h5>
                <pre style={{ margin: 0, padding: '12px', background: '#f5f5f5', borderRadius: '6px', fontSize: '12px', overflowX: 'auto', fontFamily: 'monospace', color: '#333' }}>
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            5. EMBEDDED EDUCATIONAL GUIDE (HOW TO USE / HOW IT WORKS)
            ========================================================================= */}
        <div style={{ maxWidth: '750px', margin: '0 auto', borderTop: '1px solid #e2e8f0', paddingTop: '3rem' }}>
          
          <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
            <button 
              onClick={() => setActiveGuideTab('howToUse')}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 4px',
                fontSize: '15px',
                fontWeight: activeGuideTab === 'howToUse' ? '600' : '400',
                color: activeGuideTab === 'howToUse' ? '#111' : '#666',
                borderBottom: activeGuideTab === 'howToUse' ? '2px solid #111' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              📖 How to Use the Simulator
            </button>
            <button 
              onClick={() => setActiveGuideTab('howItWorks')}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 4px',
                fontSize: '15px',
                fontWeight: activeGuideTab === 'howItWorks' ? '600' : '400',
                color: activeGuideTab === 'howItWorks' ? '#111' : '#666',
                borderBottom: activeGuideTab === 'howItWorks' ? '2px solid #111' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              🛠️ How the Engineering Works
            </button>
          </div>

          {activeGuideTab === 'howToUse' && (
            <div style={{ color: '#4b5563', lineHeight: '1.6', fontSize: '14px' }}>
              <p>Execute this testing script sequentially to understand how hallucinations break and correct themselves:</p>
              <ol style={{ paddingLeft: '1.2rem', margin: '1rem 0' }}>
                <li style={{ marginBottom: '12px' }}>
                  <strong>Trigger a Hallucination:</strong> Select <code>None (Vanilla LLM)</code>, enter <code style={inlineCode}>What is Acme pricing?</code>, and execute. Notice how the model confidently invents pricing structures out of thin air because it is not grounded.
                </li>
                <li style={{ marginBottom: '12px' }}>
                  <strong>Ground the Model (RAG):</strong> Switch strategy to <code>RAG (Grounding)</code>. The <strong>CONTEXT DB</strong> node will highlight. Watch the model return precise pricing matching our database records because of low-temperature boundaries and strict context prompts.
                </li>
                <li style={{ marginBottom: '12px' }}>
                  <strong>Simulate Confidence Score Audit:</strong> Select <code>Post-Generation Guardrails</code>. The <strong>Audit Gate</strong> node activates. The output is evaluated for speculation, returning a structured safety confidence score directly inside the UI!
                </li>
              </ol>
            </div>
          )}

          {activeGuideTab === 'howItWorks' && (
            <div style={{ color: '#4b5563', lineHeight: '1.6', fontSize: '14px' }}>
              <p>We mitigate errors dynamically across five core engineering pillars:</p>
              <ul style={{ paddingLeft: '1.2rem', margin: '1rem 0', listStyleType: 'square' }}>
                <li style={{ marginBottom: '12px' }}>
                  <strong>1. Prompt Constraints:</strong> Clear guidelines such as <em>"Answer ONLY using the provided text. If missing, refuse."</em> keep generations within boundaries.
                </li>
                <li style={{ marginBottom: '12px' }}>
                  <strong>2. Retrieval-Augmented Generation (RAG):</strong> Feeding verified documents before query processing forces the model to synthesize facts rather than guess from training memory.
                </li>
                <li style={{ marginBottom: '12px' }}>
                  <strong>3. Parameter Tuning:</strong> Keeping temperature at <code>0.1</code> and <code>top_p</code> at <code>0.1</code> filters out non-deterministic, random tokens.
                </li>
                <li style={{ marginBottom: '12px' }}>
                  <strong>4. Chain-of-Verification (CoVe):</strong> A multi-turn audit loop where a draft is generated, self-interrogated with verification questions, and revised before returning to production.
                </li>
                <li style={{ marginBottom: '12px' }}>
                  <strong>5. Post-Generation Auditing & Confidence Scoring:</strong> Responses are intercepted by an independent, structured evaluation gate that filters unverified assertions and scores safety factors.
                </li>
              </ul>
            </div>
          )}

        </div>

      </div>
    </main>
  );
}

// Styling classes remained exactly matching the beautiful Minimalist diagram
const nodeCard: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '130px',
  height: '75px',
  backgroundColor: '#fff',
  border: '1px solid #cbd5e1',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  transition: 'all 0.4s ease',
};

const nodeLabel: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: '800',
  color: '#475569',
  letterSpacing: '0.5px',
};

const metricTitle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#888',
  letterSpacing: '0.8px',
};

const metricValue: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#111',
  marginTop: '4px',
};

const formRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '2rem',
};

const formLabel: React.CSSProperties = {
  width: '180px',
  fontSize: '14px',
  color: '#555',
  fontWeight: '500',
};

const formInput: React.CSSProperties = {
  flex: 1,
  padding: '12px 18px',
  fontSize: '14px',
  color: '#222',
  backgroundColor: '#f5f5f5',
  border: 'none',
  borderRadius: '10px',
  outline: 'none',
};

const formSelect: React.CSSProperties = {
  flex: 1,
  padding: '12px 18px',
  fontSize: '14px',
  color: '#222',
  backgroundColor: '#f5f5f5',
  border: 'none',
  borderRadius: '10px',
  outline: 'none',
  appearance: 'none',
  cursor: 'pointer',
};

const inlineCode: React.CSSProperties = {
  fontFamily: 'monospace',
  background: '#f1f5f9',
  padding: '2px 6px',
  borderRadius: '4px',
  color: '#0f172a',
  fontSize: '13px'
};