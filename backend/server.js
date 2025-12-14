

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db, { sequelize } from "./models/index.js"; // Ensure models are loaded
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from './routes/chatRoutes.js';
import path from "path";
import { fileURLToPath } from "url";

// Load environment from process / root .env (no local backend .env override)
dotenv.config();
const app = express();

// CORS configuration - supports multiple origins (comma-separated in CORS_ORIGIN)
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser (no origin) or any listed origin
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  }
}));
app.use(express.json());


// 1. Fetch Houses
app.get("/api/houses", async (req, res) => {
    try {
        // Assuming you have a db.House model
        const houses = await db.House.findAll();
        res.json(houses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch houses" });
    }
});

app.use("/api/auth", authRoutes);

app.get("/api/videos", async (req, res) => {
    const videos = await db.Video.findAll();
    res.json(videos);
});

// 2. Fetch Image Categories
app.get("/api/house-images", async (req, res) => {
    try {
        const images = await db.HouseImage.findAll();
        res.json(images);
    } catch (err) {
        console.error("Error fetching HouseImages:", err);
        res.status(500).send(err.message);
    }
});

app.get("/api/room-images", async (req, res) => {
    try {
        const images = await db.RoomImage.findAll();
        res.json(images);
    } catch (err) { res.status(500).send(err.message); }
});

app.get("/api/gallery-images", async (req, res) => {
    try {
        const images = await db.GalleryImage.findAll();
        res.json(images);
    } catch (err) { res.status(500).send(err.message); }
});

app.get("/api/floor-images", async (req, res) => {
    try {
        const images = await db.FloorPlanImage.findAll();
        res.json(images);
    } catch (err) { res.status(500).send(err.message); }
});

app.get("/api/comments", async (req, res) => {
    try {
        const comments = await db.Comment.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(comments);
    } catch (err) {
        console.error("Error fetching comments:", err);
        res.status(500).json({ error: "Failed to fetch comments" });
    }
});

app.post("/api/comments", async (req, res) => {
    try {
        const newComment = await db.Comment.create(req.body);
        res.json({ success: true, data: newComment });
    } catch (err) {
        console.error("❌ DB ERROR:", err.message); // Print the specific error
        res.status(500).json({ error: err.message });
    }
});


// 1. Mark comments as seen for a specific house
app.put("/api/comments/mark-seen/:houseId", async (req, res) => {
    const { houseId } = req.params;
    try {
        // Update ALL comments for this houseId where seen is false
        await db.Comment.update(
            { seen: true },
            { where: { houseId: houseId } }
        );
        res.json({ success: true });
    } catch (err) {
        console.error("Error marking comments as seen:", err);
        res.status(500).json({ error: "Failed to update comments" });
    }
});

// 2. Toggle House State (Actif/Inactif)
app.put("/api/houses/:id", async (req, res) => {
    const { id } = req.params;
    const { state } = req.body; // Expecting { state: "actif" } or { state: "inactif" }

    try {
        await db.House.update(
            { state: state },
            { where: { id: id } }
        );
        res.json({ success: true });
    } catch (err) {
        console.error("Error updating house state:", err);
        res.status(500).json({ error: "Failed to update house" });
    }
});

app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
