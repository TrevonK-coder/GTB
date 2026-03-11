/**
 * GTB Secret Fan Reward Fund
 * 
 * A hidden fund powered by fans, friends, and supporters worldwide.
 * Fans contribute via the GTB paybill using account reference "GTB-FANFUND".
 * The algorithm automatically identifies the top performer each month
 * and distributes the reward to them.
 * 
 * The recipient is NOT announced publicly — they receive an anonymous
 * transfer with only a cryptic note: "A gift from your supporters."
 * The Architect-only view shows who received it.
 */

const { getTopPerformer, getConsistencyStreak } = require('./performance');

// ── In-memory fund store ──────────────────────────────────────────
// In production: replace with Supabase table `fan_fund`
let fanFundState = {
    balance:       47500,       // KES — starting demo balance
    totalReceived: 72000,       // KES — all time incoming
    totalAwarded:  24500,       // KES — all time paid out
    donors: [
        { name: 'Anonymous',     country: 'USA',     amount: 5000,  message: 'Keep pushing GTB!',        date: '2026-03-01' },
        { name: 'Fan #002',      country: 'Uganda',  amount: 2500,  message: 'GTB are legends!',         date: '2026-03-03' },
        { name: 'Anonymous',     country: 'UK',      amount: 10000, message: 'For the most dedicated.',  date: '2026-03-05' },
        { name: 'SupporterX',    country: 'Kenya',   amount: 3000,  message: '🔥 GTB forever!',          date: '2026-03-07' },
        { name: 'Anonymous',     country: 'Germany',amount: 8000,  message: 'Inspiring work.',           date: '2026-03-09' },
        { name: 'GlobalFan',     country: 'Canada',  amount: 5000,  message: 'For the hardest worker.',  date: '2026-03-10' },
    ],
    rewardHistory: [
        { recipient: 'The Engineer',  amount: 12000, month: 'Jan 2026', reason: 'Top scorer for 3rd consecutive month — 962/1000 pts' },
        { recipient: 'The Architect', amount: 12500, month: 'Feb 2026', reason: 'Highest KPI + contribution consistency score' },
    ],
};

// ── Processing Rules ──────────────────────────────────────────────
const DISTRIBUTION_RULES = {
    MIN_BALANCE_TO_DISTRIBUTE: 10000,     // KES — don't distribute if fund < 10k
    RETAIN_PERCENTAGE: 0.30,              // Keep 30% in fund as reserve
    STREAK_BONUS: 1000,                   // Extra KES per month of consistency streak
    MAX_STREAK_BONUS: 5000,               // Cap streak bonus at 5,000 KES
};

// ── Get fund balance ─────────────────────────────────────────────
function getRewardBalance() {
    return {
        balance:       fanFundState.balance,
        totalReceived: fanFundState.totalReceived,
        totalAwarded:  fanFundState.totalAwarded,
        donorCount:    fanFundState.donors.length,
        recentDonors:  fanFundState.donors.slice(-5).reverse(),
        rewardHistory: fanFundState.rewardHistory,
    };
}

// ── Process a fan contribution ────────────────────────────────────
function processFanContribution({ amount, donorName = 'Anonymous', message = '', country = 'Unknown' }) {
    if (!amount || amount <= 0) return { success: false, message: 'Invalid amount.' };

    fanFundState.balance       += amount;
    fanFundState.totalReceived += amount;
    fanFundState.donors.push({
        name:    donorName || 'Anonymous',
        country,
        amount,
        message: message || 'No message.',
        date:    new Date().toISOString().split('T')[0],
    });

    console.log(`[FanFund] 💝 KES ${amount} received from ${donorName} (${country}). Fund balance: KES ${fanFundState.balance}`);
    return { success: true, newBalance: fanFundState.balance };
}

// ── Algorithm: Distribute Reward ──────────────────────────────────
function distributeReward() {
    const { balance, MIN_BALANCE_TO_DISTRIBUTE, RETAIN_PERCENTAGE, STREAK_BONUS, MAX_STREAK_BONUS } = {
        balance: fanFundState.balance,
        ...DISTRIBUTION_RULES
    };

    if (fanFundState.balance < MIN_BALANCE_TO_DISTRIBUTE) {
        return {
            success: false,
            message: `Fund balance (KES ${fanFundState.balance}) is below minimum threshold (KES ${MIN_BALANCE_TO_DISTRIBUTE}). Accumulating.`,
        };
    }

    // 1. Identify top performer via algorithm
    const topPerformer = getTopPerformer();

    // 2. Calculate reward amount (70% of balance, retain 30%)
    let rewardAmount = Math.floor(fanFundState.balance * (1 - RETAIN_PERCENTAGE));

    // 3. Apply consistency streak bonus
    const streak = getConsistencyStreak(topPerformer.memberId);
    const streakBonus = Math.min(streak * STREAK_BONUS, MAX_STREAK_BONUS);
    rewardAmount += streakBonus;

    // 4. Ensure we don't exceed the balance
    rewardAmount = Math.min(rewardAmount, fanFundState.balance);

    // 5. Build reward reason
    const reason = `#1 ranked member: ${topPerformer.totalScore}/1000 pts (${topPerformer.tier.label}) — ${streak}-month consistency streak`;

    // 6. Update fund state
    fanFundState.balance      -= rewardAmount;
    fanFundState.totalAwarded += rewardAmount;
    fanFundState.rewardHistory.push({
        recipient: topPerformer.name,
        amount:    rewardAmount,
        month:     new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
        reason,
    });

    console.log(`[FanFund] 🏆 KES ${rewardAmount} awarded to ${topPerformer.name} (${topPerformer.memberId})`);
    console.log(`[FanFund] Reason: ${reason}`);
    console.log(`[FanFund] Remaining fund balance: KES ${fanFundState.balance}`);

    // In production: trigger M-Pesa B2C transfer to the member's registered Safaricom number
    // await mpesaB2C({ phone: topPerformer.phone, amount: rewardAmount, remarks: 'GTB Fan Gift' });

    return {
        success:     true,
        recipient:   topPerformer.name,
        emoji:       topPerformer.emoji,
        memberId:    topPerformer.memberId,
        rewardAmount,
        streakBonus,
        reason,
        newBalance:  fanFundState.balance,
        score:       topPerformer.totalScore,
        tier:        topPerformer.tier,
    };
}

module.exports = { processFanContribution, getRewardBalance, distributeReward };
