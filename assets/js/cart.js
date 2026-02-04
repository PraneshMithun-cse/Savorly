// ============================================
// CART PAGE JAVASCRIPT
// Handles cart operations, coupons, and checkout
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Get cart from localStorage
    let cart = JSON.parse(localStorage.getItem('savourlyCart')) || [];

    // Coupon codes
    const COUPONS = {
        'SAVE10': { discount: 10, type: 'percent', description: '10% off' },
        'SAVE20': { discount: 20, type: 'percent', description: '20% off' },
        'FLAT100': { discount: 100, type: 'flat', description: '₹100 off' },
        'WELCOME': { discount: 15, type: 'percent', description: '15% off' }
    };

    let appliedCoupon = null;

    // DOM Elements
    const cartItemsList = document.getElementById('cartItemsList');
    const cartSubtitle = document.getElementById('cartSubtitle');
    const emptyCart = document.getElementById('emptyCart');
    const cartContent = document.querySelector('.cart-content');
    const subtotalAmount = document.getElementById('subtotalAmount');
    const discountRow = document.getElementById('discountRow');
    const discountAmount = document.getElementById('discountAmount');
    const totalAmount = document.getElementById('totalAmount');
    const couponInput = document.getElementById('couponInput');
    const applyCouponBtn = document.getElementById('applyCouponBtn');
    const couponMessage = document.getElementById('couponMessage');
    const couponApplied = document.getElementById('couponApplied');
    const appliedCouponCode = document.getElementById('appliedCouponCode');
    const removeCouponBtn = document.getElementById('removeCouponBtn');
    const checkoutBtnMain = document.getElementById('checkoutBtnMain');

    // Initialize cart display
    renderCart();

    // Apply coupon button
    applyCouponBtn?.addEventListener('click', applyCoupon);

    // Apply coupon on Enter key
    couponInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyCoupon();
        }
    });

    // Remove coupon
    removeCouponBtn?.addEventListener('click', removeCoupon);

    // Checkout button
    checkoutBtnMain?.addEventListener('click', handleCheckout);

    // Render cart items
    function renderCart() {
        if (cart.length === 0) {
            showEmptyCart();
            return;
        }

        hideEmptyCart();

        cartSubtitle.textContent = `${cart.length} item${cart.length > 1 ? 's' : ''} in your cart`;

        cartItemsList.innerHTML = cart.map((item, index) => `
            <div class="cart-item" data-index="${index}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-description">Fresh meals delivered weekly</div>
                    <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')} <span>/week</span></div>
                </div>
                <div class="quantity-controls">
                    <button class="qty-btn qty-minus" data-index="${index}">−</button>
                    <span class="qty-value">${item.quantity || 1}</span>
                    <button class="qty-btn qty-plus" data-index="${index}">+</button>
                </div>
                <button class="remove-item-btn" data-index="${index}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                </button>
            </div>
        `).join('');

        // Add event listeners for quantity and remove buttons
        document.querySelectorAll('.qty-plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                updateQuantity(index, 1);
            });
        });

        document.querySelectorAll('.qty-minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                updateQuantity(index, -1);
            });
        });

        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                removeItem(index);
            });
        });

        updateTotals();
    }

    // Update quantity
    function updateQuantity(index, change) {
        if (!cart[index].quantity) {
            cart[index].quantity = 1;
        }

        cart[index].quantity += change;

        if (cart[index].quantity <= 0) {
            removeItem(index);
            return;
        }

        saveCart();
        renderCart();
    }

    // Remove item
    function removeItem(index) {
        cart.splice(index, 1);
        saveCart();
        renderCart();

        // Show toast notification
        showToast('Item removed from cart');
    }

    // Save cart to localStorage
    function saveCart() {
        localStorage.setItem('savourlyCart', JSON.stringify(cart));
    }

    // Calculate subtotal
    function calculateSubtotal() {
        return cart.reduce((sum, item) => {
            const qty = item.quantity || 1;
            return sum + (item.price * qty);
        }, 0);
    }

    // Calculate discount
    function calculateDiscount(subtotal) {
        if (!appliedCoupon) return 0;

        const coupon = COUPONS[appliedCoupon];
        if (!coupon) return 0;

        if (coupon.type === 'percent') {
            return Math.round(subtotal * coupon.discount / 100);
        } else {
            return coupon.discount;
        }
    }

    // Update totals display
    function updateTotals() {
        const subtotal = calculateSubtotal();
        const discount = calculateDiscount(subtotal);
        const total = subtotal - discount;

        subtotalAmount.textContent = `₹${subtotal.toLocaleString('en-IN')}`;

        if (discount > 0) {
            discountRow.style.display = 'flex';
            discountAmount.textContent = `-₹${discount.toLocaleString('en-IN')}`;
        } else {
            discountRow.style.display = 'none';
        }

        totalAmount.textContent = `₹${total.toLocaleString('en-IN')}`;
    }

    // Apply coupon
    function applyCoupon() {
        const code = couponInput.value.trim().toUpperCase();

        if (!code) {
            showCouponMessage('Please enter a coupon code', 'error');
            return;
        }

        if (COUPONS[code]) {
            appliedCoupon = code;
            couponInput.value = '';
            couponInput.disabled = true;
            applyCouponBtn.disabled = true;

            // Show applied coupon tag
            couponApplied.style.display = 'block';
            appliedCouponCode.textContent = `${code} - ${COUPONS[code].description}`;

            showCouponMessage('Coupon applied successfully!', 'success');
            updateTotals();

            // Hide input wrapper
            document.querySelector('.coupon-input-wrapper').style.display = 'none';
        } else {
            showCouponMessage('Invalid coupon code', 'error');
            couponInput.classList.add('shake');
            setTimeout(() => couponInput.classList.remove('shake'), 500);
        }
    }

    // Remove coupon
    function removeCoupon() {
        appliedCoupon = null;
        couponInput.value = '';
        couponInput.disabled = false;
        applyCouponBtn.disabled = false;
        couponApplied.style.display = 'none';
        couponMessage.textContent = '';
        couponMessage.className = 'coupon-message';
        document.querySelector('.coupon-input-wrapper').style.display = 'flex';
        updateTotals();
    }

    // Show coupon message
    function showCouponMessage(message, type) {
        couponMessage.textContent = message;
        couponMessage.className = `coupon-message ${type}`;

        if (type === 'error') {
            setTimeout(() => {
                couponMessage.textContent = '';
                couponMessage.className = 'coupon-message';
            }, 3000);
        }
    }

    // Show empty cart
    function showEmptyCart() {
        if (cartContent) cartContent.style.display = 'none';
        if (emptyCart) emptyCart.style.display = 'block';
    }

    // Hide empty cart
    function hideEmptyCart() {
        if (cartContent) cartContent.style.display = 'grid';
        if (emptyCart) emptyCart.style.display = 'none';
    }

    // Handle checkout
    function handleCheckout() {
        if (cart.length === 0) {
            showToast('Your cart is empty!');
            return;
        }

        const subtotal = calculateSubtotal();
        const discount = calculateDiscount(subtotal);
        const total = subtotal - discount;

        // For now, show a success message
        // In production, this would redirect to a payment gateway
        const message = `🎉 Order Confirmed!\n\nTotal: ₹${total.toLocaleString('en-IN')}/week\n${appliedCoupon ? `Coupon: ${appliedCoupon} applied\n` : ''}You will receive a confirmation email shortly.`;

        alert(message);

        // Clear cart
        cart = [];
        saveCart();
        renderCart();
    }

    // Toast notification
    function showToast(message) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--gray-800);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            animation: slideUp 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from { opacity: 0; transform: translateX(-50%) translateY(20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes slideDown {
            from { opacity: 1; transform: translateX(-50%) translateY(0); }
            to { opacity: 0; transform: translateX(-50%) translateY(20px); }
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        .shake { animation: shake 0.3s ease; }
    `;
    document.head.appendChild(style);
});
