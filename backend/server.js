// ================================
// CARGOMATE BACKEND - MONGODB VERSION (COMPLETE)
// ================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');  // ✅ ADD THIS LINE
// Import database connection
const connectDatabase = require('./config/database');

// Import models
const User = require('./models/User');
const Shipment = require('./models/Shipment');
const Bid = require('./models/Bid');
const Trip = require('./models/Trip');

// Import middleware
const { generateToken, authenticateToken, authorize } = require('./middleware/auth');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

console.log('ðŸ”§ CargoMate Backend Starting...');

// Connect to MongoDB
connectDatabase();

// ================================
// MIDDLEWARE
// ================================

// ✅ CORS MUST BE FIRST - Before helmet, before routes
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://localhost:5500'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ✅ Handle preflight OPTIONS requests
app.options('*', cors(corsOptions));

// ✅ HELMET after CORS with relaxed settings
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// ✅ Rate limiting - AFTER CORS
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  max: 500,  // Higher limit for development
  skip: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  }
});
app.use(limiter);

// ✅ Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

console.log('✅ Middleware configured successfully');


// ================================
// AUTH ROUTES
// ================================

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, license_number, vehicle_type, vehicle_number, vehicle_capacity } = req.body;
    console.log('ðŸ“ Registration attempt:', email, role);

    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const userData = { name, email: email.toLowerCase(), phone, password, role };
    if (role === 'driver') {
      if (!license_number || !vehicle_type || !vehicle_number || !vehicle_capacity) {
        return res.status(400).json({ success: false, error: 'All driver fields required' });
      }
      Object.assign(userData, { license_number, vehicle_type, vehicle_number, vehicle_capacity });
    }

    const user = await User.create(userData);
    const token = generateToken({ id: user._id, email: user.email, role: user.role });

    console.log('âœ… User registered:', user.email);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        ...(role === 'driver' && { license_number: user.license_number, vehicle_type: user.vehicle_type, vehicle_number: user.vehicle_number, vehicle_capacity: user.vehicle_capacity })
      }
    });
  } catch (error) {
    console.error('âŒ Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log('ðŸ” Login attempt:', email, role);

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    const user = await User.findOne({ email: email.toLowerCase(), role });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken({ id: user._id, email: user.email, role: user.role });

    console.log('âœ… Login successful:', user.email);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, ...(user.role === 'driver' && { license_number: user.license_number, vehicle_type: user.vehicle_type, vehicle_number: user.vehicle_number, vehicle_capacity: user.vehicle_capacity, rating: user.rating, total_trips: user.total_trips }) }
    });
  } catch (error) {
    console.error('âŒ Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================
// SHIPMENT ROUTES
// ================================

app.post('/api/shipments', authenticateToken, async (req, res) => {
  try {
    const shipment = await Shipment.create({ ...req.body, shipment_id: `SHIP-${Date.now()}`, shipper_id: req.user.id });
    console.log('âœ… Shipment created:', shipment.shipment_id);
    res.status(201).json({ success: true, message: 'Shipment created successfully', shipment });
  } catch (error) {
    console.error('âŒ Create shipment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/shipments/available', authenticateToken, async (req, res) => {
  try {
    const shipments = await Shipment.find({ status: 'pending_bids' }).populate('shipper_id', 'name phone');
    res.json({ success: true, shipments });
  } catch (error) {
    console.error('âŒ Get shipments error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// GET SHIPMENTS BY SHIPPER ID (For Billing) - ENHANCED WITH DRIVER INFO
app.get('/api/shipments/shipper/:shipperId', authenticateToken, async (req, res) => {
  try {
    const shipperId = req.params.shipperId;
    console.log('📦 Fetching shipments for shipper:', shipperId);

    const mongoose = require('mongoose');
    
    // Convert to ObjectId for proper matching
    const shipperObjectId = new mongoose.Types.ObjectId(shipperId);

    // Find all shipments for this shipper and populate driver info
    const shipments = await Shipment.find({
      $or: [
        { shipper_id: shipperId },
        { shipper_id: shipperObjectId }
      ]
    })
    .populate('selected_driver_id', 'name email phone') // Populate driver details
    .sort({ createdAt: -1 })
    .lean();

    // Transform shipments to include driver name
    const shipmentsWithDriverInfo = shipments.map(shipment => ({
      ...shipment,
      selected_driver_name: shipment.selected_driver_id?.name || null
    }));

    console.log(`✅ Found ${shipmentsWithDriverInfo.length} shipments for shipper`);

    res.json({
      success: true,
      shipments: shipmentsWithDriverInfo,
      count: shipmentsWithDriverInfo.length
    });

  } catch (error) {
    console.error('❌ Error fetching shipper shipments:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      shipments: []
    });
  }
});



// GET SHIPMENTS BY USER - FIXED
app.get('/api/shipments/user/:userId', authenticateToken, async (req, res) => {
  try {
    console.log('📦 Fetching shipments for user:', req.params.userId);
    console.log('🔍 Query parameter type:', typeof req.params.userId);
    
    // Try both String and ObjectId comparison
    const shipments = await Shipment.find({
      $or: [
        { shipper_id: req.params.userId },
        { shipper_id: new mongoose.Types.ObjectId(req.params.userId) }
      ]
    })
    .populate('selected_driver_id', 'name phone rating')
    .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${shipments.length} shipments`);
    
    if (shipments.length > 0) {
      console.log('📄 First shipment shipper_id:', shipments[0].shipper_id, 'Type:', typeof shipments[0].shipper_id);
    }
    
    res.json({ success: true, shipments });
  } catch (error) {
    console.error('❌ Get user shipments error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get bids for a specific shipment
app.get('/api/shipments/:shipmentId/bids', authenticateToken, async (req, res) => {
  try {
    const bids = await Bid.find({ shipment_id: req.params.shipmentId })
      .populate('driver_id', 'name phone rating vehicle_type vehicle_number vehicle_capacity license_number')
      .sort({ bid_amount: 1, createdAt: 1 });
    
    console.log(`âœ… Found ${bids.length} bids for shipment ${req.params.shipmentId}`);
    res.json({ success: true, bids });
  } catch (error) {
    console.error('âŒ Get shipment bids error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================
// BID ROUTES
// ================================
// POST BID (Place bid on shipment)
app.post('/api/bids', authenticateToken, async (req, res) => {
  try {
    const { shipment_id, bid_amount, message } = req.body;
    
    // ✅ USE THE AUTHENTICATED USER'S ID, NOT FROM REQUEST BODY
    const driverId = req.user.id;  // From authenticateToken middleware
    
    console.log('📤 New bid:', {
      shipment_id,
      driver_id: driverId,
      amount: bid_amount
    });

    // Find driver details
    const driver = await User.findById(driverId).lean();
    
    if (!driver || driver.role !== 'driver') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only drivers can place bids' 
      });
    }

    const newBid = new Bid({
      bid_id: `BID-${Date.now()}`,
      shipment_id: shipment_id,
      driver_id: driverId,  // ✅ USE AUTHENTICATED DRIVER ID
      driver_name: driver.name,
      driver_rating: driver.rating || 4.5,
      vehicle_type: driver.vehicle_type,
      vehicle_number: driver.vehicle_number,
      license_number: driver.license_number,
      bid_amount: bid_amount,
      message: message || '',
      status: 'pending',
      created_at: new Date()
    });

    await newBid.save();

    console.log('✅ Bid placed:', newBid.bid_id, 'Amount:', bid_amount);

    res.json({ 
      success: true, 
      message: 'Bid placed successfully',
      bid: newBid 
    });

  } catch (error) {
    console.error('❌ Error placing bid:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});


app.get('/api/bids/driver/:driverId', authenticateToken, async (req, res) => {
  try {
    const bids = await Bid.find({ driver_id: req.params.driverId }).sort({ createdAt: -1 });
    res.json({ success: true, bids });
  } catch (error) {
    console.error('âŒ Get driver bids error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Accept bid
app.post('/api/bids/:bidId/accept', authenticateToken, async (req, res) => {
  try {
    const bid = await Bid.findOne({ bid_id: req.params.bidId });
    if (!bid) {
      return res.status(404).json({ success: false, error: 'Bid not found' });
    }
    
    bid.status = 'accepted';
    await bid.save();
    
    await Shipment.findOneAndUpdate({ shipment_id: bid.shipment_id }, { 
      status: 'active',
      selected_driver_id: bid.driver_id,
      final_amount: bid.bid_amount
    });
    
    await Bid.updateMany({ shipment_id: bid.shipment_id, bid_id: { $ne: req.params.bidId } }, { status: 'rejected' });
    
    const trip = await Trip.create({
      trip_id: `TRIP-${Date.now()}`,
      shipment_id: bid.shipment_id,
      driver_id: bid.driver_id,
      shipper_id: req.user.id,
      status: 'active',
      started_at: new Date()
    });
    
    console.log('âœ… Bid accepted:', req.params.bidId, 'Trip created:', trip.trip_id);
    
    res.json({ success: true, message: 'Bid accepted successfully', bid, trip });
  } catch (error) {
    console.error('âŒ Accept bid error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================
// TRIP ROUTES
// ================================

// GET DRIVER TRIPS (From Accepted Bids) - FIXED
app.get('/api/trips/driver/:driverId', authenticateToken, async (req, res) => {
  try {
    const driverId = req.params.driverId;
    console.log('🚚 Fetching trips for driver:', driverId);

    const mongoose = require('mongoose');
    
    // Convert to ObjectId for proper matching
    const driverObjectId = new mongoose.Types.ObjectId(driverId);

    // Find accepted bids for this driver (try both string and ObjectId)
    const acceptedBids = await Bid.find({
      $or: [
        { driver_id: driverId, status: 'accepted' },
        { driver_id: driverObjectId, status: 'accepted' }
      ]
    }).lean();

    console.log(`✅ Found ${acceptedBids.length} accepted bids for driver`);

    if (acceptedBids.length === 0) {
      return res.json({ 
        success: true, 
        trips: [],
        count: 0 
      });
    }

    // Fetch full shipment details for each bid
    const trips = await Promise.all(
      acceptedBids.map(async (bid) => {
        const shipment = await Shipment.findOne({ 
          shipment_id: bid.shipment_id 
        }).lean();
        
        if (shipment) {
          return {
            ...shipment,
            bid_id: bid.bid_id,
            bid_amount: bid.bid_amount,
            driver_id: bid.driver_id,
            driver_name: bid.driver_name,
            status: shipment.status || 'active'
          };
        }
        return null;
      })
    );

    const validTrips = trips.filter(t => t !== null);

    console.log(`📦 Returning ${validTrips.length} trips with full details`);
    
    if (validTrips.length > 0) {
      console.log('📋 First trip:', {
        shipment_id: validTrips[0].shipment_id,
        from: validTrips[0].from_location,
        to: validTrips[0].to_location
      });
    }

    res.json({ 
      success: true, 
      trips: validTrips,
      count: validTrips.length 
    });

  } catch (error) {
    console.error('❌ Error fetching driver trips:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      trips: []
    });
  }
});

app.put('/api/trips/:tripId/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const shipmentId = req.params.tripId;
    
    console.log('📍 Updating shipment status:', shipmentId, 'to:', status);
    
    const updateData = { status };
    
    // When marking as completed, ONLY set completed_at
    if (status === 'completed') {
      updateData.completed_at = new Date();
      // DO NOT ADD payment_status or payment_date here!
      // Payment happens separately when shipper clicks "Pay Now"
    }

    // Update shipment by MongoDB _id
    const shipment = await Shipment.findByIdAndUpdate(
      shipmentId,
      updateData,
      { new: true }
    );
    
    if (!shipment) {
      console.error('❌ Shipment not found:', shipmentId);
      return res.status(404).json({ success: false, error: 'Shipment not found' });
    }

    // If completed, also create or update the Trip record
    if (status === 'completed') {
      const acceptedBid = await Bid.findOne({
        shipment_id: shipment.shipment_id,
        status: 'accepted'
      });

      if (acceptedBid && acceptedBid.driver_id) {
        const tripData = {
          trip_id: `TRIP-${Date.now()}`,
          shipment_id: shipment.shipment_id,
          driver_id: acceptedBid.driver_id,
          shipper_id: shipment.shipper_id,
          status: 'completed',
          completed_at: new Date()
        };

        await Trip.findOneAndUpdate(
          { shipment_id: shipment.shipment_id },
          tripData,
          { upsert: true, new: true }
        );

        await User.findByIdAndUpdate(acceptedBid.driver_id, { 
          $inc: { total_trips: 1 } 
        });
      }
    }

    console.log('✅ Shipment status updated successfully');
    res.json({ success: true, message: 'Status updated', shipment });

  } catch (error) {
    console.error('❌ Update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET DRIVER EARNINGS
app.get('/api/earnings/driver/:driverId', authenticateToken, async (req, res) => {
  try {
    const driverId = req.params.driverId;
    console.log('💰 Fetching earnings for driver:', driverId);

    const mongoose = require('mongoose');
    const driverObjectId = new mongoose.Types.ObjectId(driverId);

    // Find all completed shipments for this driver
    const completedShipments = await Shipment.find({
      $or: [
        { selected_driver_id: driverId },
        { selected_driver_id: driverObjectId }
      ],
      status: 'completed'
    }).sort({ createdAt: -1 }).lean();

    const totalEarnings = completedShipments.reduce((sum, s) => sum + (s.final_amount || 0), 0);
    const paidEarnings = completedShipments
      .filter(s => s.payment_status === 'paid')
      .reduce((sum, s) => sum + (s.final_amount || 0), 0);
    const pendingEarnings = totalEarnings - paidEarnings;

    const transactions = completedShipments.map(s => ({
      _id: s._id,
      shipment_id: s.shipment_id,
      from_location: s.from_location,
      to_location: s.to_location,
      amount: s.final_amount || 0,
      completed_at: s.updatedAt,
      payment_status: s.payment_status || 'pending',
      payment_date: s.payment_date || null
    }));

    res.json({
      success: true,
      earnings: {
        totalEarnings,
        paidEarnings,
        pendingEarnings,
        completedTrips: completedShipments.length,
        activeTrips: 0
      },
      transactions
    });

  } catch (error) {
    console.error('❌ Error fetching earnings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// SUBMIT RATING FOR SHIPMENT
app.post('/api/shipments/:shipmentId/rating', authenticateToken, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const shipmentId = req.params.shipmentId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
    }

    const shipment = await Shipment.findByIdAndUpdate(
      shipmentId,
      {
        driver_rating: rating,
        driver_review: review || '',
        rated_at: new Date() // ← MAKE SURE THIS LINE IS HERE
      },
      { new: true }
    );

    if (!shipment) {
      return res.status(404).json({ success: false, error: 'Shipment not found' });
    }

    console.log('✅ Rating submitted for shipment:', shipment.shipment_id);
    console.log('📊 Rating details:', {
      driver_rating: shipment.driver_rating,
      driver_review: shipment.driver_review,
      rated_at: shipment.rated_at,
      selected_driver_id: shipment.selected_driver_id
    });
    
    res.json({ success: true, shipment });

  } catch (error) {
    console.error('❌ Error submitting rating:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// GET DRIVER PERFORMANCE DATA
app.get('/api/driver/:driverId/performance', authenticateToken, async (req, res) => {
  try {
    const driverId = req.params.driverId;
    console.log('📊 Fetching performance for driver:', driverId);

    const mongoose = require('mongoose');
    const driverObjectId = new mongoose.Types.ObjectId(driverId);

    // First, let's check ALL completed shipments for this driver
    const allCompleted = await Shipment.find({
      $or: [
        { selected_driver_id: driverId },
        { selected_driver_id: driverObjectId }
      ],
      status: 'completed'
    }).lean();

    console.log(`📦 Found ${allCompleted.length} completed shipments for driver`);
    
    // Log a sample shipment to see the structure
    if (allCompleted.length > 0) {
      console.log('📄 Sample completed shipment:', {
        shipment_id: allCompleted[0].shipment_id,
        selected_driver_id: allCompleted[0].selected_driver_id,
        driver_rating: allCompleted[0].driver_rating,
        driver_review: allCompleted[0].driver_review
      });
    }

    // Get all completed shipments with ratings
    const ratedShipments = await Shipment.find({
      $or: [
        { selected_driver_id: driverId },
        { selected_driver_id: driverObjectId }
      ],
      status: 'completed',
      driver_rating: { $exists: true, $ne: null }
    }).sort({ rated_at: -1 }).lean();

    console.log(`⭐ Found ${ratedShipments.length} rated shipments`);

    // Calculate performance metrics
    const totalRatings = ratedShipments.length;
    const averageRating = totalRatings > 0
      ? ratedShipments.reduce((sum, s) => sum + s.driver_rating, 0) / totalRatings
      : 0;

    // Rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratedShipments.forEach(s => {
      if (s.driver_rating) {
        ratingDistribution[s.driver_rating]++;
      }
    });

    // Get total completed trips
    const completedTrips = allCompleted.length;

    // Calculate on-time delivery (simplified - all completed are considered on-time)
    const onTimeDeliveries = completedTrips;
    const onTimePercentage = completedTrips > 0 ? 100 : 0;

    // Format reviews
    const reviews = ratedShipments.map(s => ({
      shipment_id: s.shipment_id,
      from_location: s.from_location,
      to_location: s.to_location,
      driver_rating: s.driver_rating,
      driver_review: s.driver_review || '',
      rated_at: s.rated_at || s.updatedAt
    }));

    const performanceData = {
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalRatings,
      completedTrips,
      onTimeDeliveries,
      onTimePercentage,
      ratingDistribution
    };

    console.log('✅ Performance data:', performanceData);
    console.log(`💬 Returning ${reviews.length} reviews`);
    
    res.json({ success: true, performance: performanceData, reviews });

  } catch (error) {
    console.error('❌ Error fetching performance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});



// MARK PAYMENT AS COMPLETE (For Shipper to mark payment done)
app.put('/api/shipments/:shipmentId/payment', authenticateToken, async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndUpdate(
      req.params.shipmentId,
      {
        payment_status: 'paid',
        payment_date: new Date()
      },
      { new: true }
    );

    res.json({ success: true, shipment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// MIGRATION: Update existing completed shipments
app.post('/api/admin/migrate-payments', authenticateToken, async (req, res) => {
  try {
    const result = await Shipment.updateMany(
      { 
        status: 'completed',
        $or: [
          { payment_status: { $exists: false } },
          { payment_status: null }
        ]
      },
      { 
        $set: { 
          payment_status: 'paid',
          payment_date: new Date()
        }
      }
    );

    console.log('✅ Migration complete:', result);
    res.json({ 
      success: true, 
      message: 'Updated completed shipments',
      modified: result.modifiedCount 
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// ================================
// MESSAGE ENDPOINTS (WITH STORAGE)
// ================================

// In-memory message storage
const messageStorage = {};

// GET MESSAGES FOR SHIPMENT
app.get('/api/messages/:shipmentId', authenticateToken, async (req, res) => {
  try {
    const { shipmentId } = req.params;
    console.log('📨 Fetching messages for shipment:', shipmentId);

    // Initialize storage if not exists
    if (!messageStorage[shipmentId]) {
      messageStorage[shipmentId] = [
        {
          id: 1,
          shipment_id: shipmentId,
          sender_role: 'driver',
          message: 'Hello! Thank you for choosing our service. I\'ll take good care of your package.',
          timestamp: new Date().toISOString()
        }
      ];
    }

    const messages = messageStorage[shipmentId] || [];
    console.log(`✅ Returning ${messages.length} messages`);

    res.json({ 
      success: true, 
      messages: messages,
      count: messages.length 
    });

  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      messages: []
    });
  }
});

// POST MESSAGE (Send new message)
app.post('/api/messages/:shipmentId', authenticateToken, async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { message, sender_role } = req.body;

    console.log(`💬 New message from ${sender_role}:`, message.substring(0, 50));

    // Initialize storage if not exists
    if (!messageStorage[shipmentId]) {
      messageStorage[shipmentId] = [];
    }

    // Create new message
    const newMessage = {
      id: Date.now(),
      shipment_id: shipmentId,
      sender_role: sender_role,
      message: message,
      timestamp: new Date().toISOString()
    };

    // Store message
    messageStorage[shipmentId].push(newMessage);

    console.log(`✅ Message stored. Total: ${messageStorage[shipmentId].length}`);

    res.json({ 
      success: true, 
      message: 'Message sent successfully',
      data: newMessage
    });

  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});


// ================================
// HEALTH CHECK
// ================================

app.get('/', (req, res) => {
  res.json({ message: 'ðŸš› CargoMate API with MongoDB!', version: '2.0.0', database: 'MongoDB', status: 'OK' });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server healthy', database: 'MongoDB Connected', timestamp: new Date().toISOString() });
});
app.post('/api/payments/mark-paid', authenticateToken, async (req, res) => {
  const { shipment_id, trip_id } = req.body;
  await Shipment.updateOne({ shipment_id }, { payment_status: "paid" });
  await Trip.updateOne({ trip_id }, { payment_status: "paid" });
  res.json({ success: true });
});

// ============================================
// USER UPDATE ENDPOINT
// ============================================

app.put('/api/users/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const updateData = req.body;

    console.log('🔄 Updating user:', userId);
    console.log('📝 Update data:', updateData);

    // Find and update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password'); // Don't return password

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    console.log('✅ User updated successfully');
    res.json({ 
      success: true, 
      user: updatedUser 
    });

  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});


// ================================
// ERROR HANDLING
// ================================

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('âŒ Server error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});



// ================================
// START SERVER
// ================================

app.listen(PORT, () => {
  console.log(`âœ… Server running on http://localhost:${PORT}`);
  console.log(`ðŸ“¡ API: http://localhost:${PORT}/api`);
  console.log(`ðŸ—„ï¸  Database: MongoDB`);
});