const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname))); // Serve all frontend files

// File paths
const DATA_DIR = path.join(__dirname, 'data');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');
const SITE_DATA_FILE = path.join(DATA_DIR, 'data.json');

// Simple in-memory session (will reset when server restarts)
let loggedInAdmins = new Set();

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
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});
app.get('/admindashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'admindashboard.html'));
});

// ====== ADMIN MANAGEMENT API ======

// Read admins
app.get('/api/admins', (req, res) => {
  fs.readFile(ADMIN_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read admin data' });
    res.json(JSON.parse(data));
  });
});

// Register new admin
app.post('/api/admins/register', (req, res) => {
  const { username, password } = req.body;
  fs.readFile(ADMIN_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read admin data' });

    let admins = JSON.parse(data);
    if (admins.find(a => a.username === username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    admins.push({ username, password });
    fs.writeFile(ADMIN_FILE, JSON.stringify(admins, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Failed to save admin' });
      res.json({ message: 'Admin registered successfully' });
    });
  });
});

// Admin login
app.post('/api/admins/login', (req, res) => {
  const { username, password } = req.body;
  fs.readFile(ADMIN_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read admin data' });

    let admins = JSON.parse(data);
    const admin = admins.find(a => a.username === username && a.password === password);

    if (admin) {
      loggedInAdmins.add(username);
      res.json({ message: 'Login successful', username });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// Reset password
app.post('/api/admins/reset', (req, res) => {
  const { username, newPassword } = req.body;
  fs.readFile(ADMIN_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read admin data' });

    let admins = JSON.parse(data);
    const admin = admins.find(a => a.username === username);

    if (!admin) {
      return res.status(404).json({ error: 'Username not found' });
    }

    admin.password = newPassword;
    fs.writeFile(ADMIN_FILE, JSON.stringify(admins, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Failed to reset password' });
      res.json({ message: 'Password reset successfully' });
    });
  });
});

// Logout route
app.post('/api/admins/logout', (req, res) => {
  const { username } = req.body;
  loggedInAdmins.delete(username);
  res.json({ message: 'Logged out successfully' });
});

// Check if logged in (for frontend to validate)
app.get('/api/admins/check/:username', (req, res) => {
  const { username } = req.params;
  res.json({ loggedIn: loggedInAdmins.has(username) });
});

// ====== SITE CONTENT API ======

// Get site data
app.get('/api/site', (req, res) => {
  fs.readFile(SITE_DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read site data' });
    res.json(JSON.parse(data));
  });
});

// Update site data (from admin panel)
app.post('/api/site', (req, res) => {
  fs.writeFile(SITE_DATA_FILE, JSON.stringify(req.body, null, 2), (err) => {
    if (err) return res.status(500).json({ error: 'Failed to save site data' });
    res.json({ message: 'Site data updated successfully' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
