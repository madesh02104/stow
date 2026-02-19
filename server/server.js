require("dotenv").config();
const express = require("express");
const cors = require("cors");

const path = require("path");
const authRoutes = require("./routes/auth");
const listingRoutes = require("./routes/listings");
const bookingRoutes = require("./routes/bookings");
const custodyRoutes = require("./routes/custody");
const uploadRoutes = require("./routes/upload");

const app = express();

// --------------- Middleware ---------------
app.use(
  cors({
    origin: process.env.CLIENT_URL || true, // true = reflect request origin (safer than "*" with credentials)
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
  }),
);
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --------------- Routes ---------------
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/custody", custodyRoutes);
app.use("/api/upload", uploadRoutes);

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// --------------- Serve client build in production ---------------
const clientBuild = path.join(__dirname, "../client/build");
if (
  process.env.NODE_ENV === "production" ||
  require("fs").existsSync(clientBuild)
) {
  app.use(express.static(clientBuild));
  // For any route that doesn't match an API, serve the React app
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientBuild, "index.html"));
  });
}

// --------------- Error handler ---------------
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
});

// --------------- Start ---------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Stow API running on port ${PORT}`));
