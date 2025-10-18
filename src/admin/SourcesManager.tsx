import { useState, useEffect } from "react";
import { Source } from "@/types";
import { getSources, deleteSource as deleteSourceAPI, toggleSource, manualFetchSource } from "@/lib/api";
import AddSourceModal from "./components/AddSourceModal";
import TestSourceModal from "./components/TestSourceModal";

export default function SourcesManager() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [testingSource, setTestingSource] = useState<Source | null>(null);
  const [fetchingSourceId, setFetchingSourceId] = useState<string | null>(null);

  const loadSources = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getSources();
      if (result.success) {
        setSources(result.sources);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load sources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      await toggleSource(id);
      await loadSources();
    } catch (err: any) {
      alert("Failed to toggle source: " + err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }
    try {
      await deleteSourceAPI(id);
      await loadSources();
    } catch (err: any) {
      alert("Failed to delete source: " + err.message);
    }
  };

  const handleTest = (source: Source) => {
    setTestingSource(source);
  };

  const handleFetch = async (id: string) => {
    try {
      setFetchingSourceId(id);
      await manualFetchSource(id);
      alert("Fetch completed successfully!");
      await loadSources();
    } catch (err: any) {
      alert("Fetch failed: " + err.message);
    } finally {
      setFetchingSourceId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "disabled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-600">Loading sources...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sources Manager</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Source
        </button>
      </div>

      {sources.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">No sources configured yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Add Your First Source
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Fetch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Articles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sources.map((source) => (
                <tr key={source.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {source.name}
                        </div>
                        <div className="text-sm text-gray-500">{source.url}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {source.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        source.status
                      )}`}
                    >
                      {source.enabled ? source.status : "disabled"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {source.lastFetchedAt
                      ? new Date(source.lastFetchedAt.seconds * 1000).toLocaleString()
                      : "Never"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {source.totalArticlesFetched}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleToggle(source.id)}
                      className={`${
                        source.enabled ? "text-yellow-600 hover:text-yellow-900" : "text-green-600 hover:text-green-900"
                      }`}
                    >
                      {source.enabled ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => handleTest(source)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => handleFetch(source.id)}
                      disabled={fetchingSourceId === source.id}
                      className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                    >
                      {fetchingSourceId === source.id ? "Fetching..." : "Fetch"}
                    </button>
                    <button
                      onClick={() => handleDelete(source.id, source.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AddSourceModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadSources();
          }}
        />
      )}

      {testingSource && (
        <TestSourceModal
          source={testingSource}
          onClose={() => setTestingSource(null)}
        />
      )}
    </div>
  );
}
