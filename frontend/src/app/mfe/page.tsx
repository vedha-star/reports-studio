'use client';

import React, { useState, useRef } from 'react';

import './mfe.css';


// ═══════════════ TYPES ═══════════════
type ReportProp = {
  name: string;
  type: string;
  req: boolean;
  desc: string;
};

type ReportModule = {
  label: string;
  props: ReportProp[];
};

// ═══════════════ DATA ═══════════════
const ENQUIRY_DATA = [
  { no: 'ENQ-001', name: 'Rajan Sharma', email: 'rajan@gmail.com', phone: '9876543210', status: 'SUBMITTED', date: '01-04-2026' },
  { no: 'ENQ-002', name: 'Priya Nair', email: 'priya@yahoo.com', phone: '9123456789', status: 'SUBMITTED', date: '02-04-2026' },
  { no: 'ENQ-003', name: 'Arun Kumar', email: 'arun@mail.com', phone: '9988776655', status: 'PENDING', date: '03-04-2026' },
  { no: 'ENQ-004', name: 'Meena Pillai', email: 'meena@web.in', phone: '9871234560', status: 'SUBMITTED', date: '05-04-2026' },
  { no: 'ENQ-005', name: 'Suresh Babu', email: 'suresh@co.in', phone: '9765432109', status: 'APPROVED', date: '07-04-2026' },
  { no: 'ENQ-006', name: 'Divya Menon', email: 'divya@mail.com', phone: '9654321098', status: 'SUBMITTED', date: '08-04-2026' },
  { no: 'ENQ-007', name: 'Kiran Reddy', email: 'kiran@web.in', phone: '9543210987', status: 'REJECTED', date: '09-04-2026' },
];

const INVOICE_DATA = [
  { no: 'INV-0001', branch: 'Chennai HQ', amount: '₹48,500.00', due: '10-04-2026', paid: 'Yes' },
  { no: 'INV-0002', branch: 'Bangalore', amount: '₹32,750.00', due: '12-04-2026', paid: 'No' },
  { no: 'INV-0003', branch: 'Hyderabad', amount: '₹27,000.00', due: '15-04-2026', paid: 'Yes' },
  { no: 'INV-0004', branch: 'Coimbatore', amount: '₹18,400.00', due: '18-04-2026', paid: 'No' },
  { no: 'INV-0005', branch: 'Madurai', amount: '₹12,200.00', due: '20-04-2026', paid: 'Yes' },
];

const REPORT_MODULES: Record<string, ReportModule> = {
  runner: {
    label: 'ReportRunner',
    props: [
      { name: 'reportSlug', type: 'string', req: true, desc: 'Slug of the specific report to run' },
      { name: 'apiBaseUrl', type: 'string', req: true, desc: 'Base URL of the Report Service API' },
      { name: 'defaultFormat', type: '"xlsx"|"csv"|"pdf"', req: false, desc: 'Override the template\'s default format' },
      { name: 'defaultParams', type: 'object', req: false, desc: 'Runtime param overrides merged with template defaults' },
      { name: 'showFormatSelector', type: 'boolean', req: false, desc: 'Show/hide the format picker (default: true)' },
      { name: 'onSuccess', type: '(fileName: string) => void', req: false, desc: 'Callback after successful download' },
      { name: 'onError', type: '(error: ReportError) => void', req: false, desc: 'Callback on generation failure' },
      { name: 'theme', type: '"light" | "dark" | ThemeObject', req: false, desc: 'Visual theme override' },
      { name: 'className', type: 'string', req: false, desc: 'CSS class on the root container' },
    ]
  },
  browser: {
    label: 'ReportBrowser',
    props: [
      { name: 'apiBaseUrl', type: 'string', req: true, desc: 'Base URL of the Report Service API' },
      { name: 'onSelect', type: '(slug: string) => void', req: false, desc: 'Called when user picks a report' },
      { name: 'filterCategory', type: 'string', req: false, desc: 'Limit to a specific category' },
      { name: 'theme', type: '"light" | "dark"', req: false, desc: 'Visual theme' },
    ]
  },
  button: {
    label: 'DownloadButton',
    props: [
      { name: 'reportSlug', type: 'string', req: true, desc: 'Slug of the report to download' },
      { name: 'apiBaseUrl', type: 'string', req: true, desc: 'Base URL of the Report Service API' },
      { name: 'format', type: '"xlsx"|"csv"|"pdf"', req: false, desc: 'Output format (default: template default)' },
      { name: 'params', type: 'object', req: false, desc: 'Fixed param values for this button' },
      { name: 'label', type: 'string', req: false, desc: 'Button label text (default: "⬇ Download")' },
      { name: 'variant', type: '"primary"|"default"|"ghost"', req: false, desc: 'Visual variant' },
      { name: 'onSuccess', type: '(fileName: string) => void', req: false, desc: 'Success callback' },
      { name: 'onError', type: '(error: ReportError) => void', req: false, desc: 'Error callback' },
    ]
  }
};

export default function RunModePage() {
  const [currentView, setCurrentView] = useState('arch');
  const [exposedModule, setExposedModule] = useState('runner');
  const [hostPage, setHostPage] = useState('enquiries');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [rrFmt, setRrFmt] = useState('xlsx');
  const [rrGenerating, setRrGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showRrToast, setShowRrToast] = useState(false);
  const [rrToastMsg, setRrToastMsg] = useState('');
  const [globalToast, setGlobalToast] = useState({ msg: '', show: false });
  const [showNewEnquiry, setShowNewEnquiry] = useState(false);
  const [newEnquiry, setNewEnquiry] = useState({ name: '', email: '', phone: '' });

  const toastTimeout = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setGlobalToast({ msg, show: true });
    toastTimeout.current = setTimeout(() => setGlobalToast({ msg: '', show: false }), 3000);
  };

  const handleRrGenerate = () => {
    if (rrGenerating) return;
    setRrGenerating(true);
    setProgress(0);
    
    let pct = 0;
    const interval = setInterval(() => {
      pct = Math.min(pct + Math.random() * 18, 92);
      setProgress(pct);
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setRrGenerating(false);
        setProgress(0);
        const slug = 'submitted-enquiries';
        const fname = `${slug}_2026-04-14.${rrFmt}`;
        setRrToastMsg(`${fname} — 1,523 rows downloaded · onSuccess("${fname}") fired`);
        setShowRrToast(true);
        setTimeout(() => setShowRrToast(false), 5000);
      }, 200);
    }, 2000);
  };

  const simulateExpire = () => {
    setSessionExpired(true);
    setCurrentView('host');
    showToast('Session expired! Widget shows error state with onError handler.');
  };

  const restoreSession = () => {
    setSessionExpired(false);
    showToast('Session restored. Widget back to normal.');
  };

  const handleNewEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnquiry.name || !newEnquiry.email) return;
    showToast(`New enquiry submitted for ${newEnquiry.name}`);
    setShowNewEnquiry(false);
    setNewEnquiry({ name: '', email: '', phone: '' });
  };

  const copyCode = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      showToast('Copied to clipboard');
    });
  };

  const getUsageExampleCode = (key: string) => {
    const examples: Record<string, string> = {
      runner: `const ReportRunner = React.lazy(
  () => import('navacle-report-studio/ReportRunner')
)

// In your component:
<React.Suspense fallback={<Skeleton />}>
  <ReportRunner
    reportSlug="submitted-enquiries"
    apiBaseUrl="https://api.navacle.io"
    defaultFormat="xlsx"
    onSuccess={f => toast(\`Downloaded \${f}\`)}
    onError={e => toast.error(e.message)}
  />
</React.Suspense>`,
      browser: `const ReportBrowser = React.lazy(
  () => import('navacle-report-studio/ReportBrowser')
)

<React.Suspense fallback={<Skeleton />}>
  <ReportBrowser
    apiBaseUrl="https://api.navacle.io"
    filterCategory="finance"
    onSelect={slug => navigate(\`/reports/\${slug}\`)}
  />
</React.Suspense>`,
      button: `const DownloadButton = React.lazy(
  () => import('navacle-report-studio/DownloadButton')
)

// Inline in a table row or page header:
<DownloadButton
  reportSlug="invoice-summary"
  apiBaseUrl="https://api.navacle.io"
  format="pdf"
  label="⬇ Export PDF"
  variant="primary"
  onSuccess={f => toast(\`Downloaded \${f}\`)}
/>`,
    };
    return examples[key] || '';
  };

  const getUsageExampleJSX = (key: string) => {
    const examples: Record<string, React.ReactNode> = {
      runner: (
        <>
          <span className="ck">const</span> <span className="cp">ReportRunner</span> = React.lazy(
          () =&gt; <span className="ck">import</span>(<span className="cs">&apos;navacle-report-studio/ReportRunner&apos;</span>)
          )
          <br /><br />
          <span className="co">{`// In your component:`}</span><br />
          &lt;<span className="cp">React.Suspense</span> fallback={"{"}&lt;<span className="cp">Skeleton</span> /&gt;{"}"}&gt;<br />
          {"  "}&lt;<span className="cp">ReportRunner</span><br />
          {"    "}reportSlug=<span className="cs">&quot;submitted-enquiries&quot;</span><br />
          {"    "}apiBaseUrl=<span className="cs">&quot;https://api.navacle.io&quot;</span><br />
          {"    "}defaultFormat=<span className="cs">&quot;xlsx&quot;</span><br />
          {"    "}onSuccess={"{"}f =&gt; toast(<span className="cs">{`Downloaded \${f}`}</span>){"}"}<br />
          {"    "}onError={"{"}e =&gt; toast.error(e.message){"}"}<br />
          {"  "}/&gt;<br />
          &lt;/<span className="cp">React.Suspense</span>&gt;
        </>
      ),
      browser: (
        <>
          <span className="ck">const</span> <span className="cp">ReportBrowser</span> = React.lazy(
          () =&gt; <span className="ck">import</span>(<span className="cs">&apos;navacle-report-studio/ReportBrowser&apos;</span>)
          )
          <br /><br />
          &lt;<span className="cp">React.Suspense</span> fallback={"{"}&lt;<span className="cp">Skeleton</span> /&gt;{"}"}&gt;<br />
          {"  "}&lt;<span className="cp">ReportBrowser</span><br />
          {"    "}apiBaseUrl=<span className="cs">&quot;https://api.navacle.io&quot;</span><br />
          {"    "}filterCategory=<span className="cs">&quot;finance&quot;</span><br />
          {"    "}onSelect={"{"}slug =&gt; navigate(<span className="cs">{`\/reports\/\${slug}`}</span>){"}"}<br />
          {"  "}/&gt;<br />
          &lt;/<span className="cp">React.Suspense</span>&gt;
        </>
      ),
      button: (
        <>
          <span className="ck">const</span> <span className="cp">DownloadButton</span> = React.lazy(
          () =&gt; <span className="ck">import</span>(<span className="cs">&apos;navacle-report-studio/DownloadButton&apos;</span>)
          )
          <br /><br />
          <span className="co">{`// Inline in a table row or page header:`}</span><br />
          &lt;<span className="cp">DownloadButton</span><br />
          {"  "}reportSlug=<span className="cs">&quot;invoice-summary&quot;</span><br />
          {"  "}apiBaseUrl=<span className="cs">&quot;https://api.navacle.io&quot;</span><br />
          {"  "}format=<span className="cs">&quot;pdf&quot;</span><br />
          {"  "}label=<span className="cs">&quot;⬇ Export PDF&quot;</span><br />
          {"  "}variant=<span className="cs">&quot;primary&quot;</span><br />
          {"  "}onSuccess={"{"}f =&gt; toast(<span className="cs">{`Downloaded \${f}`}</span>){"}"}<br />
          /&gt;
        </>
      ),
    };
    return examples[key] || null;
  };

  const renderArchView = () => (
    <div className="archDiagram">
      <div className="diagTitle">Module Federation — Architecture</div>
      <div className="diagSub">How Report Studio exposes its Run Module and how host apps consume it at runtime via cookie-based shared authentication.</div>

      <div className="threeCol" style={{ marginBottom: '0' }}>
        <div className="diagBox highlight">
          <div className="diagBoxLabel">Host App A</div>
          <div className="diagBoxTitle">Admissions Portal</div>
          <div className="diagBoxDesc">{`app.navacle.io · React 18 + Vite`} <br />Embeds ReportRunner in enquiry list page</div>
          <div className="diagBoxTags"><span className="badge badgeInfo">React 18</span><span className="badge badgeMute">Vite</span><span className="badge badgeMute">app.navacle.io</span></div>
        </div>
        <div className="diagBox highlight">
          <div className="diagBoxLabel">Host App B</div>
          <div className="diagBoxTitle">Finance Dashboard</div>
          <div className="diagBoxDesc">{`finance.navacle.io · React 18 + Webpack 5`} <br />Embeds DownloadButton in invoice page</div>
          <div className="diagBoxTags"><span className="badge badgeInfo">React 18</span><span className="badge badgeMute">Webpack 5</span><span className="badge badgeMute">finance.navacle.io</span></div>
        </div>
        <div className="diagBox remote">
          <div className="diagBoxLabel">🟢 MFE Remote</div>
          <div className="diagBoxTitle">Report Studio</div>
          <div className="diagBoxDesc">{`studio.navacle.io · Exposes remoteEntry.js`} <br />Serves ReportRunner, ReportBrowser, DownloadButton</div>
          <div className="diagBoxTags"><span className="badge badgeSuccess">exposes 3 modules</span><span className="badge badgeMute">studio.navacle.io</span></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', margin: '0' }}>
        <div className="diagArrowV">↓ integration</div>
        <div className="diagArrowV">↓ integration</div>
        <div className="diagArrowV">↑ provides modules</div>
      </div>

      <div className="diagBox auth" style={{ marginBottom: '0' }}>
        <div className="diagBoxLabel">⚡ Runtime module loading</div>
        <div className="diagBoxTitle">Module Federation Runtime</div>
        <div className="diagBoxDesc">
          Both host apps reference the Report Studio remote entry — the bundle is fetched and cached at runtime. No version pinning, no local build dependency.
        </div>
      </div>

      <div className="diagArrowV" style={{ margin: '0' }}>↕ shared authentication</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '0' }}>
        <div className="diagBox auth">
          <div className="diagBoxLabel">🍪 Shared Session</div>
          <div className="diagBoxTitle">navacle_session</div>
          <div className="diagBoxDesc">Shared session cookie automatically sent by the browser. The MFE widget reads the tenant/branch context from the session.</div>
          <div className="diagBoxTags">
            <span className="badge" style={{ background: '#FEF3C7', color: '#92400E' }}>Shared Auth</span>
          </div>
        </div>
        <div className="diagBox">
          <div className="diagBoxLabel">🔗 Report Service API</div>
          <div className="diagBoxTitle">api.navacle.io</div>
          <div className="diagBoxDesc">{`POST /v1/reports/generate/:slug`} <br />Cookie forwarded automatically — backend validates session, resolves tenantId + branchId from it. No token in JS code.</div>
          <div className="diagBoxTags"><span className="badge badgeMute">api.navacle.io</span><span className="badge badgeSuccess">RBAC via cookie</span></div>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '10px' }}>Data flow for a single report generation</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            ['1', 'User clicks &quot;Generate Report&quot; in host app', 'Host app DOM event — no cross-origin needed'],
            ['2', 'ReportRunner widget calls POST /v1/reports/generate/slug', 'Fetch from studio.navacle.io → api.navacle.io, cookie auto-attached'],
            ['3', 'API validates navacle_session cookie', 'Resolves userId, tenantId, branchId — no token parsing in JS'],
            ['4', 'Report Service queries data with RBAC filters', 'Row-level security applied based on session context'],
            ['5', 'Binary file returned via Content-Disposition header', 'Browser triggers download — file never touches host app JS'],
            ['6', 'onSuccess(fileName) callback fires in host app', 'Host app can show a toast or update its own UI'],
          ].map(([n, t, d]) => (
            <div className="connLine" key={n}>
              <span className="stepBadge">{n}</span>
              <div><b>{t}</b><br /><span style={{ fontSize: '10px', color: 'var(--mute)' }}>{d}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="runModeBody">
      <div className="topbar">
        <div className="logo">
          <span>Navacle</span> Report Studio <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)', marginLeft: '8px', fontWeight: '400' }}>— Modules / Run Mode</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="statusPill spSuccess">● Active</span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)' }}>navacle_rs core</span>
        </div>
      </div>

      <div className="main">
        <div className="archPanel">
          <div style={{ padding: '14px 14px 10px' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--surface)', marginBottom: '2px' }}>Run Mode</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)' }}>Module Federation Strategy</div>
          </div>
          <div className="archDivider"></div>
          <div className="archSection">Explore</div>
          <div className={`archNav ${currentView === 'arch' ? 'archNavActive' : ''}`} onClick={() => setCurrentView('arch')}>
            <span className="archNavIcon">🗺</span>Architecture Overview
          </div>
          <div className={`archNav ${currentView === 'remote' ? 'archNavActive' : ''}`} onClick={() => setCurrentView('remote')}>
            <span className="archNavIcon">📦</span>Remote — Report Studio<span className="archBadge badgeGreen">Exposes</span>
          </div>
          <div className={`archNav ${currentView === 'host' ? 'archNavActive' : ''}`} onClick={() => setCurrentView('host')}>
            <span className="archNavIcon">🏠</span>Host App Simulator<span className="archBadge badgeBlue">Live</span>
          </div>
          <div className={`archNav ${currentView === 'webpack' ? 'archNavActive' : ''}`} onClick={() => setCurrentView('webpack')}>
            <span className="archNavIcon">⚙</span>Webpack / Vite Config
          </div>
          <div className={`archNav ${currentView === 'cookieauth' ? 'archNavActive' : ''}`} onClick={() => setCurrentView('cookieauth')}>
            <span className="archNavIcon">🍪</span>Cookie Auth Flow
          </div>
          <div className="archDivider"></div>
          <div className="archSection">Exposed Modules</div>
          <div className={`archNav ${currentView === 'remote' && exposedModule === 'runner' ? 'archNavActive' : ''}`} onClick={() => { setCurrentView('remote'); setExposedModule('runner'); }}>
            <span className="archNavIcon">▶</span>./ReportRunner<span className="archBadge badgeGreen">Primary</span>
          </div>
          <div className={`archNav ${currentView === 'remote' && exposedModule === 'browser' ? 'archNavActive' : ''}`} onClick={() => { setCurrentView('remote'); setExposedModule('browser'); }}>
            <span className="archNavIcon">☰</span>./ReportBrowser
          </div>
          <div className={`archNav ${currentView === 'remote' && exposedModule === 'button' ? 'archNavActive' : ''}`} onClick={() => { setCurrentView('remote'); setExposedModule('button'); }}>
            <span className="archNavIcon">⬇</span>./DownloadButton
          </div>
          <div className="archDivider"></div>
          <div className="archSection">Quick actions</div>
          <div className="archNav" onClick={simulateExpire}>
            <span className="archNavIcon">⚠</span>Simulate session expire
          </div>
          <div className="archNav" onClick={() => { setCurrentView('host'); showToast('Reloading widget...'); }}>
            <span className="archNavIcon">↻</span>Reload widget
          </div>
          <div style={{ marginTop: 'auto', padding: '16px' }}>
            <div style={{ background: 'rgba(22, 163, 74, 0.1)', border: '1px solid rgba(22, 163, 74, 0.2)', padding: '12px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' }}></div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--green)' }}>Session Active</div>
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.4' }}>
                Domain: <span style={{ color: 'var(--green)' }}>.navacle.io</span><br />
                User: <b>Vedha</b><br />
                Tenant: 5 · Branch: <b>10</b>
              </div>
            </div>
          </div>
        </div>

        <div className="canvas">
          <div className="canvasTabs">
            <div className={`canvasTab ${currentView === 'arch' ? 'canvasTabActive' : ''}`} onClick={() => setCurrentView('arch')}>
              <span className="tabDot" style={{ background: '#8B5CF6' }}></span>Architecture
            </div>
            <div className={`canvasTab ${currentView === 'remote' ? 'canvasTabActive' : ''}`} onClick={() => setCurrentView('remote')}>
              <span className="tabDot" style={{ background: 'var(--green)' }}></span>Remote
            </div>
            <div className={`canvasTab ${currentView === 'host' ? 'canvasTabActive' : ''}`} onClick={() => setCurrentView('host')}>
              <span className="tabDot" style={{ background: 'var(--blue)' }}></span>Host App Demo
            </div>
            <div className={`canvasTab ${currentView === 'webpack' ? 'canvasTabActive' : ''}`} onClick={() => setCurrentView('webpack')}>
              <span className="tabDot" style={{ background: 'var(--amber)' }}></span>Config
            </div>
            <div className={`canvasTab ${currentView === 'cookieauth' ? 'canvasTabActive' : ''}`} onClick={() => setCurrentView('cookieauth')}>
              <span className="tabDot" style={{ background: '#EC4899' }}></span>Cookie Auth
            </div>
          </div>

          <div className="canvasBody">
            {currentView === 'arch' && (
              <div className="view viewActive">
                {renderArchView()}
              </div>
            )}

            {currentView === 'remote' && (
              <div className="view viewActive">
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <div className="remoteHeader">
                    <div>
                      <div className="remoteTitle">Remote — Report Studio exposes</div>
                      <div className="remoteSubtitle">studio.navacle.io/remoteEntry.js · 3 modules</div>
                    </div>
                    <div style={{ flex: 1 }}></div>
                    <span className="statusPill spSuccess">● Remote live</span>
                  </div>
                  <div className="exposedList">
                    <div className={`exposedItem ${exposedModule === 'runner' ? 'exposedItemActive' : ''}`} onClick={() => setExposedModule('runner')}>
                      <div className="exposedIcon">▶</div>
                      <div style={{ flex: 1 }}>
                        <div className="exposedName">ReportRunner</div>
                        <div className="exposedPath">{`import('navacle-report-studio/ReportRunner')`}</div>
                        <div className="exposedDesc">{`Full report execution widget. Shows parameter form, format picker, and generate button. Primary module for embedding in any page.`} </div>
                        <div className="exposedTags"><span className="badge badgeSuccess">Primary</span><span className="badge badgeInfo">Full widget</span><span className="badge badgeMute">340×auto px</span></div>
                      </div>
                    </div>
                    <div className={`exposedItem ${exposedModule === 'browser' ? 'exposedItemActive' : ''}`} onClick={() => setExposedModule('browser')}>
                      <div className="exposedIcon">☰</div>
                      <div style={{ flex: 1 }}>
                        <div className="exposedName">ReportBrowser</div>
                        <div className="exposedPath">{`import('navacle-report-studio/ReportBrowser')`}</div>
                        <div className="exposedDesc">{`Searchable list of all available reports for the current user. Clicking a report opens the ReportRunner inline.`} </div>
                        <div className="exposedTags"><span className="badge badgeInfo">List + runner</span><span className="badge badgeMute">full-width</span></div>
                      </div>
                    </div>
                    <div className={`exposedItem ${exposedModule === 'button' ? 'exposedItemActive' : ''}`} onClick={() => setExposedModule('button')}>
                      <div className="exposedIcon">⬇</div>
                      <div style={{ flex: 1 }}>
                        <div className="exposedName">DownloadButton</div>
                        <div className="exposedPath">{`import('navacle-report-studio/DownloadButton')`}</div>
                        <div className="exposedDesc">{`Minimal single-button component. On click, generates and downloads the report with preset params. Perfect for inline use in data tables.`} </div>
                        <div className="exposedTags"><span className="badge badgeMute">Micro widget</span><span className="badge badgeMute">button-size</span></div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '0 20px 20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text)' }}>
                      {REPORT_MODULES[exposedModule].label} — Props
                    </div>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--rl)', overflow: 'hidden' }}>
                      <table className="propTable">
                        <thead><tr><th>Prop</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
                        <tbody>
                          {REPORT_MODULES[exposedModule].props.map((p) => (
                            <tr key={p.name}>
                              <td className="propName">{p.name}</td>
                              <td className="propType">{p.type}</td>
                              <td className={p.req ? 'propReq' : 'propOpt'}>{p.req ? '✓ Required' : 'Optional'}</td>
                              <td style={{ color: 'var(--mute)', fontSize: '11px' }}>{p.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ marginTop: '14px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--tm)', marginBottom: '6px' }}>Usage example</div>
                      <div className="codeWrap">
                        <div className="codeBar">
                          <span className="codeLang">TypeScript · React</span>
                          <button className="codeCopy" onClick={() => copyCode(getUsageExampleCode(exposedModule))}>Copy</button>
                        </div>
                        <div className="codeBody" style={{ whiteSpace: 'pre-wrap' }}>
                          {getUsageExampleJSX(exposedModule)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'host' && (
              <div className="view viewActive">
                <div className="hostShell">
                  <div className="hostSidebar">
                    <div className="hostSidebarHd">
                      <span style={{ fontSize: '16px' }}>🏫</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '800' }}>Navacle ERP</div>
                        <div style={{ fontSize: '10px', color: 'var(--faint)' }}>app.navacle.io</div>
                      </div>
                    </div>
                    <div style={{ padding: '6px' }}>
                      {[
                        { id: 'enquiries', icon: '📋', label: 'Enquiries' },
                        { id: 'admissions', icon: '🎓', label: 'Admissions' },
                        { id: 'finance', icon: '💰', label: 'Finance' },
                        { id: 'reports', icon: '📊', label: 'All Reports' },
                        { id: 'settings', icon: '⚙', label: 'Settings' },
                      ].map(item => (
                        <div 
                          key={item.id} 
                          className={`hostNav ${hostPage === item.id ? 'hostNavActive' : ''}`} 
                          onClick={() => setHostPage(item.id)}
                        >
                          <span className="hostNavIcon">{item.icon}</span>{item.label}
                        </div>
                      ))}
                    </div>
                    <div className="sessionContextSummary">
                      <div className="sessionContextTitle">Session Context</div>
                      <div className="sessionContextRow"><span>User:</span> <span className="sessionContextValue">Vedha</span></div>
                      <div className="sessionContextRow"><span>Tenant:</span> <span className="sessionContextValue">5</span></div>
                      <div className="sessionContextRow"><span>Branch:</span> <span className="sessionContextValue">Chennai HQ</span></div>
                      <div className="sessionContextRow"><span>Role:</span> <span className="sessionContextValue">Admin</span></div>
                    </div>
                    <div className="sessionCookieBanner">
                      <div className="sessionCookieIcon">🍪</div>
                      <div className="sessionCookieText">
                        <b>navacle_session</b> cookie active <br />
                        Domain: .navacle.io — HttpOnly
                      </div>
                    </div>
                  </div>

                  <div className="hostMain">
                    <div className="hostTopbar">
                      <span className="hostTopbarTitle">{hostPage.charAt(0).toUpperCase() + hostPage.slice(1)}</span>
                      <div style={{ flex: 1 }}></div>
                      <button className="btn btnSm" onClick={() => showToast('Filters applied')}>⊞ Filters</button>
                      <button className="btn btnSm btnPrimary" onClick={() => setShowNewEnquiry(true)}>+ New Enquiry</button>
                    </div>

                    <div 
                      className="authBar" 
                      style={sessionExpired ? { background: '#FEF2F2', borderBottomColor: '#FECACA' } : {}}
                    >
                      {sessionExpired ? (
                        <>
                          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }}></div>
                          <span style={{ fontWeight: '700', color: 'var(--red)' }}>Session Expired</span>
                          <span style={{ color: 'var(--red)', fontSize: '11px' }}>navacle_session cookie expired — API returns 401</span>
                          <div style={{ flex: 1 }}></div>
                          <span className="badge" style={{ background: '#FEE2E2', color: '#991B1B' }}>Cookie invalid</span>
                        </>
                      ) : (
                        <>
                          <div className="authDot"></div>
                          <span className="authUser">Vedha</span>
                          <span className="authMeta">Tenant 5 · Chennai HQ · Admin</span>
                          <div style={{ flex: 1 }}></div>
                          <span className="authCookie" style={{ maxWidth: '280px' }}>navacle_session=eyJhbGciOiJIUzI1NiJ9...</span>
                          <span className="badge badgeSuccess">Cookie valid</span>
                        </>
                      )}
                    </div>

                    <div className="hostContent">
                      {hostPage === 'enquiries' && (
                        <div className="hostPage hostPageActive" style={{ flexDirection: 'row' }}>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div className="ctxBanner" style={{ background: '#FFF7ED', borderBottomColor: '#FFEDD5', color: '#9A3412' }}>
                              <span style={{ fontSize: '14px' }}>📋</span> ReportRunner MFE loaded &nbsp; <b>reportSlug=&quot;submitted-enquiries&quot;</b> &nbsp; <span style={{ opacity: 0.7 }}>· context auto-resolved from cookie</span>
                            </div>
                            <div style={{ flex: 1, overflow: 'auto' }}>
                              <table className="dataTable">
                                <thead>
                                  <tr><th>Enquiry #</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Date</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                  {ENQUIRY_DATA.map(r => (
                                    <tr key={r.no}>
                                      <td style={{  fontSize: '11px', fontWeight: '600' }}>{r.no}</td>
                                      <td style={{ fontWeight: '600' }}>{r.name}</td>
                                      <td style={{ fontSize: '11px', color: 'var(--mute)' }}>{r.email}</td>
                                      <td style={{ fontSize: '11px', color: 'var(--mute)' }}>{r.phone}</td>
                                      <td>
                                        <span className={`statusPill ${r.status === 'SUBMITTED' || r.status === 'APPROVED' ? 'spSuccess' : r.status === 'PENDING' ? 'spWarn' : 'spFail'}`}>
                                          ● {r.status}
                                        </span>
                                      </td>
                                      <td style={{ fontSize: '11px', color: 'var(--mute)' }}>{r.date}</td>
                                      <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                          <button className="btn btnSm" onClick={() => showToast(`Viewing ${r.no}`)}>View</button>
                                          <button className="btn btnSm btnPrimary" onClick={() => handleRrGenerate()}>Run</button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          <div className="mfeSidebar">
                            <div className="mfeBadgeBar">
                              <div className="mfeBadgeIcon">MFE</div>
                              ReportRunner · navacle-report-studio/ReportRunner
                            </div>
                            <div className="reportRunner">
                              {sessionExpired ? (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '10px', textAlign: 'center' }}>
                                  <span style={{ fontSize: '36px' }}>🔒</span>
                                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--red)' }}>Session Expired</div>
                                  <div style={{ fontSize: '12px', color: 'var(--mute)' }}>Your navacle_session cookie has expired. onError(401) fired.</div>
                                  <button className="btn btnPrimary" style={{ marginTop: '8px' }} onClick={restoreSession}>↻ Restore Session</button>
                                  <div className="codeWrap" style={{ width: '100%', marginTop: '8px', textAlign: 'left' }}>
                                    <div className="codeBar" style={{ background: 'rgba(220,38,38,.15)' }}><span className="codeLang" style={{ color: '#FCA5A5' }}>onError handler in host app</span></div>
                                    <div className="codeBody" style={{ fontSize: '10px' }}>
                                      {`onError={err => {
  if (err.code === 'SESSION_EXPIRED') {
    window.location.href =
      'https://auth.navacle.io/login' +
      '?return_to=' + encodeURIComponent(location.href)
  }
}}`}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="rrHeader">
                                    <div className="rrTitle">Submitted Enquiries</div>
                                    <div className="rrDesc">All enquiries with status SUBMITTED for current tenant.</div>
                                    <div className="rrMetaInfo">
                                      <div className="rrMetaItem">Endpoint: <b>my-enquiries</b></div>
                                      <div className="rrMetaItem">Mode: <b>list</b></div>
                                      <div className="rrMetaItem">DB: <b>ERP</b></div>
                                    </div>
                                  </div>
                                  <div className="rrSection">
                                    <div className="rrSectionLabel">PARAMETERS</div>
                                    <div className="rrFormField">
                                      <div className="rrFormLabel">status</div>
                                      <select className="rrInput" value="SUBMITTED" disabled>
                                        <option>SUBMITTED</option><option>PENDING</option><option>APPROVED</option>
                                      </select>
                                    </div>
                                    <div className="rrFormField">
                                      <div className="rrFormLabel">startDate</div>
                                      <div style={{ position: 'relative' }}>
                                        <input className="rrInput" type="text" value="01 - 01 - 2026" readOnly />
                                        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>📅</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="rrSection">
                                    <div className="rrSectionLabel">CONTEXT <span className="autoBadge" style={{ background: 'var(--blue-soft)', color: 'var(--blue)' }}>AUTO FROM COOKIE</span></div>
                                    <div className="rrFormField">
                                      <div className="rrFormLabel">tenantId</div>
                                      <input className="rrInput" value="5" disabled />
                                    </div>
                                    <div className="rrFormField">
                                      <div className="rrFormLabel">branchId</div>
                                      <input className="rrInput" value="10 — Chennai HQ" disabled />
                                    </div>
                                  </div>
                                  <div className="fmtCards">
                                    {[
                                      { id: 'xlsx', icon: '📊', label: 'Excel', ext: '.xlsx' },
                                      { id: 'csv', icon: '📄', label: 'CSV', ext: '.csv' },
                                      { id: 'pdf', icon: '📋', label: 'PDF', ext: '.pdf' },
                                    ].map(f => (
                                      <div key={f.id} className={`fmtCard ${rrFmt === f.id ? 'fmtCardActive' : ''}`} onClick={() => setRrFmt(f.id)}>
                                        <div className="fmtCardIcon">{f.icon}</div>
                                        <div className="fmtCardLabel">{f.label}</div>
                                        <div className="fmtCardExt">{f.ext}</div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="rrFooter">
                                    <button className="genBtn" disabled={rrGenerating} onClick={handleRrGenerate}>
                                      {rrGenerating ? '⏳ Generating…' : (
                                        <><span style={{ fontSize: '16px' }}>↓</span> Generate Report</>
                                      )}
                                    </button>
                                    <div className="genProgress" style={{ display: rrGenerating ? 'block' : 'none' }}>
                                      <div className="genProgressBar" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <div className={`genToast ${showRrToast ? 'genToastShow' : ''}`}>
                                      ✓ <span>{rrToastMsg}</span>
                                    </div>
                                    <div className="cookieIndicator" style={{ background: '#FFFBEB', border: '1px solid #FCD34D', color: '#92400E' }}>
                                      <b>Auth via navacle_session</b> cookie — no token prop needed
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {hostPage === 'finance' && (
                        <div className="hostPage hostPageActive">
                           <div className="ctxBanner">
                              📡 DownloadButton MFE · <code style={{  }}>reportSlug=&quot;invoice-summary&quot;</code> · inline button mode
                           </div>
                           <div style={{ flex: 1, padding: '16px' }}>
                              <table className="dataTable">
                                <thead>
                                  <tr><th>Invoice #</th><th>Branch</th><th>Amount</th><th>Due Date</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                  {INVOICE_DATA.map(r => (
                                    <tr key={r.no}>
                                      <td style={{  }}>{r.no}</td>
                                      <td>{r.branch}</td>
                                      <td>{r.amount}</td>
                                      <td>{r.due}</td>
                                      <td><button className="btn btnSm" onClick={() => showToast(`Viewing ${r.no}`)}>View</button></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                           </div>
                        </div>
                      )}

                      {hostPage === 'reports' && (
                        <div className="hostPage hostPageActive">
                          <div className="ctxBanner">
                            📡 ReportBrowser MFE · shows reports filtered by cookie
                          </div>
                          <div style={{ padding: '20px' }}>
                            <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '10px' }}>All Reports</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              {[
                                { slug: 'enq', name: 'Enquiry List', icon: '📋' },
                                { slug: 'inv', name: 'Invoices', icon: '💰' },
                                { slug: 'stud', name: 'Students', icon: '🎓' },
                                { slug: 'staff', name: 'Staff', icon: '👤' }
                              ].map(r => (
                                <div key={r.slug} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ fontSize: '20px' }}>{r.icon}</span>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '700' }}>{r.name}</div>
                                  </div>
                                  <button className="btn btnSm" onClick={() => showToast(`Running ${r.name}...`)}>Run</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'webpack' && (
              <div className="view viewActive">
                <div className="configView">
                  <div className="configTitle">Webpack 5 / Vite Configuration</div>
                  <div className="flowBanner">
                    <div className="flowIcon">💡</div>
                    <div>
                      <div className="flowTitle">Cookie auth means zero auth config in webpack</div>
                      <div className="flowDesc">{`Because authentication uses a shared .navacle.io cookie, neither the remote nor the host needs to pass tokens.`}</div>
                    </div>
                  </div>
                  <div className="stepRow">
                    <div className="stepNum">1</div>
                    <div className="stepContent">
                      <div className="stepTitle">Remote — Report Studio (webpack.config.js)</div>
                      <div className="codeWrap">
                        <div className="codeBar"><span className="codeLang">webpack.config.js · studio.navacle.io</span><button className="codeCopy" onClick={() => copyCode('ModuleFederationPlugin code...')}>Copy</button></div>
                        <div className="codeBody">
                          <span className="ck">const</span> {'{'} ModuleFederationPlugin {'}'} = <span className="ck">require</span>(<span className="cs">&apos;webpack/lib/container/ModuleFederationPlugin&apos;</span>)<br /><br />
                          module.exports = {'{'}<br />
                          {'  '}<span className="co">{`// ... other config`}</span><br />
                          {'  '}plugins: [<br />
                          {'    '}<span className="ck">new</span> <span className="cp">ModuleFederationPlugin</span>({'{'}<br />
                          {'      '}name: <span className="cs">&apos;navacle_rs&apos;</span>,<br />
                          {'      '}filename: <span className="cs">&apos;remoteEntry.js&apos;</span>,<br />
                          {'      '}exposes: {'{'}<br />
                          {'        '}<span className="co">{`// Full run widget`}</span><br />
                          {'        '}<span className="cs">&apos;./ReportRunner&apos;</span>:    <span className="cs">&apos;./src/mfe/ReportRunner&apos;</span>,<br />
                          {'        '}<span className="co">{`// Browsable list`}</span><br />
                          {'        '}<span className="cs">&apos;./ReportBrowser&apos;</span>:   <span className="cs">&apos;./src/mfe/ReportBrowser&apos;</span>,<br />
                          {'        '}<span className="co">{`// Inline button`}</span><br />
                          {'        '}<span className="cs">&apos;./DownloadButton&apos;</span>:  <span className="cs">&apos;./src/mfe/DownloadButton&apos;</span>,<br />
                          {'      '}{'}'},<br />
                          {'      '}shared: {'{'}<br />
                          {'        '}react:     {'{'} singleton: <span className="cv">true</span>, requiredVersion: <span className="cs">&apos;^18.0.0&apos;</span> {'}'},<br />
                          {'        '}<span className="cs">&apos;react-dom&apos;</span>: {'{'} singleton: <span className="cv">true</span>, requiredVersion: <span className="cs">&apos;^18.0.0&apos;</span> {'}'},<br />
                          {'      '}{'}'},<br />
                          {'    '}{'}'}),<br />
                          {'  '}]<br />
                          {'}'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'cookieauth' && (
              <div className="view viewActive">
                <div className="authView">
                  <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>Cookie Authentication Flow</div>
                  <div className="authFlowDiagram">
                    <div style={{ marginLeft: '12px' }}>
                      {[
                        { n: '1', title: 'User logs in at auth.navacle.io', desc: 'Standard login form. Single cookie on .navacle.io.', color: 'var(--blue)' },
                        { n: '2', title: 'Cookie attributes', desc: 'HttpOnly, Secure, SameSite=Lax, Domain=.navacle.io.', color: 'var(--amber)' },
                        { n: '3', title: 'Host app loads', desc: 'Already authenticated via cookie.', color: 'var(--green)' },
                        { n: '4', title: 'MFE mounts', desc: 'Fetched from studio.navacle.io.', color: 'var(--blue)' },
                        { n: '5', title: 'API call', desc: 'Cookie attached automatically by browser.', color: 'var(--blue)' },
                        { n: '6', title: 'API validates', desc: 'Resolves tenant/branch from cookie.', color: 'var(--green)' },
                        { n: '7', title: 'Expiry', desc: '401 status handled by host.', color: 'var(--red)' },
                      ].map(s => (
                        <div className="authStep" key={s.n}>
                          <div className="authStepDot" style={{ background: s.color }}>{s.n}</div>
                          <div className="authStepContent">
                            <div className="authStepTitle">{s.title}</div>
                            <div className="authStepDesc">{s.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="toast" style={{ display: globalToast.show ? 'block' : 'none' }}>
        {globalToast.msg}
      </div>

      {showNewEnquiry && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '12px', width: '360px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>New Enquiry</div>
            <form onSubmit={handleNewEnquirySubmit}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Full Name</div>
                <input 
                  className="rrInput" 
                  value={newEnquiry.name} 
                  onChange={e => setNewEnquiry({...newEnquiry, name: e.target.value})}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Email Address</div>
                <input 
                  className="rrInput" 
                  type="email"
                  value={newEnquiry.email} 
                  onChange={e => setNewEnquiry({...newEnquiry, email: e.target.value})}
                  placeholder="e.g. john@example.com"
                  required
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Phone Number</div>
                <input 
                  className="rrInput" 
                  value={newEnquiry.phone} 
                  onChange={e => setNewEnquiry({...newEnquiry, phone: e.target.value})}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowNewEnquiry(false)}>Cancel</button>
                <button type="submit" className="btn btnPrimary" style={{ flex: 1 }}>Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
