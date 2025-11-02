
import express from "express";
import userRoutes from "./user.js";
import healthRoutes from "./health.js";
import inngestRoutes from "./inngest.js";

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/users", userRoutes);
router.use("/inngest", inngestRoutes);

export default router;
