import express from "express";
import bcrypt from "bcrypt";
import db from "../models/index.js";

const router = express.Router();
const { User } = db;

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: "Email not found" });
        }


        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Wrong password" });
        }


        res.json({
            success: true,
            message: "Login successful",
            email: user.email,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

export default router;
