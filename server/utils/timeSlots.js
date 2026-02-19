const {
  areIntervalsOverlapping,
  differenceInMinutes,
  parseISO,
  addMinutes,
  startOfDay,
  endOfDay,
  eachMinuteOfInterval,
} = require("date-fns");

/**
 * Generate 15-minute time-slots between two dates.
 */
function generate15MinSlots(startDate, endDate) {
  const slots = [];
  let cursor =
    typeof startDate === "string" ? parseISO(startDate) : new Date(startDate);
  const end =
    typeof endDate === "string" ? parseISO(endDate) : new Date(endDate);

  while (cursor < end) {
    const slotEnd = addMinutes(cursor, 15);
    slots.push({ start: new Date(cursor), end: slotEnd > end ? end : slotEnd });
    cursor = slotEnd;
  }
  return slots;
}

/**
 * Check if a proposed booking overlaps with any existing bookings.
 * Returns true if there IS a conflict.
 */
function hasOverlap(existingBookings, proposedStart, proposedEnd) {
  const proposed = {
    start:
      typeof proposedStart === "string"
        ? parseISO(proposedStart)
        : new Date(proposedStart),
    end:
      typeof proposedEnd === "string"
        ? parseISO(proposedEnd)
        : new Date(proposedEnd),
  };

  return existingBookings.some((b) =>
    areIntervalsOverlapping(
      { start: new Date(b.start_time), end: new Date(b.end_time) },
      proposed,
    ),
  );
}

/**
 * Logarithmic Decay Pricing Model
 * ─────────────────────────────────
 * Base: ₹2.40 per sqft per 15-min block.
 * The per-block rate decays logarithmically as duration increases:
 *   effectiveRate = BASE_RATE / (1 + DECAY × ln(blocks))
 *   total = effectiveRate × area × blocks
 * Minimum total is always ₹30.
 */
const BASE_RATE = 2.4;
const DECAY_CONSTANT = 10;
const MIN_SQFT = 4;
const MIN_PRICE = 30;

function calculatePrice(startTime, endTime, areaSqft) {
  const start =
    typeof startTime === "string" ? parseISO(startTime) : new Date(startTime);
  const end =
    typeof endTime === "string" ? parseISO(endTime) : new Date(endTime);
  const minutes = differenceInMinutes(end, start);
  const blocks = Math.max(1, Math.ceil(minutes / 15));
  const area = Math.max(MIN_SQFT, parseFloat(areaSqft) || MIN_SQFT);
  const decay = 1 / (1 + DECAY_CONSTANT * Math.log(blocks));
  const raw = BASE_RATE * decay * area * blocks;
  return Math.max(MIN_PRICE, Math.round(raw));
}

/** Return a pricing breakdown object (used by preview endpoint). */
function pricingBreakdown(startTime, endTime, areaSqft) {
  const start =
    typeof startTime === "string" ? parseISO(startTime) : new Date(startTime);
  const end =
    typeof endTime === "string" ? parseISO(endTime) : new Date(endTime);
  const minutes = differenceInMinutes(end, start);
  const blocks = Math.max(1, Math.ceil(minutes / 15));
  const area = Math.max(MIN_SQFT, parseFloat(areaSqft) || MIN_SQFT);
  const decay = 1 / (1 + DECAY_CONSTANT * Math.log(blocks));
  const effectiveRate = +(BASE_RATE * decay).toFixed(2);
  const total = Math.max(
    MIN_PRICE,
    Math.round(BASE_RATE * decay * area * blocks),
  );
  const perBlock = +(total / blocks).toFixed(2);
  const savingsPercent = blocks > 1 ? Math.round((1 - decay) * 100) : 0;
  return {
    total,
    blocks,
    perBlock,
    effectiveRate,
    area,
    decay: +decay.toFixed(4),
    savingsPercent,
    minutes,
  };
}

/**
 * Calculate remaining area after confirmed bookings.
 */
function remainingArea(totalAreaFt2, confirmedBookingAreas) {
  const used = confirmedBookingAreas.reduce((sum, a) => sum + a, 0);
  return Math.max(0, totalAreaFt2 - used);
}

/**
 * Parking Pricing Model (Flat Rate)
 * ──────────────────────────────────
 * 2-wheeler Open:   ₹4 per 15-min slot
 * 2-wheeler Covered: ₹8 per 15-min slot
 * 4-wheeler Open:   ₹8 per 15-min slot
 * 4-wheeler Covered: ₹12 per 15-min slot
 * No decay — simple flat rate × number of slots.
 */
const PARKING_MIN_PRICE = 4; // minimum charge

/** Get parking rate based on vehicle type and parking type */
function getParkingRate(vehicleType, isCovered) {
  if (vehicleType === "4-wheeler") {
    return isCovered ? 12 : 8;
  }
  // Default to 2-wheeler rates
  return isCovered ? 8 : 4;
}

function calculateParkingPrice(startTime, endTime, isCovered, vehicleType) {
  const start =
    typeof startTime === "string" ? parseISO(startTime) : new Date(startTime);
  const end =
    typeof endTime === "string" ? parseISO(endTime) : new Date(endTime);
  const minutes = differenceInMinutes(end, start);
  const blocks = Math.max(1, Math.ceil(minutes / 15));
  const baseRate = getParkingRate(vehicleType, isCovered);
  return Math.max(PARKING_MIN_PRICE, baseRate * blocks);
}

function parkingPricingBreakdown(startTime, endTime, isCovered, vehicleType) {
  const start =
    typeof startTime === "string" ? parseISO(startTime) : new Date(startTime);
  const end =
    typeof endTime === "string" ? parseISO(endTime) : new Date(endTime);
  const minutes = differenceInMinutes(end, start);
  const blocks = Math.max(1, Math.ceil(minutes / 15));
  const baseRate = getParkingRate(vehicleType, isCovered);
  const total = Math.max(PARKING_MIN_PRICE, baseRate * blocks);
  const perBlock = baseRate;
  return {
    total,
    blocks,
    perBlock,
    effectiveRate: baseRate,
    baseRate,
    parkingType: isCovered ? "Covered" : "Open",
    vehicleType: vehicleType || "2-wheeler",
    savingsPercent: 0,
    flatTotal: total,
    minutes,
    isParking: true,
  };
}

module.exports = {
  generate15MinSlots,
  hasOverlap,
  calculatePrice,
  pricingBreakdown,
  calculateParkingPrice,
  parkingPricingBreakdown,
  getParkingRate,
  remainingArea,
  BASE_RATE,
  DECAY_CONSTANT,
  MIN_PRICE,
};
