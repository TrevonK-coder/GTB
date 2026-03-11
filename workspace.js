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
        loadMarketplace();
        loadTreasury();
        loadWorkspace();
        initAssistant();

        // Architect-only: show Command Center
        if (currentMember.role === 'architect') {
            const cmdNav = document.getElementById('commandNavItem');
            if (cmdNav) cmdNav.style.display = 'flex';
            loadCommandCenter();
            loadPerformanceRankings();
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

    document.getElementById('confirmApply').addEventListener('click', () => {
        const reason = document.getElementById('applyReason').value.trim();
        const hours = document.getElementById('applyHours').value.trim();
        if (!reason || !hours) {
            alert('Please fill in all fields before submitting.');
            return;
        }
        document.getElementById('applyModal').classList.add('hidden');
        document.getElementById('applyReason').value = '';
        document.getElementById('applyHours').value = '';
        const t = document.getElementById('toast');
        if (t) {
            const role = MARKETPLACE_ROLES.find(r => r.id === activeApplyId);
            t.textContent = `✓ Application for "${role ? role.title : 'Role'}" submitted! The Architect will review.`;
            t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), 4000);
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
