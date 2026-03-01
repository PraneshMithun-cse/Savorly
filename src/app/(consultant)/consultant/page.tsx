'use client';
import Script from 'next/script';

export default function ConsultantPage() {
  return (
    <>






    {/* Header */}
    <header className="header">
        <div className="container">
            <a href="/" className="logo">
                <img src="/assets/images/savourly-logo-new.png" alt="Savourly" />
            </a>
            <a href="/" className="back-btn">← Back to Home</a>
        </div>
    </header>

    {/* Hero Section */}
    <section className="hero">
        <div className="container">
            <div className="hero-layout">
                <div className="hero-text">
                    <span className="badge">🏆 #1 Rated Nutritionist</span>
                    <h1>Transform Your Body in <span className="highlight">120 Days</span></h1>
                    <p>Get personalized nutrition guidance from India's top certified nutritionist. Join thousands
                        who've achieved their dream physique.</p>

                    <div className="stats-row">
                        <div className="stat">
                            <strong>15K+</strong>
                            <span>Lives Transformed</span>
                        </div>
                        <div className="stat">
                            <strong>98%</strong>
                            <span>Success Rate</span>
                        </div>
                        <div className="stat">
                            <strong>12+</strong>
                            <span>Years Experience</span>
                        </div>
                    </div>

                    <a href="#programs" className="cta-btn">View Programs →</a>
                </div>

                <div className="hero-card">
                    <img src="/assets/images/dr-rajan-sharma.png" alt="Dr. Rajan Sharma" className="doctor-img" />
                    <div className="doctor-details">
                        <h3>Dr. Rajan Sharma</h3>
                        <p>M.D. Nutrition & Dietetics</p>
                        <div className="tags">
                            <span>ICMR Certified</span>
                            <span>IDA Member</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    {/* Programs Section */}
    <section className="programs" id="programs">
        <div className="container">
            <div className="section-header">
                <span className="badge">Choose Your Journey</span>
                <h2>Transformation Programs</h2>
                <p>Select the program that fits your goals</p>
            </div>

            <div className="programs-row">
                {/* 90 Days */}
                <div className="program-card">
                    <div className="program-badge">Popular</div>
                    <div className="program-days">
                        <strong>90</strong>
                        <span>DAYS</span>
                    </div>
                    <h3>Quick Transform</h3>
                    <p className="tagline">Visible results in 3 months</p>
                    <div className="price">
                        <span className="currency">₹</span>
                        <span className="amount">4,999</span>
                    </div>
                    <ul className="features">
                        <li>✓ 6 Personal Zoom Sessions</li>
                        <li>✓ Custom Diet Plan</li>
                        <li>✓ Weekly Progress Tracking</li>
                        <li>✓ WhatsApp Support</li>
                        <li>✓ Recipe Library Access</li>
                    </ul>
                    <button className="book-btn" onClick={() => window.bookProgram('90-day')}>Book Consultation →</button>
                </div>

                {/* 120 Days */}
                <div className="program-card featured">
                    <div className="program-badge best">Best Value</div>
                    <div className="program-days">
                        <strong>120</strong>
                        <span>DAYS</span>
                    </div>
                    <h3>Complete Transform</h3>
                    <p className="tagline">Full body & lifestyle change</p>
                    <div className="price">
                        <span className="currency">₹</span>
                        <span className="amount">7,499</span>
                        <span className="savings">Save ₹2,500</span>
                    </div>
                    <ul className="features">
                        <li>✓ 12 Personal Zoom Sessions</li>
                        <li>✓ Premium Custom Diet Plan</li>
                        <li>✓ Daily Progress Tracking</li>
                        <li>✓ Priority WhatsApp Support</li>
                        <li>✓ Full Recipe Library + Meal Prep</li>
                        <li>✓ Workout Guidance</li>
                        <li>✓ 30-Day Free Extension</li>
                    </ul>
                    <button className="book-btn primary" onClick={() => window.bookProgram('120-day')}>Book Consultation →</button>
                </div>
            </div>
        </div>
    </section>

    {/* How It Works */}
    <section className="how-it-works">
        <div className="container">
            <div className="section-header">
                <h2>How Zoom Sessions Work</h2>
            </div>
            <div className="steps-row">
                <div className="step">
                    <div className="step-num">1</div>
                    <div className="step-icon">📅</div>
                    <h4>Book Your Slot</h4>
                    <p>Choose a convenient time</p>
                </div>
                <div className="step">
                    <div className="step-num">2</div>
                    <div className="step-icon">📹</div>
                    <h4>Join Zoom Call</h4>
                    <p>Connect with Dr. Rajan</p>
                </div>
                <div className="step">
                    <div className="step-num">3</div>
                    <div className="step-icon">📋</div>
                    <h4>Get Your Plan</h4>
                    <p>Personalized diet & workout</p>
                </div>
                <div className="step">
                    <div className="step-num">4</div>
                    <div className="step-icon">💪</div>
                    <h4>Transform</h4>
                    <p>Follow & see results</p>
                </div>
            </div>
        </div>
    </section>

    {/* Testimonials */}
    <section className="testimonials">
        <div className="container">
            <div className="section-header">
                <h2>Success Stories</h2>
            </div>
            <div className="testimonials-row">
                <div className="testimonial">
                    <div className="stars">⭐⭐⭐⭐⭐</div>
                    <p>"Lost 18kg in 90 days! Dr. Rajan's personalized approach made all the difference."</p>
                    <div className="author">
                        <div className="avatar">AK</div>
                        <div>
                            <strong>Amit Kumar</strong>
                            <span>Lost 18kg in 90 days</span>
                        </div>
                    </div>
                </div>
                <div className="testimonial">
                    <div className="stars">⭐⭐⭐⭐⭐</div>
                    <p>"Best investment for my health. The 120-day program completely transformed my life."</p>
                    <div className="author">
                        <div className="avatar">PS</div>
                        <div>
                            <strong>Priya Singh</strong>
                            <span>Lost 25kg in 120 days</span>
                        </div>
                    </div>
                </div>
                <div className="testimonial">
                    <div className="stars">⭐⭐⭐⭐⭐</div>
                    <p>"Flexible Zoom timings and WhatsApp support were perfect. Gained 8kg muscle mass."</p>
                    <div className="author">
                        <div className="avatar">RV</div>
                        <div>
                            <strong>Rahul Verma</strong>
                            <span>Gained 8kg muscle</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    {/* CTA */}
    <section className="cta">
        <div className="container">
            <h2>Ready to Start Your Transformation?</h2>
            <p>Book your free 15-minute discovery call today</p>
            <a href="#programs" className="cta-btn white">Book Free Call →</a>
            <div className="guarantee">🛡️ 100% Money-Back Guarantee</div>
        </div>
    </section>

    {/* Footer */}
    <footer className="footer">
        <p>© 2024 Savourly. All rights reserved.</p>
    </footer>

    {/* Modal */}
    <div className="modal-overlay" id="bookingModal">
        <div className="modal">
            <button className="modal-close" onClick={() => window.closeModal()}>×</button>
            <h2>📹 Book Your Consultation</h2>
            <p id="modalProgramName">90-Day Quick Transform Program</p>
            <form id="bookingForm">
                <label>Full Name</label>
                <input type="text" id="userName" placeholder="Enter your name" required />

                <label>Email Address</label>
                <input type="email" id="userEmail" placeholder="Enter your email" required />

                <label>Phone Number</label>
                <input type="tel" id="userPhone" placeholder="Enter your phone" required />

                <label>Preferred Time</label>
                <select id="preferredTime" required>
                    <option value="">Select time slot</option>
                    <option value="morning">Morning (9 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                    <option value="evening">Evening (4 PM - 8 PM)</option>
                </select>

                <button type="submit" className="submit-btn">Confirm Booking ✓</button>
            </form>
        </div>
    </div>

    



    <Script src="/assets/js/consultant-logic.js" strategy="lazyOnload" />
    </>
  );
}
