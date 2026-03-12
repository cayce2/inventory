const { MongoClient } = require('mongodb');

async function testDirectConnection() {
  // Direct connection string (bypassing SRV)
  const directUri = 'mongodb://calebmumbi2:Hackerspremier!1997@inventory-shard-00-00.wmsfk.mongodb.net:27017,inventory-shard-00-01.wmsfk.mongodb.net:27017,inventory-shard-00-02.wmsfk.mongodb.net:27017/inventory_management?ssl=true&replicaSet=atlas-zzqxqz-shard-0&authSource=admin&retryWrites=true&w=majority';
  
  console.log('🔄 Attempting direct connection (bypassing SRV)...');
  
  const client = new MongoClient(directUri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
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
    
    console.log(`\n✅ Retrieved ${users.length} users:\n`);
    
    if (users.length === 0) {
      console.log('⚠️  No users found');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'N/A'} (${user.email || 'N/A'})`);
        console.log(`   Role: ${user.role || 'N/A'}`);
        console.log(`   Status: ${user.suspended ? '🔴 Suspended' : '🟢 Active'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('\n❌ Failed:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Connection closed\n');
  }
}

testDirectConnection();
