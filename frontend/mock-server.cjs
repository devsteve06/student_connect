const jsonServer = require('json-server');
const server = jsonServer.create();
const path = require('path');
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

// 1. Core json-server initializations
server.use(middlewares);
server.use(jsonServer.bodyParser);

// 2. Global CORS Configuration Middleware 
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173'); 
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});


// 3. Custom URL Rewriter Engine Matrix

server.use((req, res, next) => {
  console.log(`Incoming request caught: ${req.url}`);
  
  // Student Context Mappings
  if (req.url === '/api/v1/student/metrics') {
    req.url = '/metrics';
  } else if (req.url === '/api/v1/student/applications') {
    req.url = '/applications';
  }
  else if (req.url === '/api/v1/student/placements' || req.url === '/api/v1/student/placement') {
    req.url = '/placements';
  }
  
  // Firm/Corporate Context Mappings
  else if (req.url === '/api/v1/firm/metrics') {
    req.url = '/firmMetrics';
  } else if (req.url === '/api/v1/firm/applicants') {
    req.url = '/applicants';
  }

  // University Context Mappings
  else if (req.url === '/api/v1/university/metrics') {
    req.url = '/universityMetrics';
  } else if (req.url === '/api/v1/university/logbooks/pending') {
    req.url = '/pendingLogbooks';
  } else if (req.url.startsWith('/api/v1/university/logbooks/')) {
    req.url = req.url.replace('/api/v1/university/logbooks/', '/pendingLogbooks/');
  }
  
  next();
});
  
 

// 4. Connect the data router (Must always be at the very bottom)
server.use(router);

server.listen(5000, () => {
  console.log('🚀 Custom Portal Mock API running on http://localhost:5000');
});