import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import type { FetchLog, FetchLogDetail } from "../types/index.js";

const db = getFirestore();
const FETCH_LOGS_COLLECTION = "fetch_logs";

/**
 * Creates a new fetch log entry
 */
export async function createFetchLog(
  sourcesProcessed: number,
  articlesAdded: number,
  errors: number,
  details: FetchLogDetail[]
): Promise<string> {
  try {
    const logData: FetchLog = {
      timestamp: Timestamp.now(),
      sourcesProcessed,
      articlesAdded,
      errors,
      details,
    };

    const docRef = await db.collection(FETCH_LOGS_COLLECTION).add(logData);
    logger.info("Fetch log created", { id: docRef.id, logData });
    return docRef.id;
  } catch (error) {
    logger.error("Failed to create fetch log", { error });
    throw error;
  }
}

/**
 * Gets recent fetch logs
 */
export async function getRecentFetchLogs(limit: number = 10): Promise<(FetchLog & { id: string })[]> {
  try {
    const snapshot = await db
      .collection(FETCH_LOGS_COLLECTION)
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    const logs: (FetchLog & { id: string })[] = [];
    snapshot.forEach((doc) => {
      logs.push({
        id: doc.id,
        ...(doc.data() as FetchLog),
      });
    });

    return logs;
  } catch (error) {
    logger.error("Failed to get fetch logs", { error });
    throw error;
  }
}

/**
 * Deletes old fetch logs (keep only last N days)
 */
export async function deleteOldFetchLogs(daysToKeep: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    const snapshot = await db
      .collection(FETCH_LOGS_COLLECTION)
      .where("timestamp", "<", cutoffTimestamp)
      .get();

    if (snapshot.empty) {
      return 0;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    logger.info(`Deleted ${snapshot.size} old fetch logs`);
    return snapshot.size;
  } catch (error) {
    logger.error("Failed to delete old fetch logs", { error });
    throw error;
  }
}
