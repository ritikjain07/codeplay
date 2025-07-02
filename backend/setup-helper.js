// Quick setup helper - run this after you get your connection string
import 'dotenv/config';

console.log('🔧 MongoDB Atlas Setup Helper\n');

console.log('📋 Your current .env configuration:');
console.log('Username:', 'ritikjain4560');
console.log('Password:', 'sSBysMLc1C3f0Wsa');
console.log('Current MONGODB_URI:', process.env.MONGODB_URI);

console.log('\n📝 Next steps:');
console.log('1. Copy your connection string from Atlas');
console.log('2. Replace "cluster0.xxxxx" with your actual cluster URL');
console.log('3. Make sure it ends with "/users?retryWrites=true&w=majority"');
console.log('4. Run: npm run test-db');

console.log('\n✅ Example of correct format:');
console.log('mongodb+srv://ritikjain4560:sSBysMLc1C3f0Wsa@cluster0.abc123.mongodb.net/users?retryWrites=true&w=majority');

console.log('\n🚨 What to replace:');
console.log('❌ cluster0.xxxxx.mongodb.net');
console.log('✅ cluster0.YOUR_ACTUAL_URL.mongodb.net');
