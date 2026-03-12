console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  MongoDB Connection Fix for Windows DNS Issue                 ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('Your Windows system cannot resolve MongoDB SRV DNS records.');
console.log('This is a known issue with Node.js on Windows.\n');

console.log('📋 SOLUTION: Get the standard connection string from MongoDB Atlas\n');

console.log('STEP 1: Go to MongoDB Atlas');
console.log('  → https://cloud.mongodb.com\n');

console.log('STEP 2: Select your "inventory" cluster\n');

console.log('STEP 3: Click the "Connect" button\n');

console.log('STEP 4: Choose "Drivers"\n');

console.log('STEP 5: Select:');
console.log('  - Driver: Node.js');
console.log('  - Version: 4.1 or later\n');

console.log('STEP 6: Look for the connection string that looks like:');
console.log('  mongodb://username:password@host1:27017,host2:27017,host3:27017/...\n');
console.log('  NOT the mongodb+srv:// format!\n');

console.log('STEP 7: Copy that connection string\n');

console.log('STEP 8: Update your .env.local file:');
console.log('  Replace the current MONGODB_URI with the new connection string\n');

console.log('═══════════════════════════════════════════════════════════════\n');

console.log('ALTERNATIVE: If you can\'t find the standard connection string:\n');

console.log('1. In MongoDB Atlas, go to your cluster');
console.log('2. Click "Connect" → "Connect with MongoDB Compass"');
console.log('3. Copy the connection string shown there');
console.log('4. Replace "mongodb+srv://" with "mongodb://"');
console.log('5. You may need to manually add the shard hosts\n');

console.log('═══════════════════════════════════════════════════════════════\n');

console.log('After updating .env.local, restart your dev server:\n');
console.log('  npm run dev\n');

console.log('Need help? The connection string should look like this format:');
console.log('mongodb://username:password@cluster-shard-00-00.xxxxx.mongodb.net:27017,');
console.log('cluster-shard-00-01.xxxxx.mongodb.net:27017,');
console.log('cluster-shard-00-02.xxxxx.mongodb.net:27017/');
console.log('?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin\n');
