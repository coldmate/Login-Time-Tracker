// Alen Ovalles
// Last Update: 04/21/2026

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// ---------------- MIDDLEWARE ----------------
app.use(cors());
app.use(express.json());

// ---------------- MONGODB CONNECT ----------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// ---------------- MODEL ----------------
const timeSchema = new mongoose.Schema({
  date: String, // "2026-04-18"
  time: String, // "10:30 AM"
});

const Time = mongoose.model("Time", timeSchema);

// ---------------- ROUTES ----------------

// Get ALL entries (for calendar)
app.get("/api/all", async (req, res) => {
  const entries = await Time.find({});
  res.json({ entries });
});

// Save time (frontend protected)
app.post("/api/time", async (req, res) => {
  try {
    const { date, time } = req.body;

    const existing = await Time.findOne({ date });

    // 🔒 HARD STOP: never update
    if (existing) {
      return res.status(200).json({
        message: "locked - already exists",
        entry: existing,
      });
    }

    const created = await Time.create({ date, time });

    return res.json({ entry: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete today's entry
app.delete("/api/time/today", async (req, res) => {
  const today = new Date().toLocaleDateString("en-CA");

  const deleted = await Time.findOneAndDelete({ date: today });

  res.json({ success: true, deleted });
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});