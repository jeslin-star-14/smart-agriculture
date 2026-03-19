// backend/src/controllers/authController.js
import jwt      from "jsonwebtoken";
import bcrypt   from "bcryptjs";
import mongoose from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET || "agrisense_dev_secret_2024";

// ── User Schema ───────────────────────────────────────────────
let UserModel = null;

function getUser() {
  if (UserModel) return UserModel;
  try { return (UserModel = mongoose.model("User")); } catch {}

  const schema = new mongoose.Schema({
    name:     { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
  }, { timestamps: true });

  schema.index({ email: 1 },    { unique: true });
  schema.index({ username: 1 }, { unique: true });

  UserModel = mongoose.model("User", schema);
  return UserModel;
}

function makeToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
function dbOk() { return mongoose.connection.readyState === 1; }

function validatePassword(pw) {
  const errors = [];
  if (pw.length < 8)             errors.push("at least 8 characters");
  if (!/[A-Z]/.test(pw))         errors.push("one uppercase letter (A-Z)");
  if (!/[a-z]/.test(pw))         errors.push("one lowercase letter (a-z)");
  if (!/[0-9]/.test(pw))         errors.push("one number (0-9)");
  if (!/[^A-Za-z0-9]/.test(pw))  errors.push("one special character (!@#$%^&*)");
  return errors;
}

// ── POST /api/auth/check ──────────────────────────────────────
// Live availability check used by the register form
export async function checkAvailability(req, res) {
  try {
    if (!dbOk()) return res.json({ taken: false });
    const User = getUser();
    const { email, username } = req.body || {};

    if (email) {
      const exists = await User.findOne({ email: email.toLowerCase() });
      return res.json({
        taken:   !!exists,
        message: exists ? "This email is already registered." : "",
      });
    }
    if (username) {
      const exists = await User.findOne({ username: username.toLowerCase() });
      return res.json({
        taken:   !!exists,
        message: exists ? "Username @" + username + " is already taken." : "",
      });
    }
    return res.json({ taken: false });
  } catch (err) {
    return res.json({ taken: false });
  }
}

// ── POST /api/auth/register ───────────────────────────────────
export async function register(req, res) {
  try {
    const { name, username, email, password } = req.body || {};

    if (!name || !username || !email || !password)
      return res.status(400).json({ message: "All fields are required." });

    if (username.length < 3)
      return res.status(400).json({ message: "Username must be at least 3 characters." });
    if (username.length > 20)
      return res.status(400).json({ message: "Username must be 20 characters or less." });
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return res.status(400).json({ message: "Username: only letters, numbers and _ allowed." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: "Enter a valid email address." });

    const pwErrors = validatePassword(password);
    if (pwErrors.length > 0)
      return res.status(400).json({ message: "Password needs: " + pwErrors.join(", ") + "." });

    if (!dbOk())
      return res.status(503).json({ message: "Database not connected." });

    const User = getUser();

    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists)
      return res.status(409).json({ message: "EMAIL_TAKEN: This email is already registered." });

    const usernameExists = await User.findOne({ username: username.toLowerCase() });
    if (usernameExists)
      return res.status(409).json({ message: "USERNAME_TAKEN: @" + username + " is already taken." });

    const hashed = await bcrypt.hash(password, 12);
    const user   = new User({ name, username: username.toLowerCase(), email: email.toLowerCase(), password: hashed });
    await user.save();

    const token = makeToken({ id: user._id, email: user.email, username: user.username });
    return res.status(201).json({
      message: "Account created!",
      token,
      user: { id: user._id, name: user.name, username: user.username, email: user.email },
    });

  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      return res.status(409).json({
        message: field === "email" ? "EMAIL_TAKEN: This email is already registered."
                                  : "USERNAME_TAKEN: This username is already taken.",
      });
    }
    console.error("Register error:", err.message);
    return res.status(500).json({ message: "Server error: " + err.message });
  }
}

// ── POST /api/auth/login ──────────────────────────────────────
export async function login(req, res) {
  try {
    const { emailOrUsername, password } = req.body || {};

    if (!emailOrUsername || !password)
      return res.status(400).json({ message: "Email/username and password are required." });

    // Demo account
    if (emailOrUsername.trim().toLowerCase() === "demo@agri.com" && password === "demo1234") {
      const token = makeToken({ id: "demo_user", email: "demo@agri.com", username: "demo" });
      return res.json({ token, user: { id: "demo_user", name: "Demo Farmer", username: "demo", email: "demo@agri.com" } });
    }

    if (!dbOk())
      return res.status(503).json({ message: "Database not connected. Use demo@agri.com / demo1234." });

    const User    = getUser();
    const isEmail = emailOrUsername.includes("@");
    const user    = isEmail
      ? await User.findOne({ email:    emailOrUsername.toLowerCase() })
      : await User.findOne({ username: emailOrUsername.toLowerCase() });

    if (!user)
      return res.status(401).json({ message: isEmail ? "No account with this email." : "No account with username @" + emailOrUsername + "." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Incorrect password." });

    const token = makeToken({ id: user._id, email: user.email, username: user.username });
    return res.json({ token, user: { id: user._id, name: user.name, username: user.username, email: user.email } });

  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ message: "Server error: " + err.message });
  }
}

// ── PUT /api/auth/profile ─────────────────────────────────────
export async function updateProfile(req, res) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "").trim();
    if (!token) return res.status(401).json({ message: "Not authenticated." });
    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); }
    catch { return res.status(401).json({ message: "Invalid token." }); }
    if (decoded.id === "demo_user")
      return res.json({ user: { id: "demo_user", name: req.body.name || "Demo Farmer", username: "demo", email: decoded.email } });
    if (!dbOk()) return res.status(503).json({ message: "Database not connected." });
    const User = getUser();
    const user = await User.findByIdAndUpdate(decoded.id, { name: req.body.name }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json({ user: { id: user._id, name: user.name, username: user.username, email: user.email } });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
}

// ── GET /api/auth/verify ──────────────────────────────────────
// Called on page load to check if saved token is still valid
export async function verifyToken(req, res) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "").trim();
    if (!token) return res.status(401).json({ message: "No token." });

    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); }
    catch { return res.status(401).json({ message: "Token expired or invalid." }); }

    // Demo user
    if (decoded.id === "demo_user") {
      return res.json({ valid: true, user: { id: "demo_user", name: "Demo Farmer", username: "demo", email: "demo@agri.com" } });
    }

    // Real user — fetch fresh from DB
    if (!dbOk()) {
      // DB not connected but token exists — trust token data
      return res.json({ valid: true, user: { id: decoded.id, email: decoded.email, username: decoded.username } });
    }

    const User = getUser();
    const user = await User.findById(decoded.id).lean();
    if (!user) return res.status(401).json({ message: "User not found." });

    return res.json({
      valid: true,
      user: { id: user._id, name: user.name, username: user.username, email: user.email },
    });
  } catch (err) {
    return res.status(401).json({ message: "Verification failed." });
  }
}