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

    // New Mobile Navbar Elements
    const mobileNavbarCartBtn = document.getElementById('mobileNavbarCartBtn');
    const mobileNavbarCartCount = document.getElementById('mobileNavbarCartCount');

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
    // ============================================
    // LOCATION MODAL FUNCTIONALITY
    // ============================================

    const locationTrigger = document.getElementById('locationTrigger');
    const locationModal = document.getElementById('locationModal');
    const closeLocationModal = document.getElementById('closeLocationModal');
    const useCurrentLocation = document.getElementById('useCurrentLocation');
    const currentLocationText = document.getElementById('currentLocationText');
    const addAddressBtn = document.getElementById('addAddressBtn');
    const addAddressModal = document.getElementById('addAddressModal');
    const closeAddAddressModal = document.getElementById('closeAddAddressModal');
    const addAddressForm = document.getElementById('addAddressForm');
    const savedAddressesList = document.getElementById('savedAddressesList');
    const noAddresses = document.getElementById('noAddresses');
    const locationText = document.getElementById('locationText');
    const addressSearch = document.getElementById('addressSearch');

    // Address storage
    let savedAddresses = JSON.parse(localStorage.getItem('savourlyAddresses')) || [];
    let selectedAddressLabel = 'Home';

    // Open location modal
    locationTrigger?.addEventListener('click', () => {
        locationModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        detectCurrentLocation();
        renderSavedAddresses();
    });

    // Close location modal
    closeLocationModal?.addEventListener('click', () => {
        locationModal.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close on overlay click
    locationModal?.addEventListener('click', (e) => {
        if (e.target === locationModal) {
            locationModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Detect current location
    function detectCurrentLocation() {
        if (navigator.geolocation) {
            currentLocationText.textContent = 'Detecting...';
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                        );
                        const data = await response.json();
                        const address = data.display_name || 'Location detected';
                        currentLocationText.textContent = address;
                        // Store for use
                        window.currentGPSAddress = {
                            full: address,
                            city: data.address.city || data.address.town || data.address.village || 'Unknown',
                            state: data.address.state || '',
                            pincode: data.address.postcode || ''
                        };
                    } catch (error) {
                        currentLocationText.textContent = 'Unable to detect location';
                    }
                },
                (error) => {
                    currentLocationText.textContent = 'Location access denied';
                }
            );
        } else {
            currentLocationText.textContent = 'Geolocation not supported';
        }
    }

    // Use current location - Open Complete Location Modal
    useCurrentLocation?.addEventListener('click', () => {
        if (window.currentGPSAddress) {
            // Show the detected address in the complete location modal
            const detectedText = document.getElementById('detectedAddressText');
            if (detectedText) {
                detectedText.textContent = window.currentGPSAddress.full;
            }
            // Open complete location modal
            const completeModal = document.getElementById('completeLocationModal');
            if (completeModal) {
                completeModal.classList.add('active');
            }
        } else {
            alert('Please wait for location to be detected...');
        }
    });

    // Close complete location modal
    const closeCompleteLocationModal = document.getElementById('closeCompleteLocationModal');
    closeCompleteLocationModal?.addEventListener('click', () => {
        const completeModal = document.getElementById('completeLocationModal');
        completeModal?.classList.remove('active');
    });

    // GPS Label button selection
    let gpsSelectedLabel = 'Home';
    document.getElementById('gpsLabelOptions')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.label-btn');
        if (btn) {
            document.querySelectorAll('#gpsLabelOptions .label-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gpsSelectedLabel = btn.dataset.label;
        }
    });

    // Complete Location Form Submit - Save GPS address
    const completeLocationForm = document.getElementById('completeLocationForm');
    completeLocationForm?.addEventListener('submit', (e) => {
        e.preventDefault();

        const doorNo = document.getElementById('gpsDoorNo').value;
        const landmark = document.getElementById('gpsLandmark').value;
        const phone = document.getElementById('gpsPhone').value;
        const gpsData = window.currentGPSAddress || {};

        const newAddress = {
            id: Date.now(),
            label: gpsSelectedLabel,
            doorNo: doorNo,
            line1: doorNo,
            line2: gpsData.city || 'Unknown',
            landmark: landmark,
            city: gpsData.city || 'Unknown',
            state: gpsData.state || 'Tamil Nadu',
            pincode: gpsData.pincode || '',
            phone: phone,
            fullGPS: gpsData.full || ''
        };

        savedAddresses.push(newAddress);
        localStorage.setItem('savourlyAddresses', JSON.stringify(savedAddresses));

        // Set as selected location
        const shortAddress = gpsSelectedLabel;
        locationText.textContent = shortAddress;
        localStorage.setItem('savourlySelectedLocation', JSON.stringify({
            type: 'saved',
            id: newAddress.id,
            display: gpsSelectedLabel,
            full: `${doorNo}, ${landmark ? landmark + ', ' : ''}${gpsData.city || 'Unknown'} - ${gpsData.pincode || ''}`
        }));

        // Reset form
        completeLocationForm.reset();
        document.querySelectorAll('#gpsLabelOptions .label-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('#gpsLabelOptions .label-btn[data-label="Home"]')?.classList.add('active');
        gpsSelectedLabel = 'Home';

        // Close all modals
        document.getElementById('completeLocationModal')?.classList.remove('active');
        locationModal.classList.remove('active');
        document.body.style.overflow = '';
        renderSavedAddresses();
    });

    // Open add address modal
    addAddressBtn?.addEventListener('click', () => {
        addAddressModal.classList.add('active');
        // Pre-fill city/state/pincode if GPS detected
        if (window.currentGPSAddress) {
            const cityInput = document.getElementById('addressCity');
            const stateInput = document.getElementById('addressState');
            const pincodeInput = document.getElementById('addressPincode');
            if (cityInput) cityInput.value = window.currentGPSAddress.city || '';
            if (stateInput && window.currentGPSAddress.state) stateInput.value = window.currentGPSAddress.state;
            if (pincodeInput && window.currentGPSAddress.pincode) pincodeInput.value = window.currentGPSAddress.pincode;
        }
    });

    // Close add address modal
    closeAddAddressModal?.addEventListener('click', () => {
        addAddressModal.classList.remove('active');
    });

    // Label button selection for custom address form
    document.querySelectorAll('#addAddressForm .label-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#addAddressForm .label-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedAddressLabel = btn.dataset.label;
        });
    });

    // Save new custom address
    addAddressForm?.addEventListener('submit', (e) => {
        e.preventDefault();

        const doorNo = document.getElementById('addressDoorNo')?.value || '';
        const line1 = document.getElementById('addressLine1').value;
        const line2 = document.getElementById('addressLine2').value;
        const city = document.getElementById('addressCity').value;
        const state = document.getElementById('addressState')?.value || 'Tamil Nadu';
        const pincode = document.getElementById('addressPincode').value;
        const phone = document.getElementById('addressPhone').value;
        const landmark = document.getElementById('addressLandmark')?.value || '';

        const newAddress = {
            id: Date.now(),
            label: selectedAddressLabel,
            doorNo: doorNo,
            line1: doorNo ? `${doorNo}, ${line1}` : line1,
            line2: line2,
            landmark: landmark,
            city: city,
            state: state,
            pincode: pincode,
            phone: phone
        };

        savedAddresses.push(newAddress);
        localStorage.setItem('savourlyAddresses', JSON.stringify(savedAddresses));

        // Set as selected location
        locationText.textContent = selectedAddressLabel;
        localStorage.setItem('savourlySelectedLocation', JSON.stringify({
            type: 'saved',
            id: newAddress.id,
            display: selectedAddressLabel,
            full: `${newAddress.line1}, ${line2}, ${city} - ${pincode}`
        }));

        // Reset form
        addAddressForm.reset();
        document.getElementById('addressState').value = 'Tamil Nadu';
        document.querySelectorAll('#addAddressForm .label-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('#addAddressForm .label-btn[data-label="Home"]')?.classList.add('active');
        selectedAddressLabel = 'Home';

        // Close all modals
        addAddressModal.classList.remove('active');
        locationModal.classList.remove('active');
        document.body.style.overflow = '';
        renderSavedAddresses();
    });


    // Render saved addresses
    function renderSavedAddresses() {
        if (!savedAddressesList) return;

        // Clear existing (except no-addresses div)
        const existingCards = savedAddressesList.querySelectorAll('.saved-address-card');
        existingCards.forEach(card => card.remove());

        if (savedAddresses.length === 0) {
            noAddresses.style.display = 'block';
            return;
        }

        noAddresses.style.display = 'none';

        savedAddresses.forEach(address => {
            const card = document.createElement('div');
            card.className = 'saved-address-card';
            const landmarkText = address.landmark ? `, ${address.landmark}` : '';
            card.innerHTML = `
                <div class="address-icon">${address.label === 'Home' ? '🏠' : address.label === 'Work' ? '💼' : '📍'}</div>
                <div class="address-details">
                    <div class="address-header">
                        <span class="address-label">${address.label}</span>
                    </div>
                    <div class="address-text">${address.line1}, ${address.line2}${landmarkText}, ${address.city} - ${address.pincode || ''}</div>
                    <div class="address-phone">Phone: ${address.phone}</div>

                    <div class="address-actions">
                        <button class="address-action-btn edit-btn" data-id="${address.id}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="6" cy="12" r="1"/><circle cx="18" cy="12" r="1"/></svg>
                        </button>
                        <button class="address-action-btn delete-btn" data-id="${address.id}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                    </div>
                </div>
            `;

            // Select address on click
            card.addEventListener('click', (e) => {
                if (e.target.closest('.address-action-btn')) return;

                const shortAddress = `${address.line2}, ${address.city}`;
                locationText.textContent = address.label;
                localStorage.setItem('savourlySelectedLocation', JSON.stringify({
                    type: 'saved',
                    id: address.id,
                    display: address.label,
                    full: `${address.line1}, ${address.line2}, ${address.city} - ${address.pincode}`
                }));
                locationModal.classList.remove('active');
                document.body.style.overflow = '';
            });

            // Delete button
            card.querySelector('.delete-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.currentTarget.dataset.id);
                savedAddresses = savedAddresses.filter(a => a.id !== id);
                localStorage.setItem('savourlyAddresses', JSON.stringify(savedAddresses));
                renderSavedAddresses();
            });

            savedAddressesList.appendChild(card);
        });
    }

    // Search addresses
    addressSearch?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const cards = savedAddressesList?.querySelectorAll('.saved-address-card');
        cards?.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(query) ? 'flex' : 'none';
        });
    });

    // Load saved location on page load
    const savedSelectedLocation = localStorage.getItem('savourlySelectedLocation');
    if (savedSelectedLocation && locationText) {
        const parsed = JSON.parse(savedSelectedLocation);
        locationText.textContent = parsed.display || 'Select Location';
    }

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
        if (cartCount) cartCount.textContent = count;
        if (mobileCartCount) mobileCartCount.textContent = count;
        if (mobileNavbarCartCount) mobileNavbarCartCount.textContent = count;

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
    mobileNavbarCartBtn?.addEventListener('click', openCart);
    cartClose?.addEventListener('click', closeCart);
    cartOverlay?.addEventListener('click', closeCart);

    // Checkout button - redirect to cart page
    checkoutBtn?.addEventListener('click', () => {
        if (cart.length > 0) {
            closeCart();
            window.location.href = 'cart.html';
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
            // Remove commas from price before parsing
            const price = parseInt(btn.dataset.price.replace(/,/g, ''));
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

    // ============================================
    const initMarquee = (containerSelector) => {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const isMobile = () => window.innerWidth <= 768;
        let isInitialized = false;
        let scrollTimeout = null;
        let isUserScrolling = false;

        const setup = () => {
            if (isMobile() && !isInitialized) {
                // Create marquee wrapper
                const marqueeContent = document.createElement('div');
                marqueeContent.className = 'marquee-content';

                // Move all children to wrapper
                const children = Array.from(container.children);
                children.forEach(child => marqueeContent.appendChild(child));

                // Clone children for seamless loop
                children.forEach(child => {
                    const clone = child.cloneNode(true);
                    marqueeContent.appendChild(clone);
                });

                container.appendChild(marqueeContent);
                isInitialized = true;
            } else if (!isMobile() && isInitialized) {
                // Cleanup for desktop
                const marqueeContent = container.querySelector('.marquee-content');
                if (marqueeContent) {
                    const originalCount = marqueeContent.children.length / 2;
                    const originalChildren = Array.from(marqueeContent.children).slice(0, originalCount);
                    originalChildren.forEach(child => container.appendChild(child));
                    marqueeContent.remove();
                }
                isInitialized = false;
            }
        };

        // Pause animation
        const pauseAnimation = () => {
            const marqueeContent = container.querySelector('.marquee-content');
            if (marqueeContent) {
                marqueeContent.style.animationPlayState = 'paused';
            }
        };

        // Resume animation
        const resumeAnimation = () => {
            const marqueeContent = container.querySelector('.marquee-content');
            if (marqueeContent && !isUserScrolling) {
                marqueeContent.style.animationPlayState = 'running';
            }
        };

        // Initial setup
        setup();

        // Handle resize with debounce
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(setup, 150);
        });

        // Pause on touch start
        container.addEventListener('touchstart', () => {
            isUserScrolling = true;
            pauseAnimation();
        }, { passive: true });

        // Resume after touch ends (with delay)
        container.addEventListener('touchend', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isUserScrolling = false;
                resumeAnimation();
            }, 3000); // Resume after 3 seconds of inactivity
        }, { passive: true });

        // Handle scroll events for manual scrolling
        container.addEventListener('scroll', () => {
            isUserScrolling = true;
            pauseAnimation();

            // Clear existing timeout
            clearTimeout(scrollTimeout);

            // Set new timeout to resume after scrolling stops
            scrollTimeout = setTimeout(() => {
                isUserScrolling = false;
                resumeAnimation();
            }, 3000); // Resume after 3 seconds of no scrolling
        }, { passive: true });
    };

    // Initialize marquees for features and gallery
    initMarquee('.features-grid');
    initMarquee('.gallery-grid');
});
