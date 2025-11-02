import express from "express";
import { requireClerkAuth } from "../middleware/clerkAuth.js";
import User from "../models/User.js";
import clerkService from "../services/clerkService.js";
import inngestService from "../services/inngestService.js";

const router = express.Router();

// Get current user profile
router.get("/me", requireClerkAuth, async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });

    if (!user) {
      // If user not found in database, sync from Clerk
      await clerkService.syncUserToDatabase(req.auth.userId);
      const syncedUser = await User.findOne({ clerkId: req.auth.userId });
      return res.json({
        message: "User synced and retrieved",
        user: syncedUser,
      });
    }

    res.json({ message: "User profile retrieved", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID (admin only)
router.get("/:userId", requireClerkAuth, async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put("/me", requireClerkAuth, async (req, res) => {
  try {
    const { address, role, ...otherUpdates } = req.body;

    // Update in local database
    const user = await User.findOneAndUpdate(
      { clerkId: req.auth.userId },
      {
        address,
        role,
        ...otherUpdates,
        lastSyncedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Send activity event
    await inngestService.sendUserActivityEvent(
      req.auth.userId,
      "profile_updated"
    );

    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync user from Clerk
router.post("/sync", requireClerkAuth, async (req, res) => {
  try {
    const clerkUser = await clerkService.syncUserToDatabase(req.auth.userId);
    const user = await User.findOne({ clerkId: req.auth.userId });

    res.json({
      message: "User synced successfully",
      user,
      clerkData: clerkUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (admin only - you might want to add admin middleware)
router.get("/", requireClerkAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    const users = await User.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk sync users from Clerk
router.post("/bulk-sync", requireClerkAuth, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: "userIds array is required" });
    }

    const results = await clerkService.bulkSyncUsers(userIds);

    res.json({
      message: "Bulk sync initiated",
      results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user metadata via Clerk
router.put("/:userId/metadata", requireClerkAuth, async (req, res) => {
  try {
    const { metadata, type = "public" } = req.body;

    const updatedUser = await clerkService.updateUserMetadata(
      req.params.userId,
      metadata,
      type
    );

    res.json({
      message: "User metadata updated",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send custom event
router.post("/events", requireClerkAuth, async (req, res) => {
  try {
    const { eventName, data } = req.body;

    if (!eventName) {
      return res.status(400).json({ error: "eventName is required" });
    }

    await inngestService.sendCustomEvent(eventName, {
      userId: req.auth.userId,
      ...data,
    });

    res.json({ message: "Event sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
