import mongoose from 'mongoose';

// Debugging output
console.log('Checking for MONGODB_URI in:', {
  serverRuntime: process.env.MONGODB_URI ? 'found' : 'missing',
  publicRuntime: process.env.NEXT_PUBLIC_MONGODB_URI ? 'found' : 'missing'
});

//const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_URI = 'mongodb+srv://geemal1976:8GWzRawaNkvzgN5z@cluster0.oi0gany.mongodb.net/yourdbname?retryWrites=true&w=majority';

if (!MONGODB_URI) {
  console.error('Available environment variables:', Object.keys(process.env));
  throw new Error(`
    =====================================
    CRITICAL: MongoDB URI not configured!
    =====================================
    Please create .env.local file in project root with:
    
    MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
    
    Current directory: ${__dirname}
    =====================================
  `);
}

let cached = global.mongoose || { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;

  console.log(`Connecting to MongoDB at: ${MONGODB_URI.replace(/:[^@]+@/, ':********@')}`);

  cached.promise = mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
  })
  .then(mongoose => {
    console.log('✅ MongoDB connected successfully');
    return mongoose;
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err);
    throw err;
  });

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;