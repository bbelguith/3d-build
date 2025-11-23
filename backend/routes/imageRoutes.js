// routes/imageRoutes.js
import express from "express";
import db from "../models/index.js"; // Sequelize models

const router = express.Router();
const { HouseImage, RoomImage, FloorPlanImage, GalleryImage } = db;

// Generic handler to fetch images
const fetchImages = (Model) => async (req, res) => {
    try {
        const { houseId } = req.query;
        const where = houseId ? { houseId } : {};
        const images = await Model.findAll({ where });
        res.json(images);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Routes
router.get("/houses", fetchImages(HouseImage));
router.get("/floorplans", fetchImages(FloorPlanImage));
router.get("/gallery", fetchImages(GalleryImage));
router.get("/rooms", fetchImages(RoomImage));

export default router;
