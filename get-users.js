const { MongoClient } = require('mongodb');

async function getUsers() {
  const uri = 'mongodb+srv://calebmumbi2:Hackerspremier!1997@inventory.wmsfk.mongodb.net/?retryWrites=true&w=majority&appName=inventory';
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('inventory_management');
    const users = await db.collection('users')
      .find({}, { projection: { password: 0 } })
      .toArray();

    console.log(`\nFound ${users.length} users:\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email || user.username}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Role: ${user.role || 'user'}`);
      console.log(`   Suspended: ${user.suspended || false}`);
      console.log(`   Subscription: ${user.subscriptionStatus || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

getUsers();
