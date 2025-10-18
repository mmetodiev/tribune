import { useState } from "react";
import { UpdateFrequency } from "@/types";
import { createSource } from "@/lib/api";
import { sourcePresets, type SourcePreset, getPresetCategories } from "@/lib/sourcePresets";

interface AddSourceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type ViewMode = "presets" | "custom";

export default function AddSourceModal({ onClose, onSuccess }: AddSourceModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("presets");
  const [selectedPreset, setSelectedPreset] = useState<SourcePreset | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [formData, setFormData] = useState({
    name: "",
    url: "",
    category: "general",
    updateFrequency: "daily" as UpdateFrequency,
    priority: 5,
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = ["all", ...getPresetCategories()];

  const handlePresetSelect = (preset: SourcePreset) => {
    setSelectedPreset(preset);
  };

  const handleAddPreset = async () => {
    if (!selectedPreset) return;

    try {
      setSubmitting(true);
      setError(null);

      await createSource({
        name: selectedPreset.name,
        url: selectedPreset.url,
        type: selectedPreset.type,
        category: selectedPreset.category,
        updateFrequency: "daily",
        priority: 5,
        enabled: true,
        robotsTxtCompliant: true,
        termsAccepted: true,
        notes: selectedPreset.description,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create source");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim() || !formData.url.trim()) {
      setError("Name and URL are required");
      return;
    }

    try {
      setSubmitting(true);
      const sourceData = {
        ...formData,
        type: "rss",
        enabled: true,
        robotsTxtCompliant: true,
        termsAccepted: true,
      };

      await createSource(sourceData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create source");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPresets = filterCategory === "all"
    ? sourcePresets
    : sourcePresets.filter(p => p.category === filterCategory);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold mb-4">Add News Source</h2>

          {/* View Mode Tabs */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode("presets")}
              className={`px-4 py-2 rounded ${
                viewMode === "presets"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Popular Sources
            </button>
            <button
              type="button"
              onClick={() => setViewMode("custom")}
              className={`px-4 py-2 rounded ${
                viewMode === "custom"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Custom RSS Feed
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 text-red-600 p-3 rounded">{error}</div>
        )}

        {/* Popular Sources View */}
        {viewMode === "presets" && (
          <div className="p-6">
            {/* Category Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by category:
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filterCategory === cat
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`text-left p-4 border-2 rounded-lg hover:border-blue-400 transition-colors ${
                    selectedPreset?.name === preset.name
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{preset.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{preset.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{preset.description}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        {preset.category}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Add Button */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddPreset}
                disabled={!selectedPreset || submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Adding..." : "Add Source"}
              </button>
            </div>
          </div>
        )}

        {/* Custom RSS Form */}
        {viewMode === "custom" && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">RSS Feed Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="e.g., My Favorite Blog"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RSS Feed URL *
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="https://example.com/feed.xml"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter the full URL to the RSS or Atom feed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="e.g., tech, business, general"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Update Frequency
                    </label>
                    <select
                      value={formData.updateFrequency}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          updateFrequency: e.target.value as UpdateFrequency,
                        })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority (1-10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: parseInt(e.target.value),
                        })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    rows={3}
                    placeholder="Any special notes about this source..."
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Source"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
