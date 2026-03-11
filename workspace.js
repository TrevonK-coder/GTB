// workspace.js
// GTB Intranet Logic

let sb;
try {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized OK');
} catch (e) {
    console.error('Supabase init failed:', e);
}

let currentUser = null;
let currentMember = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check Session
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
        window.location.href = 'index.html'; // Redirect to login
        return;
    }

    currentUser = session.user;
    currentMember = MEMBER_ACCOUNTS.find(m => m.email === currentUser.email);

    if (currentMember) {
        // Setup UI
        document.getElementById('userName').textContent = currentMember.title;
        document.getElementById('dashWelcomeName').textContent = currentMember.title;
        document.getElementById('userRole').textContent = currentMember.role.replace('-', ' ').toUpperCase();
        document.getElementById('userAvatar').textContent = currentMember.title.charAt(4) || 'M';
        
        loadDirectory();
        loadChatMock();
        loadDocsMock();
        loadLeadershipView();
    } else {
        document.getElementById('userName').textContent = "Unknown User";
    }

    // 2. Event Listeners
    setupNavigation();
    setupActions();
});

// Navigation Handling
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            const target = item.getAttribute('data-target');
            switchView(target);
            
            // Set Page Title
            document.getElementById('pageTitle').textContent = item.querySelector('.label').textContent;
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await sb.auth.signOut();
        window.location.href = 'index.html';
    });
}

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    const targetEl = document.getElementById(`view-${viewId}`);
    if (targetEl) {
        targetEl.classList.add('active');
    }
}

// Setup Dashboard Actions (Forms, modals)
function setupActions() {
    // Notifications Toggle
    const notifToggle = document.getElementById('notifToggle');
    const notifDrop = document.getElementById('notifDropdown');
    
    notifToggle.addEventListener('click', () => {
        notifDrop.classList.toggle('hidden');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!notifToggle.contains(e.target) && !notifDrop.contains(e.target)) {
            notifDrop.classList.add('hidden');
        }
    });
    
    // Tools Form
    const toolForm = document.getElementById('toolForm');
    if (toolForm) {
        toolForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = toolForm.querySelector('button');
            const origText = btn.textContent;
            btn.textContent = 'Submitting...';
            btn.disabled = true;
            
            setTimeout(() => {
                alert('Request Submitted successfully! It will appear in your pending queue shortly.');
                toolForm.reset();
                btn.textContent = origText;
                btn.disabled = false;
            }, 800);
        });
    }

    // Ethics Form
    const ethicsForm = document.getElementById('ethicsForm');
    if (ethicsForm) {
        ethicsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = ethicsForm.querySelector('input').value;
            const logBox = document.getElementById('ethicsLog');
            
            const entry = document.createElement('div');
            entry.className = 'doc-item';
            entry.innerHTML = `
                <div class="doc-info">
                    <span class="doc-icon">✅</span>
                    <div class="doc-meta">
                        <span class="doc-title">${input}</span>
                        <span class="doc-date">Logged today at ${new Date().toLocaleTimeString()}</span>
                    </div>
                </div>
            `;
            logBox.prepend(entry);
            ethicsForm.reset();
        });
    }
    
    // Modals
    document.getElementById('cancelSign').addEventListener('click', () => {
        document.getElementById('signModal').classList.add('hidden');
        document.getElementById('sigInput').value = '';
    });
    
    document.getElementById('confirmSign').addEventListener('click', () => {
        const val = document.getElementById('sigInput').value.trim();
        if(!val) return alert('Please input your signature to continue.');
        
        alert('Document signed successfully by ' + val);
        document.getElementById('signModal').classList.add('hidden');
        
        // Update mock UI
        const activeDoc = document.querySelector('.btn-sm[onclick*="' + window.activeDocId + '"]');
        if(activeDoc) {
            activeDoc.textContent = 'Signed';
            activeDoc.classList.remove('btn-primary');
            activeDoc.classList.add('btn-ghost');
            activeDoc.disabled = true;
            document.getElementById('docBadge').style.display = 'none';
        }
    });

    // Chat Form
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('chatInput');
            const msg = input.value.trim();
            if(!msg) return;
            
            addChatMessage({
                author: currentMember ? currentMember.title : 'Me',
                text: msg,
                time: "Just now",
                own: true
            });
            input.value = '';
        });
    }
}

// Data Loaders
function loadDirectory() {
    const grid = document.getElementById('directoryGrid');
    if (!grid) return;
    
    const roleMapping = {
        'polymath': { em: '🎙️', desc: 'Narrates the GTB story. Journalism, Art, Production.', kpi: 'Content Pipeline, Press Releases' },
        'performer': { em: '🎭', desc: 'Frontend Engagement and On-Screen presence.', kpi: 'User Engagement, UI/UX conversions' },
        'visionary': { em: '🎬', desc: 'Cinematic aesthetics and high-performance visual logic.', kpi: 'Video Assets, Visual Branding' },
        'specialist': { em: '💊', desc: 'Medical accuracy, Physical output, Health protocols.', kpi: 'Team Wellness, Health Data Models' },
        'gastronomist': { em: '🍽️', desc: 'Performance nutrition and culinary arts.', kpi: 'Nutrition Plans, Catering Management' },
        'architect': { em: '🏗️', desc: 'Heavy-duty backend, system security, AI protocols.', kpi: 'Uptime, API Latency, Cloud Costs' },
        'artist': { em: '🎵', desc: 'Sonic pulse, Experimental soundscapes, Creative Direction.', kpi: 'Audio Assets, Branding Identity' },
        'engineer': { em: '⚙️', desc: 'Rapid deployment, Scaling digital properties.', kpi: 'Build Times, Deployment Frequency' }
    };

    let html = '';
    MEMBER_ACCOUNTS.forEach(m => {
        const d = roleMapping[m.role] || { em: '👤', desc: 'Collective Member', kpi: 'General duties' };
        html += `
            <div class="dir-card">
                <div class="dir-emoji">${d.em}</div>
                <div class="dir-title">${m.title}</div>
                <div class="dir-role">${m.role.replace('-',' ')}</div>
                <div class="dir-desc">${d.desc}</div>
                <div class="dir-kpi"><strong>Core KPIs:</strong> ${d.kpi}</div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

function loadChatMock() {
    addChatMessage({author: "The Architect", time: "09:14 AM", text: "Morning team. I've deployed the new database schema for the automations portal. Please verify your endpoints.", own: false});
    addChatMessage({author: "The Performer", time: "09:22 AM", text: "Looks good on the frontend side. No broken components.", own: false});
    addChatMessage({author: "The Specialist", time: "10:05 AM", text: "Reminder: Fill out the hydration tracker today.", own: false});
}

function addChatMessage({author, time, text, own}) {
    const area = document.getElementById('chatArea');
    if(!area) return;
    
    const div = document.createElement('div');
    div.className = `msg ${own ? 'own' : ''}`;
    
    div.innerHTML = `
        ${!own ? `<div class="msg-avatar">${author.charAt(4)||'M'}</div>` : ''}
        <div class="msg-content">
            <div class="msg-meta">
                <span class="msg-author">${author}</span>
                <span class="msg-time">${time}</span>
            </div>
            <div class="msg-text">${text}</div>
        </div>
        ${own ? `<div class="msg-avatar">Me</div>` : ''}
    `;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
}

window.openSigPad = function(docId, title) {
    window.activeDocId = docId;
    document.getElementById('signModalTitle').textContent = `Sign: ${title}`;
    document.getElementById('signModal').classList.remove('hidden');
    document.getElementById('sigInput').focus();
};

function loadDocsMock() {
    const list = document.getElementById('docList');
    if(!list) return;
    
    const docs = [
        { id: 'd1', title: 'Q4 Profit Distribution Agreement', date: 'Dec 15, 2025', status: 'pending' },
        { id: 'd2', title: 'NDA - external partner GladToBe Merch', date: 'Nov 20, 2025', status: 'signed' },
        { id: 'd3', title: 'Software Architecture Compliance', date: 'Oct 05, 2025', status: 'signed' }
    ];
    
    let html = '';
    docs.forEach(d => {
        const isPending = d.status === 'pending';
        html += `
            <div class="doc-item">
                <div class="doc-info">
                    <span class="doc-icon">${isPending ? '📄' : '✅'}</span>
                    <div class="doc-meta">
                        <span class="doc-title">${d.title}</span>
                        <span class="doc-date">Sent: ${d.date}</span>
                    </div>
                </div>
                <div class="doc-actions">
                    <button class="btn btn-ghost btn-sm">Preview PDF</button>
                    ${isPending ? 
                        `<button class="btn btn-primary btn-sm" onclick="openSigPad('${d.id}', '${d.title}')">Sign Now</button>` : 
                        `<button class="btn btn-ghost btn-sm" disabled>Signed</button>`}
                </div>
            </div>
        `;
    });
    list.innerHTML = html;
}

function loadLeadershipView() {
    const statsContainer = document.getElementById('leadKpiStats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-box" style="background: rgba(34, 212, 122, 0.05); border-color: rgba(34, 212, 122, 0.2);">
                <div class="stat-label mono">Team Velocity</div>
                <div class="stat-value" style="color: var(--green);">94%</div>
            </div>
            <div class="stat-box">
                <div class="stat-label mono">Team Data Pending</div>
                <div class="stat-value accent">3 Reports</div>
            </div>
        `;
    }

    const todoList = document.getElementById('leadershipTodoList');
    if (todoList) {
        todoList.innerHTML = `
            <li class="action-item">
                <input type="checkbox" style="width:18px;height:18px;margin-right:12px;accent-color:var(--accent);cursor:pointer;">
                <div class="ai-text">
                    <strong>Review Q1 Merch Budget</strong>
                    <span>Awaiting your final sign-off before production.</span>
                </div>
                <div class="ai-badge red">Urgent</div>
            </li>
            <li class="action-item">
                <input type="checkbox" style="width:18px;height:18px;margin-right:12px;accent-color:var(--accent);cursor:pointer;">
                <div class="ai-text">
                    <strong>Update Onboarding SOP</strong>
                    <span>Add new security protocols for all new dimension members.</span>
                </div>
            </li>
            <li class="action-item">
                <input type="checkbox" style="width:18px;height:18px;margin-right:12px;accent-color:var(--accent);cursor:pointer;">
                <div class="ai-text">
                    <strong>Approve Profit Splits</strong>
                    <span>Verify the distribution chart for this quarter's payout.</span>
                </div>
            </li>
        `;
    }

    const sopList = document.getElementById('leadershipSopList');
    if (sopList) {
        sopList.innerHTML = `
            <p class="text-muted mb-4 pt-2" style="font-size:13px;line-height:1.5;">Standard Operating Procedures and required data tracking from all dimensions.</p>
            <div class="doc-list">
                <div class="doc-item">
                    <div class="doc-info">
                        <span class="doc-icon">📘</span>
                        <div class="doc-meta">
                            <span class="doc-title">Project Initiation SOP</span>
                            <span class="doc-date">Updated: Jan 12, 2026</span>
                        </div>
                    </div>
                    <div class="doc-actions">
                        <button class="btn btn-ghost btn-sm">View Manual</button>
                    </div>
                </div>
                <div class="doc-item">
                    <div class="doc-info">
                        <span class="doc-icon">📊</span>
                        <div class="doc-meta">
                            <span class="doc-title">Weekly KPI Reporting Standard</span>
                            <span class="doc-date">Required by all dimensions (Fridays)</span>
                        </div>
                    </div>
                    <div class="doc-actions">
                        <button class="btn btn-primary btn-sm">Request Data Update</button>
                    </div>
                </div>
                <div class="doc-item">
                    <div class="doc-info">
                        <span class="doc-icon">⚙️</span>
                        <div class="doc-meta">
                            <span class="doc-title">System Outage Protocol</span>
                            <span class="doc-date">Maintained by The Architect</span>
                        </div>
                    </div>
                    <div class="doc-actions">
                        <button class="btn btn-ghost btn-sm">View Protocol</button>
                    </div>
                </div>
            </div>
        `;
    }
}
