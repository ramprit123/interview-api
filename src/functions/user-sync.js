import { inngest } from "../lib/inngest.js";
import User from "../models/User.js";

// Function to sync user data from Clerk
export const syncUserFromClerk = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event, step }) => {
    const { data } = event;

    return await step.run("sync-user-to-database", async () => {
      const userData = {
        clerkId: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        username: data.username,
        email: data.email_addresses?.[0]?.email_address,
        imageUrl: data.image_url,
        lastSyncedAt: new Date(),
      };

      const user = await User.findOneAndUpdate({ clerkId: data.id }, userData, {
        upsert: true,
        new: true,
        runValidators: true,
      });

      return {
        success: true,
        userId: user._id,
        clerkId: data.id,
        action: "created",
      };
    });
  }
);

// Function to update user data from Clerk
export const updateUserFromClerk = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event, step }) => {
    const { data } = event;

    return await step.run("update-user-in-database", async () => {
      const updateData = {
        firstName: data.first_name,
        lastName: data.last_name,
        username: data.username,
        email: data.email_addresses?.[0]?.email_address,
        imageUrl: data.image_url,
        lastSyncedAt: new Date(),
      };

      const user = await User.findOneAndUpdate(
        { clerkId: data.id },
        updateData,
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error(`User with clerkId ${data.id} not found`);
      }

      return {
        success: true,
        userId: user._id,
        clerkId: data.id,
        action: "updated",
      };
    });
  }
);

// Function to handle user deletion
export const deleteUserFromClerk = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event, step }) => {
    const { data } = event;

    return await step.run("delete-user-from-database", async () => {
      const user = await User.findOneAndDelete({ clerkId: data.id });

      return {
        success: true,
        userId: user?._id,
        clerkId: data.id,
        action: "deleted",
        found: !!user,
      };
    });
  }
);
