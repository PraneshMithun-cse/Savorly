// ============================================
// SAVOURLY - Interactive JavaScript
// Time Complexity: O(1) for event handlers
// Space Complexity: O(n) where n = number of nav links
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - O(1) lookups cached
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    const navbar = document.querySelector('.navbar');

    // Cart Elements
    const cartBtn = document.getElementById('cartBtn');
    const mobileCartBtn = document.getElementById('mobileCartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartClose = document.getElementById('cartClose');
    const cartItems = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');
    const cartCount = document.getElementById('cartCount');
    const mobileCartCount = document.getElementById('mobileCartCount');
    const totalAmount = document.getElementById('totalAmount');
    const browseBtn = document.getElementById('browseBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');

    // Cart State
    let cart = JSON.parse(localStorage.getItem('savourlyCart')) || [];

    // Mobile Menu Toggle - O(1)
    hamburger?.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu on link click - O(n) where n = nav links
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger?.classList.remove('active');
            mobileMenu?.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Active link on scroll - O(s) where s = sections
    const sections = document.querySelectorAll('section[id]');

    const updateActiveLink = () => {
        const scrollY = window.scrollY;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };

    // Navbar background on scroll - O(1)
    const updateNavbar = () => {
        if (window.scrollY > 50) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }
    };

    // Throttle scroll events for performance - O(1)
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateActiveLink();
                updateNavbar();
                ticking = false;
            });
            ticking = true;
        }
    });

    // Smooth scroll for anchor links - O(1) per click
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (href && href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                target?.scrollIntoView({ behavior: 'smooth' });
                // Close cart if open
                closeCart();
            }
        });
    });

    // ============================================
    // CART FUNCTIONALITY
    // ============================================

    const openCart = () => {
        cartSidebar?.classList.add('active');
        cartOverlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeCart = () => {
        cartSidebar?.classList.remove('active');
        cartOverlay?.classList.remove('active');
        document.body.style.overflow = '';
    };

    const updateCartUI = () => {
        // Update count badges
        const count = cart.length;
        if (cartCount) cartCount.textContent = count;
        if (mobileCartCount) mobileCartCount.textContent = count;

        // Calculate total
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        if (totalAmount) totalAmount.textContent = `₹${total.toLocaleString('en-IN')}`;

        // Update cart items display
        if (cartItems) {
            if (cart.length === 0) {
                cartItems.innerHTML = `
                    <div class="cart-empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        </svg>
                        <p>Your cart is empty</p>
                        <a href="#plans" class="btn btn-primary" onclick="document.getElementById('cartSidebar').classList.remove('active'); document.getElementById('cartOverlay').classList.remove('active'); document.body.style.overflow = '';">Browse Plans</a>
                    </div>
                `;
                if (cartFooter) cartFooter.style.display = 'none';
            } else {
                cartItems.innerHTML = cart.map((item, index) => `
                    <div class="cart-item">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                        <div class="cart-item-details">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}/week</div>
                        </div>
                        <button class="cart-item-remove" data-index="${index}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                `).join('');
                if (cartFooter) cartFooter.style.display = 'block';

                // Add remove listeners
                document.querySelectorAll('.cart-item-remove').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const index = parseInt(btn.dataset.index);
                        removeFromCart(index);
                    });
                });
            }
        }

        // Save to localStorage
        localStorage.setItem('savourlyCart', JSON.stringify(cart));
    };

    const addToCart = (name, price, image) => {
        cart.push({ name, price, image });
        updateCartUI();
        openCart();
    };

    const removeFromCart = (index) => {
        cart.splice(index, 1);
        updateCartUI();
    };

    // Cart button clicks
    cartBtn?.addEventListener('click', openCart);
    mobileCartBtn?.addEventListener('click', openCart);
    cartClose?.addEventListener('click', closeCart);
    cartOverlay?.addEventListener('click', closeCart);

    // Checkout button
    checkoutBtn?.addEventListener('click', () => {
        if (cart.length > 0) {
            alert(`🎉 Thank you for your order!\n\nTotal: ₹${cart.reduce((sum, item) => sum + item.price, 0).toLocaleString('en-IN')}\n\nYou will receive a confirmation email shortly.`);
            cart = [];
            updateCartUI();
            closeCart();
        }
    });

    // Add to cart buttons on plan cards
    const planImages = {
        'Silver Plan': 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=100&h=100&fit=crop',
        'Gold Plan': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=100&h=100&fit=crop',
        'Platinum Plan': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=100&h=100&fit=crop'
    };

    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', () => {
            const plan = btn.dataset.plan;
            const price = parseInt(btn.dataset.price);
            const image = planImages[plan] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop';
            addToCart(plan, price, image);

            // Button feedback
            const originalText = btn.textContent;
            btn.textContent = '✓ Added!';
            btn.disabled = true;
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
            }, 1500);
        });
    });

    // Initialize cart UI
    updateCartUI();

    // ============================================
    // SUBSCRIPTION FORM
    // ============================================
    const subscribeForm = document.getElementById('subscribeForm');
    subscribeForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('🎉 Thank you for subscribing! You\'ll receive 20% off your first order.');
        subscribeForm.reset();
    });

    // ============================================
    // ROTATING PLAN INFO
    // ============================================
    const planInfoContent = {
        silver: [
            "Start your wellness journey with carefully portioned meals that help maintain consistent energy levels throughout the day.",
            "Perfect balance of proteins and carbs designed for beginners looking to establish healthy eating habits.",
            "Enjoy nutritious meals without the hassle of meal prep, ideal for those new to fitness nutrition."
        ],
        gold: [
            "Unlock your full potential with premium ingredients and personalized nutrition tracking for sustainable transformation.",
            "Advanced macro customization to support muscle building, fat loss, or performance enhancement goals.",
            "Get the flexibility to swap meals based on your preferences while maintaining optimal nutrition."
        ],
        platinum: [
            "Experience elite-level nutrition with dedicated support, ensuring every meal accelerates your path to excellence.",
            "Personalized meal timing synced with your workout schedule for maximum performance and recovery.",
            "Work directly with certified nutritionists to fine-tune your diet for competition-level results."
        ]
    };

    const updatePlanInfo = () => {
        Object.keys(planInfoContent).forEach(plan => {
            const infoEl = document.getElementById(`${plan}Info`);
            if (infoEl) {
                const contents = planInfoContent[plan];
                const randomIndex = Math.floor(Math.random() * contents.length);
                infoEl.textContent = contents[randomIndex];
            }
        });
    };

    // Update plan info every 8 seconds
    setInterval(updatePlanInfo, 8000);

    // ============================================
    // SCROLL ANIMATIONS
    // ============================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe animated elements
    document.querySelectorAll('.plan-card, .feature-card, .testimonial-card, .gallery-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Add visible class styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        .visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
});
