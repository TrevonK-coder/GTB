/**
 * GTB Member Performance Scoring Algorithm
 * 
 * Scores each member on 6 dimensions of commitment and hardwork.
 * Used to determine the hidden recipient of the secret fan reward fund.
 * 
 * Scoring Dimensions (max 100 pts each):
 *   1. Contribution Consistency  — On-time monthly payments
 *   2. KPI Achievement           — % of KPIs met this month
 *   3. Task Completion Rate      — % of role tasks marked done
 *   4. Engagement                — Chat activity, document signing, announcements
 *   5. Revenue Generation        — Marketplace roles claimed + revenue contributed
 *   6. Attendance & Punctuality  — Meetings attended, project deadlines hit
 * 
 * Total score: weighted sum → 0-1000 pts
 * Updated: On each API call (real-time in production = from Supabase)
 */

// ── Member Roster ────────────────────────────────────────────────
const MEMBERS = [
    { id: 'architect',    name: 'The Architect',    emoji: '🏗️' },
    { id: 'performer',    name: 'The Performer',    emoji: '🎭' },
    { id: 'visionary',    name: 'The Visionary',    emoji: '🎬' },
    { id: 'specialist',   name: 'The Specialist',   emoji: '💊' },
    { id: 'gastronomist', name: 'The Gastronomist', emoji: '🍽️' },
    { id: 'polymath',     name: 'The Polymath',     emoji: '🎙️' },
    { id: 'artist',       name: 'The Artist',       emoji: '🎵' },
    { id: 'engineer',     name: 'The Engineer',     emoji: '⚙️' },
];

// ── Scoring Weights ───────────────────────────────────────────────
const WEIGHTS = {
    contributionConsistency: 0.25,   // 25% weight — financial commitment
    kpiAchievement:          0.20,   // 20% — results-oriented performance
    taskCompletionRate:      0.20,   // 20% — day-to-day execution
    engagement:              0.15,   // 15% — team participation
    revenueGeneration:       0.10,   // 10% — business impact
    attendancePunctuality:   0.10,   // 10% — reliability
};

// ── Mock Performance Data ─────────────────────────────────────────
// In production: replace with Supabase queries
// e.g., await supabase.from('member_performance').select('*').eq('member_id', id)
const PERFORMANCE_DATA = {
    architect:    { contribution: 100, kpi: 95, tasks: 90, engagement: 88, revenue: 80, attendance: 95 },
    performer:    { contribution: 100, kpi: 88, tasks: 85, engagement: 92, revenue: 72, attendance: 90 },
    visionary:    { contribution: 67,  kpi: 78, tasks: 70, engagement: 75, revenue: 65, attendance: 80 },
    specialist:   { contribution: 100, kpi: 91, tasks: 88, engagement: 82, revenue: 70, attendance: 92 },
    gastronomist: { contribution: 33,  kpi: 55, tasks: 50, engagement: 60, revenue: 45, attendance: 65 },
    polymath:     { contribution: 67,  kpi: 72, tasks: 68, engagement: 78, revenue: 58, attendance: 75 },
    artist:       { contribution: 100, kpi: 84, tasks: 82, engagement: 86, revenue: 68, attendance: 88 },
    engineer:     { contribution: 100, kpi: 96, tasks: 94, engagement: 85, revenue: 75, attendance: 93 },
};

// ── Score a Single Member ─────────────────────────────────────────
function scoreMember(memberId) {
    const member = MEMBERS.find(m => m.id === memberId);
    const data   = PERFORMANCE_DATA[memberId];
    if (!member || !data) return null;

    // Weighted score (all sub-scores are 0-100)
    const rawScore =
        data.contribution * WEIGHTS.contributionConsistency +
        data.kpi          * WEIGHTS.kpiAchievement          +
        data.tasks        * WEIGHTS.taskCompletionRate       +
        data.engagement   * WEIGHTS.engagement               +
        data.revenue      * WEIGHTS.revenueGeneration        +
        data.attendance   * WEIGHTS.attendancePunctuality;

    // Scale to 0-1000
    const totalScore = Math.round(rawScore * 10);

    // Build breakdown
    const breakdown = {
        contributionConsistency: { score: data.contribution, weight: '25%', label: 'Monthly Payment Record' },
        kpiAchievement:          { score: data.kpi,          weight: '20%', label: 'KPI Achievement Rate' },
        taskCompletionRate:      { score: data.tasks,        weight: '20%', label: 'Task Completion Rate' },
        engagement:              { score: data.engagement,   weight: '15%', label: 'Team Engagement' },
        revenueGeneration:       { score: data.revenue,      weight: '10%', label: 'Revenue Contribution' },
        attendancePunctuality:   { score: data.attendance,   weight: '10%', label: 'Attendance & Deadlines' },
    };

    // Commitment tier
    let tier;
    if (totalScore >= 900)     tier = { label: 'ELITE',       color: '#fbbf24' };
    else if (totalScore >= 800) tier = { label: 'COMMITTED',  color: '#22d47a' };
    else if (totalScore >= 650) tier = { label: 'ACTIVE',     color: '#7c6fff' };
    else if (totalScore >= 500) tier = { label: 'DEVELOPING', color: '#60a5fa' };
    else                        tier = { label: 'AT RISK',    color: '#ff5c5c' };

    return {
        memberId,
        name:       member.name,
        emoji:      member.emoji,
        totalScore,
        tier,
        breakdown,
        computedAt: new Date().toISOString(),
    };
}

// ── Rank All Members ─────────────────────────────────────────────
function rankMembers() {
    return MEMBERS
        .map(m => scoreMember(m.id))
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((m, index) => ({ ...m, rank: index + 1 }));
}

// ── Get Top Performer ────────────────────────────────────────────
function getTopPerformer() {
    const ranked = rankMembers();
    return ranked[0];
}

// ── Streak detection: consecutive months with score ≥ 800 ────────
// In production: query Supabase monthly_scores table
function getConsistencyStreak(memberId) {
    // Mock: return streak in months
    const streaks = {
        architect: 6, performer: 4, visionary: 2, specialist: 5,
        gastronomist: 1, polymath: 3, artist: 4, engineer: 7
    };
    return streaks[memberId] || 0;
}

module.exports = { scoreMember, rankMembers, getTopPerformer, getConsistencyStreak, MEMBERS };
