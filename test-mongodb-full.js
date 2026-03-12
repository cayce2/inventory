const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function getAllTests() {
  console.log('='.repeat(60));
  console.log('MongoDB Connection Diagnostic Tool');
  console.log('='.repeat(60));
  
  // Read environment
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  const mongoLine = lines.find(line => line.startsWith('MONGODB_URI='));
  const uri = mongoLine ? mongoLine.substring('MONGODB_URI='.length).trim().replace(/\r$/, '') : null;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found');
    return;
  }

  console.log('\n📋 System Information:');
  console.log('   Node.js:', process.version);
  console.log('   Platform:', process.platform);
  console.log('   Architecture:', process.arch);
  
  console.log('\n📋 MongoDB Driver:');
  const mongoPackage = require('./node_modules/mongodb/package.json');
  console.log('   Version:', mongoPackage.version);
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: Standard SRV Connection');
  console.log('='.repeat(60));
  
  const client1 = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
  
  try {
    await client1.connect();
    console.log('✅ SRV Connection: SUCCESS');
    
    const db = client1.db('inventory_management');
    const users = await db.collection('users')
      .find({}, { projection: { password: 0 } })
      .toArray();
    
    console.log(`✅ Database Access: SUCCESS`);
    console.log(`✅ Users Retrieved: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n👥 Users in Database:');
      users.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.email} - ${user.role} - ${user.suspended ? 'Suspended' : 'Active'}`);
      });
    }
    
    await client1.close();
    console.log('\n✅ ALL TESTS PASSED - Database is accessible!');
    return true;
    
  } catch (error1) {
    console.log('❌ SRV Connection: FAILED');
    console.log('   Error:', error1.message);
    await client1.close();
    
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Connection with DNS Options');
    console.log('='.repeat(60));
    
    const client2 = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      family: 4,
      useUnifiedTopology: true,
    });
    
    try {
      await client2.connect();
      console.log('✅ DNS Options Connection: SUCCESS');
      
      const db = client2.db('inventory_management');
      const users = await db.collection('users')
        .find({}, { projection: { password: 0 } })
        .toArray();
      
      console.log(`✅ Users Retrieved: ${users.length}`);
      
      if (users.length > 0) {
        console.log('\n👥 Users in Database:');
        users.forEach((user, i) => {
          console.log(`   ${i + 1}. ${user.email} - ${user.role}`);
        });
      }
      
      await client2.close();
      console.log('\n✅ Connection successful with DNS options!');
      return true;
      
    } catch (error2) {
      console.log('❌ DNS Options Connection: FAILED');
      console.log('   Error:', error2.message);
      await client2.close();
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('DIAGNOSIS');
  console.log('='.repeat(60));
  console.log('\n❌ Unable to connect to MongoDB Atlas');
  console.log('\n🔍 Possible Issues:');
  console.log('   1. Windows Firewall blocking MongoDB (port 27017)');
  console.log('   2. Antivirus blocking Node.js network access');
  console.log('   3. IP not whitelisted in MongoDB Atlas');
  console.log('   4. VPN or proxy interference');
  console.log('   5. Node.js v24 compatibility issue');
  
  console.log('\n💡 Solutions to Try:');
  console.log('   1. Add your IP to MongoDB Atlas Network Access');
  console.log('   2. Temporarily disable Windows Firewall');
  console.log('   3. Run VS Code as Administrator');
  console.log('   4. Downgrade to Node.js v20 LTS');
  console.log('   5. Check MongoDB Atlas cluster is not paused');
  
  return false;
}

getAllTests().catch(console.error);
