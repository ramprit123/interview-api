import { inngest } from "../lib/inngest.js";

class InngestService {
  // Send user created event
  async sendUserCreatedEvent(userData) {
    return await inngest.send({
      name: "clerk/user.created",
      data: userData,
    });
  }

  // Send user updated event
  async sendUserUpdatedEvent(userData) {
    return await inngest.send({
      name: "clerk/user.updated",
      data: userData,
    });
  }

  // Send user deleted event
  async sendUserDeletedEvent(userData) {
    return await inngest.send({
      name: "clerk/user.deleted",
      data: userData,
    });
  }

  // Send custom event
  async sendCustomEvent(eventName, data) {
    return await inngest.send({
      name: eventName,
      data,
    });
  }

  // Send user activity event
  async sendUserActivityEvent(clerkId, activity) {
    return await inngest.send({
      name: "user/activity",
      data: {
        clerkId,
        activity,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Send bulk user sync event
  async sendBulkUserSyncEvent(userIds) {
    return await inngest.send({
      name: "users/bulk-sync",
      data: {
        userIds,
        requestedAt: new Date().toISOString(),
      },
    });
  }
}

export default new InngestService();
