import React from 'react';
import '../styles/support.css';

function Support() {
  const handleCallNow = () => {
    window.location.href = 'tel:+917981466577';
  };

  const handleSendEmail = () => {
    window.location.href = 'mailto:support@cargomate.com';
  };

  const handleStartChat = () => {
    alert('Live chat feature coming soon!');
  };

  return (
    <div className="support-container">
      <div className="support-header">
        <h1>
          <i className="fas fa-headset"></i> Support
        </h1>
        <p>Get help and contact our support team</p>
      </div>

      <div className="support-cards">
        {/* Call Support */}
        <div className="support-card">
          <div className="support-icon phone">
            <i className="fas fa-phone"></i>
          </div>
          <h2>Call Support</h2>
          <p className="support-detail">+91 7981466577</p>
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
          <p className="support-detail">support@cargomate.com</p>
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
          <p className="support-detail">Available 24/7</p>
          <button className="support-btn green" onClick={handleStartChat}>
            Start Chat
          </button>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <h2>
          <i className="fas fa-question-circle"></i> Frequently Asked Questions
        </h2>

        <div className="faq-list">
          <div className="faq-item">
            <h3>How do I create a new shipment?</h3>
            <p>Navigate to "Create Shipment" in the sidebar, fill in the details, and submit your request.</p>
          </div>

          <div className="faq-item">
            <h3>How can I track my shipment?</h3>
            <p>Go to "My Shipments" and click on the tracking icon next to your shipment to see real-time updates.</p>
          </div>

          <div className="faq-item">
            <h3>What payment methods do you accept?</h3>
            <p>We accept all major credit cards, debit cards, and online payment methods.</p>
          </div>

          <div className="faq-item">
            <h3>How do I contact a driver?</h3>
            <p>Use the chat feature available in your active shipments to communicate directly with your driver.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Support;
