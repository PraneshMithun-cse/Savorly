
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

        function openHelpModal() { document.getElementById('helpModal').classList.add('active'); }
        function closeHelpModal() { document.getElementById('helpModal').classList.remove('active'); }

        async function fetchOrders() {
            try {
                const res = await fetch('/api/my-orders', {
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });
                const orders = await res.json();
                renderOrders(orders);
            } catch (error) {
                console.error('Error fetching orders:', error);
                document.getElementById('ordersList').innerHTML = '<div style="text-align:center; padding: 40px; color:var(--text-muted);">Failed to load orders</div>';
            }
        }

        function renderOrders(orders) {
            const container = document.getElementById('ordersList');
            if (orders.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding: 40px; color:var(--text-muted);">No orders yet. <a href="index.html#plans" style="color:var(--primary);">Order now!</a></div>';
                return;
            }

            container.innerHTML = orders.map(o => `
                <div class="order-card">
                    <div class="order-header">
                        <span class="order-id">#${o.orderId}</span>
                        <span class="order-date">${new Date(o.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div class="order-items">
                        ${o.items.map(i => `
                            <div class="order-item">
                                <span>${i.quantity}x ${i.planName}</span>
                                <span>₹${(i.price * i.quantity).toLocaleString('en-IN')}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-footer">
                        <div class="order-total">Total: ₹${o.totalPrice.toLocaleString('en-IN')}</div>
                        <span class="status-badge status ${o.status.toLowerCase().replace(/ /g, '-')}">${o.status}</span>
                    </div>
                </div>
            `).join('');
        }

        document.getElementById('helpForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const subject = document.getElementById('helpSubject').value;
            const message = document.getElementById('helpMessage').value;

            try {
                const res = await fetch('/api/help', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + authToken
                    },
                    body: JSON.stringify({ subject, message })
                });

                if (res.ok) {
                    alert('Help request submitted! We will contact you shortly.');
                    closeHelpModal();
                    document.getElementById('helpForm').reset();
                } else {
                    alert('Failed to submit request.');
                }
            } catch (err) {
                console.error(err);
                alert('Error submitting request.');
            }
        });

        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                authToken = await user.getIdToken();
                document.getElementById('userName').textContent = user.displayName || user.email;
                document.getElementById('userAvatar').textContent = (user.displayName || user.email)[0].toUpperCase();
                fetchOrders();
            } else {
                window.location.href = 'signin.html';
            }
        });
    

