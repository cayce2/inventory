const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

// Force Node.js to use system DNS resolver instead of c-ares
dns.setDefaultResultOrder('ipv4first');

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

  console.log('🔄 Attempting to connect with DNS workaround...');
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    family: 4, // Force IPv4
  });
  
  try {
    console.log('⏳ Connecting...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB Atlas!\n');
    
    const db = client.db('inventory_management');
    
    console.log('👥 Fetching users...');
    const users = await db.collection('users')
      .find({}, { projection: { password: 0 } })
      .toArray();
    
    console.log(`\n✅ Retrieved ${users.length} users from database:\n`);
    
    if (users.length === 0) {
      console.log('⚠️  No users found in the database');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'N/A'} (${user.email || 'N/A'})`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Role: ${user.role || 'N/A'}`);
        console.log(`   Status: ${user.suspended ? '🔴 Suspended' : '🟢 Active'}`);
        console.log(`   Subscription: ${user.subscriptionStatus || 'N/A'}`);
        console.log('');
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Connection Failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
      console.error('\n🔍 This appears to be a Node.js DNS resolution issue.');
      console.error('💡 Possible solutions:');
      console.error('   1. Try running: node --dns-result-order=ipv4first test-db-detailed.js');
      console.error('   2. Use a standard connection string instead of mongodb+srv://');
      console.error('   3. Check Windows Firewall settings');
      console.error('   4. Try disabling IPv6 in Windows network settings');
    }
    
    return false;
    
  } finally {
    await client.close();
    console.log('🔌 Connection closed\n');
  }
}

testDatabaseConnection();
