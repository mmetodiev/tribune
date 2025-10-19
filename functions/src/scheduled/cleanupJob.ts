import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { deleteOldArticles } from "../storage/articles.js";

/**
 * Scheduled function that runs daily to delete articles older than 30 days
 * Cron schedule: 0 2 * * * - Every day at 2 AM
 *
 * This helps maintain database size and keeps only recent, relevant articles.
 * The default retention period is 30 days as specified in the implementation plan.
 */
export const scheduledCleanup = onSchedule(
  {
    schedule: "0 2 * * *", // Daily at 2 AM
    timeZone: "America/New_York",
    memory: "256MiB",
    timeoutSeconds: 300, // 5 minutes max
  },
  async (event) => {
    logger.info("Starting scheduled cleanup job", { timestamp: event.scheduleTime });

    try {
      const daysToKeep = 30; // Keep articles from last 30 days
      const deletedCount = await deleteOldArticles(daysToKeep);

      logger.info("Scheduled cleanup completed", {
        daysToKeep,
        articlesDeleted: deletedCount,
      });
    } catch (error) {
      logger.error("Scheduled cleanup job failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }
);
