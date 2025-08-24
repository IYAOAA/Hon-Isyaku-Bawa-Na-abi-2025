const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname))); // Serve frontend files

const DATA_FILE = path.join(__dirname, 'data', 'admin.json');

// Ensure data folder and file exist
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]');
}

// Read admins
app.get('/admins', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read admin data' });
    res.json(JSON.parse(data));
  });
});

// Register new admin
app.post('/admins/register', (req, res) => {
  const { username, password } = req.body;
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read admin data' });

    let admins = JSON.parse(data);
    if (admins.find(a => a.username === username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    admins.push({ username, password });
    fs.writeFile(DATA_FILE, JSON.stringify(admins, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Failed to save admin' });
      res.json({ message: 'Admin registered successfully' });
    });
  });
});

// Login admin
app.post('/admins/login', (req, res) => {
  const { username, password } = req.body;
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read admin data' });

    let admins = JSON.parse(data);
    const admin = admins.find(a => a.username === username && a.password === password);

    if (admin) {
      res.json({ message: 'Login successful' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// Reset password
app.post('/admins/reset', (req, res) => {
  const { username, newPassword } = req.body;
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read admin data' });

    let admins = JSON.parse(data);
    const admin = admins.find(a => a.username === username);

    if (!admin) {
      return res.status(404).json({ error: 'Username not found' });
    }

    admin.password = newPassword;
    fs.writeFile(DATA_FILE, JSON.stringify(admins, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Failed to reset password' });
      res.json({ message: 'Password reset successfully' });
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
