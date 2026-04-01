/* ═══════════════════════════════════════════════════════
   SkillBridge — Core Application Logic
   ═══════════════════════════════════════════════════════ */

/* ─── App State ─────────────────────────────────────── */
const State = {
  currentUser: null,
  joinedDomains: new Set(),
  activePage: 'home',
  activeFilter: 'All',
  currentDomain: null,
  currentSubTab: 'roadmap',
};

/* ─── DOM helpers ────────────────────────────────────── */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function showToast(msg, type = 'default') {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ─── Navigation ─────────────────────────────────────── */
function navigate(pageId) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.nav-link').forEach(b => b.classList.remove('active'));
  const page = $('page-' + pageId);
  if (!page) return;
  page.classList.add('active');
  const link = document.querySelector(`.nav-link[data-page="${pageId}"]`);
  if (link) link.classList.add('active');
  State.activePage = pageId;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const renderers = {
    communities: renderCommunities,
    internships:  renderInternships,
    mentors:      renderMentors,
    leaderboard:  renderLeaderboard,
    dashboard:    renderDashboard,
  };
  if (renderers[pageId]) renderers[pageId]();
}

/* ─── Auth ───────────────────────────────────────────── */
function handleLogin(e) {
  e.preventDefault();
  const email = $('loginEmail').value.trim();
  const password = $('loginPass').value;
  if (!email || !password) { showToast('Please fill in all fields', 'error'); return; }
  // TODO: Replace with real auth call
  State.currentUser = { name: 'Student', email, department: 'Computer Engineering' };
  onAuthSuccess();
}

function handleSignup(e) {
  e.preventDefault();
  const name  = $('signupName').value.trim();
  const email = $('signupEmail').value.trim();
  const dept  = $('signupDept').value;
  const pass  = $('signupPass').value;
  if (!name || !email || !dept || !pass) { showToast('Please complete all fields', 'error'); return; }
  const picked = $$('.domain-pick.selected');
  State.currentUser = { name, email, department: dept };
  picked.forEach(p => State.joinedDomains.add(p.dataset.id));
  onAuthSuccess();
}

function onAuthSuccess() {
  const btn = $('navAuthBtn');
  if (btn) { btn.textContent = 'Dashboard'; btn.onclick = () => navigate('dashboard'); }
  showToast('Welcome, ' + State.currentUser.name.split(' ')[0] + '!');
  navigate('communities');
}

function handleLogout() {
  State.currentUser = null;
  State.joinedDomains.clear();
  const btn = $('navAuthBtn');
  if (btn) { btn.textContent = 'Sign in'; btn.onclick = () => navigate('login'); }
  navigate('home');
}

/* ─── Domain Picker (signup) ─────────────────────────── */
function renderDomainPicker() {
  const c = $('domainPicker');
  if (!c) return;
  c.innerHTML = DOMAINS.map(d => `
    <div class="domain-pick" data-id="${d.id}" onclick="this.classList.toggle('selected')">
      <span style="font-size:20px">${d.icon}</span>
      <span class="domain-pick-name">${d.name}</span>
    </div>`).join('');
}

/* ─── Dept Tab Renderer ──────────────────────────────── */
function renderDeptTabs(containerId, activeVal, onClickFn) {
  const c = $(containerId);
  if (!c) return;
  c.innerHTML = DEPARTMENTS.map(d => `
    <button class="tab-btn${d === activeVal ? ' active' : ''}"
      onclick="${onClickFn}(this, '${d}')">${d}</button>`).join('');
}

/* ─── Communities Page ───────────────────────────────── */
function renderCommunities(el, dept) {
  if (dept !== undefined) {
    State.activeFilter = dept;
    $$('#commDeptTabs .tab-btn').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
  }
  renderDeptTabs('commDeptTabs', State.activeFilter, 'renderCommunities');
  const list = State.activeFilter === 'All'
    ? DOMAINS
    : DOMAINS.filter(d => d.department === State.activeFilter);
  $('commGrid').innerHTML = list.map(renderCommunityCard).join('');
}

function renderCommunityCard(d) {
  const bg = ACCENT_BG[d.accentClass] || '#F0F0EC';
  const tc = ACCENT_TC[d.accentClass] || '#2A2A27';
  const joined = State.joinedDomains.has(d.id);
  return `
    <div class="card comm-card" onclick="openDomain('${d.id}')">
      <div class="comm-card-top">
        <div class="comm-icon" style="background:${bg};color:${tc}">${d.icon}</div>
        <div>
          <div class="comm-dept-label">${d.department}</div>
          <h4 class="comm-name">${d.name}</h4>
        </div>
      </div>
      <p class="comm-tagline">${d.tagline}</p>
      <ul class="comm-features">
        ${d.features.map(f => `<li>${f}</li>`).join('')}
      </ul>
      <div class="comm-card-footer">
        <button class="btn btn-sm ${joined ? 'btn-teal' : 'btn-outline'} join-btn"
          data-id="${d.id}"
          onclick="event.stopPropagation(); toggleJoin('${d.id}', this)">
          ${joined ? '✓ Joined' : 'Join community'}
        </button>
        <span class="btn btn-sm btn-outline" style="pointer-events:none">
          ${d.roadmap.length} month path
        </span>
      </div>
    </div>`;
}

function toggleJoin(id, btn) {
  if (!State.currentUser) { showToast('Sign in to join communities'); navigate('login'); return; }
  if (State.joinedDomains.has(id)) {
    State.joinedDomains.delete(id);
    btn.textContent = 'Join community';
    btn.classList.remove('btn-teal'); btn.classList.add('btn-outline');
  } else {
    State.joinedDomains.add(id);
    btn.textContent = '✓ Joined';
    btn.classList.add('btn-teal'); btn.classList.remove('btn-outline');
    showToast('Joined ' + DOMAINS.find(d => d.id === id).name + '!');
  }
}

/* ─── Domain Detail ──────────────────────────────────── */
function openDomain(id) {
  State.currentDomain = DOMAINS.find(d => d.id === id);
  State.currentSubTab = 'roadmap';
  renderDomainDetail();
  navigate('domaindetail');
}

function renderDomainDetail() {
  const d = State.currentDomain;
  if (!d) return;
  const bg = ACCENT_BG[d.accentClass] || '#F0F0EC';
  const tc = ACCENT_TC[d.accentClass] || '#2A2A27';
  const jobs = JOBS.filter(j => j.domain === d.id);

  $('detailHero').innerHTML = `
    <div class="detail-top">
      <div class="detail-icon" style="background:${bg};color:${tc}">${d.icon}</div>
      <div>
        <div class="label">${d.department}</div>
        <h2 class="mt-8">${d.name}</h2>
        <p class="text-secondary mt-8">${d.description}</p>
      </div>
    </div>
    <div class="detail-meta">
      <span class="pill pill-teal">${d.features.length} features</span>
      <span class="pill pill-amber">${jobs.length} internship${jobs.length !== 1 ? 's' : ''}</span>
      <span class="pill pill-purple">${d.roadmap.length}-month path</span>
    </div>`;

  renderSubTabs();
  renderSubContent();
}

function renderSubTabs() {
  const tabs = [
    { id: 'roadmap', label: 'Skill roadmap' },
    { id: 'events',  label: 'Events & challenges' },
    { id: 'jobs',    label: 'Internships' },
  ];
  $('detailSubTabs').innerHTML = tabs.map(t => `
    <button class="tab-btn${t.id === State.currentSubTab ? ' active' : ''}"
      onclick="switchSubTab('${t.id}', this)">${t.label}</button>`).join('');
}

function switchSubTab(tab, el) {
  State.currentSubTab = tab;
  $$('#detailSubTabs .tab-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  renderSubContent();
}

function renderSubContent() {
  const d = State.currentDomain;
  const c = $('subContent');
  if (!d || !c) return;

  if (State.currentSubTab === 'roadmap') {
    c.innerHTML = `
      <div class="roadmap-grid">
        ${d.roadmap.map((r, i) => `
          <div class="rm-step">
            <div class="rm-month label">Month ${r.month}</div>
            <div class="rm-title">${r.title}</div>
            <ul class="rm-topics">
              ${r.topics.map(t => `<li>${t}</li>`).join('')}
            </ul>
          </div>`).join('')}
      </div>
      <div class="card mt-24">
        <div class="label mb-16">What's included in this path</div>
        ${d.features.map(f => `
          <div class="feature-row">
            <span class="feature-dot"></span>
            <span>${f}</span>
          </div>`).join('')}
      </div>`;

  } else if (State.currentSubTab === 'events') {
    // Generate representative events from roadmap titles
    const eventTypes = ['Workshop', 'Challenge', 'Hackathon', 'Guest talk', 'Sprint'];
    const events = d.roadmap.flatMap((r, ri) =>
      r.topics.slice(0, 1).map((topic, ti) => ({
        name: topic + ' ' + eventTypes[(ri + ti) % eventTypes.length],
        format: (ri + ti) % 2 === 0 ? 'Team' : 'Solo',
        month: r.month,
      }))
    );
    c.innerHTML = `<div class="event-list">
      ${events.map(ev => `
        <div class="event-row">
          <div>
            <div class="fw-500">${ev.name}</div>
            <div class="text-sm text-muted mt-8">Month ${ev.month} · ${State.currentDomain.department}</div>
          </div>
          <div class="flex-center gap-12">
            <span class="pill ${ev.format === 'Team' ? 'pill-teal' : 'pill-amber'}">${ev.format}</span>
            <button class="btn btn-sm btn-outline"
              onclick="showToast('Registered for ${ev.name.replace(/'/g,"&#39;")}!')">Register</button>
          </div>
        </div>`).join('')}
    </div>`;

  } else if (State.currentSubTab === 'jobs') {
    const domainJobs = JOBS.filter(j => j.domain === d.id);
    if (!domainJobs.length) {
      c.innerHTML = '<p class="text-secondary" style="padding:24px 0">No internships listed for this domain yet. Check back soon.</p>';
      return;
    }
    c.innerHTML = `<div class="grid-auto">${domainJobs.map(renderJobCard).join('')}</div>`;
  }
}

/* ─── Internships Page ───────────────────────────────── */
function renderInternships(el, dept) {
  if (dept !== undefined) {
    State.activeFilter = dept;
    $$('#jobDeptTabs .tab-btn').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
  }
  renderDeptTabs('jobDeptTabs', State.activeFilter, 'renderInternships');

  let list = JOBS;
  if (State.activeFilter !== 'All') {
    const ids = DOMAINS.filter(d => d.department === State.activeFilter).map(d => d.id);
    list = JOBS.filter(j => ids.includes(j.domain));
  }
  $('jobGrid').innerHTML = list.length
    ? list.map(renderJobCard).join('')
    : '<p class="text-secondary">No opportunities found for this department yet.</p>';
}

function renderJobCard(j) {
  const dom = DOMAINS.find(d => d.id === j.domain) || {};
  const bg  = ACCENT_BG[dom.accentClass] || '#F0F0EC';
  const tc  = ACCENT_TC[dom.accentClass] || '#2A2A27';
  const typeClass = { 'Internship': 'pill-teal', 'Part-time': 'pill-purple',
    'Freelance Project': 'pill-amber', 'Social Project': 'pill-coral' }[j.type] || 'pill-teal';
  return `
    <div class="card job-card">
      <div class="job-company text-sm text-muted">${j.company}</div>
      <h4 class="mt-8">${j.title}</h4>
      <div class="flex gap-8 mt-12" style="flex-wrap:wrap">
        <span class="pill" style="background:${bg};color:${tc}">${dom.name || j.domain}</span>
        <span class="pill ${typeClass}">${j.type}</span>
        <span class="pill pill-amber">${j.stipend}</span>
        <span class="pill pill-purple">${j.location}</span>
      </div>
      <p class="text-sm text-secondary mt-12" style="line-height:1.55">${j.description}</p>
      <div class="job-skills">
        ${j.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
      </div>
      <div class="job-footer">
        <span class="text-xs text-muted">Deadline: ${j.deadline}</span>
        <button class="btn btn-sm btn-primary"
          onclick="showToast('Application submitted for ${j.title.replace(/'/g,"&#39;")}!')">Apply now</button>
      </div>
    </div>`;
}

/* ─── Mentors Page ───────────────────────────────────── */
function renderMentors(el, dept) {
  if (dept !== undefined) {
    State.activeFilter = dept;
    $$('#mentorDeptTabs .tab-btn').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
  }
  renderDeptTabs('mentorDeptTabs', State.activeFilter, 'renderMentors');

  let list = MENTORS;
  if (State.activeFilter !== 'All') {
    const ids = DOMAINS.filter(d => d.department === State.activeFilter).map(d => d.id);
    list = MENTORS.filter(m => ids.includes(m.domain));
  }
  $('mentorGrid').innerHTML = list.map(renderMentorCard).join('');
}

function renderMentorCard(m) {
  const dom = DOMAINS.find(d => d.id === m.domain) || {};
  const bg  = ACCENT_BG[m.accentClass] || '#F0F0EC';
  const tc  = ACCENT_TC[m.accentClass] || '#2A2A27';
  return `
    <div class="card mentor-card">
      <div class="mentor-avatar" style="background:${bg};color:${tc}">${m.initials}</div>
      <div class="mentor-name fw-500 mt-12">${m.name}</div>
      <div class="text-sm text-secondary">${m.role}</div>
      <div class="text-xs text-muted">${m.company}</div>
      <span class="pill mt-12" style="background:${bg};color:${tc}">${dom.name || m.domain}</span>
      <div class="mentor-expertise">
        ${m.expertise.map(e => `<span class="skill-tag">${e}</span>`).join('')}
      </div>
      <div class="text-xs text-muted mt-12">${m.sessionFormat}</div>
      <button class="btn btn-outline btn-sm mt-16 ${!m.available ? 'btn-disabled' : ''}"
        style="width:100%"
        onclick="${m.available ? `showToast('Session request sent to ${m.name}!')` : `showToast('${m.name} is currently fully booked')`}">
        ${m.available ? 'Book a session' : 'Fully booked'}
      </button>
    </div>`;
}

/* ─── Leaderboard ────────────────────────────────────── */
function renderLeaderboard(el, dept) {
  if (dept !== undefined) {
    State.activeFilter = dept;
    $$('#lbDeptTabs .tab-btn').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
  }
  renderDeptTabs('lbDeptTabs', State.activeFilter, 'renderLeaderboard');
  // Leaderboard data is loaded from leaderboard.html placeholder
  // TODO: fetch from backend API endpoint /api/leaderboard?dept=...
}

/* ─── Dashboard ──────────────────────────────────────── */
function renderDashboard() {
  if (!State.currentUser) { navigate('login'); return; }
  const u = State.currentUser;
  $('dashName').textContent = 'Welcome back, ' + u.name.split(' ')[0];
  $('dashDept').textContent = u.department;

  const joined = [...State.joinedDomains];
  $('dashJoinedCount').textContent = joined.length;

  const domList = $('dashDomains');
  if (domList) {
    domList.innerHTML = joined.length
      ? joined.map(id => {
          const d = DOMAINS.find(x => x.id === id) || { name: id, icon: '●', roadmap: [] };
          return `
            <div class="dash-domain-row">
              <span>${d.icon} ${d.name}</span>
              <div class="progress-track" style="flex:1;margin:0 16px">
                <div class="progress-fill" style="width:0%" data-target="25"></div>
              </div>
              <span class="text-xs text-muted">Month 1 / ${d.roadmap.length}</span>
            </div>`;
        }).join('')
      : '<p class="text-secondary text-sm">You haven\'t joined any communities yet. <a onclick="navigate(\'communities\')" style="color:var(--accent-teal);cursor:pointer">Explore domains →</a></p>';
  }
  // Animate progress bars
  setTimeout(() => {
    $$('.progress-fill[data-target]').forEach(bar => {
      bar.style.width = bar.dataset.target + '%';
    });
  }, 100);
}

/* ─── Mobile nav ─────────────────────────────────────── */
function toggleMobileNav() {
  const nl = $('navLinks');
  if (nl) nl.classList.toggle('open');
}

/* ─── Init ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderDomainPicker();
  // Nav link wiring
  $$('.nav-link[data-page]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
  });
  // Auth forms
  const lf = $('loginForm');   if (lf) lf.addEventListener('submit', handleLogin);
  const sf = $('signupForm');  if (sf) sf.addEventListener('submit', handleSignup);
  // Show initial page
  navigate('home');
});
