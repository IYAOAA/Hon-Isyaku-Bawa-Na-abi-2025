// ===== server.js (READY TO REPLACE) =====
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const PROD = process.env.NODE_ENV === 'production';

// --- Security / headers (no extra deps)
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// --- Body + CORS
app.use(bodyParser.json());
app.set('trust proxy', 1); // needed for secure cookies on Render
app.use(cors({
  origin: true,          // reflect requester origin (Netlify)
  credentials: true
}));

// --- Sessions
app.use(
  session({
    name: 'admin.sid',
    secret: process.env.SESSION_SECRET || 'super-secret-key-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60, // 1 hour
      secure: PROD,           // true on Render (https)
      sameSite: PROD ? 'none' : 'lax'
    }
  })
);

// --- Static (optional; keep if you also host HTML here)
// app.use(express.static(path.join(__dirname)));

const DATA_DIR = path.join(__dirname, 'data');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');
const SITE_DATA_FILE = path.join(DATA_DIR, 'site.json');
const APPLICANTS_FILE = path.join(DATA_DIR, 'applicants.json');
const MEDIA_FILE = path.join(DATA_DIR, 'media.json');
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(ADMIN_FILE)) fs.writeFileSync(ADMIN_FILE, '[]');
if (!fs.existsSync(SITE_DATA_FILE)) {
  fs.writeFileSync(
    SITE_DATA_FILE,
    JSON.stringify(
      {
        home: {
          headline: "Welcome to Hon. Isyaku Bawa Na’abi 2025",
          subheadline: "A Vision for Progress and Development",
          heroImage: "assets/images/hero.jpg",
          introText: "Together, we can build a better future for our community."
        },
        settings: {
          contact: {
            email: "contact@naabi2025.org",
            phone: "+234-800-123-4567",
            address: "123 Campaign Street, Kaduna, Nigeria"
          },
          features: {
            membershipEnabled: true,
            scholarshipEnabled: true,
            empowermentEnabled: true,
            grantEnabled: true,
            loanEnabled: true
          }
        }
      },
      null,
      2
    )
  );
}
if (!fs.existsSync(APPLICANTS_FILE)) fs.writeFileSync(APPLICANTS_FILE, '[]');
if (!fs.existsSync(MEDIA_FILE)) fs.writeFileSync(MEDIA_FILE, '[]');
if (!fs.existsSync(COMMENTS_FILE)) fs.writeFileSync(COMMENTS_FILE, '[]');

// Helpers
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, data) =>
  fs.writeFileSync(file, JSON.stringify(data, null, 2));

// Auth middleware
const auth = (req, res, next) => {
  if (req.session && req.session.admin) return next();
  return res.status(401).json({ error: 'Unauthorized' });
};

// --- Health / Debug
app.get('/api/health', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ ok: true, time: Date.now() });
});

// ================= ADMIN AUTH =================

// Register
app.post('/api/admins/register', (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password)
    return res.status(400).json({ error: 'username, email, password required' });

  const admins = readJson(ADMIN_FILE);
  if (admins.find((a) => a.email === email || a.username === username)) {
    return res.status(400).json({ error: 'Username or Email already exists' });
  }
  admins.push({ id: Date.now().toString(), username, email, password });
  writeJson(ADMIN_FILE, admins);
  res.json({ message: 'Admin registered successfully' });
});

// Login
app.post('/api/admins/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: 'email and password required' });

  const admins = readJson(ADMIN_FILE);
  const admin = admins.find((a) => a.email === email && a.password === password);
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

  req.session.admin = { email: admin.email, username: admin.username, id: admin.id };
  res.json({ message: 'Login successful', admin: req.session.admin });
});

// Check session
app.get('/api/admins/check', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.session && req.session.admin) {
    return res.json({ loggedIn: true, admin: req.session.admin });
  }
  res.json({ loggedIn: false });
});

// Logout
app.post('/api/admins/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out successfully' });
  });
});

// List admins (for admin management UI)
app.get('/api/admins', auth, (req, res) => {
  const admins = readJson(ADMIN_FILE).map(({ password, ...rest }) => rest);
  res.json(admins);
});

// Reset admin password (email based)
app.post('/api/admins/reset', (req, res) => {
  const { email, newPassword } = req.body || {};
  if (!email || !newPassword)
    return res.status(400).json({ error: 'email and newPassword required' });

  const admins = readJson(ADMIN_FILE);
  const admin = admins.find((a) => a.email === email);
  if (!admin) return res.status(404).json({ error: 'Email not found' });

  admin.password = newPassword;
  writeJson(ADMIN_FILE, admins);
  res.json({ message: 'Password reset successfully' });
});

// ================= SITE CONTENT =================

// Get site data
app.get('/api/site', (req, res) => {
  const site = readJson(SITE_DATA_FILE);
  res.setHeader('Cache-Control', 'no-store');
  res.json(site);
});

// Update site data (home + settings)
app.post('/api/site', auth, (req, res) => {
  const incoming = req.body || {};
  const current = readJson(SITE_DATA_FILE);
  const updated = {
    ...current,
    home: { ...current.home, ...(incoming.home || {}) },
    settings: { ...current.settings, ...(incoming.settings || {}) }
  };
  writeJson(SITE_DATA_FILE, updated);
  res.json({ message: 'Site data updated successfully', site: updated });
});

// ================= MEDIA / GALLERY =================

app.get('/api/media', (req, res) => {
  const items = readJson(MEDIA_FILE);
  res.json(items);
});

app.post('/api/media', auth, (req, res) => {
  const { title, url } = req.body || {};
  if (!title || !url) return res.status(400).json({ error: 'title and url required' });

  const items = readJson(MEDIA_FILE);
  const item = { id: Date.now().toString(), title, url };
  items.push(item);
  writeJson(MEDIA_FILE, items);
  res.json({ message: 'Media item added', item });
});

app.delete('/api/media/:id', auth, (req, res) => {
  const id = req.params.id;
  let items = readJson(MEDIA_FILE);
  const before = items.length;
  items = items.filter((i) => i.id !== id);
  if (items.length === before) return res.status(404).json({ error: 'Not found' });
  writeJson(MEDIA_FILE, items);
  res.json({ message: 'Media item removed' });
});

// ================= COMMENTS / TRIBUTES =================

app.get('/api/comments', auth, (req, res) => {
  const comments = readJson(COMMENTS_FILE);
  res.json(comments);
});

app.post('/api/comments', (req, res) => {
  // Public submission endpoint (optional)
  const { name, text } = req.body || {};
  if (!name || !text) return res.status(400).json({ error: 'name and text required' });

  const comments = readJson(COMMENTS_FILE);
  const comment = { id: Date.now().toString(), name, text, approved: false };
  comments.push(comment);
  writeJson(COMMENTS_FILE, comments);
  res.json({ message: 'Comment submitted, pending approval', comment });
});

app.post('/api/comments/:id/moderate', auth, (req, res) => {
  const id = req.params.id;
  const { approved } = req.body || {};
  const comments = readJson(COMMENTS_FILE);
  const c = comments.find((x) => x.id === id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  c.approved = !!approved;
  writeJson(COMMENTS_FILE, comments);
  res.json({ message: 'Comment updated', comment: c });
});

// ================= APPLICANTS =================
// (Assuming submissions from public site hit /api/applicants via POST)
app.get('/api/applicants', auth, (req, res) => {
  const applicants = readJson(APPLICANTS_FILE);
  res.json(applicants);
});

app.post('/api/applicants', (req, res) => {
  // Public submission (example fields)
  const { name, email, program, note } = req.body || {};
  if (!name || !email || !program)
    return res.status(400).json({ error: 'name, email, program required' });

  const applicants = readJson(APPLICANTS_FILE);
  const appItem = {
    id: Date.now().toString(),
    name,
    email,
    program, // membership, scholarship, etc.
    note: note || '',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  applicants.push(appItem);
  writeJson(APPLICANTS_FILE, applicants);
  res.json({ message: 'Application received', applicant: appItem });
});

app.post('/api/applicants/:id/status', auth, (req, res) => {
  const id = req.params.id;
  const { status } = req.body || {}; // 'approved' | 'rejected' | 'pending'
  if (!status) return res.status(400).json({ error: 'status required' });

  const applicants = readJson(APPLICANTS_FILE);
  const a = applicants.find((x) => x.id === id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  a.status = status;
  writeJson(APPLICANTS_FILE, applicants);
  res.json({ message: 'Applicant status updated', applicant: a });
});

// ================= OPTIONAL: ROUTES FOR HTML (if hosted here) =================
// app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
// app.get('/admin-login', (req, res) => res.sendFile(path.join(__dirname, 'admin-login.html')));
// app.get('/admindash', (req, res) => res.sendFile(path.join(__dirname, 'admindash.html')));

// Start
app.listen(PORT, () => {
  console.log(`Server running on :${PORT}`);
});
