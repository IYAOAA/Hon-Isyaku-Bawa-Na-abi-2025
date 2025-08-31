const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: true,           // Allow your frontend domain (Netlify, etc.)
  credentials: true       // Allow cookies
}));

// Session middleware (keeps user logged in)
app.use(session({
  secret: 'super-secret-key', // Change to a strong secret in production
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // ❌ Set to true if you have HTTPS on Render
    httpOnly: true,
    maxAge: 1000 * 60 * 60 // 1 hour session
  }
}));

app.use(express.static(path.join(__dirname))); // Serve frontend files

// File paths
const DATA_DIR = path.join(__dirname, 'data');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');
const SITE_DATA_FILE = path.join(DATA_DIR, 'data.json');

// Ensure data folder and files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(ADMIN_FILE)) fs.writeFileSync(ADMIN_FILE, '[]');
if (!fs.existsSync(SITE_DATA_FILE)) {
  fs.writeFileSync(SITE_DATA_FILE, JSON.stringify({
    home: {
      headline: "Welcome to Hon. Isyaku Bawa Na’abi 2025",
      subheadline: "A Vision for Progress and Development",
      heroImage: "assets/images/hero.jpg",
      introText: "Together, we can build a better future for our community."
    },
    about: {
      title: "About Hon. Isyaku Bawa Na’abi",
      content: "Hon. Isyaku Bawa Na’abi is a visionary leader committed to transparency, accountability, and sustainable development. With years of experience in public service, he aims to bring progress to every corner of our society.",
      profileImage: "assets/images/profile.jpg"
    },
    products: [],
    events: [],
    contact: {
      email: "contact@naabi2025.org",
      phone: "+234-800-123-4567",
      address: "123 Campaign Street, Kaduna, Nigeria"
    }
  }, null, 2));
}

// ========== ROUTES ==========

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/admindash', (req, res) => {
  if (req.session.admin) {
    res.sendFile(path.join(__dirname, 'admindashboard.html'));
  } else {
    res.redirect('/admin-login.html'); // force login
  }
});

// ====== ADMIN MANAGEMENT API ======

// Register new admin
app.post('/api/admins/register', (req, res) => {
  const { username, email, password } = req.body;
  fs.readFile(ADMIN_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read admin data' });

    let admins = JSON.parse(data);
    if (admins.find(a => a.username === username || a.email === email)) {
      return res.status(400).json({ error: 'Username or Email already exists' });
    }

    admins.push({ username, email, password });
    fs.writeFile(ADMIN_FILE, JSON.stringify(admins, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Failed to save admin' });
      res.json({ message: 'Admin registered successfully' });
    });
  });
});

// Admin login
app.post('/api/admins/login', (req, res) => {
  const { email, password } = req.body;
  fs.readFile(ADMIN_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read admin data' });

    let admins = JSON.parse(data);
    const admin = admins.find(a => a.email === email && a.password === password);

    if (admin) {
      req.session.admin = { email: admin.email, username: admin.username };
      res.json({ message: 'Login successful', email: admin.email });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// Check if logged in
app.get('/api/admins/check', (req, res) => {
  if (req.session.admin) {
    res.json({ loggedIn: true, admin: req.session.admin });
  } else {
    res.json({ loggedIn: false });
  }
});

// Logout
app.post('/api/admins/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out successfully' });
  });
});

// ====== SITE CONTENT API ======

// Get site data
app.get('/api/site', (req, res) => {
  fs.readFile(SITE_DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read site data' });
    res.json(JSON.parse(data));
  });
});

// Update site data (only if logged in)
app.post('/api/site', (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  fs.writeFile(SITE_DATA_FILE, JSON.stringify(req.body, null, 2), (err) => {
    if (err) return res.status(500).json({ error: 'Failed to save site data' });
    res.json({ message: 'Site data updated successfully' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
