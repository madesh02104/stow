const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middleware/auth");

// ---------- Create listing ----------
router.post("/", auth, async (req, res, next) => {
  try {
    const {
      type,
      title,
      description,
      address,
      latitude,
      longitude,
      length_ft,
      width_ft,
      height_ft,
      has_locker,
      has_cctv,
      has_ev_charge,
      is_waterproof,
      has_security_guard,
      image_url,
      subtypes,
      photos,
      vehicle_type,
    } = req.body;

    // Latitude and longitude are required
    if (latitude == null || longitude == null) {
      return res
        .status(400)
        .json({ error: "Map location (latitude & longitude) is required" });
    }

    // Pricing: parking uses flat per-slot rate, storage uses area-based
    const { getParkingRate } = require("../utils/timeSlots");
    let price_per_15min;
    if (type === "parking") {
      const isCovered = (subtypes || []).includes("Covered");
      price_per_15min = getParkingRate(vehicle_type, isCovered);
    } else {
      const area = Math.max(4, (length_ft || 0) * (width_ft || 0));
      price_per_15min = +(area * 2.4).toFixed(2);
    }

    const result = await db.query(
      `INSERT INTO listings
        (owner_id, type, title, description, address, latitude, longitude,
         length_ft, width_ft, height_ft, price_per_15min,
         has_locker, has_cctv, has_ev_charge, is_waterproof, has_security_guard, image_url, subtypes, photos, vehicle_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING *`,
      [
        req.user.id,
        type,
        title,
        description,
        address,
        latitude,
        longitude,
        type === "parking" ? 0 : length_ft || 0,
        type === "parking" ? 0 : width_ft || 0,
        type === "parking" ? null : height_ft,
        price_per_15min,
        has_locker || false,
        has_cctv || false,
        has_ev_charge || false,
        is_waterproof || false,
        has_security_guard || false,
        image_url,
        subtypes || [],
        photos || [],
        type === "parking" ? vehicle_type || null : null,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ---------- Add sub-slot to listing ----------
router.post("/:id/subslots", auth, async (req, res, next) => {
  try {
    const { label, length_ft, width_ft, height_ft } = req.body;
    const listingId = req.params.id;

    // verify ownership
    const listing = await db.query(
      "SELECT owner_id FROM listings WHERE id = $1",
      [listingId],
    );
    if (!listing.rows.length)
      return res.status(404).json({ error: "Listing not found" });
    if (listing.rows[0].owner_id !== req.user.id)
      return res.status(403).json({ error: "Not your listing" });

    const result = await db.query(
      `INSERT INTO sub_slots (listing_id, label, length_ft, width_ft, height_ft)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [listingId, label, length_ft, width_ft, height_ft],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ---------- Get nearby listings ----------
router.get("/nearby", async (req, res, next) => {
  try {
    const { lat, lng, radius = 25 } = req.query;
    if (!lat || !lng)
      return res.status(400).json({ error: "lat and lng are required" });

    const userLat = +lat;
    const userLng = +lng;
    const maxKm = +radius;

    // Haversine formula in SQL (returns distance in km)
    const sql = `
      SELECT * FROM (
        SELECT l.*, u.name as owner_name, u.phone as owner_phone,
          ( 6371 * acos(
              LEAST(1, cos(radians($1)) * cos(radians(l.latitude))
              * cos(radians(l.longitude) - radians($2))
              + sin(radians($1)) * sin(radians(l.latitude)))
          )) AS distance_km
        FROM listings l JOIN users u ON l.owner_id = u.id
        WHERE l.is_active = true
          AND l.latitude IS NOT NULL AND l.longitude IS NOT NULL
      ) sub
      WHERE distance_km <= $3
      ORDER BY distance_km ASC
      LIMIT 20`;

    const result = await db.query(sql, [userLat, userLng, maxKm]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ---------- Get all listings (with optional filters) ----------
router.get("/", async (req, res, next) => {
  try {
    const {
      type,
      search,
      city,
      min_area,
      max_area,
      min_price,
      max_price,
      amenities, // comma-separated: locker,cctv,ev_charge,waterproof
      sort = "rating", // rating | price_low | price_high | newest
      limit = 20,
      offset = 0,
    } = req.query;

    let sql = `SELECT l.*, u.name as owner_name, u.phone as owner_phone
               FROM listings l JOIN users u ON l.owner_id = u.id
               WHERE l.is_active = true`;
    const params = [];

    if (type) {
      params.push(type);
      sql += ` AND l.type = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (l.title ILIKE $${params.length} OR l.address ILIKE $${params.length})`;
    }
    if (city) {
      params.push(`%${city}%`);
      sql += ` AND l.address ILIKE $${params.length}`;
    }
    if (min_area) {
      params.push(+min_area);
      sql += ` AND (l.length_ft * l.width_ft) >= $${params.length}`;
    }
    if (max_area) {
      params.push(+max_area);
      sql += ` AND (l.length_ft * l.width_ft) <= $${params.length}`;
    }
    if (min_price) {
      params.push(+min_price);
      sql += ` AND l.price_per_15min >= $${params.length}`;
    }
    if (max_price) {
      params.push(+max_price);
      sql += ` AND l.price_per_15min <= $${params.length}`;
    }
    if (amenities) {
      const amenityList = amenities.split(",");
      if (amenityList.includes("locker")) sql += " AND l.has_locker = true";
      if (amenityList.includes("cctv")) sql += " AND l.has_cctv = true";
      if (amenityList.includes("ev_charge"))
        sql += " AND l.has_ev_charge = true";
      if (amenityList.includes("waterproof"))
        sql += " AND l.is_waterproof = true";
    }

    // Sorting
    switch (sort) {
      case "price_low":
        sql += " ORDER BY l.price_per_15min ASC";
        break;
      case "price_high":
        sql += " ORDER BY l.price_per_15min DESC";
        break;
      case "newest":
        sql += " ORDER BY l.created_at DESC";
        break;
      default:
        sql += " ORDER BY l.rating_avg DESC, l.created_at DESC";
    }

    params.push(+limit);
    sql += ` LIMIT $${params.length}`;
    params.push(+offset);
    sql += ` OFFSET $${params.length}`;

    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ---------- Get single listing ----------
router.get("/:id", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT l.*, u.name as owner_name, u.phone as owner_phone, u.id_verified as owner_verified,
              u.avatar_url as owner_avatar
       FROM listings l JOIN users u ON l.owner_id = u.id
       WHERE l.id = $1`,
      [req.params.id],
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Listing not found" });

    // also fetch sub-slots
    const slots = await db.query(
      "SELECT * FROM sub_slots WHERE listing_id = $1 AND is_active = true",
      [req.params.id],
    );

    res.json({ ...result.rows[0], sub_slots: slots.rows });
  } catch (err) {
    next(err);
  }
});

// ---------- My listings ----------
router.get("/user/mine", auth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT l.*,
         (SELECT COUNT(*) FROM bookings b WHERE b.listing_id = l.id AND b.status IN ('confirmed','in_custody')) as active_bookings
       FROM listings l WHERE l.owner_id = $1 ORDER BY l.created_at DESC`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ---------- Update listing ----------
router.put("/:id", auth, async (req, res, next) => {
  try {
    const listing = await db.query(
      "SELECT owner_id FROM listings WHERE id = $1",
      [req.params.id],
    );
    if (!listing.rows.length)
      return res.status(404).json({ error: "Not found" });
    if (listing.rows[0].owner_id !== req.user.id)
      return res.status(403).json({ error: "Forbidden" });

    const {
      type,
      title,
      description,
      address,
      latitude,
      longitude,
      length_ft,
      width_ft,
      height_ft,
      price_per_15min,
      has_locker,
      has_cctv,
      has_ev_charge,
      is_waterproof,
      has_security_guard,
      is_active,
      image_url,
      subtypes,
      photos,
      vehicle_type,
    } = req.body;

    // Recalculate price based on type
    const { getParkingRate } = require("../utils/timeSlots");
    let newPrice = price_per_15min;
    const effectiveType = type || listing.rows[0].type;
    if (effectiveType === "parking") {
      const isCovered = (subtypes || []).includes("Covered");
      newPrice = getParkingRate(vehicle_type, isCovered);
    } else if (length_ft != null && width_ft != null) {
      const area = Math.max(4, (length_ft || 0) * (width_ft || 0));
      newPrice = +(area * 2.4).toFixed(2);
    }

    const result = await db.query(
      `UPDATE listings SET
         type = COALESCE($1, type),
         title = COALESCE($2, title),
         description = COALESCE($3, description),
         address = COALESCE($4, address),
         latitude = COALESCE($5, latitude),
         longitude = COALESCE($6, longitude),
         length_ft = COALESCE($7, length_ft),
         width_ft = COALESCE($8, width_ft),
         height_ft = COALESCE($9, height_ft),
         price_per_15min = COALESCE($10, price_per_15min),
         has_locker = COALESCE($11, has_locker),
         has_cctv = COALESCE($12, has_cctv),
         has_ev_charge = COALESCE($13, has_ev_charge),
         is_waterproof = COALESCE($14, is_waterproof),
         has_security_guard = COALESCE($15, has_security_guard),
         is_active = COALESCE($16, is_active),
         image_url = COALESCE($17, image_url),
         subtypes = COALESCE($18, subtypes),
         photos = COALESCE($19, photos),
         vehicle_type = COALESCE($20, vehicle_type),
         updated_at = NOW()
       WHERE id = $21 RETURNING *`,
      [
        type,
        title,
        description,
        address,
        latitude,
        longitude,
        effectiveType === "parking" ? 0 : length_ft != null ? +length_ft : null,
        effectiveType === "parking" ? 0 : width_ft != null ? +width_ft : null,
        effectiveType === "parking"
          ? null
          : height_ft != null
            ? +height_ft
            : null,
        newPrice,
        has_locker,
        has_cctv,
        has_ev_charge,
        is_waterproof,
        has_security_guard,
        is_active,
        image_url,
        subtypes || null,
        photos || null,
        effectiveType === "parking" ? vehicle_type || null : null,
        req.params.id,
      ],
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ---------- Split listing (reduce dimensions → auto-create remainder) ----------
router.post("/:id/split", auth, async (req, res, next) => {
  try {
    const { new_length_ft, new_width_ft } = req.body;

    // Fetch existing listing
    const existing = await db.query("SELECT * FROM listings WHERE id = $1", [
      req.params.id,
    ]);
    if (!existing.rows.length)
      return res.status(404).json({ error: "Listing not found" });

    const listing = existing.rows[0];
    if (listing.owner_id !== req.user.id)
      return res.status(403).json({ error: "Forbidden" });

    const newLen = parseFloat(new_length_ft);
    const newWid = parseFloat(new_width_ft);

    if (
      !newLen ||
      !newWid ||
      newLen <= 0 ||
      newWid <= 0 ||
      (newLen >= listing.length_ft && newWid >= listing.width_ft)
    ) {
      return res.status(400).json({
        error:
          "New dimensions must be smaller than current dimensions in at least one axis.",
      });
    }

    if (newLen > listing.length_ft || newWid > listing.width_ft) {
      return res.status(400).json({
        error: "New dimensions cannot exceed original dimensions on any axis.",
      });
    }

    const origArea = listing.length_ft * listing.width_ft;
    const keptArea = newLen * newWid;
    const remainderArea = origArea - keptArea;

    if (remainderArea <= 0) {
      return res.status(400).json({ error: "No space left to split." });
    }

    // Decide remainder dimensions.
    // Strategy: keep the same width, give the leftover length.
    // If width was reduced, use original width with leftover width portion.
    let remLen, remWid;
    if (newLen < listing.length_ft && newWid === listing.width_ft) {
      // Only length was reduced → remainder is a strip along the length
      remLen = parseFloat((listing.length_ft - newLen).toFixed(2));
      remWid = listing.width_ft;
    } else if (newWid < listing.width_ft && newLen === listing.length_ft) {
      // Only width was reduced → remainder is a strip along the width
      remLen = listing.length_ft;
      remWid = parseFloat((listing.width_ft - newWid).toFixed(2));
    } else {
      // Both reduced → create remainder based on area difference
      // Use original length, calculate width to match area
      remLen = listing.length_ft;
      remWid = parseFloat((remainderArea / remLen).toFixed(2));
    }

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Shrink the original listing
      const updated = await client.query(
        `UPDATE listings SET
           length_ft = $1, width_ft = $2,
           updated_at = NOW()
         WHERE id = $3 RETURNING *`,
        [newLen, newWid, listing.id],
      );

      // 2. Create the new remainder listing (same metadata)
      const remainder = await client.query(
        `INSERT INTO listings
          (owner_id, type, title, description, address, latitude, longitude,
           length_ft, width_ft, height_ft, price_per_15min,
           has_locker, has_cctv, has_ev_charge, is_waterproof, image_url, parent_listing_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         RETURNING *`,
        [
          listing.owner_id,
          listing.type,
          `${listing.title} (Split)`,
          listing.description,
          listing.address,
          listing.latitude,
          listing.longitude,
          remLen,
          remWid,
          listing.height_ft,
          listing.price_per_15min,
          listing.has_locker,
          listing.has_cctv,
          listing.has_ev_charge,
          listing.is_waterproof,
          listing.image_url,
          listing.id,
        ],
      );

      await client.query("COMMIT");

      res.json({
        original: updated.rows[0],
        remainder: remainder.rows[0],
      });
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

// ---------- Delete listing ----------
router.delete("/:id", auth, async (req, res, next) => {
  try {
    const listing = await db.query(
      "SELECT owner_id FROM listings WHERE id = $1",
      [req.params.id],
    );
    if (!listing.rows.length)
      return res.status(404).json({ error: "Listing not found" });
    if (listing.rows[0].owner_id !== req.user.id)
      return res.status(403).json({ error: "Forbidden" });

    // Prevent deletion if there are active bookings
    const active = await db.query(
      "SELECT COUNT(*) FROM bookings WHERE listing_id = $1 AND status IN ('confirmed','in_custody')",
      [req.params.id],
    );
    if (parseInt(active.rows[0].count) > 0) {
      return res
        .status(400)
        .json({ error: "Cannot delete a listing with active bookings" });
    }

    await db.query("DELETE FROM listings WHERE id = $1", [req.params.id]);
    res.json({ message: "Listing deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
