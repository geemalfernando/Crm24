require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const CompanyAI = require('./models/CompanyAI');
const CompanyMigrated = require('./models/CompanyMigrated');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

// Routes
app.get('/', (req, res) => res.status(200).json({ status: 'OK' }));

app.get('/api/get-companies', async (req, res) => {
  try {
    const companies = await CompanyAI.find().lean();
    res.json(companies);
  } catch (err) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/store-companies', async (req, res) => {
  try {
    const requiredFields = [
      'companyName', 
      'companyAddress',
      'contactPersonName',
      'contactPersonNumber',
      'contactPersonEmail',
      'industry_id'
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        missingFields 
      });
    }

    const newCompany = await CompanyMigrated.create({
      ...req.body,
      comment: req.body.comment || '',
      migratedAt: new Date()
    });

    res.status(201).json(newCompany);
  } catch (err) {
    console.error('Error storing company:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/migrated-companies', async (req, res) => {
  try {
    const companies = await CompanyMigrated.find()
      .sort({ migratedAt: -1 })
      .lean();
      
    res.json(companies.length ? companies : []);
  } catch (err) {
    console.error('Error fetching migrated companies:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Server Startup
const startServer = async () => {
  await connectDB();
  
  const PORT = process.env.PORT || 5000;
  const findAvailablePort = async (port) => {
    const net = require('net');
    return new Promise((resolve) => {
      const server = net.createServer();
      server.unref();
      server.on('error', () => resolve(findAvailablePort(port + 1)));
      server.listen({ port }, () => {
        server.close(() => resolve(port));
      });
    });
  };

  const availablePort = await findAvailablePort(PORT);
  const server = app.listen(availablePort, () => {
    console.log(`🚀 Server running on port ${availablePort}`);
    console.log(`🔗 Access via: http://localhost:${availablePort}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      mongoose.connection.close(false, () => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
      mongoose.connection.close(false, () => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  });
};

startServer();