const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middleware/auth");
const {
  hasOverlap,
  calculatePrice,
  pricingBreakdown,
  calculateParkingPrice,
  parkingPricingBreakdown,
  remainingArea,
} = require("../utils/timeSlots");

// ---------- Price preview (no auth required) ----------
router.post("/preview-price", async (req, res, next) => {
  try {
    const { listing_id, start_time, end_time } = req.body;
    const listingRes = await db.query(
      "SELECT length_ft, width_ft, type, subtypes, vehicle_type FROM listings WHERE id = $1",
      [listing_id],
    );
    if (!listingRes.rows.length)
      return res.status(404).json({ error: "Listing not found" });
    const l = listingRes.rows[0];

    if (l.type === "parking") {
      const isCovered = (l.subtypes || []).includes("Covered");
      res.json(
        parkingPricingBreakdown(
          start_time,
          end_time,
          isCovered,
          l.vehicle_type,
        ),
      );
    } else {
      const areaSqft = l.length_ft * l.width_ft;
      res.json(pricingBreakdown(start_time, end_time, areaSqft));
    }
  } catch (err) {
    next(err);
  }
});

// ---------- Create booking ----------
router.post("/", auth, async (req, res, next) => {
  try {
    const {
      listing_id,
      sub_slot_id,
      start_time,
      end_time,
      item_photos,
      item_description,
    } = req.body;

    // Fetch listing
    const listingRes = await db.query("SELECT * FROM listings WHERE id = $1", [
      listing_id,
    ]);
    if (!listingRes.rows.length)
      return res.status(404).json({ error: "Listing not found" });
    const listing = listingRes.rows[0];

    if (listing.owner_id === req.user.id) {
      return res.status(400).json({ error: "Cannot book your own listing" });
    }

    // Check overlaps on this slot / listing
    const target = sub_slot_id || listing_id;
    const col = sub_slot_id ? "sub_slot_id" : "listing_id";
    const existing = await db.query(
      `SELECT start_time, end_time FROM bookings
       WHERE ${col} = $1 AND status NOT IN ('cancelled','completed')`,
      [target],
    );

    if (hasOverlap(existing.rows, start_time, end_time)) {
      return res.status(409).json({ error: "Time slot already booked" });
    }

    // Calculate price — parking uses flat rate, storage uses area-based
    let total_price;
    if (listing.type === "parking") {
      const isCovered = (listing.subtypes || []).includes("Covered");
      total_price = calculateParkingPrice(
        start_time,
        end_time,
        isCovered,
        listing.vehicle_type,
      );
    } else {
      const areaSqft = listing.length_ft * listing.width_ft;
      total_price = calculatePrice(start_time, end_time, areaSqft);
    }
    const { differenceInMinutes } = require("date-fns");
    const duration_minutes = differenceInMinutes(
      new Date(end_time),
      new Date(start_time),
    );

    const result = await db.query(
      `INSERT INTO bookings
        (listing_id, sub_slot_id, seeker_id, provider_id, start_time, end_time, duration_minutes, total_price, status, custody_state, item_photos, item_description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'confirmed','Pending',$9,$10)
       RETURNING *`,
      [
        listing_id,
        sub_slot_id || null,
        req.user.id,
        listing.owner_id,
        start_time,
        end_time,
        duration_minutes,
        total_price,
        item_photos || [],
        item_description || "",
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ---------- My bookings (seeker) ----------
router.get("/mine", auth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT b.*, l.title as listing_title, l.address, l.type as listing_type,
              l.image_url, u.name as provider_name
       FROM bookings b
       JOIN listings l ON b.listing_id = l.id
       JOIN users u ON b.provider_id = u.id
       WHERE b.seeker_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ---------- Provider bookings ----------
router.get("/provider", auth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT b.*, l.title as listing_title, l.address, l.type as listing_type,
              u.name as seeker_name
       FROM bookings b
       JOIN listings l ON b.listing_id = l.id
       JOIN users u ON b.seeker_id = u.id
       WHERE b.provider_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ---------- Single booking ----------
router.get("/:id", auth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT b.*, l.title as listing_title, l.address, l.type as listing_type,
              l.image_url, lister.name as provider_name, seeker.name as seeker_name
       FROM bookings b
       JOIN listings l ON b.listing_id = l.id
       JOIN users lister ON b.provider_id = lister.id
       JOIN users seeker ON b.seeker_id = seeker.id
       WHERE b.id = $1`,
      [req.params.id],
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Not found" });
    const booking = result.rows[0];
    if (
      booking.seeker_id !== req.user.id &&
      booking.provider_id !== req.user.id
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

// ---------- Cancel booking ----------
// Refund policy: cancel 24+ hrs before start_time → 100% refund, else 0%
router.patch("/:id/cancel", auth, async (req, res, next) => {
  try {
    const booking = await db.query("SELECT * FROM bookings WHERE id = $1", [
      req.params.id,
    ]);
    if (!booking.rows.length)
      return res.status(404).json({ error: "Not found" });

    const b = booking.rows[0];
    if (b.seeker_id !== req.user.id)
      return res.status(403).json({ error: "Forbidden" });

    if (b.status === "cancelled")
      return res.status(400).json({ error: "Already cancelled" });

    if (b.custody_state === "In-Custody")
      return res
        .status(400)
        .json({ error: "Cannot cancel while items are in custody" });

    if (b.custody_state === "Completed")
      return res
        .status(400)
        .json({ error: "Cannot cancel a completed booking" });

    // Calculate refund
    const hoursUntilStart =
      (new Date(b.start_time) - new Date()) / (1000 * 60 * 60);
    const refundPercent = hoursUntilStart >= 24 ? 100 : 0;
    const refundAmount = +(b.total_price * (refundPercent / 100)).toFixed(2);

    const result = await db.query(
      `UPDATE bookings SET
         status = 'cancelled',
         refund_amount = $1,
         refund_percent = $2,
         updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [refundAmount, refundPercent, b.id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ---------- Available time slots for a listing on a given date ----------
router.get("/slots/:listingId", async (req, res, next) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    const {
      generate15MinSlots,
      hasOverlap: checkOverlap,
    } = require("../utils/timeSlots");
    const { startOfDay, endOfDay, parseISO } = require("date-fns");

    const dayStart = startOfDay(parseISO(date));
    const dayEnd = endOfDay(parseISO(date));

    const existing = await db.query(
      `SELECT start_time, end_time FROM bookings
       WHERE listing_id = $1 AND status NOT IN ('cancelled','completed')
         AND start_time >= $2 AND end_time <= $3`,
      [req.params.listingId, dayStart, dayEnd],
    );

    const allSlots = generate15MinSlots(dayStart, dayEnd);
    const available = allSlots.filter(
      (s) => !checkOverlap(existing.rows, s.start, s.end),
    );

    res.json(available);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
