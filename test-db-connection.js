const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function testDatabaseConnection() {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  const mongoLine = lines.find(line => line.startsWith('MONGODB_URI='));
  const uri = mongoLine ? mongoLine.substring('MONGODB_URI='.length).trim() : null;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }

  console.log('🔄 Connecting to MongoDB...');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Successfully connected to MongoDB');
    
    const db = client.db('inventory_management');
    const users = await db.collection('users')
      .find({}, { projection: { password: 0 } })
      .toArray();
    
    console.log(`\n📊 Found ${users.length} users in the database:\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'N/A'} (${user.email})`);
      console.log(`   Role: ${user.role || 'N/A'}`);
      console.log(`   Status: ${user.suspended ? '🔴 Suspended' : '🟢 Active'}`);
      console.log(`   Subscription: ${user.subscriptionStatus || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Connection closed');
  }
}

testDatabaseConnection();
