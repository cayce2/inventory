const { MongoClient } = require('mongodb');
const dns = require('dns');
const fs = require('fs');
const path = require('path');

// Apply DNS fix
dns.setDefaultResultOrder('ipv4first');

async function testConnection() {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  const mongoLine = lines.find(line => line.startsWith('MONGODB_URI='));
  const uri = mongoLine ? mongoLine.substring('MONGODB_URI='.length).trim().replace(/\r$/, '') : null;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found');
    return;
  }

  console.log('🔄 Testing MongoDB connection with DNS fix...\n');
  
  const client = new MongoClient(uri, {
    family: 4, // Force IPv4
    serverSelectionTimeoutMS: 10000,
  });
  
  try {
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!\n');
    
    const db = client.db('inventory_management');
    const users = await db.collection('users').find({}, { projection: { password: 0 }, limit: 5 }).toArray();
    
    console.log(`📊 Found ${users.length} users (showing first 5):\n`);
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.name || 'N/A'} (${user.email})`);
      console.log(`   Role: ${user.role || 'N/A'}`);
      console.log(`   Status: ${user.suspended ? '🔴 Suspended' : '🟢 Active'}\n`);
    });
    
    console.log('✅ Connection test PASSED - Your app should work now!');
    
  } catch (error) {
    console.error('❌ Connection FAILED:', error.message);
  } finally {
    await client.close();
  }
}

testConnection();
