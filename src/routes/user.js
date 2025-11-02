import express from "express";
import { requireClerkAuth } from "../middleware/clerkAuth.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/me", requireClerkAuth, async (req, res) => {
  const clerkUser = await User.findOne(req.auth.userId);
  res.json({ message: "Welcome!", user: clerkUser });
});

export default router;
