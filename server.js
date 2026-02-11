require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');

// ─── Firebase Admin Init ────────────────────────────────────────────────────
try {
    let serviceAccount;

    // Option 1: JSON string from environment variable (for Vercel)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else {
        // Option 2: Local file (for dev)
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || './firebase-service-account.json';
        serviceAccount = require(path.resolve(serviceAccountPath));
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin SDK initialized');
} catch (err) {
    console.warn('⚠️  Firebase service account not found.');
    console.warn('   For local dev: place firebase-service-account.json in project root');
    console.warn('   For Vercel: set FIREBASE_SERVICE_ACCOUNT_JSON env var');

    // Initialize without credentials so the app still runs
    if (!admin.apps.length) {
        admin.initializeApp({ projectId: 'savorly-d2e63' });
    }
}

// ─── Import Middleware & Models ─────────────────────────────────────────────
const { verifyToken, requireRole, loadCredentials, saveCredentials } = require('./middleware/auth');
const Order = require('./models/Order');
const Consultation = require('./models/Consultation');
const Plan = require('./models/Plan');
const HelpRequest = require('./models/HelpRequest');

// ─── Seeding ──────────────────────────────────────────────────────────────
const seedPlans = async () => {
    try {
        const count = await Plan.countDocuments();
        if (count > 0) return;

        console.log('🌱 Seeding default plans...');
        const plans = [
            {
                name: 'Silver Plan',
                price: 1300,
                description: 'Perfect for beginners starting their fitness journey with balanced nutrition.',
                features: ['10 meals per week', 'Balanced macros', 'Weekly planning', 'Email support'],
                image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=250&fit=crop',
                infoContent: [
                    "Start your wellness journey with carefully portioned meals that help maintain consistent energy levels throughout the day.",
                    "Perfect balance of proteins and carbs designed for beginners looking to establish healthy eating habits.",
                    "Enjoy nutritious meals without the hassle of meal prep, ideal for those new to fitness nutrition."
                ],
                badgeColor: 'silver'
            },
            {
                name: 'Gold Plan',
                price: 1500,
                description: 'Ideal for dedicated fitness enthusiasts looking for optimal results.',
                features: ['10 meals per week', 'Custom macro targets', 'Flexible meal swapping', '24/7 priority support', 'Monthly check-ins'],
                image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=250&fit=crop',
                infoContent: [
                    "Unlock your full potential with premium ingredients and personalized nutrition tracking for sustainable transformation.",
                    "Advanced macro customization to support muscle building, fat loss, or performance enhancement goals.",
                    "Get the flexibility to swap meals based on your preferences while maintaining optimal nutrition."
                ],
                isPopular: true,
                badgeColor: 'gold'
            },
            {
                name: 'Platinum Plan',
                price: 2000,
                description: 'The ultimate package for athletes seeking peak performance.',
                features: ['10 meals + juices', 'Personalized recipes', '1-on-1 nutritionist', 'Workout meal timing', 'Weekly analytics'],
                image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=250&fit=crop',
                infoContent: [
                    "Experience elite-level nutrition with dedicated support, ensuring every meal accelerates your path to excellence.",
                    "Personalized meal timing synced with your workout schedule for maximum performance and recovery.",
                    "Work directly with certified nutritionists to fine-tune your diet for competition-level results."
                ],
                badgeColor: 'platinum'
            }
        ];
        await Plan.insertMany(plans);
        console.log('✅ Plans seeded successfully');
    } catch (err) {
        console.error('Seeding error:', err);
    }
};

// ─── Express Setup ──────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from project root
app.use(express.static(path.join(__dirname)));

// ─── MongoDB Connection ─────────────────────────────────────────────────────
// ─── MongoDB Connection (Serverless Optimized) ──────────────────────────────
// ─── MongoDB Connection (Serverless Optimized) ──────────────────────────────
let isConnected = false;

const connectDB = async () => {
    if (isConnected || mongoose.connection.readyState === 1) {
        return;
    }

    const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/savourly';

    // If on Vercel and no explicit MONGODB_URI, skip connection to avoid timeout
    if (process.env.VERCEL && !process.env.MONGODB_URI) {
        console.warn('⚠️  Vercel environment detected but MONGODB_URI not set. Skipping connection.');
        return;
    }

    try {
        const conn = await mongoose.connect(dbURI, {
            // Options to ensure robust connection
            serverSelectionTimeoutMS: 5000 // Fail fast
        });
        isConnected = true;
        console.log('✅ MongoDB Connected:', conn.connection.host);
        seedPlans();
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        // Don't exit process in serverless, just log
    }
};

// Middleware to ensure DB is connected for every request
app.use(async (req, res, next) => {
    // Skip DB connection for static files to save time
    if (req.path.startsWith('/assets') || req.path.match(/\.(css|js|png|jpg|ico)$/)) {
        return next();
    }

    await connectDB();
    next();
});

// ─── Debug Route (Temporary) ────────────────────────────────────────────────
app.get('/api/debug', (req, res) => {
    res.json({
        status: 'ok',
        env: {
            NODE_ENV: process.env.NODE_ENV,
            MONGODB_URI_SET: !!process.env.MONGODB_URI,
            FIREBASE_JSON_SET: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
            FIREBASE_JSON_LENGTH: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? process.env.FIREBASE_SERVICE_ACCOUNT_JSON.length : 0
        },
        mongo: {
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            name: mongoose.connection.name
        },
        firebase: {
            appsLength: admin.apps.length,
            projectId: admin.apps.length ? admin.app().options.projectId : null,
            credential: admin.apps.length ? (admin.app().options.credential ? 'set' : 'null') : 'null'
        }
    });
});

// ─── Clean URL Routes (serve .html files without extension) ─────────────────
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signin', (req, res) => res.sendFile(path.join(__dirname, 'signin.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/delivery', (req, res) => res.sendFile(path.join(__dirname, 'delivery-partner.html')));
app.get('/orders', (req, res) => res.sendFile(path.join(__dirname, 'orders.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, 'cart.html')));

// ─── API Routes ─────────────────────────────────────────────────────────────
// IMPORTANT: Specific routes (/my, /stats) MUST come before generic routes (/api/orders)

// ─── Consultation Routes ────────────────────────────────────────────────────

/**
 * POST /api/consultations
 * Book a new consultation (Public - no auth required for guests, or optional auth?)
 * For now, we'll keep it public as it's a lead generation form.
 */
app.post('/api/consultations', async (req, res) => {
    try {
        const { name, email, phone, program, preferredTime } = req.body;

        if (!name || !email || !phone || !preferredTime) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const consultation = new Consultation({
            name,
            email,
            phone,
            program: program || '90-day',
            preferredTime
        });

        await consultation.save();
        console.log('📅 New consultation booking:', consultation._id);

        res.status(201).json({
            message: 'Consultation booked successfully!',
            consultation
        });
    } catch (err) {
        console.error('Consultation booking error:', err);
        res.status(500).json({ error: 'Failed to book consultation' });
    }
});

/**
 * GET /api/admin/consultations
 * List all consultations (Admin only)
 */
app.get('/api/admin/consultations', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const consultations = await Consultation.find()
            .sort({ timestamp: -1 });

        const pendingCount = await Consultation.countDocuments({ status: 'Pending' });

        res.json({ consultations, pendingCount });
    } catch (err) {
        console.error('Fetch consultations error:', err);
        res.status(500).json({ error: 'Failed to fetch consultations' });
    }
});

/**
 * PATCH /api/admin/consultations/:id/status
 * Update consultation status (Admin only)
 */
app.patch('/api/admin/consultations/:id/status', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Pending', 'Completed', 'Cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const consultation = await Consultation.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!consultation) {
            return res.status(404).json({ error: 'Consultation not found' });
        }

        res.json({ message: 'Status updated', consultation });
    } catch (err) {
        console.error('Update consultation status error:', err);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// ─── Plan Routes ────────────────────────────────────────────────────────────

/**
 * GET /api/plans
 * Get all plans (Public)
 */
app.get('/api/plans', async (req, res) => {
    try {
        const plans = await Plan.find().sort({ price: 1 });
        res.json(plans);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
});

/**
 * POST /api/plans
 * Create a new plan (Admin only)
 */
app.post('/api/plans', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const plan = new Plan(req.body);
        await plan.save();
        res.status(201).json(plan);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create plan' });
    }
});

/**
 * PATCH /api/plans/:id
 * Update a plan (Admin only)
 */
app.patch('/api/plans/:id', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(plan);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update plan' });
    }
});

/**
 * DELETE /api/plans/:id
 * Delete a plan (Admin only)
 */
app.delete('/api/plans/:id', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        await Plan.findByIdAndDelete(req.params.id);
        res.json({ message: 'Plan deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete plan' });
    }
});

// ─── Help & Support Routes ──────────────────────────────────────────────────

/**
 * POST /api/help
 * Submit a help request (Auth required)
 */
app.post('/api/help', verifyToken, async (req, res) => {
    try {
        const { subject, message, name } = req.body;
        const helpRequest = new HelpRequest({
            userId: req.user.uid,
            userName: name || req.user.name || 'User',
            userEmail: req.user.email,
            subject,
            message
        });
        await helpRequest.save();
        res.status(201).json({ message: 'Help request submitted' });
    } catch (err) {
        console.error('Help submit error:', err);
        res.status(500).json({ error: 'Failed to submit help request' });
    }
});

/**
 * GET /api/my-orders
 * Get orders for the logged-in user
 */
app.get('/api/my-orders', verifyToken, async (req, res) => {
    try {
        const orders = await Order.find({ firebaseUid: req.user.uid }).sort({ timestamp: -1 });
        res.json(orders);
    } catch (err) {
        console.error('Fetch my orders error:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

/**
 * GET /api/admin/help
 * Get all help requests (Admin only)
 */
app.get('/api/admin/help', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const requests = await HelpRequest.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch help requests' });
    }
});


/**
 * POST /api/orders
 * Create a new order (requires authenticated user)
 */
app.post('/api/orders', verifyToken, async (req, res) => {
    try {
        const { customerDetails, items, totalPrice, paymentMethod } = req.body;

        if (!customerDetails || !items || !totalPrice) {
            return res.status(400).json({ error: 'Missing required fields: customerDetails, items, totalPrice' });
        }

        const order = new Order({
            customerDetails: {
                name: customerDetails.name,
                phone: customerDetails.phone,
                address: customerDetails.address,
                email: req.user.email || customerDetails.email
            },
            items,
            totalPrice,
            paymentMethod: paymentMethod || 'cod',
            firebaseUid: req.user.uid
        });

        await order.save();
        console.log('📦 New order created:', order.orderId);

        res.status(201).json({
            message: 'Order placed successfully!',
            order: {
                orderId: order.orderId,
                status: order.status,
                totalPrice: order.totalPrice,
                timestamp: order.timestamp
            }
        });
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

/**
 * GET /api/orders/my
 * List orders for the authenticated customer
 */
app.get('/api/orders/my', verifyToken, async (req, res) => {
    try {
        const orders = await Order.find({ firebaseUid: req.user.uid })
            .sort({ timestamp: -1 });

        res.json({ orders });
    } catch (err) {
        console.error('Fetch my orders error:', err);
        res.status(500).json({ error: 'Failed to fetch your orders' });
    }
});



/**
 * GET /api/orders/stats
 * Get comprehensive order statistics (admin only)
 */
app.get('/api/orders/stats', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const total = await Order.countDocuments();
        const pending = await Order.countDocuments({ status: 'Pending' });
        const preparing = await Order.countDocuments({ status: 'Preparing' });
        const outForDelivery = await Order.countDocuments({ status: 'Out for Delivery' });
        const delivered = await Order.countDocuments({ status: 'Delivered' });
        const cancelled = await Order.countDocuments({ status: 'Cancelled' });

        // Revenue (exclude cancelled)
        const revenueResult = await Order.aggregate([
            { $match: { status: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const revenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // Average delivery time (only delivered orders with deliveredAt)
        const avgTimeResult = await Order.aggregate([
            { $match: { status: 'Delivered', deliveredAt: { $ne: null } } },
            {
                $project: {
                    deliveryTimeMs: { $subtract: ['$deliveredAt', '$timestamp'] }
                }
            },
            {
                $group: {
                    _id: null,
                    avgMs: { $avg: '$deliveryTimeMs' }
                }
            }
        ]);
        const avgDeliveryMinutes = avgTimeResult.length > 0
            ? Math.round(avgTimeResult[0].avgMs / 60000)
            : 0;

        // Unique customers
        const uniqueCustomers = await Order.distinct('firebaseUid');
        const totalCustomers = uniqueCustomers.length;

        // Today's stats
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayOrders = await Order.countDocuments({ timestamp: { $gte: todayStart } });
        const todayRevResult = await Order.aggregate([
            { $match: { timestamp: { $gte: todayStart }, status: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const todayRevenue = todayRevResult.length > 0 ? todayRevResult[0].total : 0;

        const todayDelivered = await Order.countDocuments({
            status: 'Delivered',
            deliveredAt: { $gte: todayStart }
        });

        const todayCustomers = await Order.distinct('firebaseUid', { timestamp: { $gte: todayStart } });

        res.json({
            total, pending, preparing, outForDelivery, delivered, cancelled,
            revenue, avgDeliveryMinutes, totalCustomers,
            todayOrders, todayRevenue, todayDelivered,
            newCustomersToday: todayCustomers.length
        });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

/**
 * GET /api/orders
 * List all orders (admin / delivery partner only)
 */
app.get('/api/orders', verifyToken, requireRole('admin', 'delivery'), async (req, res) => {
    try {
        const { status, limit = 50, skip = 0 } = req.query;
        const filter = {};
        if (status) filter.status = status;

        const orders = await Order.find(filter)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Order.countDocuments(filter);

        res.json({ orders, total });
    } catch (err) {
        console.error('Fetch orders error:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

/**
 * GET /api/orders/:id
 * View a single order — enforces row-level security:
 *   • Admins / delivery partners can view any order
 *   • Regular users can only view their OWN orders (matched by firebaseUid)
 *   Returns 403 if a user tries to access someone else's order
 */
app.get('/api/orders/:id', verifyToken, async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.id });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check if user is admin or delivery partner
        const creds = loadCredentials();
        const email = (req.user.email || '').toLowerCase();
        const isPrivileged = creds.admins.map(e => e.toLowerCase()).includes(email)
            || creds.delivery.map(e => e.toLowerCase()).includes(email);

        // If not privileged, enforce ownership — must match firebaseUid
        if (!isPrivileged && order.firebaseUid !== req.user.uid) {
            return res.status(403).json({ error: 'Forbidden — this order does not belong to you' });
        }

        res.json({ order });
    } catch (err) {
        console.error('Fetch order detail error:', err);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

/**
 * PATCH /api/orders/:id/status
 * Update order status (admin / delivery partner only)
 * Automatically sets deliveredAt when status = "Delivered"
 */
app.patch('/api/orders/:id/status', verifyToken, requireRole('admin', 'delivery'), async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const updateData = { status };
        if (status === 'Delivered') {
            updateData.deliveredAt = new Date();
        }

        const order = await Order.findOneAndUpdate(
            { orderId: req.params.id },
            updateData,
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        console.log(`📦 Order ${order.orderId} status updated to: ${status}`);
        res.json({ message: 'Status updated', order });
    } catch (err) {
        console.error('Update status error:', err);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// ─── Admin Endpoints ────────────────────────────────────────────────────────

/**
 * GET /api/admin/customers
 * Get unique customers from orders (admin only)
 */
app.get('/api/admin/customers', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const customers = await Order.aggregate([
            {
                $group: {
                    _id: '$firebaseUid',
                    name: { $last: '$customerDetails.name' },
                    email: { $last: '$customerDetails.email' },
                    phone: { $last: '$customerDetails.phone' },
                    address: { $last: '$customerDetails.address' },
                    orderCount: { $sum: 1 },
                    totalSpent: { $sum: '$totalPrice' },
                    lastOrder: { $max: '$timestamp' },
                    firstOrder: { $min: '$timestamp' }
                }
            },
            { $sort: { lastOrder: -1 } }
        ]);

        res.json({ customers, total: customers.length });
    } catch (err) {
        console.error('Customers error:', err);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

/**
 * GET /api/admin/credentials
 * Get admin and delivery partner email lists (admin only)
 */
app.get('/api/admin/credentials', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const creds = loadCredentials();
        res.json(creds);
    } catch (err) {
        console.error('Credentials error:', err);
        res.status(500).json({ error: 'Failed to load credentials' });
    }
});

/**
 * POST /api/admin/credentials
 * Add an admin or delivery email (admin only)
 * Body: { type: "admin"|"delivery", email: "..." }
 */
app.post('/api/admin/credentials', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const { type, email } = req.body;
        if (!type || !email || !['admin', 'delivery'].includes(type)) {
            return res.status(400).json({ error: 'type must be "admin" or "delivery", and email is required' });
        }

        const creds = loadCredentials();
        const list = type === 'admin' ? creds.admins : creds.delivery;
        const emailLower = email.toLowerCase().trim();

        if (list.map(e => e.toLowerCase()).includes(emailLower)) {
            return res.status(409).json({ error: 'Email already exists' });
        }

        list.push(emailLower);
        saveCredentials(creds);

        console.log(`👤 ${type} email added: ${emailLower}`);
        res.json({ message: `${type} email added`, credentials: creds });
    } catch (err) {
        console.error('Add credential error:', err);
        res.status(500).json({ error: 'Failed to add credential' });
    }
});

/**
 * DELETE /api/admin/credentials
 * Remove an admin or delivery email (admin only)
 * Body: { type: "admin"|"delivery", email: "..." }
 */
app.delete('/api/admin/credentials', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const { type, email } = req.body;
        if (!type || !email || !['admin', 'delivery'].includes(type)) {
            return res.status(400).json({ error: 'type must be "admin" or "delivery", and email is required' });
        }

        const creds = loadCredentials();
        const emailLower = email.toLowerCase().trim();

        // Prevent removing the primary admin
        if (type === 'admin' && emailLower === 'admin@savourly.in') {
            return res.status(403).json({ error: 'Cannot remove the primary admin' });
        }

        if (type === 'admin') {
            creds.admins = creds.admins.filter(e => e.toLowerCase() !== emailLower);
        } else {
            creds.delivery = creds.delivery.filter(e => e.toLowerCase() !== emailLower);
        }

        saveCredentials(creds);
        console.log(`👤 ${type} email removed: ${emailLower}`);
        res.json({ message: `${type} email removed`, credentials: creds });
    } catch (err) {
        console.error('Remove credential error:', err);
        res.status(500).json({ error: 'Failed to remove credential' });
    }
});

/**
 * POST /api/admin/notify
 * Send a notification (mock or real) to all users
 */
app.post('/api/admin/notify', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        // In a real app, this would use Firebase Cloud Messaging (FCM) or email (Nodemailer)
        // For now, we'll just log it and maybe store it in a Notifications collection
        console.log(`📢 BROADCAST NOTIFICATION: "${message}"`);

        // Mock success - return count of users
        const userCount = await Order.distinct('firebaseUid');

        res.json({ message: 'Notification sent', count: userCount.length });
    } catch (err) {
        console.error('Notify error:', err);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

/**
 * DELETE /api/admin/orders
 * Clear all orders from MongoDB (admin only — danger zone)
 */
app.delete('/api/admin/orders', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const result = await Order.deleteMany({});
        console.log(`🗑️ Cleared ${result.deletedCount} orders`);
        res.json({ message: `Deleted ${result.deletedCount} orders` });
    } catch (err) {
        console.error('Clear orders error:', err);
        res.status(500).json({ error: 'Failed to clear orders' });
    }
});

/**
 * GET /api/debug
 * Simple endpoint to check if server is up and env vars are loaded
 */
app.get('/api/debug', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        env: {
            vercel: process.env.VERCEL === '1',
            hasMongoURI: !!process.env.MONGODB_URI,
            hasFirebase: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON
        }
    });
});

// ─── Catch-All: Serve index.html only for non-file routes ──────────────────
// This prevents the catch-all from intercepting .html, .css, .js etc.
app.get('*', (req, res) => {
    // If the request looks like a file (has an extension), return 404
    if (path.extname(req.path)) {
        return res.status(404).send('File not found');
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── Start Server (local dev only, Vercel uses the export) ──────────────────
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`🚀 Savourly server running at http://localhost:${PORT}`);
    });
}

// Export for Vercel serverless
module.exports = app;
