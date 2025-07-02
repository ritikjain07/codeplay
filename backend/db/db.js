import mongoose from "mongoose";

function connect() {
    console.log('🔍 Attempting to connect to MongoDB...');
    console.log('📍 MongoDB URI:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//<username>:<password>@'));
    
    mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    })
        .then(() => {
            console.log("✅ Connected to MongoDB successfully");
        })
        .catch(err => {
            console.error("❌ MongoDB connection failed:");
            console.error("   Error:", err.message);
            console.error("   🔧 Solutions:");
            console.error("   1. Install MongoDB locally: https://www.mongodb.com/try/download/community");
            console.error("   2. Start MongoDB service: 'net start MongoDB' (Windows)");
            console.error("   3. Use MongoDB Atlas: Update MONGODB_URI in .env");
            console.error("   4. Current URI:", process.env.MONGODB_URI);
        });
        
    // Handle connection events
    mongoose.connection.on('connected', () => {
        console.log('🎉 Mongoose connected to MongoDB');
    });
    
    mongoose.connection.on('error', (err) => {
        console.error('❌ Mongoose connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
        console.log('⚠️  Mongoose disconnected from MongoDB');
    });
}

export default connect;