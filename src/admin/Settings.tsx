import { useState } from "react";
import { cleanupOldArticles } from "@/lib/api";

export default function Settings() {
  const [daysToKeep, setDaysToKeep] = useState(30);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{
    deletedCount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleManualCleanup() {
    if (
      !confirm(
        `Are you sure you want to delete articles older than ${daysToKeep} days?`
      )
    ) {
      return;
    }

    setCleaning(true);
    setError(null);
    setCleanupResult(null);

    try {
      const result = await cleanupOldArticles(daysToKeep);
      console.log("Cleanup result:", result);
      setCleanupResult(result as any);
    } catch (err) {
      console.error("Cleanup failed:", err);
      setError("Failed to cleanup old articles");
    } finally {
      setCleaning(false);
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {/* Data Retention Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Data Retention</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage how long articles are stored in the database
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Days to Keep Articles
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="1"
                max="365"
                value={daysToKeep}
                onChange={(e) => setDaysToKeep(parseInt(e.target.value) || 30)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
              />
              <span className="text-gray-600">days</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Articles older than this will be automatically deleted by the
              scheduled cleanup job (runs daily at 2 AM)
            </p>
          </div>

          <div>
            <button
              onClick={handleManualCleanup}
              disabled={cleaning}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {cleaning ? "Cleaning up..." : "Run Cleanup Now"}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Manually trigger cleanup to delete articles older than{" "}
              {daysToKeep} days
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {cleanupResult && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">
                Cleanup completed successfully!
              </p>
              <p className="text-green-700 text-sm mt-1">
                Deleted {cleanupResult.deletedCount} old articles
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fetch Schedule Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Fetch Schedule</h2>
          <p className="text-sm text-gray-600 mt-1">
            Automated fetch job configuration
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Scheduled Fetch Job</p>
              <p className="text-sm text-gray-600">
                Automatically fetches articles from all enabled sources
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Active
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Frequency</p>
              <p className="text-sm text-gray-600">
                How often the fetch job runs
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-gray-900">Every 12 hours</p>
              <p className="text-xs text-gray-500">0 */12 * * *</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Scheduled Cleanup Job</p>
              <p className="text-sm text-gray-600">
                Automatically deletes old articles
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Active
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Cleanup Frequency</p>
              <p className="text-sm text-gray-600">
                When old articles are deleted
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-gray-900">Daily at 2:00 AM</p>
              <p className="text-xs text-gray-500">0 2 * * *</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Schedule configuration is managed in the
              Firebase Functions codebase. To modify schedules, update the cron
              expressions in <code className="font-mono">functions/src/scheduled/</code> and
              redeploy.
            </p>
          </div>
        </div>
      </div>

      {/* System Information Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">System Information</h2>
          <p className="text-sm text-gray-600 mt-1">
            Technical details about the application
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <p className="font-medium text-gray-900">Application Version</p>
            <p className="font-mono text-gray-600">1.0.0</p>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <p className="font-medium text-gray-900">Backend</p>
            <p className="text-gray-600">Firebase Functions v2</p>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <p className="font-medium text-gray-900">Database</p>
            <p className="text-gray-600">Cloud Firestore</p>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <p className="font-medium text-gray-900">Hosting</p>
            <p className="text-gray-600">Firebase Hosting</p>
          </div>

          <div className="flex items-center justify-between py-3">
            <p className="font-medium text-gray-900">Functions Region</p>
            <p className="text-gray-600">us-central1</p>
          </div>

          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">
              Deployed Functions
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Source Management (CRUD operations)</li>
              <li>• Article Storage & Retrieval</li>
              <li>• Category Management</li>
              <li>• Manual & Scheduled Fetch Jobs</li>
              <li>• Data Cleanup & Retention</li>
              <li>• Fetch Logging & Analytics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
