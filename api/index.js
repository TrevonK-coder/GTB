/**
 * GTB Intranet — Express Backend
 * Handles: Static files, M-Pesa Daraja API, Member Performance Algorithm, Secret Fan Fund
 * Run: node server.js
 * Port: 8080
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const { scoreMember, rankMembers, MEMBERS } = require('./performance');
const { processFanContribution, getRewardBalance, distributeReward } = require('./fanfund');

const app = express();
app.use(express.json());
app.use(cors());

// ════════════════════════════════════════════════════════════════
// M-PESA DARAJA API CONFIG
// ════════════════════════════════════════════════════════════════
const MPESA_CONFIG = {
    PAYBILL:        process.env.MPESA_PAYBILL     || '522522',
    TILL:           process.env.MPESA_TILL         || '5312847',
    CONSUMER_KEY:   process.env.MPESA_CONSUMER_KEY || 'YOUR_CONSUMER_KEY',
    CONSUMER_SECRET:process.env.MPESA_CONSUMER_SECRET || 'YOUR_CONSUMER_SECRET',
    PASSKEY:        process.env.MPESA_PASSKEY      || 'YOUR_LIPA_NA_MPESA_PASSKEY',
    CALLBACK_URL:   process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/api/mpesa/callback',
    BASE_URL:       process.env.MPESA_SANDBOX === 'false'
                        ? 'https://api.safaricom.co.ke'     // Production
                        : 'https://sandbox.safaricom.co.ke', // Sandbox
};

async function getMpesaToken() {
    const auth = Buffer.from(`${MPESA_CONFIG.CONSUMER_KEY}:${MPESA_CONFIG.CONSUMER_SECRET}`).toString('base64');
    const { data } = await axios.get(
        `${MPESA_CONFIG.BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
        { headers: { Authorization: `Basic ${auth}` } }
    );
    return data.access_token;
}

function getMpesaTimestamp() {
    return new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
}

function getMpesaPassword(timestamp) {
    return Buffer.from(`${MPESA_CONFIG.PAYBILL}${MPESA_CONFIG.PASSKEY}${timestamp}`).toString('base64');
}

// ── POST /api/mpesa/stkpush ───────────────────────────────────
// Initiates Lipa Na M-Pesa STK Push to customer's phone
app.post('/api/mpesa/stkpush', async (req, res) => {
    const { phone, amount, accountRef, purpose } = req.body;

    if (!phone || !amount) {
        return res.status(400).json({ success: false, message: 'Phone and amount are required.' });
    }

    // Normalize phone: replace leading 0 with 254
    const normalizedPhone = phone.startsWith('0')
        ? '254' + phone.slice(1)
        : phone.replace('+', '');

    try {
        const token = await getMpesaToken();
        const timestamp = getMpesaTimestamp();
        const password = getMpesaPassword(timestamp);

        const payload = {
            BusinessShortCode: MPESA_CONFIG.PAYBILL,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.ceil(amount),
            PartyA: normalizedPhone,
            PartyB: MPESA_CONFIG.PAYBILL,
            PhoneNumber: normalizedPhone,
            CallBackURL: MPESA_CONFIG.CALLBACK_URL,
            AccountReference: accountRef || 'GTB-Payment',
            TransactionDesc: purpose || 'GTB Collective Payment',
        };

        const { data } = await axios.post(
            `${MPESA_CONFIG.BASE_URL}/mpesa/stkpush/v1/processrequest`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('[M-Pesa] STK Push sent:', data);
        return res.json({ success: true, data });

    } catch (error) {
        const errMsg = error.response?.data || error.message;
        console.error('[M-Pesa] STK Push error:', errMsg);
        return res.status(500).json({ success: false, message: errMsg });
    }
});

// ── POST /api/mpesa/callback ──────────────────────────────────
// Safaricom calls this URL after payment is processed
app.post('/api/mpesa/callback', (req, res) => {
    const callback = req.body?.Body?.stkCallback;
    if (!callback) return res.sendStatus(400);

    const resultCode = callback.ResultCode;
    const resultDesc = callback.ResultDesc;
    const checkoutRequestId = callback.CheckoutRequestID;

    if (resultCode === 0) {
        // Payment successful
        const items = callback.CallbackMetadata?.Item || [];
        const amount     = items.find(i => i.Name === 'Amount')?.Value;
        const mpesaCode  = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
        const phone      = items.find(i => i.Name === 'PhoneNumber')?.Value;
        const txDate     = items.find(i => i.Name === 'TransactionDate')?.Value;

        console.log(`[M-Pesa] ✅ Payment confirmed: KES ${amount} from ${phone} — Code: ${mpesaCode}`);

        // Check if this is a Fan Fund contribution (account ref starts with "GTB-FAN")
        // In production: store to Supabase here
        // await supabase.from('transactions').insert({ mpesa_code: mpesaCode, amount, phone, ... });
    } else {
        console.warn(`[M-Pesa] ❌ Payment failed: ${resultDesc}`);
    }

    // Always respond 200 to Safaricom so they don't retry
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// ── GET /api/mpesa/status/:checkoutRequestId ─────────────────
// Query STK Push status
app.get('/api/mpesa/status/:id', async (req, res) => {
    try {
        const token = await getMpesaToken();
        const timestamp = getMpesaTimestamp();
        const { data } = await axios.post(
            `${MPESA_CONFIG.BASE_URL}/mpesa/stkpushquery/v1/query`,
            {
                BusinessShortCode: MPESA_CONFIG.PAYBILL,
                Password: getMpesaPassword(timestamp),
                Timestamp: timestamp,
                CheckoutRequestID: req.params.id,
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ════════════════════════════════════════════════════════════════
// MEMBER PERFORMANCE API
// ════════════════════════════════════════════════════════════════

// ── GET /api/performance ─────────────────────────────────────
// Returns ranked member performance scores
app.get('/api/performance', (req, res) => {
    const ranked = rankMembers();
    res.json({ success: true, rankings: ranked });
});

// ── GET /api/performance/:memberId ──────────────────────────
app.get('/api/performance/:memberId', (req, res) => {
    const score = scoreMember(req.params.memberId);
    if (!score) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, score });
});

// ════════════════════════════════════════════════════════════════
// SECRET FAN FUND API
// ════════════════════════════════════════════════════════════════

// ── GET /api/fanfund/balance ──────────────────────────────────
app.get('/api/fanfund/balance', (req, res) => {
    res.json({ success: true, balance: getRewardBalance() });
});

// ── POST /api/fanfund/contribute ─────────────────────────────
// Called when an external fan contributes via paybill
// Account reference must start with "GTB-FAN" to trigger this
app.post('/api/fanfund/contribute', (req, res) => {
    const { amount, donorName, message } = req.body;
    const result = processFanContribution({ amount: parseFloat(amount), donorName, message });
    res.json({ success: true, result });
});

// ── POST /api/fanfund/distribute ─────────────────────────────
// Architect triggers distribution to top performer(s)
app.post('/api/fanfund/distribute', (req, res) => {
    const { requestedBy } = req.body;
    if (requestedBy !== 'architect') {
        return res.status(403).json({ success: false, message: 'Unauthorized — Architect only.' });
    }
    const result = distributeReward();
    res.json({ success: true, result });
});

const PORT = process.env.PORT || 8080;
if (require.main === module) {
    app.listen(PORT, () => console.log(`🚀 GTB Server running at http://localhost:${PORT}`));
}
module.exports = app;
