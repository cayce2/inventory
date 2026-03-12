const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function testDatabaseConnection() {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  const mongoLine = lines.find(line => line.startsWith('MONGODB_URI='));
  const uri = mongoLine ? mongoLine.substring('MONGODB_URI='.length).trim().replace(/\r$/, '') : null;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    return;
  }

  console.log('🔄 Attempting to connect to MongoDB Atlas...');
  console.log('📍 Connection string (masked):', uri.replace(/:[^:@]+@/, ':****@'));
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
  
  try {
    console.log('⏳ Connecting (timeout: 10s)...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB Atlas!\n');
    
    const db = client.db('inventory_management');
    
    // Test database access
    console.log('📊 Testing database access...');
    const collections = await db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections:`, collections.map(c => c.name).join(', '));
    
    // Get users
    console.log('\n👥 Fetching users...');
    const users = await db.collection('users')
      .find({}, { projection: { password: 0 } })
      .toArray();
    
    console.log(`\n✅ Successfully retrieved ${users.length} users:\n`);
    
    if (users.length === 0) {
      console.log('⚠️  No users found in the database');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'N/A'} (${user.email || 'N/A'})`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Role: ${user.role || 'N/A'}`);
        console.log(`   Status: ${user.suspended ? '🔴 Suspended' : '🟢 Active'}`);
        console.log(`   Subscription: ${user.subscriptionStatus || 'N/A'}`);
        if (user.subscriptionEndDate) {
          console.log(`   Subscription End: ${new Date(user.subscriptionEndDate).toLocaleDateString()}`);
        }
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('\n❌ Connection Failed!');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
      console.error('\n🔍 Possible causes:');
      console.error('   1. No internet connection');
      console.error('   2. MongoDB Atlas cluster is paused or deleted');
      console.error('   3. Firewall blocking MongoDB connection');
      console.error('   4. DNS resolution issues');
      console.error('\n💡 Try:');
      console.error('   - Check your internet connection');
      console.error('   - Verify MongoDB Atlas cluster is running');
      console.error('   - Check IP whitelist in MongoDB Atlas');
    } else if (error.message.includes('authentication')) {
      console.error('\n🔍 Authentication issue - check username/password in connection string');
    }
    
  } finally {
    await client.close();
    console.log('\n🔌 Connection closed');
  }
}

testDatabaseConnection();
