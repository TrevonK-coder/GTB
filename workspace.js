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

// ── Global Helpers ──
function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3500);
}

function isBlankCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    return data.every(v => v === 0);
}


// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check Session (Bypassing Supabase for immediate demo access)
    const savedUser = localStorage.getItem('gtb_user');
    if (!savedUser) {
        window.location.href = 'login.html'; // Redirect to login
        return;
    }

    try {
        currentMember = JSON.parse(savedUser);
        currentUser = currentMember; // Mock currentUser
    } catch (e) {
        localStorage.removeItem('gtb_user');
        window.location.href = 'index.html';
        return;
    }

    if (currentMember) {
        // Setup UI
        document.getElementById('userName').textContent = currentMember.title;
        document.getElementById('dashWelcomeName').textContent = currentMember.title;
        document.getElementById('userRole').textContent = currentMember.role.replace('-', ' ').toUpperCase();
        document.getElementById('userAvatar').textContent = currentMember.title.charAt(4) || 'M';
        
        loadDirectory();
        loadChatMock();
        loadDocsMock();
        // The following functions do not exist yet, leave commented out
        // loadDocumentSystem();
        // loadSharesModule();
        // loadTemplatesModule();
        // loadLeadershipView();
        // loadMarketplace();
        // loadTreasury();
        // loadWorkspace();
        // initAssistant();

        // Architect-only: show Command Center
        if (currentMember.role === 'architect') {
            const cmdNav = document.getElementById('commandNavItem');
            if (cmdNav) cmdNav.style.display = 'flex';
            // loadCommandCenter();
            // loadPerformanceRankings();
        }
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
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('gtb_user');
            window.location.href = 'login.html';
        });
    }
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
    
    if (notifToggle && notifDrop) {
        notifToggle.addEventListener('click', () => {
            notifDrop.classList.toggle('hidden');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!notifToggle.contains(e.target) && !notifDrop.contains(e.target)) {
                notifDrop.classList.add('hidden');
            }
        });
    }
    
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
    
    // ── Signature Modal ──
    const cancelSignBtn = document.getElementById('cancelSign');
    if (cancelSignBtn) {
        cancelSignBtn.addEventListener('click', () => {
            document.getElementById('signModal').classList.add('hidden');
            const sigInput = document.getElementById('sigInput');
            if (sigInput) sigInput.value = '';
        });
    }

    // Signature pad (canvas draw)
    const sigCanvas = document.getElementById('sigCanvas');
    if (sigCanvas) {
        const ctx = sigCanvas.getContext('2d');
        let drawing = false;
        ctx.strokeStyle = '#f0f0f4';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        const getPos = (e) => {
            const rect = sigCanvas.getBoundingClientRect();
            const src = e.touches ? e.touches[0] : e;
            return { x: src.clientX - rect.left, y: src.clientY - rect.top };
        };
        sigCanvas.addEventListener('mousedown', e => { drawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); });
        sigCanvas.addEventListener('mousemove', e => { if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
        sigCanvas.addEventListener('mouseup', () => drawing = false);
        sigCanvas.addEventListener('mouseleave', () => drawing = false);

        const sigClear = document.getElementById('sigClear');
        if (sigClear) sigClear.addEventListener('click', () => ctx.clearRect(0, 0, sigCanvas.width, sigCanvas.height));
    }

    // Typed signature preview
    const sigInput = document.getElementById('sigInput');
    const sigPreview = document.getElementById('sigPreviewText');
    if (sigInput && sigPreview) {
        sigInput.addEventListener('input', () => { sigPreview.textContent = sigInput.value; });
    }

    // Draw / Type tab toggle
    const sigDrawTab = document.getElementById('sigDrawTab');
    const sigTypeTab = document.getElementById('sigTypeTab');
    const sigDrawPanel = document.getElementById('sigDrawPanel');
    const sigTypePanel = document.getElementById('sigTypePanel');
    if (sigDrawTab && sigTypeTab) {
        sigDrawTab.addEventListener('click', () => {
            sigDrawTab.classList.add('active'); sigTypeTab.classList.remove('active');
            sigDrawPanel.style.display = ''; sigTypePanel.style.display = 'none';
        });
        sigTypeTab.addEventListener('click', () => {
            sigTypeTab.classList.add('active'); sigDrawTab.classList.remove('active');
            sigTypePanel.style.display = ''; sigDrawPanel.style.display = 'none';
        });
    }

    const confirmSignBtn = document.getElementById('confirmSign');
    if (confirmSignBtn) {
        confirmSignBtn.addEventListener('click', () => {
            const typeVal = document.getElementById('sigInput')?.value?.trim();
            const canvas = document.getElementById('sigCanvas');
            const hasDrawing = canvas && !isBlankCanvas(canvas);
            if (!typeVal && !hasDrawing) {
                alert('Please draw or type your signature to continue.');
                return;
            }
            const sigName = typeVal || currentMember?.title || 'Member';
            showToast('✅ Document signed by ' + sigName);
            document.getElementById('signModal').classList.add('hidden');
            const activeDoc = document.querySelector('.btn-sm[onclick*="' + window.activeDocId + '"]');
            if (activeDoc) {
                activeDoc.textContent = 'Signed ✓';
                activeDoc.classList.remove('btn-primary');
                activeDoc.classList.add('btn-ghost');
                activeDoc.disabled = true;
                const badge = document.getElementById('docBadge');
                if (badge) badge.style.display = 'none';
            }
        });
    }

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

// ════════════════════════════════════
// ARCHITECT COMMAND CENTER
// ════════════════════════════════════
function loadCommandCenter() {
    const mockRequests = [
        { id: 'r1', member: 'The Performer', type: 'Expense', detail: 'Adobe Creative Cloud subscription — $55/mo', status: 'pending' },
        { id: 'r2', member: 'The Gastronomist', type: 'Leave', detail: '3-day leave: Mar 15–17 for catering event', status: 'pending' },
        { id: 'r3', member: 'The Visionary', type: 'Resource', detail: 'RODE Wireless GO II microphone — $299', status: 'pending' },
        { id: 'r4', member: 'The Specialist', type: 'Expense', detail: 'Medical conference registration — $120', status: 'pending' },
    ];

    const queue = document.getElementById('requestQueue');
    if (!queue) return;

    function renderQueue(requests) {
        const pending = requests.filter(r => r.status === 'pending');
        const decided = requests.filter(r => r.status !== 'pending');
        const badge = document.getElementById('commandBadge');
        const countEl = document.getElementById('cmdPendingCount');
        if (badge) badge.textContent = pending.length;
        if (countEl) countEl.textContent = pending.length;

        const all = [...pending, ...decided];
        queue.innerHTML = all.map(r => {
            const isPending = r.status === 'pending';
            const sColor = r.status === 'approved' ? 'var(--green)' : r.status === 'declined' ? 'var(--red)' : 'var(--yellow)';
            const icon = r.type === 'Expense' ? '💳' : r.type === 'Leave' ? '📅' : '📦';
            return `<li class="action-item" style="flex-direction:column;align-items:flex-start;gap:12px;">
                <div style="display:flex;align-items:center;gap:12px;width:100%;">
                    <div class="ai-icon">${icon}</div>
                    <div class="ai-text" style="flex:1;">
                        <strong>${r.member}</strong>
                        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);text-transform:uppercase;margin:0 8px;">${r.type}</span>
                        <span>${r.detail}</span>
                    </div>
                    <span style="font-family:'DM Mono',monospace;font-size:10px;color:${sColor};border:1px solid ${sColor};padding:3px 10px;border-radius:8px;opacity:0.85;">${r.status.toUpperCase()}</span>
                </div>
                ${isPending ? `<div style="display:flex;gap:10px;align-self:flex-end;">
                    <button class="btn btn-sm" style="border-color:var(--green);color:var(--green);background:rgba(34,212,122,0.07);" onclick="decideRequest('${r.id}','approved')">✓ Approve</button>
                    <button class="btn btn-sm" style="border-color:var(--red);color:var(--red);background:rgba(255,92,92,0.07);" onclick="decideRequest('${r.id}','declined')">✕ Decline</button>
                </div>` : ''}
            </li>`;
        }).join('');
    }

    renderQueue(mockRequests);

    window.decideRequest = function(id, decision) {
        const req = mockRequests.find(r => r.id === id);
        if (!req) return;
        req.status = decision;
        renderQueue(mockRequests);
        const t = document.getElementById('toast');
        if (t) {
            t.textContent = `✓ Request from ${req.member} ${decision}.`;
            t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), 3000);
        }
    };

    // Team Data Snapshot
    const teamPanel = document.getElementById('teamDataPanel');
    if (teamPanel) {
        const members = [
            {em:'🏗️', name:'The Architect'}, {em:'🎭', name:'The Performer'}, {em:'🎬', name:'The Visionary'},
            {em:'💊', name:'The Specialist'}, {em:'🍽️', name:'The Gastronomist'}, {em:'🎙️', name:'The Polymath'},
            {em:'🎵', name:'The Artist'}, {em:'⚙️', name:'The Engineer'}
        ];
        teamPanel.innerHTML = `<div class="doc-list">${members.map((m, i) => {
            const submitted = i % 2 === 0;
            const color = submitted ? 'var(--green)' : 'var(--yellow)';
            const border = submitted ? 'rgba(34,212,122,0.3)' : 'rgba(251,191,36,0.3)';
            return `<div class="doc-item">
                <div class="doc-info">
                    <span style="font-size:20px;min-width:28px;">${m.em}</span>
                    <div class="doc-meta">
                        <span class="doc-title">${m.name}</span>
                        <span class="doc-date">KPI submitted: ${submitted ? 'Today' : 'Pending'}</span>
                    </div>
                </div>
                <span style="font-family:'DM Mono',monospace;font-size:10px;color:${color};border:1px solid ${border};padding:3px 10px;border-radius:8px;">${submitted ? 'SUBMITTED' : 'PENDING'}</span>
            </div>`;
        }).join('')}</div>`;

        document.getElementById('refreshTeamData').addEventListener('click', () => {
            teamPanel.innerHTML = '<p class="mono" style="color:var(--muted);font-size:12px;padding:8px;">Fetching latest team data...</p>';
            setTimeout(() => loadCommandCenter(), 1200);
        });
    }

    // Offers & Partnerships
    const offers = document.getElementById('offersList');
    if (offers) {
        const mockOffers = [
            { company: 'Nairobi Fashion Week 2026', detail: 'Official media & content team. 3-day shoot.', val: '$2,400' },
            { company: 'Gym Nation Kenya', detail: 'Wellness content sponsorship with The Specialist.', val: '$800/mo' },
            { company: 'WeBrief Agency', detail: 'Ghost-writing retainer for The Polymath. 8 articles/mo.', val: '$1,200/mo' },
        ];
        offers.innerHTML = mockOffers.map(o => `
            <div class="doc-item">
                <div class="doc-info">
                    <span class="doc-icon">🤝</span>
                    <div class="doc-meta">
                        <span class="doc-title">${o.company}</span>
                        <span class="doc-date">${o.detail}</span>
                    </div>
                </div>
                <div class="doc-actions" style="gap:8px;">
                    <span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--accent);">${o.val}</span>
                    <button class="btn btn-sm" style="border-color:var(--green);color:var(--green);background:rgba(34,212,122,0.07);"
                        onclick="this.textContent='Accepted';this.disabled=true;this.style.opacity='0.5'">✓ Accept</button>
                    <button class="btn btn-sm" style="border-color:var(--red);color:var(--red);background:rgba(255,92,92,0.07);"
                        onclick="this.closest('.doc-item').style.opacity='0.4';this.disabled=true">✕ Decline</button>
                </div>
            </div>`).join('');
    }
}

// ════════════════════════════════════
// ROLES MARKETPLACE
// ════════════════════════════════════
const MARKETPLACE_ROLES = [
    {
        id: 'm1', icon: '📲', category: 'content',
        title: 'Social Media Manager',
        desc: 'Own all GTB social channels. Plan, schedule, and publish content across Instagram, TikTok, and YouTube. Drive engagement and follower growth.',
        kpis: ['Post 5× per week per platform', 'Grow followers by 10% per quarter', 'Report weekly engagement metrics'],
        revenue: '$1,200/mo', status: 'available'
    },
    {
        id: 'm2', icon: '🤝', category: 'sales',
        title: 'Brand Partnerships Lead',
        desc: 'Prospect and close brand sponsorship deals for the collective. Manage relationships with sponsors and negotiate campaign terms.',
        kpis: ['Close 2+ deals per month', 'Maintain sponsor CRM', 'Deliver post-campaign ROI reports'],
        revenue: '$2,500/mo + 5% commission', status: 'available'
    },
    {
        id: 'm3', icon: '📝', category: 'content',
        title: 'Content Strategist',
        desc: 'Build and maintain a content calendar for all GTB verticals. Ideate viral concepts aligned with each dimension\'s niche.',
        kpis: ['Monthly content calendar', '1 viral concept pitch per week', 'Cross-dimension content synergy'],
        revenue: '$900/mo', status: 'available'
    },
    {
        id: 'm4', icon: '🎨', category: 'creative',
        title: 'Graphic Designer',
        desc: 'Design all visual assets — social graphics, merchandise layouts, presentations, and brand identity materials for GTB Collective.',
        kpis: ['Deliver assets within 48hrs', 'Maintain brand style guide', 'Design 20+ assets per month'],
        revenue: '$1,000/mo', status: 'available'
    },
    {
        id: 'm5', icon: '📊', category: 'ops',
        title: 'Operations Coordinator',
        desc: 'Track project timelines, member deliverables, and internal communications. Ensure every dimension hits its weekly targets.',
        kpis: ['Weekly progress reports', 'On-time project delivery rate >90%', 'Manage tool stack & subscriptions'],
        revenue: '$800/mo', status: 'taken'
    },
    {
        id: 'm6', icon: '🎥', category: 'content',
        title: 'Video Editor',
        desc: 'Edit all GTB YouTube videos, reels, and TikToks. Maintain consistent visual language; color grade, cut, and export at broadcast quality.',
        kpis: ['Deliver edits within 72hrs of raw footage', 'Edit 12+ videos per month', 'Archive project files'],
        revenue: '$1,500/mo', status: 'available'
    },
    {
        id: 'm7', icon: '💼', category: 'sales',
        title: 'Merch Sales Manager',
        desc: 'Drive sales for gladtobe.co.ke — manage campaigns, flash sales, and promotions. Coordinate with the store and logistics.',
        kpis: ['Hit monthly GMV target', 'Run 2+ promotions per month', 'Reduce cart abandonment rate'],
        revenue: '$700/mo + 3% GMV', status: 'available'
    },
    {
        id: 'm8', icon: '🌐', category: 'tech',
        title: 'SEO & Growth Hacker',
        desc: 'Optimize all GTB digital properties for search and organic growth. Run A/B tests and own the analytics stack.',
        kpis: ['Improve organic traffic 15% per quarter', 'Monthly SEO audit', 'Own Google Analytics dashboards'],
        revenue: '$1,100/mo', status: 'available'
    },
    {
        id: 'm9', icon: '💡', category: 'creative',
        title: 'Creative Director (Freelance)',
        desc: 'Drive overarching creative vision for campaigns, events, and drops. Collaborate with The Visionary and The Artist on GTB brand directions.',
        kpis: ['Deliver 1 campaign brief per month', 'Attend weekly creative syncs', 'Maintain moodboard & direction doc'],
        revenue: '$1,800/mo', status: 'available'
    },
    {
        id: 'm10', icon: '🤖', category: 'tech',
        title: 'AI Tools Integrator',
        desc: 'Research and implement AI automations across GTB workflows — content, analytics, and customer engagement. Work under The Architect.',
        kpis: ['Integrate 1 new tool per month', 'Document all automation flows', 'Reduce manual work by 20%'],
        revenue: '$1,300/mo', status: 'taken'
    },
    {
        id: 'm11', icon: '📣', category: 'sales',
        title: 'Affiliate & Influencer Manager',
        desc: 'Recruit and manage affiliate partners and micro-influencers who promote GTB merch and content. Track conversions and commissions.',
        kpis: ['Onboard 5+ affiliates per month', 'Track clicks & conversions', 'Payout affiliates on time'],
        revenue: '$850/mo + 2% affiliate sales', status: 'available'
    },
    {
        id: 'm12', icon: '📋', category: 'ops',
        title: 'Finance & Invoicing Officer',
        desc: 'Manage invoices, expense tracking, and profit distribution records. Prepare monthly financial summaries for The Architect review.',
        kpis: ['Submit expense report by 5th of month', 'Zero overdue invoices', 'Maintain finance spreadsheet'],
        revenue: '$750/mo', status: 'available'
    }
];

let activeApplyId = null;

function loadMarketplace() {
    renderMarketplace('all');

    // Filter tabs
    document.querySelectorAll('.mkt-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.mkt-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderMarketplace(tab.dataset.filter);
        });
    });

    // Apply Modal events
    document.getElementById('cancelApply').addEventListener('click', () => {
        document.getElementById('applyModal').classList.add('hidden');
    });

    document.getElementById('confirmApply').addEventListener('click', async () => {
        const reason = document.getElementById('applyReason').value.trim();
        const hours = document.getElementById('applyHours').value.trim();
        if (!reason || !hours) {
            alert('Please fill in all fields before submitting.');
            return;
        }

        const btn = document.getElementById('confirmApply');
        const origText = btn.textContent;
        btn.textContent = 'Submitting...';
        btn.disabled = true;

        const role = MARKETPLACE_ROLES.find(r => r.id === activeApplyId);
        
        try {
            const { error } = await sb.from('role_applications').insert([
                {
                    member_id: currentMember ? currentMember.email : 'Unknown',
                    role_id: activeApplyId,
                    role_title: role ? role.title : 'Unknown Role',
                    reason: reason,
                    hours: parseInt(hours),
                    status: 'pending'
                }
            ]);

            if (error) throw error;

            document.getElementById('applyModal').classList.add('hidden');
            document.getElementById('applyReason').value = '';
            document.getElementById('applyHours').value = '';
            const t = document.getElementById('toast');
            if (t) {
                t.textContent = `✓ Application for "${role ? role.title : 'Role'}" submitted! The Architect will review.`;
                t.classList.add('show');
                setTimeout(() => t.classList.remove('show'), 4000);
            }
        } catch (err) {
            console.error('Submit error:', err);
            alert('Failed to submit application: ' + err.message);
        } finally {
            btn.textContent = origText;
            btn.disabled = false;
        }
    });
}

function renderMarketplace(filter) {
    const grid = document.getElementById('mktGrid');
    if (!grid) return;

    const filtered = filter === 'all' ? MARKETPLACE_ROLES : MARKETPLACE_ROLES.filter(r => r.category === filter);
    const available = filtered.filter(r => r.status === 'available').length;

    const countEl = document.getElementById('mktAvailCount');
    const badgeEl = document.getElementById('mktBadge');
    const totalAvail = MARKETPLACE_ROLES.filter(r => r.status === 'available').length;
    if (countEl) countEl.textContent = filter === 'all' ? totalAvail : available;
    if (badgeEl) badgeEl.textContent = totalAvail;

    grid.innerHTML = filtered.map(r => `
        <div class="mkt-card ${r.status === 'taken' ? 'taken' : ''}">
            <div class="mkt-card-top">
                <span class="mkt-icon">${r.icon}</span>
                <span class="mkt-category ${r.category}">${r.category}</span>
            </div>
            <div>
                <div class="mkt-role-title">${r.title}</div>
                <div class="mkt-role-desc">${r.desc}</div>
                <div class="mkt-kpis">
                    ${r.kpis.map(k => `<div class="mkt-kpi-row">${k}</div>`).join('')}
                </div>
            </div>
            <div class="mkt-card-footer">
                <div class="mkt-revenue">
                    <span class="rev-label">Revenue Potential</span>
                    <span class="rev-val">${r.revenue}</span>
                </div>
                ${r.status === 'available'
                    ? `<button class="btn btn-primary btn-sm" onclick="openApplyModal('${r.id}', '${r.title}')">Apply Now →</button>`
                    : `<span class="mkt-status-taken">Filled</span>`}
            </div>
        </div>
    `).join('');
}

window.openApplyModal = function(id, title) {
    activeApplyId = id;
    document.getElementById('applyModalRoleName').textContent = title;
    document.getElementById('applyModal').classList.remove('hidden');
    document.getElementById('applyReason').focus();
};

// ════════════════════════════════════
// TREASURY & INVESTMENTS
// ════════════════════════════════════
function loadTreasury() {
    const CONTRIB_AMOUNT = 3000;
    const now = new Date();
    const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Set month label
    const monthEl = document.getElementById('contribMonth');
    if (monthEl) monthEl.textContent = monthLabel;

    // ── Member Contribution Status ──
    const members = [
        { name: 'The Architect', em: '🏗️', status: 'paid' },
        { name: 'The Performer', em: '🎭', status: 'paid' },
        { name: 'The Visionary', em: '🎬', status: 'pending' },
        { name: 'The Specialist', em: '💊', status: 'paid' },
        { name: 'The Gastronomist', em: '🍽️', status: 'late' },
        { name: 'The Polymath', em: '🎙️', status: 'pending' },
        { name: 'The Artist', em: '🎵', status: 'paid' },
        { name: 'The Engineer', em: '⚙️', status: 'paid' },
    ];

    const paidCount = members.filter(m => m.status === 'paid').length;
    const treasuryRaw = paidCount * CONTRIB_AMOUNT;

    // Update banner stats
    const balEl = document.getElementById('treasuryBalance');
    const paidEl = document.getElementById('membersPaidCount');
    const invEl = document.getElementById('totalInvested');
    if (balEl) balEl.textContent = `KES ${treasuryRaw.toLocaleString()}`;
    if (paidEl) paidEl.textContent = `${paidCount}/8`;
    if (invEl) invEl.textContent = 'KES 20,000';

    // Render contribution list
    const list = document.getElementById('contributionList');
    if (list) {
        list.innerHTML = members.map(m => {
            const statusMap = { paid: { label: 'PAID', cls: 'contrib-paid' }, pending: { label: 'PENDING', cls: 'contrib-pending' }, late: { label: 'LATE', cls: 'contrib-late' } };
            const s = statusMap[m.status];
            return `<div class="doc-item">
                <div class="doc-info">
                    <span style="font-size:20px;min-width:28px;">${m.em}</span>
                    <div class="doc-meta">
                        <span class="doc-title">${m.name}</span>
                        <span class="doc-date">KES 3,000 &bull; ${monthLabel}</span>
                    </div>
                </div>
                <span class="${s.cls}" style="font-family:'DM Mono',monospace;font-size:11px;font-weight:800;">${s.label}</span>
            </div>`;
        }).join('');
    }

    // Pay button (marks current member as paid)
    const payBtn = document.getElementById('payContribBtn');
    if (payBtn) {
        const myMember = currentMember ? members.find(m => m.name === currentMember.title) : null;
        if (myMember && myMember.status === 'paid') {
            payBtn.textContent = '✓ Contributed This Month';
            payBtn.disabled = true;
            payBtn.style.opacity = '0.5';
        }
        payBtn.addEventListener('click', () => {
            if (myMember) myMember.status = 'paid';
            loadTreasury();
            const t = document.getElementById('toast');
            if (t) { t.textContent = '✓ KES 3,000 contribution recorded! Thank you.'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3500); }
        });
    }

    // ── Fundraisers ──
    let fundraisers = [
        { name: 'GTB Annual Meetup 2026', target: 50000, raised: 18000, deadline: '2026-06-01', desc: 'Venue, catering & production for our first in-person collective event.' },
        { name: 'Equipment Upgrade Fund', target: 30000, raised: 30000, deadline: '2026-03-31', desc: 'Camera, audio, and lighting upgrades for The Visionary & The Artist.' },
        { name: 'Marketing Campaign Q2', target: 25000, raised: 4500, deadline: '2026-04-30', desc: 'Paid ads and influencer campaigns for GTB merch launch.' },
    ];

    function renderFundraisers() {
        const fr = document.getElementById('fundraiserList');
        if (!fr) return;
        fr.innerHTML = fundraisers.map((f, i) => {
            const pct = Math.min(100, Math.round((f.raised / f.target) * 100));
            const done = pct >= 100;
            return `<div class="doc-item" style="flex-direction:column;align-items:stretch;gap:10px;">
                <div style="display:flex;align-items:center;gap:14px;">
                    <span style="font-size:22px;">${done ? '✅' : '🎉'}</span>
                    <div style="flex:1;">
                        <span class="doc-title">${f.name}</span>
                        <span class="doc-date">Deadline: ${f.deadline} &bull; ${f.desc}</span>
                    </div>
                    <button class="btn btn-ghost btn-sm" onclick="contributeToFundraiser(${i})">+ Contribute</button>
                </div>
                <div>
                    <div class="progress-track"><div class="progress-fill" style="width:${pct}%;"></div></div>
                    <div class="fundraiser-meta">
                        <span>KES ${f.raised.toLocaleString()} raised</span>
                        <strong>KES ${f.target.toLocaleString()} goal &bull; ${pct}%</strong>
                    </div>
                </div>
            </div>`;
        }).join('');
    }
    renderFundraisers();

    window.contributeToFundraiser = function(i) {
        const amount = parseInt(prompt('Enter your contribution amount (KES):'));
        if (!amount || isNaN(amount) || amount <= 0) return;
        fundraisers[i].raised = Math.min(fundraisers[i].target, fundraisers[i].raised + amount);
        renderFundraisers();
        const t = document.getElementById('toast');
        if (t) { t.textContent = `✓ KES ${amount.toLocaleString()} added to "${fundraisers[i].name}"!`; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3500); }
    };

    document.getElementById('newFundraiserBtn').addEventListener('click', () => {
        document.getElementById('fundraiserModal').classList.remove('hidden');
    });
    document.getElementById('saveFundraiserBtn').addEventListener('click', () => {
        const name = document.getElementById('frName').value.trim();
        const target = parseInt(document.getElementById('frTarget').value);
        const deadline = document.getElementById('frDeadline').value;
        const desc = document.getElementById('frDesc').value.trim();
        if (!name || !target || !deadline) { alert('Please fill in all required fields.'); return; }
        fundraisers.unshift({ name, target, raised: 0, deadline, desc });
        renderFundraisers();
        document.getElementById('fundraiserModal').classList.add('hidden');
        ['frName','frTarget','frDeadline','frDesc'].forEach(id => document.getElementById(id).value = '');
        const t = document.getElementById('toast');
        if (t) { t.textContent = `✓ Fundraiser "${name}" created!`; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3500); }
    });

    // ── Investment Strategies ──
    let investments = [
        { title: 'Kenya Treasury Bills (91-Day)', tag: 'active', desc: 'Low-risk government-backed instrument. Rolling 91-day reinvestment for steady liquidity.', amount: 20000, roi: '14.5% p.a.' },
        { title: 'Money Market Fund (Sanlam)', tag: 'active', desc: 'Liquid savings vehicle with daily interest. Flexibility for emergency withdrawals after 60 days.', amount: 15000, roi: '11% p.a.' },
        { title: 'GTB Merch Pre-Production', tag: 'proposed', desc: 'Invest in bulk inventory production for the next GTB merch drop. Expected 60% margin.', amount: 30000, roi: '40-60% per drop' },
        { title: 'Content Studio Equipment', tag: 'proposed', desc: 'Capital equipment investment: mirrorless camera + lens kit for content monetisation.', amount: 45000, roi: 'Long-term revenue' },
        { title: 'Crypto Blue-Chips (BTC/ETH)', tag: 'proposed', desc: 'Hold 10% of treasury in BTC and ETH for mid-term growth. High risk, high reward.', amount: 5000, roi: 'Variable' },
        { title: 'Chama SACCO Deposit', tag: 'completed', desc: 'Q4 2025 SACCO contribution fully disbursed. Returns distributed to members in January 2026.', amount: 24000, roi: '9% (Paid)' },
    ];

    function renderInvestments() {
        const grid = document.getElementById('investGrid');
        if (!grid) return;
        grid.innerHTML = investments.map((inv, i) => `
            <div class="invest-card">
                <div class="invest-card-header">
                    <span class="invest-card-title">${inv.title}</span>
                    <span class="invest-tag ${inv.tag}">${inv.tag}</span>
                </div>
                <p class="invest-desc">${inv.desc}</p>
                <div class="invest-meta">
                    <div>
                        <span class="invest-amount-label">Capital Allocated</span>
                        <span class="invest-amount">KES ${inv.amount.toLocaleString()}</span>
                    </div>
                    <div class="invest-roi">
                        <span>Expected ROI</span>
                        <strong>${inv.roi}</strong>
                    </div>
                </div>
            </div>
        `).join('');
    }
    renderInvestments();

    document.getElementById('proposeInvestBtn').addEventListener('click', () => {
        document.getElementById('investModal').classList.remove('hidden');
    });
    document.getElementById('saveInvestBtn').addEventListener('click', () => {
        const name = document.getElementById('invName').value.trim();
        const amount = parseInt(document.getElementById('invAmount').value);
        const roi = document.getElementById('invROI').value.trim();
        const rat = document.getElementById('invRationale').value.trim();
        if (!name || !amount || !roi) { alert('Please fill all required fields.'); return; }
        investments.unshift({ title: name, tag: 'proposed', desc: rat || 'No rationale provided.', amount, roi });
        renderInvestments();
        document.getElementById('investModal').classList.add('hidden');
        ['invName','invAmount','invROI','invRationale'].forEach(id => document.getElementById(id).value = '');
        const t = document.getElementById('toast');
        if (t) { t.textContent = `✓ Investment proposal "${name}" submitted for review.`; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3500); }
    });
}

// ════════════════════════════════════
// ROLE WORKSPACE PANEL
// ════════════════════════════════════
const ROLE_WORKSPACE_DATA = {
    architect: {
        tasks: [
            { text: 'Review pending member requests in Command Center', due: 'Today', urgent: true },
            { text: 'Verify cloud deployment pipeline is green', due: 'Today', urgent: false },
            { text: 'Sign Q4 Partner Agreement', due: 'Mar 15', urgent: true },
            { text: 'Approve Q2 investment proposals', due: 'Mar 20', urgent: false },
            { text: 'Update system outage protocol', due: 'Mar 31', urgent: false },
        ],
        files: [
            { name: 'GTB System Architecture', type: 'PDF', icon: '📄' },
            { name: 'Server Access Credentials', type: 'Encrypted Doc', icon: '🔐' },
            { name: 'Cloud Cost Report Q1', type: 'Sheet', icon: '📊' },
        ],
    },
    performer: {
        tasks: [
            { text: 'Post 3 short-form reels this week', due: 'Fri', urgent: false },
            { text: 'Film the GTB behind-the-scenes vlog', due: 'Mar 14', urgent: true },
            { text: 'Submit expense claim for Adobe CC', due: 'Mar 15', urgent: true },
            { text: 'Engage with 50 targeted accounts', due: 'Daily', urgent: false },
        ],
        files: [
            { name: 'Content Calendar Q1', type: 'Sheet', icon: '📅' },
            { name: 'Brand Guidelines', type: 'PDF', icon: '🎨' },
            { name: 'Script Template', type: 'Doc', icon: '📝' },
        ],
    },
    visionary: {
        tasks: [
            { text: 'Edit and export Episode 3 footage', due: 'Mar 14', urgent: true },
            { text: 'Submit leave application for Mar 15-17', due: 'Today', urgent: true },
            { text: 'Grade color for GTB launch teaser', due: 'Mar 18', urgent: false },
            { text: 'Upload raw footage to shared drive', due: 'Mar 13', urgent: false },
        ],
        files: [
            { name: 'GTB Brand Moodboard', type: 'Image', icon: '🖼️' },
            { name: 'Shoot Schedule', type: 'Sheet', icon: '📊' },
            { name: 'Episode 3 Brief', type: 'Doc', icon: '📝' },
        ],
    },
    specialist: {
        tasks: [
            { text: 'Submit medical conference reimbursement', due: 'Today', urgent: true },
            { text: 'Publish weekly health tip for GTB feed', due: 'Wed', urgent: false },
            { text: 'Complete hydration tracker review', due: 'Fri', urgent: false },
            { text: 'Prepare wellness protocol document', due: 'Mar 20', urgent: false },
        ],
        files: [
            { name: 'Health Protocol SOP', type: 'PDF', icon: '📚' },
            { name: 'Member Wellness Data', type: 'Sheet', icon: '📊' },
            { name: 'GTB Diet Plan Template', type: 'Doc', icon: '🍎' },
        ],
    },
    gastronomist: {
        tasks: [
            { text: 'Submit leave request for catering event', due: 'Today', urgent: true },
            { text: 'Pay monthly contribution (KES 3,000)', due: 'Mar 5', urgent: true },
            { text: 'Plan menu for GTB Annual Meetup', due: 'Apr 01', urgent: false },
        ],
        files: [
            { name: 'Event Catering Brief', type: 'Doc', icon: '🍽️' },
            { name: 'GTB Nutrition Guide', type: 'PDF', icon: '🍏' },
            { name: 'Budget Sheet Q2', type: 'Sheet', icon: '📊' },
        ],
    },
    polymath: {
        tasks: [
            { text: 'Pay monthly contribution (KES 3,000)', due: 'Mar 5', urgent: true },
            { text: 'Draft press release for Q2 launch', due: 'Mar 16', urgent: false },
            { text: 'Record 2 podcast segments this week', due: 'Fri', urgent: false },
        ],
        files: [
            { name: 'Press Kit 2026', type: 'PDF', icon: '📄' },
            { name: 'Episode Script Archive', type: 'Doc', icon: '🎙️' },
            { name: 'GTB Style Guide', type: 'PDF', icon: '🎨' },
        ],
    },
    artist: {
        tasks: [
            { text: 'Produce 2 beats for GTB intro library', due: 'Mar 18', urgent: false },
            { text: 'Submit monthly contribution (KES 3,000)', due: 'Mar 5', urgent: false },
            { text: 'Create GTB sonic identity document', due: 'Mar 30', urgent: false },
        ],
        files: [
            { name: 'GTB Sound Library', type: 'Folder', icon: '🎵' },
            { name: 'Branding Brief', type: 'PDF', icon: '🎨' },
            { name: 'Licensing Template', type: 'Doc', icon: '📝' },
        ],
    },
    engineer: {
        tasks: [
            { text: 'Deploy latest build to staging server', due: 'Today', urgent: true },
            { text: 'Review CI/CD pipeline configuration', due: 'Mar 14', urgent: false },
            { text: 'Fix broken API endpoint on portal', due: 'Today', urgent: true },
            { text: 'Submit contribution (KES 3,000)', due: 'Mar 5', urgent: false },
        ],
        files: [
            { name: 'GTB API Docs', type: 'Doc', icon: '⚙️' },
            { name: 'Deployment Checklist', type: 'PDF', icon: '📄' },
            { name: 'Environment Variables', type: 'Encrypted', icon: '🔐' },
        ],
    }
};

const GLOBAL_REMINDERS = [
    { text: 'KES 3,000 contribution due by the 5th', type: 'critical', icon: '💳' },
    { text: 'Weekly KPI report must be submitted by Friday', type: 'warning', icon: '📊' },
    { text: 'All documents pending signature need urgent attention', type: 'critical', icon: '✍️' },
    { text: 'New open roles available in the Marketplace', type: 'info', icon: '🛒' },
    { text: 'Fundraiser: GTB Annual Meetup — 64% goal remaining', type: 'warning', icon: '🎉' },
];

function loadWorkspace() {
    const role = currentMember ? currentMember.role : null;
    const data = ROLE_WORKSPACE_DATA[role] || ROLE_WORKSPACE_DATA['architect'];
    const labelEl = document.getElementById('workspaceRoleLabel');
    if (labelEl && currentMember) {
        labelEl.textContent = `${currentMember.title.toUpperCase()} — ${currentMember.role.toUpperCase()} DIMENSION`;
    }

    // Tasks
    const taskList = document.getElementById('wsTaskList');
    if (taskList && data.tasks) {
        taskList.innerHTML = data.tasks.map((t, i) => `
            <li class="ws-task" id="wst-${i}">
                <input type="checkbox" id="wstck-${i}" onchange="toggleWsTask(${i})">
                <div class="task-meta">
                    <span>${t.text}</span>
                    <span class="task-due ${t.urgent ? 'urgent' : ''}">Due: ${t.due}${t.urgent ? ' 🔴' : ''}</span>
                </div>
            </li>
        `).join('');
    }

    window.toggleWsTask = function(i) {
        const li = document.getElementById(`wst-${i}`);
        if (li) li.classList.toggle('done');
    };

    // Pin file button (quick demo)
    document.getElementById('addTaskBtn').addEventListener('click', () => {
        const name = prompt('Enter new task:');
        if (!name) return;
        const li = document.createElement('li');
        li.className = 'ws-task';
        li.innerHTML = `<input type="checkbox"><div class="task-meta"><span>${name}</span><span class="task-due">Due: TBD</span></div>`;
        taskList.prepend(li);
    });

    // Files
    const fileList = document.getElementById('wsFileList');
    if (fileList && data.files) {
        fileList.innerHTML = data.files.map(f => `
            <div class="ws-file-item">
                <span class="fi-icon">${f.icon}</span>
                <div class="ws-file-meta">
                    <span class="ws-file-name">${f.name}</span>
                    <span class="ws-file-type">${f.type}</span>
                </div>
                <span style="font-size:12px;color:var(--muted);">Open →</span>
            </div>
        `).join('');
    }

    document.getElementById('addFileBtn').addEventListener('click', () => {
        const name = prompt('Pin file name:');
        if (!name) return;
        const div = document.createElement('div');
        div.className = 'ws-file-item';
        div.innerHTML = `<span class="fi-icon">📎</span><div class="ws-file-meta"><span class="ws-file-name">${name}</span><span class="ws-file-type">Pinned</span></div>`;
        fileList.prepend(div);
    });

    // Reminders
    const remList = document.getElementById('wsReminderList');
    if (remList) {
        remList.innerHTML = GLOBAL_REMINDERS.map(r => `
            <div class="ws-reminder ${r.type}">
                <span class="rem-icon">${r.icon}</span>
                <span>${r.text}</span>
            </div>
        `).join('');
    }
}

// ════════════════════════════════════
// GTB ASSISTANT (8-HOUR REMINDER)
// ════════════════════════════════════
function initAssistant() {
    const INTERVAL_MS = 8 * 60 * 60 * 1000; // 8 hours
    const LS_KEY = 'gtb_assistant_last_shown';
    const overlay = document.getElementById('gtbAssistant');
    const fab = document.getElementById('assistantFab');
    const fabNotif = document.getElementById('fabNotif');

    function getUrgentTasks() {
        const role = currentMember ? currentMember.role : 'architect';
        const data = ROLE_WORKSPACE_DATA[role] || ROLE_WORKSPACE_DATA['architect'];
        const urgent = (data.tasks || []).filter(t => t.urgent);
        return urgent;
    }

    function buildAssistantContent() {
        const hour = new Date().getHours();
        let greeting;
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 17) greeting = 'Good afternoon';
        else greeting = 'Good evening';

        const name = currentMember ? currentMember.title : 'Member';
        const greetEl = document.getElementById('assistantGreeting');
        const timeEl = document.getElementById('assistantTime');
        if (greetEl) greetEl.textContent = `${greeting}, ${name}. Here are your open action items that require attention right now:`;
        if (timeEl) timeEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });

        const urgentTasks = getUrgentTasks();
        const allReminders = [
            ...urgentTasks.map(t => ({ icon: '🔴', text: t.text, sub: `Due: ${t.due}`, level: 'critical' })),
            { icon: '💳', text: 'Monthly KES 3,000 contribution', sub: 'Due: 5th of every month — check your status', level: 'warning' },
            { icon: '✍️', text: 'Unsigned documents awaiting you', sub: 'Navigate to Documents → Sign Now', level: 'warning' },
            { icon: '📊', text: 'Submit weekly KPI report', sub: 'Required by all dimensions every Friday', level: 'normal' },
        ];

        const tasksEl = document.getElementById('assistantTasks');
        if (tasksEl) {
            tasksEl.innerHTML = allReminders.map(r => `
                <div class="assist-task ${r.level}">
                    <span class="at-icon">${r.icon}</span>
                    <div class="at-body">
                        <strong>${r.text}</strong>
                        <span>${r.sub}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    function showAssistant() {
        buildAssistantContent();
        overlay.classList.remove('hidden');
        fabNotif.classList.remove('show');
        localStorage.setItem(LS_KEY, Date.now().toString());
    }

    function hideAssistant() {
        overlay.classList.add('hidden');
    }

    function shouldShow() {
        const last = parseInt(localStorage.getItem(LS_KEY) || '0');
        return Date.now() - last >= INTERVAL_MS;
    }

    // Check on load — show after 3s if 8hr elapsed
    setTimeout(() => {
        if (shouldShow()) {
            showAssistant();
        } else {
            // Show FAB notification dot
            fabNotif.classList.add('show');
        }
    }, 3000);

    // Periodic interval check
    setInterval(() => {
        if (shouldShow()) {
            fabNotif.classList.add('show');
            showAssistant();
        }
    }, 60 * 1000); // check every minute

    // FAB click
    fab.addEventListener('click', () => {
        if (overlay.classList.contains('hidden')) {
            showAssistant();
        } else {
            hideAssistant();
        }
    });

    // Close button
    document.getElementById('assistantClose').addEventListener('click', hideAssistant);

    // Dismiss
    document.getElementById('assistantDismiss').addEventListener('click', () => {
        hideAssistant();
        const t = document.getElementById('toast');
        if (t) { t.textContent = '✓ Great! Your next check-in is in 8 hours.'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }
    });

    // Snooze 2 hours
    document.getElementById('assistantSnooze').addEventListener('click', () => {
        hideAssistant();
        const snoozeTime = Date.now() - INTERVAL_MS + (2 * 60 * 60 * 1000);
        localStorage.setItem(LS_KEY, snoozeTime.toString());
        const t = document.getElementById('toast');
        if (t) { t.textContent = '⏰ Snoozed 2 hours. I\'ll remind you again soon.'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }
    });
}

// ════════════════════════════════════
// PERFORMANCE RANKINGS & FAN FUND
// (Called in Architect Command Center)
// ════════════════════════════════════

// Fallback mock data used when backend server is not running
const PERF_MOCK = [
    { rank:1, name:'The Engineer',    emoji:'⚙️',  totalScore:962, tier:{label:'ELITE',color:'#fbbf24'},      breakdown:{contributionConsistency:{score:100},kpiAchievement:{score:96},taskCompletionRate:{score:94},engagement:{score:85}} },
    { rank:2, name:'The Architect',   emoji:'🏗️', totalScore:940, tier:{label:'ELITE',color:'#fbbf24'},      breakdown:{contributionConsistency:{score:100},kpiAchievement:{score:95},taskCompletionRate:{score:90},engagement:{score:88}} },
    { rank:3, name:'The Specialist',  emoji:'💊',  totalScore:895, tier:{label:'COMMITTED',color:'#22d47a'}, breakdown:{contributionConsistency:{score:100},kpiAchievement:{score:91},taskCompletionRate:{score:88},engagement:{score:82}} },
    { rank:4, name:'The Performer',   emoji:'🎭',  totalScore:875, tier:{label:'COMMITTED',color:'#22d47a'}, breakdown:{contributionConsistency:{score:100},kpiAchievement:{score:88},taskCompletionRate:{score:85},engagement:{score:92}} },
    { rank:5, name:'The Artist',      emoji:'🎵',  totalScore:862, tier:{label:'COMMITTED',color:'#22d47a'}, breakdown:{contributionConsistency:{score:100},kpiAchievement:{score:84},taskCompletionRate:{score:82},engagement:{score:86}} },
    { rank:6, name:'The Polymath',    emoji:'🎙️', totalScore:720, tier:{label:'ACTIVE',color:'#7c6fff'},    breakdown:{contributionConsistency:{score:67}, kpiAchievement:{score:72},taskCompletionRate:{score:68},engagement:{score:78}} },
    { rank:7, name:'The Visionary',   emoji:'🎬',  totalScore:698, tier:{label:'ACTIVE',color:'#7c6fff'},    breakdown:{contributionConsistency:{score:67}, kpiAchievement:{score:78},taskCompletionRate:{score:70},engagement:{score:75}} },
    { rank:8, name:'The Gastronomist',emoji:'🍽️', totalScore:492, tier:{label:'AT RISK',color:'#ff5c5c'},   breakdown:{contributionConsistency:{score:33}, kpiAchievement:{score:55},taskCompletionRate:{score:50},engagement:{score:60}} },
];

async function loadPerformanceRankings() {
    let rankings = PERF_MOCK;
    try {
        const res = await fetch('/api/performance');
        if (res.ok) { const j = await res.json(); if (j.rankings) rankings = j.rankings; }
    } catch (_) { /* backend not running, use mock */ }

    renderPerfTable(rankings);
    loadFanFund(rankings[0]);

    const refreshBtn = document.getElementById('refreshPerfBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            renderPerfTable(rankings);
            loadFanFund(rankings[0]);
        });
    }
}

function renderPerfTable(rankings) {
    const tbody = document.getElementById('perfTableBody');
    if (!tbody) return;
    const medals = ['🥇','🥈','🥉'];
    tbody.innerHTML = rankings.map(m => {
        const b = m.breakdown;
        return `<tr>
            <td><span class="rank-medal">${medals[m.rank - 1] || m.rank}</span></td>
            <td><span style="font-size:18px;margin-right:8px;">${m.emoji}</span><strong>${m.name}</strong></td>
            <td><span class="perf-score" style="color:${m.tier.color};">${m.totalScore}</span><span class="perf-sub">/1000</span></td>
            <td><span class="tx-status" style="color:${m.tier.color};background:${m.tier.color}18;border-color:${m.tier.color}44;">${m.tier.label}</span></td>
            <td class="perf-sub">${b.contributionConsistency.score}%</td>
            <td class="perf-sub">${b.kpiAchievement.score}%</td>
            <td class="perf-sub">${b.taskCompletionRate.score}%</td>
            <td class="perf-sub">${b.engagement.score}%</td>
        </tr>`;
    }).join('');
}

async function loadFanFund(topPerformer) {
    let fundData = {
        balance: 47500, totalReceived: 72000, totalAwarded: 24500, donorCount: 14,
        recentDonors: [
            { name:'GlobalFan',   country:'Canada',  amount:5000,  message:'For the hardest worker.',  date:'2026-03-10' },
            { name:'Anonymous',   country:'Germany', amount:8000,  message:'Inspiring work.',           date:'2026-03-09' },
            { name:'SupporterX',  country:'Kenya',   amount:3000,  message:'🔥 GTB forever!',           date:'2026-03-07' },
            { name:'Anonymous',   country:'UK',      amount:10000, message:'For the most dedicated.',  date:'2026-03-05' },
            { name:'Fan #002',    country:'Uganda',  amount:2500,  message:'GTB are legends!',          date:'2026-03-03' },
        ],
        rewardHistory: [
            { recipient:'The Engineer',  amount:12000, month:'Jan 2026', reason:'Top scorer 3 months running — 962/1000' },
            { recipient:'The Architect', amount:12500, month:'Feb 2026', reason:'Highest KPI + contribution consistency' },
        ]
    };

    try {
        const res = await fetch('/api/fanfund/balance');
        if (res.ok) { const j = await res.json(); if (j.balance) fundData = j; }
    } catch (_) { /* use mock */ }

    // Stats
    const statsEl = document.getElementById('fanFundStats');
    if (statsEl) {
        statsEl.innerHTML = [
            { label: 'Current Balance', val: `KES ${fundData.balance.toLocaleString()}`, color: 'var(--green)' },
            { label: 'Total Received',  val: `KES ${fundData.totalReceived.toLocaleString()}`, color: 'var(--text)' },
            { label: 'Total Awarded',   val: `KES ${fundData.totalAwarded.toLocaleString()}`, color: 'var(--accent)' },
        ].map(s => `<div class="ffs-box"><div class="ffs-label">${s.label}</div><div class="ffs-val" style="color:${s.color};">${s.val}</div></div>`).join('');
    }

    // Recent Donors
    const donorEl = document.getElementById('fanDonorList');
    if (donorEl && fundData.recentDonors) {
        donorEl.innerHTML = fundData.recentDonors.map(d => `
            <div class="doc-item">
                <div class="doc-info">
                    <span style="font-size:20px;">🌍</span>
                    <div class="doc-meta">
                        <span class="doc-title">${d.name} <span class="mono" style="font-size:10px;color:var(--muted);">${d.country}</span></span>
                        <span class="doc-date">"${d.message}" — KES ${d.amount.toLocaleString()}</span>
                    </div>
                </div>
                <span class="tx-status confirmed">KES ${d.amount.toLocaleString()}</span>
            </div>
        `).join('');
    }

    // Reward History
    const histEl = document.getElementById('fanRewardHistory');
    if (histEl && fundData.rewardHistory) {
        histEl.innerHTML = fundData.rewardHistory.map(r => `
            <div class="doc-item">
                <div class="doc-info">
                    <span style="font-size:20px;">🏆</span>
                    <div class="doc-meta">
                        <span class="doc-title">${r.recipient} <span class="mono" style="font-size:10px;color:var(--muted);">${r.month}</span></span>
                        <span class="doc-date">${r.reason}</span>
                    </div>
                </div>
                <span class="tx-status confirmed">KES ${r.amount.toLocaleString()}</span>
            </div>
        `).join('');
    }

    // Next winner preview
    if (topPerformer) {
        const nwEl = document.getElementById('nextRewardPreview');
        if (nwEl) {
            const reward = Math.floor(fundData.balance * 0.70);
            nwEl.innerHTML = `
                <span class="fnw-emoji">${topPerformer.emoji}</span>
                <div class="fnw-info">
                    <strong>${topPerformer.name}</strong>
                    <span class="fnw-score">${topPerformer.totalScore}/1000 pts — If distributed now: <strong style="color:var(--yellow);">KES ${reward.toLocaleString()}</strong></span>
                    <span class="fnw-reason">Based on current weighted algorithm across all 6 performance dimensions.</span>
                </div>
                <span class="fnw-tier">${topPerformer.tier.label}</span>
            `;
        }
    }

    // Distribute button
    const distBtn = document.getElementById('distributeFundBtn');
    if (distBtn) {
        distBtn.addEventListener('click', async () => {
            if (!confirm(`Are you sure you want to distribute ~KES ${Math.floor(fundData.balance * 0.70).toLocaleString()} to ${topPerformer?.name || 'top performer'}?`)) return;
            try {
                const res = await fetch('/api/fanfund/distribute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requestedBy: 'architect' }),
                });
                const data = await res.json();
                if (data.success) {
                    const t = document.getElementById('toast');
                    if (t) {
                        t.textContent = `🏆 KES ${data.result.rewardAmount.toLocaleString()} secretly awarded to ${data.result.recipient}!`;
                        t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 4500);
                    }
                    loadFanFund(topPerformer); // Refresh
                }
            } catch (_) {
                // Simulate for demo
                const t = document.getElementById('toast');
                if (t) {
                    t.textContent = `🏆 KES ${Math.floor(fundData.balance * 0.70).toLocaleString()} reward triggered — check M-Pesa! (Demo mode)`;
                    t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 4500);
                }
            }
        });
    }
}

// ════════════════════════════════════
// DOCUMENT SYSTEM — PDF, SIGNING, VIDEO, AI CHAT
// ════════════════════════════════════

// ── GTB Document Registry ─────────────────────────────────────
const GTB_DOCS = [
    {
        id: 'gtb-member-agreement',
        title: 'GTB Member Agreement',
        type: 'Contract',
        category: 'Legal',
        status: 'needs-signature',
        date: 'Mar 2026',
        icon: '📜',
        content: `
            <h2>GTB Collective Member Agreement</h2>
            <p><strong>Date:</strong> March 2026 &nbsp;|&nbsp; <strong>Version:</strong> 2.1</p>
            <h3>1. Purpose</h3>
            <p>This agreement governs the terms under which each member of Glad To Be (GTB) participates in the collective. By signing, you confirm your understanding and acceptance of all obligations herein.</p>
            <div class="clause">Every member is required to contribute KES 3,000 per calendar month, due no later than the 5th of each month, to cover shared operational costs including but not limited to hosting, software licenses, and event reserves.</div>
            <h3>2. Roles & Responsibilities</h3>
            <p>Each member occupies a specific Dimension within the GTB collective. Members are expected to fulfil the responsibilities associated with their Dimension and contribute actively to the collective's KPIs.</p>
            <h3>3. Investment Participation</h3>
            <p>Members who participate in collective investment pools agree to a minimum 60-day lock-in period. Investment returns are distributed quarterly after a 20% reinvestment deduction.</p>
            <h3>4. Confidentiality</h3>
            <div class="clause">All internal financials, strategies, and member data are strictly confidential. Sharing this information outside the collective without written consent from The Architect constitutes a breach of this agreement.</div>
            <h3>5. Exit Clause</h3>
            <p>A departing member forfeits their investment share for the current quarter. All prior returns are retained. Notice of exit must be submitted in writing at least 30 days in advance.</p>
        `
    },
    {
        id: 'gtb-nda',
        title: 'Non-Disclosure Agreement (NDA)',
        type: 'NDA',
        category: 'Legal',
        status: 'signed',
        date: 'Jan 2026',
        icon: '🔒',
        content: `
            <h2>GTB Non-Disclosure Agreement</h2>
            <p><strong>Date:</strong> January 2026 &nbsp;|&nbsp; <strong>Status:</strong> SIGNED</p>
            <h3>1. Confidential Information</h3>
            <p>For purposes of this Agreement, "Confidential Information" means any proprietary data, business strategies, financial information, or creative works developed by or shared within the GTB Collective.</p>
            <div class="clause">The receiving party agrees not to disclose, publish, or otherwise reveal any Confidential Information received from the disclosing party to any other person or entity without prior written approval.</div>
            <h3>2. Term</h3>
            <p>This obligation shall remain in effect for 3 years following the termination of membership.</p>
        `
    },
    {
        id: 'gtb-investment-consent',
        title: 'Q1 2026 Investment Consent Form',
        type: 'Investment',
        category: 'Finance',
        status: 'needs-signature',
        date: 'Mar 2026',
        icon: '📈',
        content: `
            <h2>Q1 2026 Collective Investment Consent</h2>
            <p><strong>Investment:</strong> Kenya Treasury Bills (91-Day) &nbsp;|&nbsp; <strong>Pool size:</strong> KES 120,000</p>
            <h3>Terms</h3>
            <p>Each consenting member authorizes the allocation of up to KES 15,000 from the treasury pool into Kenya Treasury Bills for a 91-day period at a projected interest rate of 14.5% per annum.</p>
            <div class="clause">Returns will be distributed equally among consenting members after the 91-day maturity period, with 20% reinvested back into the pool as per GTB financial rules.</div>
            <h3>Risk Acknowledgement</h3>
            <p>I understand government securities carry minimal risk but are not guaranteed. I have read and understand the investment terms.</p>
        `
    },
    {
        id: 'gtb-role-sop',
        title: 'Role SOP & KPI Agreement',
        type: 'SOP',
        category: 'Operations',
        status: 'signed',
        date: 'Feb 2026',
        icon: '📋',
        content: `
            <h2>Standard Operating Procedure — Member Role KPIs</h2>
            <p>This document outlines the expected Key Performance Indicators (KPIs) for your role Dimension at GTB.</p>
            <div class="clause">Members are required to submit a weekly KPI report every Friday before 11:59 PM EAT. Failure to submit 3 consecutive reports will trigger a performance review with The Architect.</div>
            <h3>Universal KPIs (All Members)</h3>
            <p>1. Monthly contribution — paid by 5th<br>2. Weekly KPI report — submitted by Friday<br>3. Document signing — within 48hrs of issuance<br>4. Meeting attendance — min 75% per month</p>
        `
    },
];

// ── Document List UI ──────────────────────────────────────────
function loadDocumentSystem() {
    renderDocList();
    initDocTabs();
    initSignatureCanvas();
    initVideoSystem();
    initAIDocAssistant();

    // Generate PDF button (generates the active/first doc)
    const genPdfBtn = document.getElementById('genPdfBtn');
    if (genPdfBtn) {
        genPdfBtn.addEventListener('click', () => generateGTBPdf(GTB_DOCS[0]));
    }
}

function renderDocList() {
    const list = document.getElementById('docList');
    if (!list) return;
    list.innerHTML = GTB_DOCS.map(doc => {
        const isSigned = doc.status === 'signed';
        return `
        <div class="doc-item">
            <div class="doc-info">
                <span style="font-size:22px;">${doc.icon}</span>
                <div class="doc-meta">
                    <span class="doc-title">${doc.title}</span>
                    <span class="doc-date">${doc.category} &bull; ${doc.date}</span>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                ${isSigned
                    ? `<span class="tx-status confirmed">✓ Signed</span>`
                    : `<span class="tx-status pending">⚠ Needs Signature</span>`}
                <button class="btn btn-ghost btn-sm" onclick="openDocViewer('${doc.id}')">View</button>
                <button class="btn btn-ghost btn-sm" onclick="generateGTBPdf('${doc.id}')">⬇️ PDF</button>
            </div>
        </div>`;
    }).join('');
}

window.openDocViewer = function(docId) {
    const doc = GTB_DOCS.find(d => d.id === docId);
    if (!doc) return;
    document.getElementById('signModalTitle').textContent = doc.title;
    document.getElementById('docPreviewArea').innerHTML = doc.content;
    document.getElementById('signModal').classList.remove('hidden');

    // Clear canvas for fresh signing
    const canvas = document.getElementById('sigCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const hint = canvas.parentElement.querySelector('.sig-canvas-hint');
        if (hint) hint.style.opacity = '1';
    }

    // Wire PDF download inside modal
    const dlBtn = document.getElementById('downloadPdfBtn');
    if (dlBtn) {
        dlBtn.onclick = () => generateGTBPdf(docId);
    }
};

// ── PDF Generation ────────────────────────────────────────────
window.generateGTBPdf = function(docOrId) {
    const doc = typeof docOrId === 'string'
        ? GTB_DOCS.find(d => d.id === docOrId)
        : docOrId;
    if (!doc) return;

    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) { alert('PDF library not loaded. Check your internet connection.'); return; }

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    // Header
    pdf.setFillColor(6, 6, 9);
    pdf.rect(0, 0, 210, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GTB COLLECTIVE', 20, 20);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(160, 160, 180);
    pdf.text(`${doc.type} — ${doc.category}`, 20, 30);

    // Document title block
    pdf.setTextColor(30, 30, 30);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(doc.title, 20, 58);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 120);
    pdf.text(`Document ID: ${doc.id}  |  Date: ${doc.date}  |  Status: ${doc.status.toUpperCase()}`, 20, 68);

    // Strip HTML for PDF content
    const parser = new DOMParser();
    const parsed = parser.parseFromString(doc.content, 'text/html');
    const plainText = parsed.body.innerText || parsed.body.textContent || '';
    const lines = pdf.splitTextToSize(plainText.trim(), 170);

    pdf.setTextColor(40, 40, 50);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    let y = 82;
    lines.forEach(line => {
        if (y > 265) { pdf.addPage(); y = 20; }
        pdf.text(line, 20, y);
        y += 6;
    });

    // Signature block
    y = Math.max(y + 16, 220);
    pdf.setDrawColor(200, 200, 220);
    pdf.line(20, y, 100, y);
    pdf.line(120, y, 190, y);
    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 140);
    pdf.text('Member Signature', 20, y + 6);
    pdf.text('Date', 120, y + 6);

    // Footer
    pdf.setFillColor(6, 6, 9);
    pdf.rect(0, 285, 210, 12, 'F');
    pdf.setTextColor(100, 100, 120);
    pdf.setFontSize(8);
    pdf.text(`Generated by GTB Intranet  |  ${new Date().toLocaleDateString('en-KE', { dateStyle: 'long' })}  |  CONFIDENTIAL`, 20, 292);

    pdf.save(`GTB_${doc.id}_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast(`✓ PDF for "${doc.title}" downloaded.`);
};

// ── Signature Canvas ──────────────────────────────────────────
let sigStrokes = [];
let isDrawing = false;

function initSignatureCanvas() {
    const canvas = document.getElementById('sigCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#7c6fff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    }

    function startDraw(e) {
        e.preventDefault();
        isDrawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        sigStrokes.push([pos]);
        const hint = canvas.parentElement.querySelector('.sig-canvas-hint');
        if (hint) hint.style.opacity = '0';
    }
    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        sigStrokes[sigStrokes.length - 1].push(pos);
    }
    function endDraw() { isDrawing = false; }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', endDraw);

    // Clear button
    document.getElementById('sigClear')?.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        sigStrokes = [];
        const hint = canvas.parentElement.querySelector('.sig-canvas-hint');
        if (hint) hint.style.opacity = '1';
    });

    // Undo last stroke
    document.getElementById('sigUndo')?.addEventListener('click', () => {
        sigStrokes.pop();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        sigStrokes.forEach(stroke => {
            stroke.forEach((pt, i) => {
                if (i === 0) { ctx.beginPath(); ctx.moveTo(pt.x, pt.y); }
                else { ctx.lineTo(pt.x, pt.y); ctx.stroke(); }
            });
        });
        if (sigStrokes.length === 0) {
            const hint = canvas.parentElement.querySelector('.sig-canvas-hint');
            if (hint) hint.style.opacity = '1';
        }
    });

    // Draw / Type toggle
    document.getElementById('sigDrawTab')?.addEventListener('click', () => {
        document.getElementById('sigDrawPanel').style.display = '';
        document.getElementById('sigTypePanel').style.display = 'none';
        document.getElementById('sigDrawTab').classList.add('active');
        document.getElementById('sigTypeTab').classList.remove('active');
    });
    document.getElementById('sigTypeTab')?.addEventListener('click', () => {
        document.getElementById('sigDrawPanel').style.display = 'none';
        document.getElementById('sigTypePanel').style.display = '';
        document.getElementById('sigTypeTab').classList.add('active');
        document.getElementById('sigDrawTab').classList.remove('active');
    });

    // Live type preview
    document.getElementById('sigInput')?.addEventListener('input', (e) => {
        const preview = document.getElementById('sigPreviewText');
        if (preview) preview.textContent = e.target.value;
    });

    // Confirm signing
    document.getElementById('confirmSign')?.addEventListener('click', () => {
        const hasDrawnSig = sigStrokes.length > 0;
        const typedSig = document.getElementById('sigInput')?.value?.trim();
        if (!hasDrawnSig && !typedSig) {
            showToast('⚠ Please draw or type your signature to proceed.');
            return;
        }
        const title = document.getElementById('signModalTitle')?.textContent;
        showToast(`✅ "${title}" signed & certified!`);
        document.getElementById('signModal').classList.add('hidden');
        // Mark document as signed in the registry
        const doc = GTB_DOCS.find(d => d.title === title);
        if (doc) { doc.status = 'signed'; renderDocList(); }
    });
}

// ── Doc Tab Switcher ──────────────────────────────────────────
function initDocTabs() {
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');
            document.querySelectorAll('.doc-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.doc-tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(target)?.classList.add('active');
        });
    });
}

// ── Video System ──────────────────────────────────────────────
const VIDEO_FEED_MOCK = [
    { id: 1, title: 'March KPI Progress — Architecture Update', member: 'The Architect', category: 'Progress Update', date: 'Mar 9, 2026', desc: 'Overview of current system deployment, Q2 feature roadmap, and team assignments for next sprint.', reactions: { '👍': 4, '🔥': 2, '💡': 1 } },
    { id: 2, title: 'GTB Brand Shoot BTS — Episode 3 Prep', member: 'The Visionary', category: 'Review Request', date: 'Mar 8, 2026', desc: 'Behind-the-scenes footage from the Episode 3 location scouting. Reviewing color grade options — feedback needed!', reactions: { '❤️': 5, '🔥': 3, '✅': 2 } },
    { id: 3, title: 'Social Media Strategy Q2 Walkthrough', member: 'The Performer', category: 'Announcement', date: 'Mar 7, 2026', desc: 'Presenting the updated content calendar and platform strategy for Q2. New reels format and engagement targets covered.', reactions: { '👍': 6, '💡': 4 } },
    { id: 4, title: 'Nutrition & Wellness Plan Presentation', member: 'The Specialist', category: 'Training', date: 'Mar 6, 2026', desc: 'Walk-through of the new member wellness guide including recommended nutrition plans and exercise schedules.', reactions: { '❤️': 3, '💚': 5 } },
];

function initVideoSystem() {
    renderVideoFeed(VIDEO_FEED_MOCK);

    document.getElementById('pickVideoBtn')?.addEventListener('click', () => {
        document.getElementById('videoFileInput')?.click();
    });

    document.getElementById('videoFileInput')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        const preview = document.getElementById('videoPreview');
        preview.src = url;
        document.getElementById('videoDropZone').style.display = 'none';
        document.getElementById('videoPreviewWrap').style.display = '';
    });

    document.getElementById('cancelVideoBtn')?.addEventListener('click', () => {
        document.getElementById('videoDropZone').style.display = '';
        document.getElementById('videoPreviewWrap').style.display = 'none';
        document.getElementById('videoFileInput').value = '';
    });

    document.getElementById('shareVideoBtn')?.addEventListener('click', () => {
        const title = document.getElementById('videoTitle')?.value || 'Untitled Update';
        const desc = document.getElementById('videoDesc')?.value || '';
        const cat = document.getElementById('videoCat')?.value || 'Progress Update';
        const member = currentMember ? currentMember.title : 'A Member';

        const newVideo = {
            id: Date.now(), title, member, category: cat,
            date: new Date().toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }),
            desc, reactions: { '👍': 0 },
            blobUrl: document.getElementById('videoPreview')?.src || ''
        };

        VIDEO_FEED_MOCK.unshift(newVideo);
        renderVideoFeed(VIDEO_FEED_MOCK);

        document.getElementById('videoDropZone').style.display = '';
        document.getElementById('videoPreviewWrap').style.display = 'none';
        document.getElementById('videoFileInput').value = '';
        document.getElementById('videoTitle').value = '';
        document.getElementById('videoDesc').value = '';
        showToast(`🚀 Your video "${title}" has been shared with the team!`);
    });

    // Category filter
    document.getElementById('videoFilter')?.addEventListener('change', (e) => {
        const val = e.target.value;
        const filtered = val === 'all' ? VIDEO_FEED_MOCK : VIDEO_FEED_MOCK.filter(v => v.category === val);
        renderVideoFeed(filtered);
    });

    // Drag & drop
    const dropZone = document.getElementById('videoDropZone');
    dropZone?.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragging'); });
    dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
    dropZone?.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragging');
        const file = e.dataTransfer.files[0];
        if (!file || !file.type.startsWith('video/')) return;
        const url = URL.createObjectURL(file);
        document.getElementById('videoPreview').src = url;
        dropZone.style.display = 'none';
        document.getElementById('videoPreviewWrap').style.display = '';
    });
}

function renderVideoFeed(videos) {
    const feed = document.getElementById('videoFeed');
    if (!feed) return;
    if (videos.length === 0) { feed.innerHTML = `<div class="empty-state mono" style="grid-column:1/-1;">No videos found for this category.</div>`; return; }
    feed.innerHTML = videos.map(v => `
        <div class="video-card">
            <div class="video-thumb" id="vthumb-${v.id}">
                ${v.blobUrl
                    ? `<video src="${v.blobUrl}" preload="metadata"></video>`
                    : `<span style="font-size:48px;opacity:0.3;">🎬</span>`}
                <div class="video-play-overlay">▶️</div>
            </div>
            <div class="video-card-body">
                <span class="video-cat-tag">${v.category}</span>
                <div class="video-card-title" style="margin-top:8px;">${v.title}</div>
                <div class="video-card-meta"><span>${v.member}</span><span>${v.date}</span></div>
                <div class="video-card-desc">${v.desc}</div>
            </div>
            <div class="video-review-bar">
                ${Object.entries(v.reactions).map(([emoji, count]) =>
                    `<button class="video-reaction" onclick="reactToVideo(${v.id},'${emoji}')">${emoji} ${count}</button>`
                ).join('')}
                <input class="video-comment-input" placeholder="Leave a comment..." onkeydown="if(event.key==='Enter'){showToast('💬 Comment posted!');this.value='';}">
            </div>
        </div>
    `).join('');
}

window.reactToVideo = function(id, emoji) {
    const v = VIDEO_FEED_MOCK.find(v => v.id === id);
    if (v) { v.reactions[emoji] = (v.reactions[emoji] || 0) + 1; renderVideoFeed(VIDEO_FEED_MOCK); }
};

// ── AI Document Assistant ─────────────────────────────────────
const AI_KNOWLEDGE_BASE = {
    'sign': (role) => `You currently have ${GTB_DOCS.filter(d => d.status === 'needs-signature').length} documents awaiting your signature:\n${GTB_DOCS.filter(d => d.status === 'needs-signature').map(d => `• ${d.title} (${d.type})`).join('\n')}\n\nClick "View" next to each one on the Documents tab and draw or type your signature to sign.`,
    'contribution': () => `**GTB Monthly Contribution Rules:**\n• Amount: KES 3,000 per member per month\n• Due date: 5th of each month\n• Late payment penalty: KES 300\n• Payment method: M-Pesa Paybill 522522, Account: GTB-[Your Name]\n• Arrears beyond 2 months trigger a formal compliance review`,
    'exit': () => `**GTB Exit Clause:**\nA departing member forfeits their investment share for the current quarter. All previously distributed returns are retained. You must provide written notice of exit at least 30 days in advance to The Architect.`,
    'investment': () => `**GTB Investment Rules:**\n• Minimum lock-in: 60 days\n• Returns distributed quarterly\n• 20% reinvested back into the pool\n• Each member receives 12.5% of net returns\n• Investments require majority member consent before activation`,
    'nda': () => `**Your NDA Summary:**\nYou are bound by a 3-year confidentiality obligation covering all GTB financials, strategies, member data, and creative works. Violations can result in expulsion from the collective and civil liability.`,
    'role': (role) => `**Your Role Agreement (${role || 'Member'} Dimension):**\n• Submit KPI report every Friday before 11:59 PM EAT\n• Attend a minimum of 75% of monthly meetings\n• Sign all issued documents within 48 hours\n• Pay monthly contribution by the 5th\n• Deliver Dimension-specific KPIs as agreed with The Architect`,
    'summary': (role) => `**Your Document Status Summary:**\n${GTB_DOCS.map(d => `• ${d.icon} ${d.title} — ${d.status === 'signed' ? '✅ Signed' : '⚠️ Needs your signature'}`).join('\n')}`,
    'default': (q) => `I understand you're asking about: "${q}". Based on GTB's documents, all members are bound by the Member Agreement, NDA, and Role SOP. For specific clause interpretations, consult The Architect directly. You can also view any document in the Documents tab and I'll help explain it.`,
};

function getAIResponse(question, role) {
    const q = question.toLowerCase();
    if (q.includes('sign') || q.includes('signature') || q.includes('need to sign')) return AI_KNOWLEDGE_BASE['sign'](role);
    if (q.includes('contribution') || q.includes('3000') || q.includes('payment') || q.includes('mpesa')) return AI_KNOWLEDGE_BASE['contribution']();
    if (q.includes('exit') || q.includes('leave') || q.includes('quit')) return AI_KNOWLEDGE_BASE['exit']();
    if (q.includes('invest')) return AI_KNOWLEDGE_BASE['investment']();
    if (q.includes('nda') || q.includes('confiden')) return AI_KNOWLEDGE_BASE['nda']();
    if (q.includes('role') || q.includes('sop') || q.includes('kpi') || q.includes('summary of my role')) return AI_KNOWLEDGE_BASE['role'](role);
    if (q.includes('summary') || q.includes('status') || q.includes('overview')) return AI_KNOWLEDGE_BASE['summary'](role);
    return AI_KNOWLEDGE_BASE['default'](question);
}

function initAIDocAssistant() {
    const input = document.getElementById('aiChatInput');
    const sendBtn = document.getElementById('aiChatSend');
    const messagesEl = document.getElementById('aiChatMessages');

    function sendMessage(text) {
        if (!text.trim()) return;
        appendAIMsg(text, 'user');
        input && (input.value = '');

        // Show typing indicator
        const typingId = 'typing-' + Date.now();
        appendAIMsg('...', 'ai', typingId);

        setTimeout(() => {
            const role = currentMember ? currentMember.title : 'Member';
            const response = getAIResponse(text, role);
            // Remove typing
            document.getElementById(typingId)?.remove();
            appendAIMsg(response, 'ai');
        }, 900 + Math.random() * 600);
    }

    function appendAIMsg(text, sender, id) {
        if (!messagesEl) return;
        const div = document.createElement('div');
        div.className = `ai-msg ${sender}`;
        if (id) div.id = id;
        div.innerHTML = `
            <span class="ai-avatar">${sender === 'ai' ? '🤖' : '👤'}</span>
            <div class="ai-bubble">${text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/•/g, '&bull;')}</div>
        `;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    sendBtn?.addEventListener('click', () => sendMessage(input?.value || ''));
    input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(input.value); });

    // Quick prompts
    document.querySelectorAll('.ai-prompt-btn').forEach(btn => {
        btn.addEventListener('click', () => sendMessage(btn.getAttribute('data-q')));
    });
}

// ════════════════════════════════════
// SHARES, EQUITY & INVESTMENT STRATEGY
// ════════════════════════════════════

const CAP_TABLE = [
    { role: 'architect',  title: 'The Architect',  type: 'Founder', shares: 200000, percentage: 20, invested: 15000, voting: 'Full' },
    { role: 'visionary',  title: 'The Visionary',  type: 'Founder', shares: 200000, percentage: 20, invested: 15000, voting: 'Full' },
    { role: 'director',   title: 'The Director',   type: 'Founder', shares: 200000, percentage: 20, invested: 15000, voting: 'Full' },
    { role: 'connector',  title: 'The Connector',  type: 'Member',  shares: 80000,  percentage: 8,  invested: 3000,  voting: 'Standard' },
    { role: 'performer',  title: 'The Performer',  type: 'Member',  shares: 80000,  percentage: 8,  invested: 3000,  voting: 'Standard' },
    { role: 'fixer',      title: 'The Fixer',      type: 'Member',  shares: 80000,  percentage: 8,  invested: 3000,  voting: 'Standard' },
    { role: 'analyst',    title: 'The Analyst',    type: 'Member',  shares: 80000,  percentage: 8,  invested: 3000,  voting: 'Standard' },
    { role: 'specialist', title: 'The Specialist', type: 'Member',  shares: 80000,  percentage: 8,  invested: 3000,  voting: 'Standard' },
];

const STRATEGIES = [
    { id: 1, title: 'Treasury Bills — 91 Day', vehicle: 'Kenya T-Bills', target: 120000, horizon: '91 days', return: '14.5%', status: 'Active Vote', votes: { 'yes': 3, 'no': 0 } },
    { id: 2, title: 'Money Market Fund Reserve', vehicle: 'MMF', target: 50000, horizon: 'Ongoing', return: '11.0%', status: 'Approved', votes: { 'yes': 8, 'no': 0 } },
];

function loadSharesModule() {
    renderRegTimeline();
    renderEquityChart();
    renderCapTable();
    renderMyShareholding();
    renderPersonalPortfolio();
    renderStrategyBuilder();

    document.getElementById('viewCapTableBtn')?.addEventListener('click', () => {
        showToast('Full Capitalization Table is displayed below.');
        document.getElementById('capTable').scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('submitStrategyBtn')?.addEventListener('click', () => {
        const title = document.getElementById('stratName').value || 'New Collective Strategy';
        const vehicle = document.getElementById('stratVehicle').value;
        const target = document.getElementById('stratAmount').value || '0';
        const horizon = document.getElementById('stratHorizon').value;
        const ret = document.getElementById('stratReturn').value || '0';
        
        STRATEGIES.push({
            id: Date.now(), title, vehicle, target: parseInt(target), horizon, return: ret + '%',
            status: 'Pending Vote', votes: { 'yes': 1, 'no': 0 } // Submitter auto-votes yes
        });
        
        renderStrategyBuilder();
        showToast('🚀 Strategy submitted for collective voting!');
        
        // Reset form
        document.getElementById('stratName').value = '';
        document.getElementById('stratAmount').value = '';
        document.getElementById('stratReturn').value = '';
        document.getElementById('stratRationale').value = '';
    });
}

function renderRegTimeline() {
    const tl = document.getElementById('regTimeline');
    if (!tl) return;
    const steps = [
        { label: 'Founders Agrmt', status: 'done' },
        { label: 'Name Search', status: 'done' },
        { label: 'CR12 & Cert', status: 'active' },
        { label: 'KRA PIN & Bank', status: 'pending' }
    ];
    tl.innerHTML = steps.map(s => `
        <div class="reg-step ${s.status}">
            <div class="reg-dot">${s.status === 'done' ? '✓' : (s.status === 'active' ? '●' : '')}</div>
            <div class="reg-step-label">${s.label}</div>
        </div>
    `).join('');
}

function renderEquityChart() {
    const canvas = document.getElementById('equityCanvas');
    const legend = document.getElementById('equityLegend');
    if (!canvas || !legend) return;

    const ctx = canvas.getContext('2d');
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    const radius = 90;
    const colors = {
        'founder1': '#7c6fff',   // Architect
        'founder2': '#a457ff',   // Visionary
        'founder3': '#4d9eff',   // Director
        'members': '#22d47a'     // Remaining 5 members aggregated
    };

    // Calculate angles
    const aggregated = [
        { label: 'The Architect (Founder)', pct: 20, color: colors.founder1 },
        { label: 'The Visionary (Founder)', pct: 20, color: colors.founder2 },
        { label: 'The Director (Founder)', pct: 20, color: colors.founder3 },
        { label: 'Other Members (5x 8%)', pct: 40, color: colors.members }
    ];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let startAngle = -0.5 * Math.PI;

    aggregated.forEach(item => {
        const sliceAngle = (item.pct / 100) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = item.color;
        ctx.fill();
        
        // Stroke to separate slices
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#060609';
        ctx.stroke();

        startAngle += sliceAngle;
    });

    // Donut hole
    ctx.beginPath();
    ctx.arc(x, y, 55, 0, 2 * Math.PI);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#060609';
    ctx.stroke();

    // Center text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Syne, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('1M', x, y - 8);
    ctx.fillStyle = '#a0a0b4';
    ctx.font = '11px "DM Mono", monospace';
    ctx.fillText('SHARES', x, y + 12);

    // Legend
    legend.innerHTML = aggregated.map(item => `
        <div class="legend-item">
            <div style="display:flex;align-items:center;">
                <span class="legend-color" style="background:${item.color};"></span>
                <span>${item.label}</span>
            </div>
            <span class="legend-val">${item.pct}%</span>
        </div>
    `).join('');
}

function renderCapTable() {
    const tbody = document.getElementById('capTableBody');
    if (!tbody) return;
    tbody.innerHTML = CAP_TABLE.sort((a,b) => b.shares - a.shares).map(m => `
        <tr>
            <td style="font-weight:600;">${m.title}</td>
            <td><span class="mono" style="font-size:10px;padding:3px 6px;border-radius:4px;background:var(--surface2);">${m.type}</span></td>
            <td class="mono">${m.shares.toLocaleString()}</td>
            <td class="mono">${m.percentage}%</td>
            <td class="mono">KES ${m.invested.toLocaleString()}</td>
            <td>${m.voting}</td>
            <td><span style="color:var(--green);">Verified</span></td>
        </tr>
    `).join('');
}

function renderMyShareholding() {
    const card = document.getElementById('myShareCard');
    const roleSpan = document.getElementById('myShareRole');
    if (!card || !roleSpan || !currentMember) return;

    roleSpan.textContent = currentMember.title;
    const myCap = CAP_TABLE.find(m => m.role === currentMember.role) || CAP_TABLE[3]; // Fallback to a standard member

    card.innerHTML = `
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:16px;">
            <span style="font-size:32px;font-weight:800;color:var(--text);letter-spacing:-1px;">${myCap.shares.toLocaleString()}</span>
            <span class="mono" style="color:var(--muted);font-size:11px;">SHARES</span>
        </div>
        <div style="display:flex;gap:40px;margin-bottom:20px;">
            <div>
                <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Ownership</div>
                <div style="font-size:18px;font-weight:700;color:var(--accent);">${myCap.percentage}%</div>
            </div>
            <div>
                <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Voting Class</div>
                <div style="font-size:16px;font-weight:600;">${myCap.voting}</div>
            </div>
        </div>
        <div class="progress-wrap" style="height:6px;margin-bottom:8px;">
            <div class="progress-bar" style="width:${myCap.percentage}%;background:var(--accent);"></div>
        </div>
        <div style="font-size:11px;color:var(--muted);display:flex;justify-content:space-between;">
            <span>Vesting Schedule</span>
            <span>0% Cliff (Fully vested)</span>
        </div>
    `;

    document.getElementById('sharesStats').innerHTML = `
        <div class="stat-box"><div class="stat-label mono">Total Auth Shares</div><div class="stat-value">1,000,000</div></div>
        <div class="stat-box"><div class="stat-label mono">My Value (Est)</div><div class="stat-value accent">KES ${myCap.invested.toLocaleString()}</div></div>
    `;
}

function renderPersonalPortfolio() {
    const port = document.getElementById('portfolioStats');
    const grid = document.getElementById('personalInvestGrid');
    if (!port || !grid || !currentMember) return;

    const myCap = CAP_TABLE.find(m => m.role === currentMember.role) || CAP_TABLE[3];

    port.innerHTML = `
        <div style="display:flex;gap:24px;align-items:center;background:var(--surface2);padding:16px;border-radius:12px;border:1px solid var(--border);">
            <div>
                <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">TOTAL APPLIED FUNDS</div>
                <div style="font-size:24px;font-weight:800;letter-spacing:-0.5px;">KES ${myCap.invested.toLocaleString()}</div>
            </div>
            <div style="height:40px;width:1px;background:var(--border);"></div>
            <div>
                <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">PROJECTED YIELD</div>
                <div style="font-size:20px;font-weight:700;color:var(--green);">+11.5%</div>
            </div>
        </div>
    `;

    grid.innerHTML = `
        <div class="strategy-card">
            <div class="strat-header">
                <span class="strat-title">Monthly Contributions (Shares)</span>
                <span class="strat-badge" style="color:#fff;background:var(--accent);">ACTIVE</span>
            </div>
            <div class="strat-metric"><span>Paid In</span><span>KES ${myCap.invested - 1000}</span></div>
            <div class="strat-metric"><span>Next Due</span><span>Apr 5, 2026</span></div>
        </div>
        <div class="strategy-card">
            <div class="strat-header">
                <span class="strat-title">Collective MMF Allocation</span>
                <span class="strat-badge" style="color:var(--green);border-color:var(--green);">POSTED</span>
            </div>
            <div class="strat-metric"><span>My Principal</span><span>KES 1,000</span></div>
            <div class="strat-metric"><span>Current APY</span><span>11.0%</span></div>
        </div>
    `;
}

function renderStrategyBuilder() {
    const grid = document.getElementById('strategyGrid');
    if (!grid) return;
    grid.innerHTML = STRATEGIES.map(s => `
        <div class="strategy-card">
            <div class="strat-header">
                <span class="strat-title">${s.title}</span>
                <span class="strat-badge" style="${s.status === 'Approved' ? 'color:var(--green);border-color:var(--green);' : 'color:var(--yellow);border-color:var(--yellow);'}">${s.status.toUpperCase()}</span>
            </div>
            <div class="strat-metric"><span>Vehicle</span><span>${s.vehicle}</span></div>
            <div class="strat-metric"><span>Target Pool</span><span>KES ${s.target.toLocaleString()}</span></div>
            <div class="strat-metric"><span>Expected Yield</span><span style="color:var(--green);">${s.return}</span></div>
            <div class="strat-metric"><span>Horizon</span><span>${s.horizon}</span></div>
            
            <div style="margin-top:12px;padding-top:12px;border-top:1px dashed var(--border);display:flex;justify-content:space-between;align-items:center;">
                <div style="font-size:10px;font-family:'DM Mono',monospace;color:var(--muted);">VOTES: ✅${s.votes.yes} ❌${s.votes.no}</div>
                ${s.status !== 'Approved' ? `
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-ghost btn-sm" style="padding:4px 8px;font-size:11px;" onclick="voteStrategy(${s.id},'yes')">👍</button>
                        <button class="btn btn-ghost btn-sm" style="padding:4px 8px;font-size:11px;" onclick="voteStrategy(${s.id},'no')">👎</button>
                    </div>
                ` : '<span style="font-size:10px;color:var(--green);">LOCKED</span>'}
            </div>
        </div>
    `).join('');
}

window.voteStrategy = function(id, type) {
    const s = STRATEGIES.find(x => x.id === id);
    if(s) {
        s.votes[type]++;
        if (s.votes.yes >= 5) s.status = 'Approved';
        renderStrategyBuilder();
        showToast('Vote recorded!');
    }
};

// ════════════════════════════════════
// DOCUMENT TEMPLATES LIBRARY
// ════════════════════════════════════

const TEMPLATES = [
    { id: 't1', title: 'Non-Disclosure Agreement', category: 'universal', role: 'all', icon: '🔒', desc: 'Standard 3-year mutual NDA for external partners and contractors.' },
    { id: 't2', title: 'Contractor Service Agreement', category: 'legal', role: 'all', icon: '📝', desc: 'Baseline legal contract for hiring freelancers or external agencies.' },
    { id: 't3', title: 'Monthly Expense Claim Form', category: 'finance', role: 'all', icon: '💵', desc: 'Template for submitting out-of-pocket expenses to the treasury.' },
    { id: 't4', title: 'Weekly KPI Report Tracker', category: 'operations', role: 'all', icon: '📊', desc: 'Standard spreadsheet template for Friday KPI submissions.' },
    
    // Role-specific templates
    { id: 't5', title: 'Technical Architecture Brief', category: 'operations', role: 'architect', icon: '🏗️', desc: 'Template for proposing new system integrations or IT infrastructure.' },
    { id: 't6', title: 'Brand Identity Guidelines', category: 'operations', role: 'visionary', icon: '🎨', desc: 'Master template for GTB visual identity, colors, and typography.' },
    { id: 't7', title: 'Meeting Minutes & Agenda', category: 'operations', role: 'director', icon: '📋', desc: 'Official template for conducting and recording GTB monthly sit-downs.' },
    { id: 't8', title: 'Partnership MoU', category: 'legal', role: 'connector', icon: '🤝', desc: 'Memorandum of Understanding for initial partnership discussions.' },
    { id: 't9', title: 'Media Release Form', category: 'legal', role: 'performer', icon: '📸', desc: 'Consent form for individuals appearing in GTB digital content.' },
    { id: 't10', title: 'Incident Resolution Log', category: 'operations', role: 'fixer', icon: '🔧', desc: 'Form for documenting crisis interventions and technical bug fixes.' },
    { id: 't11', title: 'Data Analytics Dashboard Spec', category: 'operations', role: 'analyst', icon: '📈', desc: 'Requirement documentation template for custom analytics views.' },
    { id: 't12', title: 'Specialized Consulting Proposal', category: 'operations', role: 'specialist', icon: '🧠', desc: 'Client-facing proposal format outlining specific domain expertise.' },
];

function loadTemplatesModule() {
    renderTemplates('all');
    document.getElementById('tmplCount').textContent = TEMPLATES.length;
    
    const myRole = currentMember ? currentMember.role : 'member';
    const myCount = TEMPLATES.filter(t => t.role === myRole || t.role === 'all').length;
    document.getElementById('myTmplCount').textContent = myCount;

    document.querySelectorAll('#tmplTabs .doc-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#tmplTabs .doc-tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            renderTemplates(btn.getAttribute('data-tmpl-cat'));
        });
    });
}

function renderTemplates(filter) {
    const grid = document.getElementById('tmplGrid');
    if (!grid) return;
    
    const myRole = currentMember ? currentMember.role : 'member';
    
    let filtered = TEMPLATES;
    if (filter === 'myrole') {
        filtered = TEMPLATES.filter(t => t.role === myRole || t.role === 'all');
    } else if (filter !== 'all') {
        filtered = TEMPLATES.filter(t => t.category === filter);
    }

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state mono" style="grid-column:1/-1;">No templates found for this filter.</div>`;
        return;
    }

    grid.innerHTML = filtered.map(t => `
        <div class="tmpl-card">
            <div style="display:flex;gap:12px;align-items:flex-start;">
                <div class="tmpl-icon">${t.icon}</div>
                <div>
                    <div class="tmpl-title">${t.title}</div>
                    <div style="margin-top:6px;">
                        ${t.role !== 'all' ? `<span class="tmpl-role-tag">Only for ${t.role.toUpperCase()}</span>` : '<span class="tmpl-role-tag" style="background:var(--surface2);border-color:var(--border);color:var(--text);">UNIVERSAL</span>'}
                    </div>
                </div>
            </div>
            <div class="tmpl-desc">${t.desc}</div>
            <div class="tmpl-actions">
                <button class="btn btn-ghost btn-sm" onclick="showToast('Opening template preview...')">👁️ Preview</button>
                <button class="btn btn-primary btn-sm" onclick="showToast('Downloading Word Doc template...')">⬇️ Download</button>
            </div>
        </div>
    `).join('');
}

// ════════════════════════════════════
// GLOBAL UTILS
// ════════════════════════════════════

function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3500);
}
