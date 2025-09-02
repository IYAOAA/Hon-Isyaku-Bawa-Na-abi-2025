// server.js — JWT-based auth, file JSON store, token blacklist on logout
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'change_this_to_a_strong_secret_in_prod';
const DATA_DIR = path.join(__dirname, 'data');

const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');
const SITE_FILE = path.join(DATA_DIR, 'site.json');
const APPLICANTS_FILE = path.join(DATA_DIR, 'applicants.json');
const MEDIA_FILE = path.join(DATA_DIR, 'media.json');
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json');
const BLACKLIST_FILE = path.join(DATA_DIR, 'blacklist.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(ADMIN_FILE)) fs.writeFileSync(ADMIN_FILE, '[]');
if (!fs.existsSync(SITE_FILE)) fs.writeFileSync(SITE_FILE, JSON.stringify({
  home: {
    headline: "Welcome to Hon. Isyaku Bawa Na’abi 2025",
    subheadline: "A Vision for Progress and Development",
    heroImage: "assets/images/hero.jpg",
    introText: "Together, we can build a better future for our community."
  },
  settings: {
    contact: { email: "contact@naabi2025.org", phone: "+234-800-123-4567", address: "123 Campaign Street, Kaduna, Nigeria" },
    features: {}
  }
}, null, 2));
if (!fs.existsSync(APPLICANTS_FILE)) fs.writeFileSync(APPLICANTS_FILE, '[]');
if (!fs.existsSync(MEDIA_FILE)) fs.writeFileSync(MEDIA_FILE, '[]');
if (!fs.existsSync(COMMENTS_FILE)) fs.writeFileSync(COMMENTS_FILE, '[]');
if (!fs.existsSync(BLACKLIST_FILE)) fs.writeFileSync(BLACKLIST_FILE, '[]');

// --- helpers
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 2));

// --- CORS
app.use(bodyParser.json());
app.use(cors({
  origin: true,                // reflect request origin
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// security header small hardening
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// --- blacklist helpers
const loadBlacklist = () => readJson(BLACKLIST_FILE);
const addToBlacklist = (token, expTs = null) => {
  const list = loadBlacklist();
  list.push({ token, exp: expTs });
  writeJson(BLACKLIST_FILE, list);
};
const isBlacklisted = (token) => {
  const list = loadBlacklist();
  // clean expired entries (optional)
  const now = Math.floor(Date.now() / 1000);
  const alive = list.filter(x => !x.exp || x.exp > now);
  if (alive.length !== list.length) writeJson(BLACKLIST_FILE, alive);
  return alive.some(x => x.token === token);
};

// --- auth middleware (header: Authorization: Bearer <token>)
const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice(7);
  if (isBlacklisted(token)) return res.status(401).json({ error: 'Token invalidated' });
  try {
    const decoded = jwt.verify(token, SECRET);
    req.admin = decoded; // { id, email, username, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// --- Admin endpoints
app.post('/api/admins/register', (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) return res.status(400).json({ error: 'username, email, password required' });

  const admins = readJson(ADMIN_FILE);
  if (admins.find(a => a.username === username || a.email === email)) {
    return res.status(400).json({ error: 'Username or email already exists' });
  }
  const admin = { id: Date.now().toString(), username, email, password };
  admins.push(admin);
  writeJson(ADMIN_FILE, admins);
  res.json({ message: 'Admin registered' });
});

app.post('/api/admins/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const admins = readJson(ADMIN_FILE);
  const admin = admins.find(a => a.email === email && a.password === password);
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

  const payload = { id: admin.id, email: admin.email, username: admin.username };
  const token = jwt.sign(payload, SECRET, { expiresIn: '8h' }); // token valid 8 hours
  res.json({ message: 'Login successful', token, admin: payload });
});

app.get('/api/admins/check', (req, res) => {
  // check token from header; if valid, return loggedIn true
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.json({ loggedIn: false });
  const token = auth.slice(7);
  if (isBlacklisted(token)) return res.json({ loggedIn: false });
  try {
    const decoded = jwt.verify(token, SECRET);
    return res.json({ loggedIn: true, admin: { id: decoded.id, email: decoded.email, username: decoded.username } });
  } catch (err) {
    return res.json({ loggedIn: false });
  }
});

app.post('/api/admins/logout', (req, res) => {
  // get token from header and blacklist it
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.json({ message: 'No token provided' });
  const token = auth.slice(7);
  try {
    const decoded = jwt.decode(token) || {};
    addToBlacklist(token, decoded.exp || null);
  } catch (err) {
    addToBlacklist(token, null);
  }
  res.json({ message: 'Logged out' });
});

app.get('/api/admins', authenticate, (req, res) => {
  const admins = readJson(ADMIN_FILE).map(({ password, ...rest }) => rest);
  res.json(admins);
});

app.post('/api/admins/reset', (req, res) => {
  const { email, newPassword } = req.body || {};
  if (!email || !newPassword) return res.status(400).json({ error: 'email and newPassword required' });

  const admins = readJson(ADMIN_FILE);
  const admin = admins.find(a => a.email === email);
  if (!admin) return res.status(404).json({ error: 'Email not found' });
  admin.password = newPassword;
  writeJson(ADMIN_FILE, admins);
  res.json({ message: 'Password reset' });
});

// --- Site content
app.get('/api/site', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json(readJson(SITE_FILE));
});

app.post('/api/site', authenticate, (req, res) => {
  const incoming = req.body || {};
  const current = readJson(SITE_FILE);
  const updated = {
    ...current,
    home: { ...current.home, ...(incoming.home || {}) },
    settings: { ...current.settings, ...(incoming.settings || {}) }
  };
  writeJson(SITE_FILE, updated);
  res.json({ message: 'Site updated', site: updated });
});

// --- Media
app.get('/api/media', (req, res) => res.json(readJson(MEDIA_FILE)));
app.post('/api/media', authenticate, (req, res) => {
  const { title, url } = req.body || {};
  if (!title || !url) return res.status(400).json({ error: 'title and url required' });
  const items = readJson(MEDIA_FILE);
  const item = { id: Date.now().toString(), title, url };
  items.push(item);
  writeJson(MEDIA_FILE, items);
  res.json({ message: 'Media added', item });
});
app.delete('/api/media/:id', authenticate, (req, res) => {
  const id = req.params.id;
  let items = readJson(MEDIA_FILE);
  const before = items.length;
  items = items.filter(i => i.id !== id);
  if (items.length === before) return res.status(404).json({ error: 'Not found' });
  writeJson(MEDIA_FILE, items);
  res.json({ message: 'Deleted' });
});

// --- Comments / tributes
app.get('/api/comments', authenticate, (req, res) => res.json(readJson(COMMENTS_FILE)));
app.post('/api/comments', (req, res) => {
  const { name, text } = req.body || {};
  if (!name || !text) return res.status(400).json({ error: 'name and text required' });
  const comments = readJson(COMMENTS_FILE);
  const comment = { id: Date.now().toString(), name, text, approved: false };
  comments.push(comment);
  writeJson(COMMENTS_FILE, comments);
  res.json({ message: 'Submitted', comment });
});
app.post('/api/comments/:id/moderate', authenticate, (req, res) => {
  const id = req.params.id;
  const { approved } = req.body || {};
  const comments = readJson(COMMENTS_FILE);
  const c = comments.find(x => x.id === id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  c.approved = !!approved;
  writeJson(COMMENTS_FILE, comments);
  res.json({ message: 'Updated', comment: c });
});

// --- Applicants
app.get('/api/applicants', authenticate, (req, res) => res.json(readJson(APPLICANTS_FILE)));
app.post('/api/applicants', (req, res) => {
  const { name, email, program, note } = req.body || {};
  if (!name || !email || !program) return res.status(400).json({ error: 'name, email, program required' });
  const items = readJson(APPLICANTS_FILE);
  const appItem = { id: Date.now().toString(), name, email, program, note: note || '', status: 'pending', createdAt: new Date().toISOString() };
  items.push(appItem);
  writeJson(APPLICANTS_FILE, items);
  res.json({ message: 'Application received', applicant: appItem });
});
app.post('/api/applicants/:id/status', authenticate, (req, res) => {
  const id = req.params.id;
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: 'status required' });
  const applicants = readJson(APPLICANTS_FILE);
  const a = applicants.find(x => x.id === id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  a.status = status;
  writeJson(APPLICANTS_FILE, applicants);
  res.json({ message: 'Applicant updated', applicant: a });
});

// --- Start
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
