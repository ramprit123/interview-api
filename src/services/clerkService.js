import { createClerkClient } from "@clerk/express";
import inngestService from "./inngestService.js";

class ClerkService {
  constructor() {
    this.clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const user = await this.clerk.users.getUser(userId);
      return user;
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }

  // Get all users with pagination
  async getAllUsers(limit = 10, offset = 0) {
    try {
      const users = await this.clerk.users.getUserList({
        limit,
        offset,
      });
      return users;
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  // Update user metadata
  async updateUserMetadata(userId, metadata, type = "public") {
    try {
      const updateData = {};
      updateData[`${type}Metadata`] = metadata;

      const user = await this.clerk.users.updateUser(userId, updateData);

      // Send update event to Inngest
      await inngestService.sendUserUpdatedEvent(user);

      return user;
    } catch (error) {
      throw new Error(`Failed to update user metadata: ${error.message}`);
    }
  }

  // Sync user to database via Inngest
  async syncUserToDatabase(userId) {
    try {
      const user = await this.getUserById(userId);

      // Send sync event to Inngest
      await inngestService.sendUserUpdatedEvent(user);

      return user;
    } catch (error) {
      throw new Error(`Failed to sync user: ${error.message}`);
    }
  }

  // Bulk sync users
  async bulkSyncUsers(userIds) {
    try {
      const results = [];

      for (const userId of userIds) {
        try {
          const user = await this.getUserById(userId);
          await inngestService.sendUserUpdatedEvent(user);
          results.push({ userId, success: true });
        } catch (error) {
          results.push({ userId, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to bulk sync users: ${error.message}`);
    }
  }
}

export default new ClerkService();
