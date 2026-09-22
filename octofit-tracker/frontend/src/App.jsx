import { useEffect, useState } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';

const logo = new URL('../../../docs/octofitapp-small.png', import.meta.url).href;
const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.VITE_CODESPACE_NAME ? `https://${import.meta.env.VITE_CODESPACE_NAME}-8000.app.github.dev` : 'http://localhost:8000');

async function fetchApi(path, options) {
  const response = await fetch(`${apiBase}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!response.ok) throw new Error((await response.json()).message || 'The API request failed');
  return response.json();
}

function App() {
  return <BrowserRouter><Tracker /></BrowserRouter>;
}

function collectionData(payload) {
  return Array.isArray(payload) ? payload : payload?.results || payload?.data || [];
}

function Tracker() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeTab = location.pathname.slice(1);
  const activeTab = ['log', 'teams', 'board', 'workouts'].includes(routeTab) ? routeTab : 'overview';
  const setActiveTab = (tab) => navigate(tab === 'overview' ? '/' : `/${tab}`);
  const [users, setUsers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activities, setActivities] = useState([]);
  const [teams, setTeams] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [notice, setNotice] = useState('');
  const [activity, setActivity] = useState({ user: '', type: 'running', durationMinutes: 20, distanceKm: '', notes: '' });

  async function loadData() {
    try {
      const [usersResponse, leaderboardResponse, activitiesResponse, teamsResponse] = await Promise.all(['/api/users/', '/api/leaderboard/', '/api/activities/', '/api/teams/'].map(fetchApi));
      const userData = collectionData(usersResponse);
      const workoutResponse = await fetchApi(userData[0] ? `/api/workouts/suggestions/${userData[0]._id}` : '/api/workouts/');
      setUsers(userData); setLeaderboard(collectionData(leaderboardResponse)); setActivities(collectionData(activitiesResponse)); setTeams(collectionData(teamsResponse)); setWorkouts(collectionData(workoutResponse?.workouts || workoutResponse));
      setActivity((current) => ({ ...current, user: current.user || userData[0]?._id || '' }));
    } catch (error) { setNotice(`Connect the API on port 8000 to load your tracker: ${error.message}`); }
  }

  useEffect(() => { loadData(); }, []);

  async function submitActivity(event) {
    event.preventDefault();
    try { await fetchApi('/api/activities/', { method: 'POST', body: JSON.stringify({ ...activity, durationMinutes: Number(activity.durationMinutes), distanceKm: Number(activity.distanceKm || 0) }) }); setNotice('Activity logged. Your points are on the board.'); setActiveTab('overview'); await loadData(); }
    catch (error) { setNotice(error.message); }
  }

  const currentUser = users[0] || { displayName: 'Athlete', grade: 'Student', points: 0, avatarColor: '#f97316' };
  const totalMinutes = activities.reduce((total, item) => total + item.durationMinutes, 0);
  const totalDistance = activities.reduce((total, item) => total + (item.distanceKm || 0), 0);

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><img src={logo} alt="OctoFit" /><span>OCTOFIT <small>TRACKER</small></span></div><div className="status-pill"><i /> LIVE SEASON <b>04</b></div></header>
    <div className="content-wrap">
      <aside className="sidebar"><div className="profile-mini"><div className="avatar" style={{ backgroundColor: currentUser.avatarColor }}>{currentUser.displayName[0]}</div><div><strong>{currentUser.displayName}</strong><small>{currentUser.grade} grade</small></div></div><nav>{[['overview', '◈', 'Overview'], ['log', '+', 'Log activity'], ['teams', '◎', 'My teams'], ['board', '↗', 'Leaderboard'], ['workouts', '◇', 'Workouts']].map(([id, icon, label]) => <button className={activeTab === id ? 'active' : ''} key={id} onClick={() => setActiveTab(id)}><span>{icon}</span>{label}</button>)}</nav><div className="sidebar-foot"><span>WEEKLY GOAL</span><strong>{Math.min(totalMinutes, 150)} <small>/ 150 MIN</small></strong><div className="progress"><div style={{ width: `${Math.min(totalMinutes / 1.5, 100)}%` }} /></div></div></aside>
      <main className="main-area"><div className="page-heading"><div><p className="eyebrow">TUESDAY · OCTOBER 15</p><h1>{activeTab === 'overview' ? <>Make your <em>move.</em></> : activeTab === 'log' ? <>Log an <em>activity.</em></> : activeTab === 'board' ? <>Climb the <em>board.</em></> : activeTab === 'workouts' ? <>Find your <em>flow.</em></> : <>Find your <em>team.</em></>}</h1></div><div className="season-score"><span>YOUR SCORE</span><strong>{currentUser.points || 0}</strong><small>PTS THIS SEASON</small></div></div>{notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}
        {activeTab === 'overview' && <Overview currentUser={currentUser} totalMinutes={totalMinutes} totalDistance={totalDistance} activities={activities} leaderboard={leaderboard} setActiveTab={setActiveTab} />}
        {activeTab === 'log' && <ActivityForm activity={activity} setActivity={setActivity} users={users} onSubmit={submitActivity} />}
        {activeTab === 'teams' && <Teams teams={teams} />}
        {activeTab === 'board' && <Leaderboard entries={leaderboard} />}
        {activeTab === 'workouts' && <Workouts workouts={workouts} />}
      </main>
    </div>
  </div>;
}

function Overview({ currentUser, totalMinutes, totalDistance, activities, leaderboard, setActiveTab }) { return <><section className="stat-grid"><Stat label="ACTIVE DAYS" value={new Set(activities.map((item) => new Date(item.completedAt).toDateString())).size} suffix="DAYS" accent="orange" /><Stat label="MOVE TIME" value={totalMinutes} suffix="MIN" accent="teal" /><Stat label="DISTANCE" value={totalDistance.toFixed(1)} suffix="KM" accent="blue" /><Stat label="RANK" value={leaderboard.find((item) => item.user?._id === currentUser._id)?.rank || '—'} suffix="IN SCHOOL" accent="purple" /></section><section className="split-grid"><div className="panel activity-panel"><div className="panel-heading"><div><p className="eyebrow">RECENT MOVES</p><h2>Your activity</h2></div><button className="text-button" onClick={() => setActiveTab('log')}>+ Log activity</button></div>{activities.slice(0, 4).map((item) => <ActivityRow item={item} key={item._id} />)}{!activities.length && <Empty text="Your first activity is waiting." />}</div><div className="panel challenge-panel"><p className="eyebrow">TEAM CHALLENGE</p><h2>Move more,<br /><em>together.</em></h2><p>Every minute counts toward this month's school-wide goal.</p><div className="challenge-number">68<small>%</small></div><div className="progress"><div style={{ width: '68%' }} /></div><button className="dark-button" onClick={() => setActiveTab('teams')}>View teams <span>→</span></button></div></section></>; }
function Stat({ label, value, suffix, accent }) { return <div className={`stat-card ${accent}`}><span>{label}</span><strong>{value} <small>{suffix}</small></strong><div className="stat-line" /></div>; }
function ActivityRow({ item }) { return <div className="activity-row"><div className="activity-icon">{item.type === 'running' ? '↗' : item.type === 'strength' ? '✦' : '◌'}</div><div className="activity-copy"><strong>{item.type}</strong><small>{item.user?.displayName || 'Athlete'} · {new Date(item.completedAt).toLocaleDateString()}</small></div><b>+{item.points} <small>PTS</small></b></div>; }
function ActivityForm({ activity, setActivity, users, onSubmit }) { return <section className="form-panel"><p className="eyebrow">QUICK ENTRY</p><h2>What did you get up to?</h2><p className="muted">Log a move and earn points for your team.</p><form onSubmit={onSubmit}><label>WHO <select value={activity.user} onChange={(event) => setActivity({ ...activity, user: event.target.value })}>{users.map((user) => <option key={user._id} value={user._id}>{user.displayName}</option>)}</select></label><div className="form-grid"><label>ACTIVITY <select value={activity.type} onChange={(event) => setActivity({ ...activity, type: event.target.value })}><option value="running">Running</option><option value="walking">Walking</option><option value="strength">Strength training</option><option value="cycling">Cycling</option><option value="yoga">Yoga</option></select></label><label>MINUTES <input type="number" min="1" value={activity.durationMinutes} onChange={(event) => setActivity({ ...activity, durationMinutes: event.target.value })} required /></label><label>DISTANCE (KM) <input type="number" min="0" step="0.1" value={activity.distanceKm} onChange={(event) => setActivity({ ...activity, distanceKm: event.target.value })} /></label></div><label>NOTE <textarea placeholder="How did it feel?" value={activity.notes} onChange={(event) => setActivity({ ...activity, notes: event.target.value })} /></label><button className="primary-button" type="submit">Save activity <span>→</span></button></form></section>; }
function Teams({ teams }) { return <section><div className="section-heading"><p className="eyebrow">SQUAD GOALS</p><h2>Find your people.</h2></div><div className="team-grid">{teams.map((team, index) => <article className={`team-card team-${index}`} key={team._id}><span className="team-mark">{index ? '▲' : '✦'}</span><h3>{team.name}</h3><p>{team.motto}</p><div className="member-stack">{team.members?.map((member) => <span key={member._id} title={member.displayName}>{member.displayName[0]}</span>)}</div><small>{team.members?.length || 0} MEMBERS</small></article>)}{!teams.length && <Empty text="Teams will appear after the API is seeded." />}</div></section>; }
function Leaderboard({ entries }) { return <section className="panel board-panel"><div className="panel-heading"><div><p className="eyebrow">SEASON 04 · SCHOOL WIDE</p><h2>Leaderboard</h2></div><span className="live-tag">● LIVE</span></div>{entries.map((entry) => <div className={`leader-row ${entry.rank === 1 ? 'leader-first' : ''}`} key={entry._id}><b>{String(entry.rank).padStart(2, '0')}</b><div className="leader-avatar" style={{ backgroundColor: entry.user?.avatarColor }}>{entry.user?.displayName?.[0]}</div><strong>{entry.user?.displayName}</strong><span>{entry.activities} activities</span><em>{entry.points} pts</em></div>)}</section>; }
function Workouts({ workouts }) { return <section><div className="section-heading"><p className="eyebrow">CURATED FOR YOU</p><h2>Pick your next win.</h2></div><div className="workout-grid">{workouts.map((workout) => <article className="workout-card" key={workout._id}><div className="workout-top"><span>{workout.category}</span><b>{workout.durationMinutes} MIN</b></div><h3>{workout.title}</h3><p>{workout.description}</p><div className="workout-bottom"><span>{workout.level}</span><strong>+{workout.points} pts</strong></div></article>)}</div></section>; }
function Empty({ text }) { return <div className="empty">{text}</div>; }

export default App;