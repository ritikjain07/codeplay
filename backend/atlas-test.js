import 'dotenv/config';
import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    console.log('🔍 Testing MongoDB Atlas connection...');
    console.log('📍 URI:', uri.replace(/\/\/([^:]+):([^@]+)@/, '//<username>:<password>@'));
    
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas successfully!');
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log('✅ Pinged your deployment. You successfully connected to MongoDB!');
    
    // Test database operations
    console.log('\n🧪 Testing database operations...');
    const db = client.db("users");
    const collection = db.collection("test");
    
    // Insert a test document
    const testDoc = { name: "test", timestamp: new Date() };
    const result = await collection.insertOne(testDoc);
    console.log('✅ Document inserted:', result.insertedId);
    
    // Read the test document
    const foundDoc = await collection.findOne({ _id: result.insertedId });
    console.log('✅ Document retrieved:', foundDoc.name);
    
    // Delete the test document
    await collection.deleteOne({ _id: result.insertedId });
    console.log('✅ Test document cleaned up');
    
    console.log('\n🎉 All tests passed! Your MongoDB Atlas connection is working perfectly.');
    console.log('💡 Your login/signup functionality should now work.');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🔧 Authentication Issue - Possible solutions:');
      console.log('   1. Double-check username and password in Atlas');
      console.log('   2. Ensure database user has proper permissions');
      console.log('   3. Wait a few minutes for user provisioning to complete');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
      console.log('\n🔧 Network Issue - Possible solutions:');
      console.log('   1. Check your internet connection');
      console.log('   2. Verify IP whitelist in Atlas Network Access');
      console.log('   3. Try again in a few minutes');
    }
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
    console.log('\n🔌 Connection closed');
  }
}

run().catch(console.dir);
