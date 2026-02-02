import React, { useState, useEffect, useRef } from 'react';
import '../styles/tracking-modal.css';

function TrackingModal({ shipment, driver, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      shipment_id: shipment.shipment_id,
      sender_role: 'driver',
      message: 'Hello! Thank you for choosing our service. I\'ll take good care of your package.',
      timestamp: new Date().toISOString()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  // Add this inside TrackingModal component
useEffect(() => {
  if (!shipment?.shipment_id) return;

  // Load messages initially
  loadMessages();

  // Auto-refresh every 3 seconds
  const interval = setInterval(() => {
    loadMessages();
  }, 3000);

  // Cleanup on unmount
  return () => clearInterval(interval);
}, [shipment?.shipment_id]);

// Add this function
const loadMessages = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(
      `http://localhost:3000/api/messages/${shipment.shipment_id}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (response.ok) {
      const data = await response.json();
      setMessages(data.messages || []);
    }
  } catch (error) {
    console.error('Error loading messages:', error);
  }
};


  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      
      // Send to backend
      const response = await fetch(
        `http://localhost:3000/api/messages/${shipment.shipment_id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: messageText.trim(),
            sender_role: 'shipper'
          })
        }
      );

      if (response.ok) {
        // ✅ ADD to local state immediately (don't wait for backend)
        const newMsg = {
          id: Date.now(),
          shipment_id: shipment.shipment_id,
          sender_role: 'shipper',
          message: messageText.trim(),
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        console.log('✅ Message added locally');
      }
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tracking-modal-overlay" onClick={onClose}>
      <div className="tracking-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="tracking-modal-header">
          <h2>💬 Chat with Driver</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="tracking-container">
          {/* Left: Info */}
          <div className="tracking-section">
            <h3> Trip Details</h3>
            <div className="shipment-info">
              <div className="info-row">
                <span className="label">ID:</span>
                <span className="value">{shipment.shipment_id}</span>
              </div>
              <div className="info-row">
                <span className="label">From:</span>
                <span className="value">{shipment.from_location}</span>
              </div>
              <div className="info-row">
                <span className="label">To:</span>
                <span className="value">{shipment.to_location}</span>
              </div>
              <div className="info-row">
                <span className="label">Driver:</span>
                <span className="value">{driver?.name || 'Assigned'}</span>
              </div>
              <div className="info-row">
                <span className="label">Status:</span>
                <span className={`status-badge ${shipment.status}`}>
                  {shipment.status?.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="live-map">
              <div className="map-icon">🗺️</div>
              <p>Live Map</p>
              <div className="tracking-badge">
                <div className="pulse"></div> Live
              </div>
            </div>
          </div>

          {/* Right: Chat */}
          <div className="chat-section">
            <h3>💬 Chat ({messages.length})</h3>
            
            <div className="messages-container">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.sender_role}`}>
                  <div className="message-content">
                    <p>{msg.message}</p>
                    <small>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </small>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="message-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={loading}
              />
              <button type="submit" disabled={loading}>
                {loading ? '⏳' : '📤'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrackingModal;
