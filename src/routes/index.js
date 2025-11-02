
import express from "express";
import userRoutes from "./user.js";
import healthRoutes from "./health.js";

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/users", userRoutes);

export default router;
