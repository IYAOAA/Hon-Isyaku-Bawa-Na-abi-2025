const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;
const ADMIN_FILE = path.join(__dirname, 'admins.json');

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('.')); // serve your HTML/CSS/JS files

// Helper: Load admins from file
function loadAdmins() {
  if (!fs.existsSync(ADMIN_FILE)) return [];
  return JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
}

// Helper: Save admins to file
function saveAdmins(admins) {
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(admins, null, 2));
}

// Register Admin
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  let admins = loadAdmins();

  if (admins.find(a => a.username === username)) {
    return res.status(400).json({ success: false, message: 'Username already exists' });
  }

  admins.push({ username, password });
  saveAdmins(admins);
  res.json({ success: true, message: 'Registration successful!' });
});

// Login Admin
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  let admins = loadAdmins();

  const found = admins.find(a => a.username === username && a.password === password);
  if (found) {
    res.json({ success: true, message: 'Login successful!' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Reset Password
app.post('/reset', (req, res) => {
  const { username, newPassword } = req.body;
  let admins = loadAdmins();

  let admin = admins.find(a => a.username === username);
  if (!admin) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  admin.password = newPassword;
  saveAdmins(admins);
  res.json({ success: true, message: 'Password reset successful!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
