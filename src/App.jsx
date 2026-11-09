
import React from 'react';
import {
  Bot, Brain, Code, Search, Palette,
  ShieldCheck, FolderKanban, Settings,
  Activity, Cpu, Zap, Plus
} from 'lucide-react';

const agents = [
  { name: 'Developer AI', icon: Code, status: 'Ready' },
  { name: 'Research AI', icon: Search, status: 'Ready' },
  { name: 'Designer AI', icon: Palette, status: 'Offline' },
  { name: 'Tester AI', icon: ShieldCheck, status: 'Ready' }
];

function App() {
  return (
    <div className="app-container">
      <header className="dashboard-header">
        <div>
          <h1>NEXUS AI</h1>
          <small>Operating System</small>
        </div>
        <Bot size={30} />
      </header>

      <section className="dashboard-card">
        <h2>Welcome, Owner!</h2>
        <p>Your AI workforce is ready.</p>
        <p className="status-online">● System Online</p>
      </section>

      <section className="dashboard-card">
        <h2><Brain size={20} /> AI Commander</h2>
        <p>Your central AI management system.</p>
        <button>Open AI Chat</button>
      </section>

      <h2>System Overview</h2>

      <div className="dashboard-card">
        <Cpu size={22} />
        <h2>AI Agents</h2>
        <h1>4</h1>
        <small>Registered Agents</small>
      </div>

      <div className="dashboard-card">
        <FolderKanban size={22} />
        <h2>Projects</h2>
        <h1>0</h1>
        <small>Active Projects</small>
      </div>

      <div className="dashboard-card">
        <Activity size={22} />
        <h2>Running Tasks</h2>
        <h1>0</h1>
        <small>Current Tasks</small>
      </div>

      <section>
        <h2>AI Agent Center</h2>

        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <div className="dashboard-card" key={agent.name}>
              <Icon size={24} />
              <h3>{agent.name}</h3>
              <p>{agent.status}</p>
            </div>
          );
        })}
      </section>

      <section className="dashboard-card">
        <h2><Zap size={20} /> Quick Actions</h2>
        <button><Plus size={16} /> New Project</button>
        <button><Bot size={16} /> Add AI Agent</button>
        <button><Settings size={16} /> Settings</button>
      </section>

      <footer>
        <p>NEXUS AI OS v1.0</p>
        <small>Built for your AI workforce</small>
      </footer>
    </div>
  );
}

export default App;
