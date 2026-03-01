import Script from 'next/script';

export default function Home() {
    return (
        <>






            <nav className="navbar">
                <div className="nav-container">
                    <div className="logo-location">
                        <a href="#" className="logo"><img src="/assets/images/savourly-logo-new.png" alt="Savourly"
                            className="logo-img" /></a>
                    </div>
                    <ul className="nav-links" id="navLinks">
                        <li><a href="#home" className="nav-link active">Home</a></li>
                        <li><a href="#plans" className="nav-link">Meal Plans</a></li>
                        <li><a href="#about" className="nav-link">About Us</a></li>
                        <li><a href="/consultant" className="nav-link">Consultant</a></li>
                    </ul>
                    <div className="nav-actions">
                        <button className="cart-btn" id="cartBtn">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="9" cy="21" r="1" />
                                <circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                            </svg>
                            <span className="cart-count" id="cartCount">0</span>
                        </button>
                        <div id="desktopAuthBtn">
                            <a href="/login" className="btn btn-outline">Login</a>
                        </div>
                    </div>
                </div>
            </nav>

            <section className="hero" id="home">
                <div className="hero-bg-shapes">
                    {/* Fork/Spoon */}
                    <div className="shape shape-1">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
                        </svg>
                    </div>
                    {/* Broccoli/Veggie */}
                    <div className="shape shape-2">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M12 2C9.24 2 7 4.24 7 7c0 1.1.36 2.14 1 3H6c-2.21 0-4 1.79-4 4s1.79 4 4 4h1v4h10v-4h1c2.21 0 4-1.79 4-4s-1.79-4-4-4h-2c.64-.86 1-1.9 1-3 0-2.76-2.24-5-5-5z" />
                        </svg>
                    </div>
                    {/* Leaf */}
                    <div className="shape shape-3">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.71c.48.17.98.3 1.34.3 3.41 0 5.7-1.69 7.5-3.59 1.8 1.9 4.09 3.59 7.5 3.59.36 0 .86-.13 1.34-.3l.95 2.71 1.89-.66C24.1 16.17 21.9 10 13 8V3h-2v5h6z" />
                        </svg>
                    </div>
                    {/* Carrot */}
                    <div className="shape shape-4">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M16.18 19.6l-3.57-3.57c-.57.97-1.3 1.88-2.19 2.67l-3.6-3.6c.79-.89 1.7-1.62 2.67-2.19L5.92 9.34 4.51 10.75 3.1 9.34l4.24-4.24 1.41 1.41-1.41 1.41 3.57 3.57c.57-.97 1.3-1.88 2.19-2.67l3.6 3.6c-.79.89-1.7 1.62-2.67 2.19l3.57 3.57 1.41-1.41 1.42 1.41-4.24 4.24-1.42-1.41 1.41-1.41z" />
                        </svg>
                    </div>
                    {/* Avocado */}
                    <div className="shape shape-5">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M12 2C8.5 2 5 5.5 5 9.5c0 3.5 2 7 5.5 9.5C8.5 21 7 22 7 22s5 0 5-3c0 3 5 3 5 3s-1.5-1-3.5-3c3.5-2.5 5.5-6 5.5-9.5C19 5.5 15.5 2 12 2zm0 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                        </svg>
                    </div>
                </div>
                <div className="container hero-container">
                    <div className="hero-content">
                        <span className="hero-badge"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg> #1 Rated Fitness Meal Service</span>
                        <h1 className="hero-title">Eat Smart,<br /><span className="gradient-text">Live Better</span></h1>
                        <p className="hero-description">Chef-crafted, nutritionist-approved meals designed to fuel your fitness
                            journey. Fresh ingredients, perfect macros, delivered daily.</p>

                        <div className="hero-price-box">
                            <div className="price-tag-wrapper">
                                <span className="price-starts">Starting at just</span>
                                <div className="price-main">
                                    <span className="rupee-symbol">₹</span>
                                    <span className="price-big">129</span>
                                    <span className="price-per">/meal</span>
                                </div>
                            </div>
                            <div className="price-features">
                                <div className="price-feature"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg> Fresh Daily</div>
                                <div className="price-feature"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg> Free Delivery</div>
                                <div className="price-feature"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg> Cancel Anytime</div>
                            </div>
                        </div>

                        <div className="hero-cta">
                            <a href="#plans" className="btn btn-primary btn-lg"><span>Explore Plans</span><svg width="20"
                                height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg></a>
                            <a href="#" className="btn btn-outline btn-lg"><svg width="20" height="20" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg><span>Watch Video</span></a>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="hero-image-container">
                            <div className="hero-image-wrapper"><img
                                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop"
                                alt="Healthy salad bowl" className="hero-image" /></div>
                            <div className="floating-card card-1"><img src="/assets/images/protein-icon.png" alt="Protein"
                                className="card-icon-img" />
                                <div className="card-content"><span className="card-title">Protein</span><span
                                    className="card-value">35g</span></div>
                            </div>
                            <div className="floating-card card-2"><img src="/assets/images/kcal-icon.png" alt="Calories"
                                className="card-icon-img" />
                                <div className="card-content"><span className="card-title">Calories</span><span
                                    className="card-value">415</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="plans" id="plans">
                <div className="container">
                    <div className="section-header">
                        <span className="section-badge">Our Plans</span>
                        <h2 className="section-title">Choose Your <span className="gradient-text">Perfect Plan</span></h2>
                        <p className="section-description">Whether you're looking to lose weight, build muscle, or maintain a
                            healthy lifestyle, we have the perfect plan.</p>
                    </div>
                    <div className="plans-grid" id="plansGrid">
                        <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                            Loading plans...
                        </div>
                    </div>
                </div>
            </section>



            <section className="features" id="features">
                <div className="container">
                    <div className="section-header">
                        <span className="section-badge">Why Choose Us</span>
                        <h2 className="section-title">The <span className="gradient-text">Savourly</span> Difference</h2>
                    </div>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-card-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="M9 12l2 2 4-4" />
                            </svg></div>
                            <h3 className="feature-card-title">Fresh Ingredients</h3>
                            <p className="feature-card-description">Locally sourced, organic ingredients prepared daily.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-card-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg></div>
                            <h3 className="feature-card-title">Quick Prep</h3>
                            <p className="feature-card-description">Heat and eat in under 3 minutes.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-card-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2">
                                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                <path d="M4 22h16" />
                                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                            </svg></div>
                            <h3 className="feature-card-title">Expert Nutrition</h3>
                            <p className="feature-card-description">Meals designed by certified nutritionists.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-card-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="3" width="15" height="13" />
                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                <circle cx="5.5" cy="18.5" r="2.5" />
                                <circle cx="18.5" cy="18.5" r="2.5" />
                            </svg></div>
                            <h3 className="feature-card-title">Free Delivery</h3>
                            <p className="feature-card-description">Fresh delivery straight to your door.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-card-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg></div>
                            <h3 className="feature-card-title">Expert Support</h3>
                            <p className="feature-card-description">Access to nutritionists and fitness experts.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-card-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="20" x2="18" y2="10" />
                                <line x1="12" y1="20" x2="12" y2="4" />
                                <line x1="6" y1="20" x2="6" y2="14" />
                            </svg></div>
                            <h3 className="feature-card-title">Track Progress</h3>
                            <p className="feature-card-description">Monitor your nutrition with our dashboard.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="gallery">
                <div className="container">
                    <div className="section-header">
                        <span className="section-badge">Our Menu</span>
                        <h2 className="section-title">Delicious <span className="gradient-text">Healthy Meals</span></h2>
                    </div>
                    <div className="gallery-grid">
                        <div className="gallery-item"><img
                            src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop"
                            alt="Colorful salad" />
                            <div className="gallery-overlay">
                                <h4>Rainbow Bowl</h4>
                                <p>420 cal • 35g protein</p>
                            </div>
                        </div>
                        <div className="gallery-item"><img
                            src="https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop"
                            alt="Grilled salmon" />
                            <div className="gallery-overlay">
                                <h4>Grilled Salmon</h4>
                                <p>380 cal • 42g protein</p>
                            </div>
                        </div>
                        <div className="gallery-item"><img
                            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=400&fit=crop"
                            alt="Breakfast bowl" />
                            <div className="gallery-overlay">
                                <h4>Power Breakfast</h4>
                                <p>350 cal • 28g protein</p>
                            </div>
                        </div>
                        <div className="gallery-item"><img
                            src="https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=400&fit=crop"
                            alt="Chicken bowl" />
                            <div className="gallery-overlay">
                                <h4>Chicken Teriyaki</h4>
                                <p>520 cal • 48g protein</p>
                            </div>
                        </div>
                        <div className="gallery-item"><img
                            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop"
                            alt="Fresh salad" />
                            <div className="gallery-overlay">
                                <h4>Garden Fresh</h4>
                                <p>290 cal • 18g protein</p>
                            </div>
                        </div>
                        <div className="gallery-item"><img
                            src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=400&fit=crop"
                            alt="Veggie plate" />
                            <div className="gallery-overlay">
                                <h4>Veggie Delight</h4>
                                <p>310 cal • 22g protein</p>
                            </div>
                        </div>
                        <div className="gallery-item"><img
                            src="https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop"
                            alt="Fruit bowl" />
                            <div className="gallery-overlay">
                                <h4>Berry Bliss</h4>
                                <p>240 cal • 8g protein</p>
                            </div>
                        </div>
                        <div className="gallery-item"><img
                            src="https://images.unsplash.com/photo-1482049016gy6-cd7f1c0c4a25?w=400&h=400&fit=crop"
                            alt="Buddha bowl" />
                            <div className="gallery-overlay">
                                <h4>Buddha Bowl</h4>
                                <p>450 cal • 32g protein</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="testimonials" id="testimonials">
                <div className="container">
                    <div className="section-header">
                        <span className="section-badge">Testimonials</span>
                        <h2 className="section-title">What Our <span className="gradient-text">Customers Say</span></h2>
                    </div>
                    <div className="testimonials-grid">
                        <div className="testimonial-card">
                            <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
                            <p className="testimonial-text">"Savourly completely changed my relationship with food. I've lost 15 lbs
                                in 2 months!"</p>
                            <div className="testimonial-author"><img
                                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop"
                                alt="Sarah M." className="author-image" />
                                <div className="author-info"><span className="author-name">Sarah Mitchell</span><span
                                    className="author-role">Fitness Enthusiast</span></div>
                            </div>
                        </div>
                        <div className="testimonial-card">
                            <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
                            <p className="testimonial-text">"Restaurant-quality meals that fit my macros perfectly. Game changer!"
                            </p>
                            <div className="testimonial-author"><img
                                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop"
                                alt="James K." className="author-image" />
                                <div className="author-info"><span className="author-name">James Kim</span><span
                                    className="author-role">Software Engineer</span></div>
                            </div>
                        </div>
                        <div className="testimonial-card">
                            <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
                            <p className="testimonial-text">"The Platinum Plan helped me achieve my competition goals. Highly
                                recommend!"</p>
                            <div className="testimonial-author"><img
                                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop"
                                alt="Emma L." className="author-image" />
                                <div className="author-info"><span className="author-name">Emma Lopez</span><span
                                    className="author-role">Athlete</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Us Section */}
            <section className="about" id="about">
                <div className="container">
                    <div className="about-grid">
                        <div className="about-content">
                            <span className="section-badge">About Us</span>
                            <h2 className="section-title">Passion for <span className="gradient-text">Healthy Living</span></h2>
                            <p className="about-text">At Savourly, we believe that healthy eating shouldn't mean compromising on
                                taste. Our team of expert chefs and certified nutritionists work together to create meals that
                                are both delicious and perfectly balanced for your fitness goals.</p>
                            <p className="about-text">Founded in 2023, we've helped thousands of people transform their eating
                                habits with our premium meal plans. Every meal is prepared fresh daily using locally-sourced,
                                organic ingredients.</p>

                        </div>
                        <div className="about-image">
                            <img src="/assets/images/power-protein-meal.jpg" alt="Power Protein Meal" />
                        </div>
                    </div>
                </div>
            </section>

            <section className="cta">
                <div className="container">
                    <div className="cta-content">
                        <h2 className="cta-title">Ready to Transform Your Nutrition?</h2>
                        <p className="cta-description">Start your fitness journey with Savourly today and taste the difference!</p>
                        <a href="#plans" className="btn btn-white btn-lg"><span>Start Your Plan</span><svg width="20" height="20"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg></a>
                        <p className="cta-note">No commitment • Cancel anytime • Free first delivery</p>
                    </div>
                </div>
            </section>

            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand"><a href="#" className="logo"><span className="logo-icon"></span><span
                            className="logo-text">Savourly</span></a>
                            <p className="footer-tagline">Transforming lives through nutrition since 2020.</p>
                        </div>
                        <div className="footer-links">
                            <h4 className="footer-title">Quick Links</h4>
                            <ul className="footer-menu">
                                <li><a href="#plans">Meal Plans</a></li>
                                <li><a href="#features">Features</a></li>
                                <li><a href="#testimonials">Reviews</a></li>
                            </ul>
                        </div>
                        <div className="footer-links">
                            <h4 className="footer-title">Support</h4>
                            <ul className="footer-menu">
                                <li><a href="#">FAQ</a></li>
                                <li><a href="#">Shipping</a></li>
                                <li><a href="#">Contact</a></li>
                            </ul>
                        </div>
                        <div className="footer-links">
                            <h4 className="footer-title">Legal</h4>
                            <ul className="footer-menu">
                                <li><a href="#">Privacy Policy</a></li>
                                <li><a href="#">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p className="copyright">© 2026 Savourly. All rights reserved. Made with ❤️</p>
                    </div>
                </div>
            </footer>

            {/* Cart Sidebar */}
            <div className="cart-overlay" id="cartOverlay"></div>
            <div className="cart-sidebar" id="cartSidebar">
                <div className="cart-header">
                    <h3>Your Cart</h3>
                    <button className="cart-close" id="cartClose">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <div className="cart-items" id="cartItems">
                    <div className="cart-empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                        <p>Your cart is empty</p>
                        <a href="#plans" className="btn btn-primary" id="browseBtn">Browse Plans</a>
                    </div>
                </div>
                <div className="cart-footer" id="cartFooter" style={{ display: "none" }}>
                    <div className="cart-total">
                        <span>Total</span>
                        <span className="total-amount" id="totalAmount">₹0</span>
                    </div>
                    <button className="btn btn-primary btn-block checkout-btn" id="checkoutBtn">Proceed to Checkout</button>
                </div>
            </div>

            {/* Location Modal */}
            <div className="location-modal-overlay" id="locationModal">
                <div className="location-modal">
                    <div className="location-modal-header">
                        <button className="location-modal-close" id="closeLocationModal">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h2>Select a location</h2>
                    </div>

                    <div className="location-modal-search">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input type="text" placeholder="Search for area, street name..." id="addressSearch" />
                    </div>

                    <div className="location-modal-content">
                        {/* Use Current Location */}
                        <div className="location-option current-location" id="useCurrentLocation">
                            <div className="option-icon gps">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                                </svg>
                            </div>
                            <div className="option-text">
                                <strong>Use current location</strong>
                                <span id="currentLocationText">Detecting...</span>
                            </div>
                            <svg className="option-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </div>

                        {/* Add Custom Address */}
                        <div className="location-option add-address" id="addAddressBtn">
                            <div className="option-icon add">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    strokeWidth="2">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                            </div>
                            <div className="option-text">
                                <strong>Add Custom Address</strong>
                                <span>Enter complete address manually</span>
                            </div>
                            <svg className="option-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </div>

                        {/* Saved Addresses Section */}
                        <div className="saved-addresses-section">
                            <h3>SAVED ADDRESSES</h3>
                            <div className="saved-addresses-list" id="savedAddressesList">
                                {/* Addresses will be populated by JavaScript */}
                                <div className="no-addresses" id="noAddresses">
                                    <p>No saved addresses yet. Add your first address!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Complete Current Location Modal (Door/Landmark) */}
            <div className="add-address-modal-overlay" id="completeLocationModal">
                <div className="add-address-modal">
                    <div className="location-modal-header">
                        <button className="location-modal-close" id="closeCompleteLocationModal">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h2>Complete your address</h2>
                    </div>

                    <div className="detected-address-box">
                        <div className="detected-icon">📍</div>
                        <div className="detected-text">
                            <strong>Detected Location</strong>
                            <span id="detectedAddressText">Loading...</span>
                        </div>
                    </div>

                    <form className="add-address-form" id="completeLocationForm">
                        <div className="form-group">
                            <label>Address Label</label>
                            <div className="label-options" id="gpsLabelOptions">
                                <button type="button" className="label-btn active" data-label="Home">🏠 Home</button>
                                <button type="button" className="label-btn" data-label="Work">💼 Work</button>
                                <button type="button" className="label-btn" data-label="Other">📍 Other</button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="gpsDoorNo">Door No. / Flat No. *</label>
                            <input type="text" id="gpsDoorNo" placeholder="E.g., 12A, Flat 302, Building B" required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="gpsLandmark">Landmark (Optional)</label>
                            <input type="text" id="gpsLandmark" placeholder="E.g., Near Metro Station, Opposite Park" />
                        </div>

                        <div className="form-group">
                            <label htmlFor="gpsPhone">Phone Number *</label>
                            <input type="tel" id="gpsPhone" placeholder="+91 XXXXX XXXXX" required />
                        </div>

                        <button type="submit" className="save-address-btn">Save & Use This Address</button>
                    </form>
                </div>
            </div>

            {/* Add Custom Address Modal */}
            <div className="add-address-modal-overlay" id="addAddressModal">
                <div className="add-address-modal">
                    <div className="location-modal-header">
                        <button className="location-modal-close" id="closeAddAddressModal">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h2>Add New Address</h2>
                    </div>

                    <form className="add-address-form" id="addAddressForm">
                        <div className="form-group">
                            <label>Address Label</label>
                            <div className="label-options">
                                <button type="button" className="label-btn active" data-label="Home">🏠 Home</button>
                                <button type="button" className="label-btn" data-label="Work">💼 Work</button>
                                <button type="button" className="label-btn" data-label="Other">📍 Other</button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="addressDoorNo">Door No. / Flat / Apartment *</label>
                            <input type="text" id="addressDoorNo" placeholder="E.g., 12A, Flat 302, Tower B" required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="addressLine1">Building / Street Name *</label>
                            <input type="text" id="addressLine1" placeholder="Building name, Street" required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="addressLine2">Area / Locality *</label>
                            <input type="text" id="addressLine2" placeholder="Area, Locality" required />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="addressCity">City *</label>
                                <input type="text" id="addressCity" placeholder="City" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="addressState">State *</label>
                                <input type="text" id="addressState" placeholder="State" defaultValue="Tamil Nadu" required />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="addressPincode">Pincode *</label>
                                <input type="text" id="addressPincode" placeholder="Pincode" required maxLength={6} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="addressPhone">Phone Number *</label>
                                <input type="tel" id="addressPhone" placeholder="+91 XXXXX XXXXX" required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="addressLandmark">Landmark (Optional)</label>
                            <input type="text" id="addressLandmark" placeholder="E.g., Near Metro Station" />
                        </div>

                        <button type="submit" className="save-address-btn">Save Address</button>
                    </form>
                </div>
            </div>
            {/* Payment Method Modal */}
            <div className="payment-modal-overlay" id="paymentModal">
                <div className="payment-modal">
                    <div className="location-modal-header">
                        <button className="location-modal-close" id="closePaymentModal">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h2>Select Payment Method</h2>
                    </div>

                    <div className="payment-options">
                        <button className="payment-option-btn" id="payOnlineBtn">
                            <div className="option-icon">💳</div>
                            <div className="option-details">
                                <strong>Pay Online</strong>
                                <span>Credit/Debit Card, UPI, NetBanking</span>
                            </div>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </button>

                        <button className="payment-option-btn" id="codBtn">
                            <div className="option-icon">💵</div>
                            <div className="option-details">
                                <strong>Cash on Delivery</strong>
                                <span>Pay when you receive your meal</span>
                            </div>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>


            {/* Supabase SDK & Config */}
            <Script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></Script>
            <Script id="supabase-init" strategy="beforeInteractive">
                {`
                    window.SUPABASE_URL = "${process.env.NEXT_PUBLIC_SUPABASE_URL}";
                    window.SUPABASE_KEY = "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}";
                `}
            </Script>

            {/* Core Logic */}
            <Script src="/assets/js/supabase-client.js"></Script>
            <Script src="/assets/js/script.js"></Script>

            {/* Razorpay SDK */}
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            <Script id="razorpay-init" strategy="lazyOnload">
                {`window.RAZORPAY_KEY_ID = "${process.env.RAZORPAY_KEY_ID || ''}";`}
            </Script>

        </>
    );
}
