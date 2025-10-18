import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { getAllSources } from "../storage/sources.js";
import { fetchAndStoreArticles } from "../core/fetchSource.js";
import { createFetchLog } from "../storage/fetchLogs.js";
import type { Source, FetchLogDetail } from "../types/index.js";

/**
 * Scheduled function that runs twice daily to fetch articles from all enabled sources
 * Cron schedule: 0 star-slash-12 star star star - Every 12 hours
 * Alternative: 0 6,18 star star star - At 6 AM and 6 PM
 */
export const scheduledFetch = onSchedule(
  {
    schedule: "0 */12 * * *",
    timeZone: "America/New_York",
    memory: "512MiB",
    timeoutSeconds: 540, // 9 minutes max
  },
  async (event) => {
    logger.info("Starting scheduled fetch job", { timestamp: event.scheduleTime });

    try {
      // Get all sources and filter enabled ones
      const allSources = await getAllSources();
      const enabledSources = allSources.filter((source: Source) => source.enabled);

      logger.info(`Found ${enabledSources.length} enabled sources to process`);

      if (enabledSources.length === 0) {
        logger.warn("No enabled sources found");
        return;
      }

      // Fetch from all sources using Promise.allSettled for graceful degradation
      const results = await Promise.allSettled(
        enabledSources.map((source: Source) => fetchAndStoreArticles(source))
      );

      // Build detailed log
      const details: FetchLogDetail[] = results.map((result, index) => {
        const source = enabledSources[index];
        if (result.status === "fulfilled") {
          return {
            sourceId: source.id,
            sourceName: source.name,
            success: result.value.success,
            articleCount: result.value.articleCount,
            error: result.value.error,
          };
        } else {
          return {
            sourceId: source.id,
            sourceName: source.name,
            success: false,
            articleCount: 0,
            error: result.reason?.message || "Unknown error",
          };
        }
      });

      // Calculate summary stats
      const totalArticles = details.reduce((sum, d) => sum + d.articleCount, 0);
      const errorCount = details.filter((d) => !d.success).length;

      // Save fetch log to Firestore
      await createFetchLog(enabledSources.length, totalArticles, errorCount, details);

      logger.info("Scheduled fetch completed", {
        sourcesProcessed: enabledSources.length,
        articlesAdded: totalArticles,
        errors: errorCount,
      });
    } catch (error) {
      logger.error("Scheduled fetch job failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }
);
