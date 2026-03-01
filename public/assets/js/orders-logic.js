
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

const auth = firebase.auth();
const container = document.getElementById('ordersContainer');

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = '/login';
        return;
    }

    try {
        const token = await user.getIdToken();
        const response = await fetch('/api/orders/my', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch orders');

        const data = await response.json();
        renderOrders(data.orders);
    } catch (error) {
        console.error('Error loading orders:', error);
        // Show error state — never fall back to unscoped localStorage data
        container.innerHTML = `
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <h2>Unable to load orders</h2>
                        <p>Please check your connection and try again.</p>
                        <a href="/orders">Retry</a>
                    </div>
                `;
    }
});

function renderOrders(orders) {
    if (!orders || orders.length === 0) {
        showEmpty();
        return;
    }

    container.innerHTML = orders.map(order => `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <div class="order-id">${order.orderId}</div>
                            <div class="order-date">${new Date(order.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <span class="order-status status-${order.status}">${order.status}</span>
                    </div>
                    <ul class="order-items">
                        ${order.items.map(item => `
                            <li>
                                <span>${item.name || item.planName} × ${item.quantity || 1}</span>
                                <span>₹${(item.price * (item.quantity || 1)).toLocaleString('en-IN')}</span>
                            </li>
                        `).join('')}
                    </ul>
                    <div class="order-total">
                        <span>Total</span>
                        <span>₹${order.totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            `).join('');
}

function renderLocalOrders(orders) {
    container.innerHTML = orders.reverse().map(order => `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <div class="order-id">${order.id}</div>
                            <div class="order-date">${new Date(order.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <span class="order-status status-Pending">Pending</span>
                    </div>
                    <ul class="order-items">
                        ${order.items.map(item => `
                            <li>
                                <span>${item.name} × ${item.quantity || 1}</span>
                                <span>₹${((item.price) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
                            </li>
                        `).join('')}
                    </ul>
                    <div class="order-total">
                        <span>Total</span>
                        <span>₹${order.total.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            `).join('');
}

function showEmpty() {
    container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                    <h2>No orders yet</h2>
                    <p>Browse our meal plans and place your first order!</p>
                    <a href="/#plans">Browse Plans</a>
                </div>
            `;
}


