import React from 'react';
import '../styles/driver-support.css';

function DriverSupport() {
  const handleCallNow = () => {
    window.location.href = 'tel:+919876543210';
  };

  const handleSendEmail = () => {
    window.location.href = 'mailto:driver@cargomate.com';
  };

  const handleStartChat = () => {
    alert('Live chat will open between 6 AM - 10 PM');
  };

  return (
    <div className="driver-support-container">
      <div className="support-header">
        <h1>
          <i className="fas fa-headset"></i> Support
        </h1>
        <p>Get help and contact our support team</p>
      </div>

      <div className="support-cards-grid">
        {/* Emergency Support */}
        <div className="support-card emergency">
          <div className="support-icon">
            <i className="fas fa-phone"></i>
          </div>
          <h2>Emergency Support</h2>
          <p className="support-subtitle">24/7 emergency assistance</p>
          <p className="support-detail">+91 98765 43210</p>
          <button className="support-btn green" onClick={handleCallNow}>
            Call Now
          </button>
        </div>

        {/* Email Support */}
        <div className="support-card">
          <div className="support-icon email">
            <i className="fas fa-envelope"></i>
          </div>
          <h2>Email Support</h2>
          <p className="support-subtitle">General inquiries and support</p>
          <p className="support-detail">driver@cargomate.com</p>
          <button className="support-btn" onClick={handleSendEmail}>
            Send Email
          </button>
        </div>

        {/* Live Chat */}
        <div className="support-card">
          <div className="support-icon chat">
            <i className="fas fa-comments"></i>
          </div>
          <h2>Live Chat</h2>
          <p className="support-subtitle">Instant help from our team</p>
          <p className="support-detail">Available 6 AM - 10 PM</p>
          <button className="support-btn green" onClick={handleStartChat}>
            Start Chat
          </button>
        </div>
      </div>
    </div>
  );
}

export default DriverSupport;
