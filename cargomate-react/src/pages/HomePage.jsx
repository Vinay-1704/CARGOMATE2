import React, { useEffect, useRef } from 'react';
import '../styles/index.css';


function HomePage() {
  const headerRef = useRef(null);
  const heroContentRef = useRef(null);

  useEffect(() => {
    console.log('🚛 CargoMate Landing Page Loaded');

    // Header scroll effect
    const handleScroll = () => {
      if (headerRef.current) {
        if (window.scrollY > 100) {
          headerRef.current.classList.add('scrolled');
        } else {
          headerRef.current.classList.remove('scrolled');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Initialize hero animations
    if (heroContentRef.current) {
      const elements = Array.from(heroContentRef.current.children);
      elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
          element.style.transition = 'all 0.6s ease';
          element.style.opacity = '1';
          element.style.transform = 'translateY(0)';
        }, index * 200);
      });
    }

    console.log('🚛 CargoMate Landing Page Ready');

    // Cleanup scroll listener on unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      {/* Header */}
      <header className="header" id="header" ref={headerRef}>
        <div className="logo">
          <i className="fas fa-truck"></i>
          CargoMate
        </div>
        <a href="/contact" className="contact-btn">Contact Us</a>
      </header>

      {/* Hero Section */}
      <main className="hero">
        <div className="hero-content" ref={heroContentRef}>
          <h1>
            The #1 Connection &<br />
            Service Partner<br />
            for <span className="highlight">Smart Transportation Networks</span>
          </h1>
          <p>
            Unlock better transportation rates and take control of your fleet's 
            connectivity and logistics operations with our comprehensive platform.
          </p>
          <a href="/login" className="cta-button">GET STARTED</a>
        </div>
      </main>

      {/* Partners Section */}
      <section className="partners-section">
        <div className="partners-container">
          <h3 className="partners-title">PARTNERED WITH INDUSTRY LEADERS</h3>
          <div className="partners-grid">
            <div className="partner-item">
              <i className="fas fa-shipping-fast"></i>
              <span>LogiTrans</span>
            </div>
            <div className="partner-item">
              <i className="fas fa-truck-moving"></i>
              <span>SwiftMove</span>
            </div>
            <div className="partner-item">
              <i className="fas fa-route"></i>
              <span>RouteMax</span>
            </div>
            <div className="partner-item">
              <i className="fas fa-warehouse"></i>
              <span>CargoHub</span>
            </div>
            <div className="partner-item">
              <i className="fas fa-ship"></i>
              <span>NaviFleet</span>
            </div>
            <div className="partner-item">
              <i className="fas fa-box"></i>
              <span>PackageLink</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default HomePage;
