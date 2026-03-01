/* Delivery Partner JavaScript logic - Integrated with MongoDB API */

let authToken = null;
let deliveryOrders = [];

function updateTime() {
    const now = new Date();
    const el = document.getElementById('currentTime');
    if (el) el.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateTime, 1000);

async function apiFetch(url, options = {}) {
    const separator = url.includes('?') ? '&' : '?';
    const freshUrl = `${url}${separator}_t=${Date.now()}`;

    const res = await fetch(freshUrl, {
        ...options,
        headers: {
            'Authorization': 'Bearer ' + authToken,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
}

window.toggleOnline = function () {
    const current = document.getElementById('onlineStatus');
    const toggle = document.getElementById('toggleSwitch');
    if (current && toggle) {
        if (current.innerText === 'Online') {
            current.innerText = 'Offline';
            toggle.classList.remove('active');
        } else {
            current.innerText = 'Online';
            toggle.classList.add('active');
            loadDeliveryData();
        }
    }
};

window.switchTab = function (tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
    renderOrders(tabName);
};

async function loadDeliveryData() {
    const status = document.getElementById('onlineStatus');
    if (status && status.innerText === 'Offline') return;

    try {
        const data = await apiFetch('/api/orders?limit=100');
        deliveryOrders = data.orders || [];

        let todaysDeliveries = 0;
        let activeCount = 0;
        let newCount = 0;

        deliveryOrders.forEach(o => {
            const s = (o.status || '').toLowerCase();
            if (s === 'out for delivery' || s === 'dispatched') activeCount++;
            if (s === 'processing' || s === 'pending') newCount++;
            if (s === 'delivered') todaysDeliveries++;
        });

        document.getElementById('todayDeliveries').innerText = todaysDeliveries;
        document.getElementById('newCount').innerText = newCount;

        const activeTab = document.querySelector('.tab.active').getAttribute('data-tab');
        renderOrders(activeTab);
    } catch (err) {
        console.error('Failed fetching delivery orders', err);
    }
}

function renderOrders(tab) {
    const container = document.getElementById('content');
    if (!container) return;

    let filtered = [];
    if (tab === 'new') {
        filtered = deliveryOrders.filter(o => ['processing', 'pending'].includes(o.status.toLowerCase()));
    } else if (tab === 'active') {
        filtered = deliveryOrders.filter(o => ['out for delivery', 'dispatched'].includes(o.status.toLowerCase()));
    } else if (tab === 'completed') {
        filtered = deliveryOrders.filter(o => o.status.toLowerCase() === 'delivered');
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div style="padding: 40px; text-align: center; color: #888;">No ${tab} orders right now.</div>`;
        return;
    }

    container.innerHTML = filtered.map(o => {
        let itemsHtml = '';
        if (Array.isArray(o.items)) {
            itemsHtml = o.items.map(i => `${i.quantity}x ${i.planName || i.name}`).join(', ');
        }

        return `
        <div class="test-order-card" style="background:#fff; border-radius:12px; padding:16px; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid #eee; padding-bottom:12px;">
                <strong style="color:var(--primary);">#${o.orderId || o._id.substring(0, 6)}</strong>
                <span style="background:#f0fbf8; color:var(--primary); padding:4px 8px; border-radius:6px; font-size:12px; font-weight:600;">${o.status.toUpperCase()}</span>
            </div>
            <div style="margin-bottom:16px;">
                <div style="font-weight:600; font-size:16px; margin-bottom:4px;">${o.customerDetails?.name || 'Customer'}</div>
                <div style="color:#666; font-size:14px; margin-bottom:8px;">📞 ${o.customerDetails?.phone || 'N/A'}</div>
                <div style="color:#444; font-size:14px; line-height:1.4;">📍 ${o.customerDetails?.address || 'N/A'}</div>
            </div>
            <div style="background:#f9fafb; padding:12px; border-radius:8px; margin-bottom:16px; font-size:13px; color:#555;">
                <strong>Items:</strong> ${itemsHtml} <br/>
                <strong style="margin-top:4px; display:inline-block;">Pay:</strong> ₹${o.totalPrice} (${o.paymentMethod.toUpperCase()})
            </div>
            
            ${tab === 'new' ? `
            <div style="display:flex; gap:12px;">
                <button onclick="updateOrderStatus('${o._id}', 'Out for Delivery')" style="flex:1; background:var(--primary); color:#fff; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer;">Accept Pick-Up</button>
            </div>
            ` : ''}

            ${tab === 'active' ? `
            <div style="display:flex; gap:12px;">
                <button onclick="updateOrderStatus('${o._id}', 'Delivered')" style="flex:1; background:var(--success); color:#fff; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer;">Mark Delivered</button>
            </div>
            ` : ''}
        </div>
        `;
    }).join('');
}

window.updateOrderStatus = async function (dbOrderId, newStatus) {
    try {
        const res = await apiFetch('/api/orders/update', {
            method: 'POST',
            body: JSON.stringify({ orderId: dbOrderId, status: newStatus })
        });

        if (res.success) {
            loadDeliveryData();
            showToast(`Order marked as ${newStatus}`);
        } else {
            alert('Failed to update: ' + res.error);
        }
    } catch (e) {
        alert('Server Error Updating Status');
    }
}

function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// Ensure Auth before starting
if (typeof firebase !== 'undefined') {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            alert('Delivery Partner Login Required');
            window.location.href = '/signin';
            return;
        }

        try {
            authToken = await user.getIdToken(true);
            loadDeliveryData();
            setInterval(loadDeliveryData, 10000);
        } catch (e) {
            alert('Auth validation failed.');
        }
    });
}
