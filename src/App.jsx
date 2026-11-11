import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, Bot, Brain, CheckCircle2, Circle, Code2, Command, FolderKanban,
  LayoutDashboard, ListTodo, MessageSquare, Palette, Plus, Search, Settings,
  ShieldCheck, Sparkles, Terminal, Trash2, X, Zap, Menu, ChevronRight
} from 'lucide-react';

const starterAgents = [
  { id: 'developer', name: 'Developer AI', role: 'Build apps and write code', icon: Code2, status: 'Ready' },
  { id: 'researcher', name: 'Research AI', role: 'Research and summarize information', icon: Search, status: 'Ready' },
  { id: 'designer', name: 'Designer AI', role: 'Create designs and visual concepts', icon: Palette, status: 'Planned' },
  { id: 'tester', name: 'Tester AI', role: 'Review quality and find issues', icon: ShieldCheck, status: 'Ready' },
];

const starterProjects = [
  { id: 'nexus', name: 'NEXUS AI OS', detail: 'Personal AI operating system', status: 'In progress', progress: 20 },
];

function readStore(key, fallback) {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
}

export default function App() {
  const [page, setPage] = useState('Dashboard');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [projects, setProjects] = useState(() => readStore('nexus-projects', starterProjects));
  const [tasks, setTasks] = useState(() => readStore('nexus-tasks', []));
  const [agents] = useState(starterAgents);
  const [newProject, setNewProject] = useState('');
  const [newTask, setNewTask] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [messages, setMessages] = useState(() => readStore('nexus-chat', [
    { role: 'assistant', text: 'Hello! I am your NEXUS command interface. I can organize projects and tasks here. External AI actions will need an AI provider connection.' }
  ]));
  const [searchText, setSearchText] = useState('');

  useEffect(() => localStorage.setItem('nexus-projects', JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem('nexus-tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('nexus-chat', JSON.stringify(messages)), [messages]);

  const completed = tasks.filter(t => t.done).length;
  const pending = tasks.length - completed;
  const nav = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'AI Commander', icon: MessageSquare },
    { label: 'Projects', icon: FolderKanban },
    { label: 'Tasks', icon: ListTodo },
    { label: 'AI Agents', icon: Bot },
    { label: 'Settings', icon: Settings },
  ];

  function addProject(e) {
    e.preventDefault();
    if (!newProject.trim()) return;
    setProjects(p => [...p, { id: crypto.randomUUID(), name: newProject.trim(), detail: 'New project', status: 'Planning', progress: 0 }]);
    setNewProject('');
  }

  function addTask(e) {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks(t => [{ id: crypto.randomUUID(), title: newTask.trim(), done: false, created: new Date().toLocaleDateString() }, ...t]);
    setNewTask('');
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!chatInput.trim() || aiLoading) return;
    const text = chatInput.trim();
    const history = [...messages.filter(m => !(m.role === 'assistant' && String(m.text || '').startsWith('Connection error:'))), { role: 'user', text }];
    setMessages(history);
    setChatInput('');
    setAiLoading(true);
    try {
      const response = await fetch('/.netlify/functions/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, history: history.slice(-12) }) });
      const raw = await response.text();
      let data;
      try { data = JSON.parse(raw); }
      catch { throw new Error('Server returned non-JSON (HTTP ' + response.status + '): ' + raw.slice(0, 250)); }
      if (!response.ok) throw new Error(data.error || data.message || ('AI request failed (HTTP ' + response.status + '): ' + JSON.stringify(data)));
      if (!data.reply) throw new Error(data.error || 'The AI server returned no reply.');
      setMessages(m => [...m, { role: 'assistant', text: data.reply }]);
    } catch (error) {
      setMessages(m => [...m, { role: 'assistant', text: 'Connection error: ' + error.message + ' — Check that GEMINI_API_KEY is added in Netlify environment variables, then redeploy.' }]);
    } finally { setAiLoading(false); }
  }

  const filteredTasks = useMemo(() => tasks.filter(t => t.title.toLowerCase().includes(searchText.toLowerCase())), [tasks, searchText]);

  function content() {
    if (page === 'AI Commander') return <section className="panel chat-panel">
      <div className="section-title"><div><span className="eyebrow">COMMAND CENTER</span><h2>AI Commander</h2></div><span className="live-pill"><i /> Local workspace</span></div>
      <div className="messages">{messages.map((m, i) => <div className={'message ' + m.role} key={i}><div className="message-avatar">{m.role === 'assistant' ? <Bot size={17}/> : 'You'}</div><p>{m.text}</p></div>)}</div>
      <form className="chat-form" onSubmit={sendMessage}><input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Give NEXUS an instruction..." /><button className="primary" type="submit" disabled={aiLoading}><Zap size={16}/> {aiLoading ? "Thinking..." : "Send"}</button></form>
      <p className="muted tiny">Powered by Gemini AI. Your chat history stays in this browser; AI requests use a secure server function.</p>
    </section>;

    if (page === 'Projects') return <section className="panel">
      <div className="section-title"><div><span className="eyebrow">WORKSPACE</span><h2>Projects</h2></div><span className="count-badge">{projects.length} total</span></div>
      <form className="inline-form" onSubmit={addProject}><input value={newProject} onChange={e => setNewProject(e.target.value)} placeholder="Enter a project name..." /><button className="primary"><Plus size={16}/> Add project</button></form>
      <div className="project-grid">{projects.map(p => <article className="project-card" key={p.id}><div className="project-icon"><FolderKanban/></div><span className="tag">{p.status}</span><h3>{p.name}</h3><p>{p.detail}</p><div className="progress-track"><span style={{width: p.progress + '%'}} /></div><small>{p.progress}% progress</small>{p.id !== 'nexus' && <button className="icon-button delete" onClick={() => setProjects(a => a.filter(x => x.id !== p.id))} aria-label="Delete project"><Trash2 size={16}/></button>}</article>)}</div>
    </section>;

    if (page === 'Tasks') return <section className="panel">
      <div className="section-title"><div><span className="eyebrow">EXECUTION</span><h2>Task Manager</h2></div><span className="count-badge">{pending} pending</span></div>
      <form className="inline-form" onSubmit={addTask}><input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="What needs to get done?" /><button className="primary"><Plus size={16}/> Add task</button></form>
      <div className="task-toolbar"><span>{completed} completed · {pending} pending</span><input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search tasks..." /></div>
      <div className="task-list">{filteredTasks.length ? filteredTasks.map(t => <div className={'task-row ' + (t.done ? 'is-done' : '')} key={t.id}><button className="check-button" onClick={() => setTasks(a => a.map(x => x.id === t.id ? {...x, done: !x.done} : x))}>{t.done ? <CheckCircle2/> : <Circle/>}</button><span>{t.title}</span><small>{t.created}</small><button className="icon-button delete" onClick={() => setTasks(a => a.filter(x => x.id !== t.id))}><Trash2 size={15}/></button></div>) : <div className="empty"><ListTodo size={28}/><p>No tasks yet. Add your first task above.</p></div>}</div>
    </section>;

    if (page === 'AI Agents') return <section className="panel">
      <div className="section-title"><div><span className="eyebrow">YOUR AI TEAM</span><h2>AI Agent Center</h2></div><span className="count-badge">{agents.length} agents</span></div>
      <div className="agent-grid">{agents.map(a => <article className="agent-card" key={a.id}><div className="agent-icon"><a.icon size={22}/></div><span className={a.status === 'Ready' ? 'agent-status ready' : 'agent-status'}>{a.status}</span><h3>{a.name}</h3><p>{a.role}</p><button className="secondary" onClick={() => setPage('AI Commander')}>Open commander <ChevronRight size={15}/></button></article>)}</div>
      <p className="muted tiny note">Agent cards are configured as workspace roles. They do not run independently until their AI services and permissions are connected.</p>
    </section>;

    if (page === 'Settings') return <section className="panel">
      <div className="section-title"><div><span className="eyebrow">PREFERENCES</span><h2>Settings</h2></div></div>
      <div className="settings-row"><div><b>NEXUS AI OS</b><p>Personal AI operating system</p></div><span className="tag">Version 1.0</span></div>
      <div className="settings-row"><div><b>Storage</b><p>Projects, tasks and chat are saved in this browser on this device.</p></div><span className="live-pill"><i/> Local</span></div>
      <div className="settings-row"><div><b>AI provider</b><p>No external AI provider is connected yet.</p></div><span className="tag warning">Not connected</span></div>
      <button className="secondary" onClick={() => { if (confirm('Clear all NEXUS projects, tasks and chat history from this browser?')) { localStorage.removeItem('nexus-projects'); localStorage.removeItem('nexus-tasks'); localStorage.removeItem('nexus-chat'); location.reload(); } }}>Reset local workspace</button>
    </section>;

    return <>
      <section className="welcome panel"><div><span className="eyebrow">YOUR PERSONAL AI WORKSPACE</span><h2>Welcome back, Owner.</h2><p>One command center for your projects, tasks and AI team.</p><div className="welcome-actions"><button className="primary" onClick={() => setPage('AI Commander')}><MessageSquare size={16}/> Open AI Commander</button><button className="secondary" onClick={() => setPage('Projects')}><Plus size={16}/> New project</button></div></div><div className="orb"><Brain size={42}/><span/></div></section>
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-icon green"><Bot/></span><div><small>AI AGENTS</small><strong>{agents.length}</strong><p>Configured roles</p></div></div>
        <div className="stat-card"><span className="stat-icon blue"><FolderKanban/></span><div><small>PROJECTS</small><strong>{projects.length}</strong><p>In your workspace</p></div></div>
        <div className="stat-card"><span className="stat-icon purple"><ListTodo/></span><div><small>PENDING TASKS</small><strong>{pending}</strong><p>{completed} completed</p></div></div>
        <div className="stat-card"><span className="stat-icon orange"><Activity/></span><div><small>SYSTEM STATUS</small><strong className="status-text">Online</strong><p>Local workspace ready</p></div></div>
      </div>
      <div className="dashboard-columns">
        <section className="panel"><div className="section-title"><div><span className="eyebrow">WORKSPACE</span><h2>Recent Projects</h2></div><button className="text-button" onClick={() => setPage('Projects')}>View all <ChevronRight size={15}/></button></div>{projects.slice(0,4).map(p => <div className="compact-row" key={p.id}><span className="row-icon"><FolderKanban size={17}/></span><div><b>{p.name}</b><small>{p.detail}</small></div><span className="tag">{p.status}</span></div>)}</section>
        <section className="panel"><div className="section-title"><div><span className="eyebrow">UP NEXT</span><h2>Tasks</h2></div><button className="text-button" onClick={() => setPage('Tasks')}>Manage <ChevronRight size={15}/></button></div>{tasks.filter(t => !t.done).slice(0,4).map(t => <div className="compact-row" key={t.id}><span className="row-icon"><Circle size={17}/></span><div><b>{t.title}</b><small>{t.created}</small></div></div>)}{pending === 0 && <div className="empty small-empty"><CheckCircle2 size={22}/><p>All clear. Add a task when you're ready.</p></div>}</section>
      </div>
      <section className="panel"><div className="section-title"><div><span className="eyebrow">YOUR AI TEAM</span><h2>Agent overview</h2></div><button className="text-button" onClick={() => setPage('AI Agents')}>View agents <ChevronRight size={15}/></button></div><div className="agent-strip">{agents.map(a => <div className="agent-mini" key={a.id}><span className="agent-icon"><a.icon size={19}/></span><div><b>{a.name}</b><small>{a.status}</small></div><span className={a.status === 'Ready' ? 'dot ready-dot' : 'dot'} /></div>)}</div></section>
    </>;
  }

  return <div className="shell">
    <aside className={'sidebar ' + (mobileMenu ? 'show' : '')}>
      <div className="brand"><div className="brand-mark"><Command size={22}/></div><div><b>NEXUS<span> AI</span></b><small>OPERATING SYSTEM</small></div><button className="close-menu" onClick={() => setMobileMenu(false)}><X/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{nav.map(n => <button key={n.label} className={page === n.label ? 'nav-item active' : 'nav-item'} onClick={() => {setPage(n.label);setMobileMenu(false);}}><n.icon size={18}/><span>{n.label}</span>{n.label === 'Tasks' && pending > 0 && <em>{pending}</em>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="connection"><span className="dot ready-dot"/><div><b>Workspace active</b><small>Saved on this device</small></div></div><small className="version">NEXUS AI OS · V1.0</small></div>
    </aside>
    {mobileMenu && <button className="scrim" onClick={() => setMobileMenu(false)} aria-label="Close menu"/>}
    <main className="main-area">
      <header className="topbar"><button className="menu-button" onClick={() => setMobileMenu(true)}><Menu/></button><div className="breadcrumb">NEXUS <ChevronRight size={14}/><span>{page}</span></div><div className="top-right"><span className="live-pill"><i/> System online</span><div className="avatar">O</div></div></header>
      <div className="page-content"><div className="page-heading"><div><span className="eyebrow">NEXUS CONTROL PANEL</span><h1>{page}</h1></div><span className="date-label">{new Date().toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</span></div>{content()}<footer className="footer">NEXUS AI OS <span>•</span> Your workspace, your command.</footer></div>
    </main>
  </div>;
}
