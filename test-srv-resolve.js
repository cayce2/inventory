const { MongoClient } = require('mongodb');
const dns = require('dns').promises;
const fs = require('fs');
const path = require('path');

async function resolveSRV() {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  const mongoLine = lines.find(line => line.startsWith('MONGODB_URI='));
  const srvUri = mongoLine ? mongoLine.substring('MONGODB_URI='.length).trim().replace(/\r$/, '') : null;
  
  if (!srvUri || !srvUri.includes('mongodb+srv://')) {
    console.error('❌ Not an SRV URI');
    return;
  }

  console.log('🔄 Manually resolving MongoDB SRV record...\n');

  try {
    // Extract credentials and host
    const match = srvUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/\?]+)/);
    if (!match) {
      console.error('❌ Could not parse URI');
      return;
    }

    const [, username, password, host] = match;
    const srvRecord = `_mongodb._tcp.${host}`;

    console.log(`🔍 Looking up: ${srvRecord}`);
    
    // Try to resolve SRV record
    const records = await dns.resolveSrv(srvRecord);
    
    console.log(`✅ Found ${records.length} MongoDB servers:\n`);
    records.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name}:${r.port} (priority: ${r.priority})`);
    });

    // Build standard connection string
    const hosts = records.map(r => `${r.name}:${r.port}`).join(',');
    const standardUri = `mongodb://${username}:${password}@${hosts}/?ssl=true&authSource=admin&retryWrites=true&w=majority`;

    console.log('\n📝 Standard connection string generated');
    console.log('\n🔄 Testing connection...\n');

    const client = new MongoClient(standardUri, {
      serverSelectionTimeoutMS: 10000,
    });

    await client.connect();
    console.log('✅ Successfully connected!\n');

    const db = client.db('inventory_management');
    const users = await db.collection('users').find({}, { limit: 3 }).toArray();
    console.log(`📊 Found ${users.length} users\n`);

    await client.close();
    
    console.log('✅ CONNECTION TEST PASSED!\n');
    console.log('💡 Update your .env.local with this connection string:');
    console.log(`\nMONGODB_URI=${standardUri}\n`);

  } catch (error) {
    console.error('❌ Failed:', error.message);
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('\n💡 DNS resolution failed. Trying with known Atlas hosts...\n');
      
      // Fallback: Use common Atlas shard pattern
      const match = srvUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/\?]+)/);
      if (match) {
        const [, username, password, host] = match;
        const clusterName = host.split('.')[0];
        
        // Try standard Atlas pattern
        const fallbackUri = `mongodb://${username}:${password}@${clusterName}-shard-00-00.wmsfk.mongodb.net:27017,${clusterName}-shard-00-01.wmsfk.mongodb.net:27017,${clusterName}-shard-00-02.wmsfk.mongodb.net:27017/?ssl=true&replicaSet=atlas-zzqxqz-shard-0&authSource=admin&retryWrites=true&w=majority`;
        
        console.log('🔄 Testing fallback connection...\n');
        
        const client = new MongoClient(fallbackUri, {
          serverSelectionTimeoutMS: 10000,
        });

        try {
          await client.connect();
          console.log('✅ Fallback connection SUCCESSFUL!\n');
          
          const db = client.db('inventory_management');
          const count = await db.collection('users').countDocuments();
          console.log(`📊 Found ${count} users in database\n`);
          
          await client.close();
          
          console.log('✅ Use this connection string in .env.local:');
          console.log(`\nMONGODB_URI=${fallbackUri}\n`);
          
        } catch (err) {
          console.error('❌ Fallback also failed:', err.message);
          console.log('\n💡 Please get the correct connection string from MongoDB Atlas:');
          console.log('   1. Go to https://cloud.mongodb.com');
          console.log('   2. Click "Connect" on your cluster');
          console.log('   3. Choose "Connect your application"');
          console.log('   4. Copy the connection string (standard, not SRV)');
        }
      }
    }
  }
}

resolveSRV();
