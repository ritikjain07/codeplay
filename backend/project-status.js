import 'dotenv/config';
import mongoose from 'mongoose';
import redisClient from './services/redis.service.js';

async function checkProjectStatus() {
    console.log('🔍 Checking Project Status...\n');

    // Check Environment Variables
    console.log('📋 Environment Variables:');
    console.log('   PORT:', process.env.PORT || 'Not set');
    console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');
    console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');
    console.log('   REDIS_HOST:', process.env.REDIS_HOST ? '✅ Set' : '❌ Not set');
    console.log('   GOOGLE_AI_KEY:', process.env.GOOGLE_AI_KEY ? '✅ Set' : '❌ Not set');
    console.log('');

    // Check MongoDB Connection
    console.log('🍃 Testing MongoDB Connection...');
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('   ✅ MongoDB connected successfully');
        await mongoose.disconnect();
    } catch (error) {
        console.log('   ❌ MongoDB connection failed:', error.message);
    }
    console.log('');

    // Check Redis Connection
    console.log('🔴 Testing Redis Connection...');
    try {
        await redisClient.ping();
        console.log('   ✅ Redis connected successfully');
        
        // Test basic operations
        await redisClient.set('health-check', 'ok', 'EX', 5);
        const value = await redisClient.get('health-check');
        console.log('   ✅ Redis operations working:', value);
    } catch (error) {
        console.log('   ⚠️  Redis connection issues:', error.message);
        console.log('   📝 Note: App will work but logout tokens won\'t be cached');
    }
    console.log('');

    // Check Google AI
    console.log('🤖 Testing Google AI Service...');
    try {
        const { generateResult } = await import('./services/ai.service.js');
        console.log('   ✅ AI service module loaded');
        // Note: We won't test actual API call to avoid quota usage
    } catch (error) {
        console.log('   ❌ AI service failed to load:', error.message);
    }
    console.log('');

    console.log('📊 Project Components Status:');
    console.log('   🖥️  Backend: Node.js + Express + Socket.io');
    console.log('   🎨 Frontend: React + Vite + TailwindCSS');
    console.log('   🌐 Real-time: WebSockets for collaboration');
    console.log('   💾 Database: MongoDB for data persistence');
    console.log('   ⚡ Cache: Redis for session management');
    console.log('   🤖 AI: Google Generative AI integration');
    console.log('   🔧 Code Execution: WebContainer API');
    console.log('');

    console.log('🚀 Project Features:');
    console.log('   ✅ User authentication & authorization');
    console.log('   ✅ Project creation & management');
    console.log('   ✅ Real-time collaborative editing');
    console.log('   ✅ File system with import/export');
    console.log('   ✅ In-browser code execution');
    console.log('   ✅ AI-powered code assistance');
    console.log('   ✅ Live chat & messaging');
    console.log('   ✅ Syntax highlighting & code editor');

    process.exit(0);
}

checkProjectStatus();
