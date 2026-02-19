const { Pool } = require("pg");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const pool = isProduction
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: "/var/run/postgresql",
      database: "stow",
      user: process.env.DB_USER || "madesh",
      port: 5432,
    });

pool.on("error", (err) => {
  console.error("Unexpected PG pool error", err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
