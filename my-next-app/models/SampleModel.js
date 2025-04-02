export function getProdModel() {
  const mongoose = require('../lib/db').getConnection('production');
  
  const schema = new mongoose.Schema({
    name: String,
    email: String,
    age: Number,
    createdAt: { type: Date, default: Date.now }
    // Add other fields as needed
  });

  return mongoose.models.Sample || mongoose.model('Sample', schema);
}

export function getDevModel() {
  const mongoose = require('../lib/db').getConnection('development');
  
  const schema = new mongoose.Schema({
    name: String,
    email: String,
    age: Number,
    createdAt: { type: Date, default: Date.now }
    // Match the production schema
  });

  return mongoose.models.Sample || mongoose.model('Sample', schema);
}