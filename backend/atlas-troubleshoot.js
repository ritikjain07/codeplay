import 'dotenv/config';

console.log('🔍 MongoDB Atlas Troubleshooting...\n');

console.log('📋 Current Configuration:');
console.log('   Username: ritikjain4560');
console.log('   Password: sSBysMLc1C3f0Wsa');
console.log('   Cluster: soen-cluster.3op2532.mongodb.net');
console.log('   IP: 49.43.162.51 (should be whitelisted)');

console.log('\n🔧 Common Issues and Solutions:');
console.log('');
console.log('1. ⏳ Cluster Still Creating');
console.log('   - Atlas clusters can take 1-10 minutes to fully provision');
console.log('   - Check Atlas dashboard for cluster status');
console.log('   - Look for "Available" status, not "Creating"');
console.log('');
console.log('2. 👤 Database User Not Ready');
console.log('   - Database users can take 1-2 minutes to activate');
console.log('   - Go to Database Access in Atlas dashboard');
console.log('   - Ensure user shows as "Available" not "Pending"');
console.log('');
console.log('3. 🌐 Network Access');
console.log('   - Your current IP: 49.43.162.51');
console.log('   - Check Network Access in Atlas dashboard');
console.log('   - Ensure this IP is listed or use 0.0.0.0/0');
console.log('');
console.log('4. 🔑 Credentials');
console.log('   - Double-check username: ritikjain4560');
console.log('   - Double-check password: sSBysMLc1C3f0Wsa');
console.log('   - Ensure no extra spaces or characters');
console.log('');

console.log('💡 Next Steps:');
console.log('1. Wait 2-3 minutes for full provisioning');
console.log('2. Check Atlas dashboard for "Available" status');
console.log('3. Try connection again with: npm run test-db');
console.log('4. If still failing, regenerate user password in Atlas');

console.log('\n🌐 Atlas Dashboard: https://cloud.mongodb.com/');
