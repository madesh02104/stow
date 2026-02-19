const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middleware/auth");
const crypto = require("crypto");

/**
 * Chain of Custody State Machine
 * Pending  -->  In-Custody  -->  Completed
 *
 * Flow:
 *  1. Provider generates a one-time QR token for handover
 *  2. Seeker scans QR → POST /custody/:id/scan  →  Pending → In-Custody
 *  3. Provider generates another QR token for return
 *  4. Seeker scans QR → POST /custody/:id/scan  →  In-Custody → Completed
 */

// ---------- Generate QR token (Provider only) ----------
router.post("/:bookingId/generate-qr", auth, async (req, res, next) => {
  try {
    const booking = await db.query("SELECT * FROM bookings WHERE id = $1", [
      req.params.bookingId,
    ]);
    if (!booking.rows.length)
      return res.status(404).json({ error: "Booking not found" });

    const b = booking.rows[0];

    // Only the provider (lister) can generate QR
    if (b.provider_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Only the space provider can generate QR codes" });
    }

    if (b.custody_state === "Completed") {
      return res
        .status(400)
        .json({ error: "This booking is already completed" });
    }

    // Generate a fresh one-time token
    const scanToken = crypto.randomUUID();
    const action = b.custody_state === "Pending" ? "handover" : "return";

    await db.query(
      "UPDATE bookings SET qr_code_token = $1, updated_at = NOW() WHERE id = $2",
      [scanToken, b.id],
    );

    res.json({
      scanToken,
      action,
      bookingId: b.id,
      custody_state: b.custody_state,
    });
  } catch (err) {
    next(err);
  }
});

// ---------- Scan QR (Seeker only) — advances custody state ----------
router.post("/:bookingId/scan", auth, async (req, res, next) => {
  try {
    const { scanToken } = req.body;
    if (!scanToken) {
      return res.status(400).json({ error: "scanToken is required" });
    }

    const booking = await db.query("SELECT * FROM bookings WHERE id = $1", [
      req.params.bookingId,
    ]);
    if (!booking.rows.length)
      return res.status(404).json({ error: "Booking not found" });

    const b = booking.rows[0];

    // Only the seeker can scan
    if (b.seeker_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Only the seeker can scan QR codes" });
    }

    // Verify the token matches
    if (scanToken !== b.qr_code_token) {
      return res.status(400).json({ error: "Invalid or expired QR code" });
    }

    if (b.custody_state === "Completed") {
      return res
        .status(400)
        .json({ error: "This booking is already completed" });
    }

    // Advance state
    let result;
    if (b.custody_state === "Pending") {
      result = await db.query(
        `UPDATE bookings SET
           custody_state = 'In-Custody',
           status = 'in_custody',
           handed_over_at = NOW(),
           qr_code_token = NULL,
           updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [b.id],
      );
    } else if (b.custody_state === "In-Custody") {
      result = await db.query(
        `UPDATE bookings SET
           custody_state = 'Completed',
           status = 'completed',
           regotten_at = NOW(),
           qr_code_token = NULL,
           updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [b.id],
      );
    } else {
      return res
        .status(400)
        .json({ error: `Cannot transition from state "${b.custody_state}"` });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ---------- Hand-over (Pending -> In-Custody) — legacy/manual ----------
router.patch("/:bookingId/handover", auth, async (req, res, next) => {
  try {
    const { qr_code_token } = req.body;
    const booking = await db.query("SELECT * FROM bookings WHERE id = $1", [
      req.params.bookingId,
    ]);
    if (!booking.rows.length)
      return res.status(404).json({ error: "Booking not found" });

    const b = booking.rows[0];

    // Only provider or seeker can trigger
    if (b.provider_id !== req.user.id && b.seeker_id !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (b.custody_state !== "Pending") {
      return res
        .status(400)
        .json({ error: `Cannot hand-over from state "${b.custody_state}"` });
    }

    // Optionally verify QR token
    if (qr_code_token && qr_code_token !== b.qr_code_token) {
      return res.status(400).json({ error: "QR token mismatch" });
    }

    const result = await db.query(
      `UPDATE bookings SET
         custody_state = 'In-Custody',
         status = 'in_custody',
         handed_over_at = NOW(),
         updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.bookingId],
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ---------- Re-gotten / Complete (In-Custody -> Completed) ----------
router.patch("/:bookingId/complete", auth, async (req, res, next) => {
  try {
    const { qr_code_token } = req.body;
    const booking = await db.query("SELECT * FROM bookings WHERE id = $1", [
      req.params.bookingId,
    ]);
    if (!booking.rows.length)
      return res.status(404).json({ error: "Booking not found" });

    const b = booking.rows[0];

    if (b.provider_id !== req.user.id && b.seeker_id !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (b.custody_state !== "In-Custody") {
      return res
        .status(400)
        .json({ error: `Cannot complete from state "${b.custody_state}"` });
    }

    if (qr_code_token && qr_code_token !== b.qr_code_token) {
      return res.status(400).json({ error: "QR token mismatch" });
    }

    const result = await db.query(
      `UPDATE bookings SET
         custody_state = 'Completed',
         status = 'completed',
         regotten_at = NOW(),
         updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.bookingId],
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ---------- Get custody info ----------
router.get("/:bookingId", auth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, custody_state, qr_code_token, handed_over_at, regotten_at, status
       FROM bookings WHERE id = $1`,
      [req.params.bookingId],
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
