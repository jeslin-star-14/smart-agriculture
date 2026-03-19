// backend/src/routes/authRoutes.js
import express from "express";
import { register, login, updateProfile, checkAvailability, verifyToken } from "../controllers/Authcontroller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login",    login);
router.put("/profile",   updateProfile);
router.post("/check",    checkAvailability);   // live availability check
router.get("/verify",   verifyToken);          // session check on page load

export default router;