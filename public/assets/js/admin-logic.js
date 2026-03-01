
const firebaseConfig = {
    apiKey: "AIzaSyAbOyzOi3xqyXNLWrmkL7pqMrxk_opjW1I",
    authDomain: "savorly-d2e63.firebaseapp.com",
    projectId: "savorly-d2e63",
    storageBucket: "savorly-d2e63.firebasestorage.app",
    messagingSenderId: "820941077673",
    appId: "1:820941077673:web:feffe61f09d5970c477db8",
    measurementId: "G-E3YQ1VSL75"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

let authToken = null;

// Time display
function updateTime() {
    const now = new Date();
    const el = document.getElementById('currentTime');
    if (el) el.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
updateTime();
setInterval(updateTime, 1000);

// Helper: relative time
function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + ' min ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
}

// Fetch data with auth and cache-busting
async function apiFetch(url) {
    // Append timestamp to prevent caching
    const separator = url.includes('?') ? '&' : '?';
    const freshUrl = `${url}${separator}_t=${Date.now()}`;

    const res = await fetch(freshUrl, {
        headers: {
            'Authorization': 'Bearer ' + authToken,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    });
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
}

// ... (renderStats, renderOrders, renderFeedback functions omitted for brevity) ...

// Render dashboard stats
function renderStats(stats) {
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };

    el('totalRevenue', '₹' + (stats.todayRevenue || 0).toLocaleString('en-IN'));
    el('totalOrders', stats.todayOrders || 0);
    el('avgDeliveryTime', (stats.avgDeliveryMinutes || 0) + ' min');
    el('newCustomers', stats.totalCustomers || 0);

    // Delivery stats
    el('activeDeliveries', stats.outForDelivery || 0);
    el('completedDeliveries', stats.todayDelivered || 0);
    el('pendingPickup', stats.pending || 0);
    el('cancelledOrders', stats.cancelled || 0);

    // Update sidebar badge
    const badge = document.querySelector('.nav-badge');
    if (badge) badge.textContent = stats.pending || 0;
}

// Render recent orders
function renderOrders(orders) {
    const table = document.getElementById('ordersTable');
    if (!table) return;

    if (!orders || orders.length === 0) {
        table.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);">No orders yet</div>';
        return;
    }

    table.innerHTML = orders.slice(0, 8).map(o => {
        let itemsHtml = '';
        if (Array.isArray(o.items)) {
            itemsHtml = o.items.map(i => `${i.quantity}x ${i.planName || i.name}`).join(', ');
        }

        return `
                <div class="order-row">
                    <span class="order-id">#${o.orderId || o._id.substring(0, 6)}</span>
                    <div class="order-customer">
                        <strong>${o.customerDetails?.name || 'Guest'}</strong>
                        <span>${o.customerDetails?.phone || 'N/A'}</span>
                    </div>
                    <span class="order-items">${itemsHtml}</span>
                    <span class="order-amount">₹${(o.totalPrice || 0).toLocaleString('en-IN')}</span>
                    <div class="order-status">
                        <span class="status-badge ${o.status.toLowerCase().replace(/\s+/g, '-')}">${o.status}</span>
                    </div>
                    <span class="order-time">${timeAgo(o.timestamp)}</span>
                </div>
            `;
    }).join('');
}

// Render feedback (static for now since no feedback API)
function renderFeedback() {
    const list = document.getElementById('feedbackList');
    if (!list) return;
    const feedback = [
        { name: 'Sneha R', initials: 'SR', stars: 5, text: 'Amazing food quality! The portion size is perfect and delivery was super fast.' },
        { name: 'Vikram S', initials: 'VS', stars: 4, text: 'Good variety of healthy options. Would love more South Indian choices.' },
        { name: 'Meera K', initials: 'MK', stars: 5, text: 'Best meal delivery service in Chennai! Fresh ingredients every time.' }
    ];
    list.innerHTML = feedback.map(f => `
                <div class="feedback-item">
                    <div class="feedback-header">
                        <div class="feedback-user">
                            <div class="feedback-avatar">${f.initials}</div>
                            <span class="feedback-name">${f.name}</span>
                        </div>
                        <span class="feedback-stars">${'★'.repeat(f.stars)}${'☆'.repeat(5 - f.stars)}</span>
                    </div>
                    <p class="feedback-text">${f.text}</p>
                </div>
            `).join('');
}

// Load all dashboard data
async function loadDashboard() {
    try {
        const [stats, ordersData] = await Promise.all([
            apiFetch('/api/orders/stats'),
            apiFetch('/api/orders?limit=8')
        ]);

        // Save to cache
        localStorage.setItem('admin_dashboard_cache', JSON.stringify({
            stats,
            orders: ordersData.orders,
            timestamp: Date.now()
        }));

        renderStats(stats);
        renderOrders(ordersData.orders);
        renderFeedback();
    } catch (err) {
        console.error('Dashboard load error:', err);
    }
}

// Load from cache for instant display
function loadFromCache() {
    const cached = localStorage.getItem('admin_dashboard_cache');
    if (cached) {
        try {
            const data = JSON.parse(cached);
            // Only use cache if less than 24h old
            if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                renderStats(data.stats);
                renderOrders(data.orders);
                renderFeedback();
                console.log('Loaded from cache');
            }
        } catch (e) {
            console.error('Cache parse error', e);
        }
    }
}

// Refresh button
document.getElementById('refreshBtn').addEventListener('click', function () {
    this.classList.add('loading');
    loadDashboard().finally(() => {
        setTimeout(() => this.classList.remove('loading'), 500);
    });
});

// Auth guard + init
firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
        alert('Please log in as admin.');
        window.location.href = '/signin';
        return;
    }

    try {
        // Force fresh token to ensure custom claims are up to date
        authToken = await user.getIdToken(true);

        // Check if user is admin by trying stats endpoint
        const testRes = await fetch('/api/orders/stats', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });

        if (testRes.status === 403) {
            alert('Access denied. Admin credentials required.');
            window.location.href = '/';
            return;
        }

        // User is admin — load dashboard
        loadFromCache(); // Instant render
        await loadDashboard();
        updateBadgeCount();

        // Real-time updates (1 second refresh)
        setInterval(loadDashboard, 1000);
        setInterval(updateBadgeCount, 60000); // Badges can be slower
    } catch (err) {
        console.error('Auth error:', err);
        alert('Access denied. Admin credentials required.');
        window.location.href = '/';
    }
});

// Dynamic Badge Count
async function updateBadgeCount() {
    try {
        if (!authToken) return;
        const badges = document.querySelectorAll('.nav-badge');
        if (badges.length === 0) return;

        const res = await fetch('/api/orders/stats', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        if (res.ok) {
            const data = await res.json();
            badges.forEach(badge => {
                badge.textContent = data.pending;
                badge.style.display = data.pending > 0 ? 'inline-flex' : 'none';
            });
        }
    } catch (e) { console.error('Badge update error', e); }
}

// Dynamic Badge Count
async function updateBadgeCount() {
    try {
        if (!authToken) return;
        const badges = document.querySelectorAll('.nav-badge');
        if (badges.length === 0) return;

        const res = await fetch('/api/orders/stats', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        if (res.ok) {
            const data = await res.json();
            badges.forEach(badge => {
                badge.textContent = data.pending;
                badge.style.display = data.pending > 0 ? 'inline-flex' : 'none';
            });
        }
    } catch (e) { console.error('Badge update error', e); }
}

// Export Orders to CSV
async function exportOrders() {
    try {
        if (!authToken) return;
        const res = await fetch('/api/orders?limit=1000', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        const orders = data.orders;

        if (orders.length === 0) return alert('No orders to export');

        // Define CSV headers
        const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Address', 'Items', 'Total', 'Status', 'Payment'];
        const rows = orders.map(o => [
            o.orderId,
            new Date(o.timestamp).toLocaleString(),
            o.customerDetails.name,
            o.customerDetails.phone,
            `"${(o.customerDetails.address || '').replace(/"/g, '""')}"`, // Escape quotes
            `"${o.items.map(i => `${i.quantity}x ${i.planName}`).join(', ')}"`,
            o.totalPrice,
            o.status,
            o.paymentMethod
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `savourly-orders-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

    } catch (err) {
        console.error('Export error:', err);
        alert('Failed to export orders');
    }
}

// Send Notifications Modal
function showNotifyModal() {
    const msg = prompt("Enter notification message to send to all customers:");
    if (msg) sendNotification(msg);
}

async function sendNotification(message) {
    try {
        const res = await fetch('/api/admin/notify', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        const data = await res.json();
        if (res.ok) alert('Notification sent to ' + data.count + ' users!');
        else alert('Failed: ' + data.error);
    } catch (e) { alert('Error sending notification'); }
}

// Attach listeners
document.querySelector('.help-item:nth-child(1)').addEventListener('click', exportOrders);
document.querySelector('.help-item:nth-child(2)').addEventListener('click', showNotifyModal);

// Call after auth
const originalAuth = firebase.auth().onAuthStateChanged;

// We can just rely on the existing auth observer calling loadStats, so we add it there if possible, or sets an interval.
// Since loadStats is called in onAuthStateChanged, we can add it there.
// But wait, admin.html has a big script block. I should inject this function and call it.


