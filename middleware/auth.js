const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');

// ─── Load / Save Credentials ────────────────────────────────────────────────

function loadCredentials() {
    try {
        const data = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        // If file doesn't exist, create with defaults
        const defaults = {
            admins: ['admin@savourly.in'],
            delivery: ['delivery@savourly.in']
        };
        saveCredentials(defaults);
        return defaults;
    }
}

function saveCredentials(creds) {
    fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(creds, null, 2), 'utf8');
}

function getAdminEmails() {
    return loadCredentials().admins.map(e => e.toLowerCase());
}

function getDeliveryEmails() {
    return loadCredentials().delivery.map(e => e.toLowerCase());
}

// ─── Token Verification Middleware ───────────────────────────────────────────

async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized — no token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        req.user = decoded;

        // Attach role based on email
        const email = (decoded.email || '').toLowerCase();
        if (getAdminEmails().includes(email)) {
            req.user.role = 'admin';
        } else if (getDeliveryEmails().includes(email)) {
            req.user.role = 'delivery';
        } else {
            req.user.role = 'customer';
        }

        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);
        return res.status(401).json({ error: 'Unauthorized — invalid token' });
    }
}

// ─── Role Authorization Middleware ───────────────────────────────────────────

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden — insufficient permissions' });
        }
        next();
    };
}

module.exports = {
    verifyToken,
    requireRole,
    loadCredentials,
    saveCredentials,
    getAdminEmails,
    getDeliveryEmails
};
