const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const auth = require("../middleware/auth");

// ---------- Register ----------
router.post("/register", async (req, res, next) => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) {
      return res
        .status(400)
        .json({ error: "Name, phone, and password are required" });
    }

    const exists = await db.query("SELECT id FROM users WHERE phone = $1", [
      phone,
    ]);
    if (exists.rows.length) {
      return res.status(409).json({ error: "Phone number already registered" });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      "INSERT INTO users (name, phone, password_hash) VALUES ($1, $2, $3) RETURNING id, name, phone, created_at",
      [name, phone, hash],
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      },
    );

    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
});

// ---------- Login ----------
router.post("/login", async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: "Phone and password are required" });
    }

    const result = await db.query("SELECT * FROM users WHERE phone = $1", [
      phone,
    ]);
    if (!result.rows.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      },
    );

    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    next(err);
  }
});

// ---------- Current user ----------
router.get("/me", auth, async (req, res, next) => {
  try {
    const result = await db.query(
      "SELECT id, name, phone, email, avatar_url, id_verified, created_at FROM users WHERE id = $1",
      [req.user.id],
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ---------- Update profile ----------
router.put("/me", auth, async (req, res, next) => {
  try {
    const { name, email, avatar_url } = req.body;
    const result = await db.query(
      `UPDATE users SET
         name = COALESCE($1, name),
         email = COALESCE($2, email),
         avatar_url = COALESCE($3, avatar_url),
         updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, phone, email, avatar_url, id_verified, created_at`,
      [name, email, avatar_url, req.user.id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
