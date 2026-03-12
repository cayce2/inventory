const dns = require('dns');

// Apply DNS fix BEFORE any other imports
dns.setDefaultResultOrder('ipv4first');

// Override dns.promises.resolveSrv to use system resolver
const originalResolveSrv = dns.promises.resolveSrv;
dns.promises.resolveSrv = async function(hostname) {
  try {
    return await originalResolveSrv.call(this, hostname);
  } catch (error) {
    console.error('DNS SRV lookup failed, this is a known Windows/Node.js issue');
    throw error;
  }
};

console.log('🔧 DNS fix applied');

// Now start Next.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
