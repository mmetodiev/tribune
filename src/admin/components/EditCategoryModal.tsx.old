import { useState, useEffect } from "react";
import { updateCategory, getSources } from "@/lib/api";
import type { Source, Category } from "@/types";

interface EditCategoryModalProps {
  category: Category;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditCategoryModal({
  category,
  onClose,
  onSuccess,
}: EditCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: category.name,
    slug: category.slug,
    description: category.description,
    color: category.color,
    icon: category.icon,
    keywords: category.rules.keywords.join(", "),
    selectedSources: category.rules.sources,
    domains: category.rules.domains.join(", "),
    order: category.order,
  });

  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUncategorized = category.slug === "uncategorized";

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const result = await getSources();
      if (result.success) {
        setSources(result.sources);
      }
    } catch (err) {
      console.error("Failed to load sources:", err);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-generate slug from name (only if not uncategorized)
    if (field === "name" && !isUncategorized) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSourceToggle = (sourceId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedSources: prev.selectedSources.includes(sourceId)
        ? prev.selectedSources.filter((id) => id !== sourceId)
        : [...prev.selectedSources, sourceId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Category name is required");
      return;
    }

    if (!formData.slug.trim()) {
      setError("Slug is required");
      return;
    }

    try {
      setLoading(true);

      const updates = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        color: formData.color,
        icon: formData.icon || "📰",
        order: formData.order,
        rules: {
          keywords: formData.keywords
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k.length > 0),
          sources: formData.selectedSources,
          domains: formData.domains
            .split(",")
            .map((d) => d.trim())
            .filter((d) => d.length > 0),
        },
      };

      await updateCategory(category.id, updates);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to update category");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Edit Category</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {isUncategorized && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              <p className="font-semibold">System Category</p>
              <p className="text-sm">
                The Uncategorized category is a system category. You can modify its
                appearance but not its slug.
              </p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Technology"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="e.g., technology"
                  disabled={isUncategorized}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL-friendly identifier
                  {isUncategorized && " (cannot be changed for system category)"}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Brief description of what articles belong in this category"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => handleInputChange("icon", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl text-center"
                  placeholder="📰"
                  maxLength={2}
                />
                <p className="text-xs text-gray-500 mt-1">Use an emoji</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#6366f1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => handleInputChange("order", parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={0}
                  max={999}
                />
                <p className="text-xs text-gray-500 mt-1">0-999 (lower = first)</p>
              </div>
            </div>
          </div>

          {/* Categorization Rules */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900">Categorization Rules</h3>
            <p className="text-sm text-gray-600">
              Articles matching any of these rules will be automatically added to this category
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keywords
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => handleInputChange("keywords", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="AI, machine learning, neural network"
              />
              <p className="text-xs text-gray-500 mt-1">
                Comma-separated keywords to match in article title/summary
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sources ({formData.selectedSources.length} selected)
              </label>
              <div className="border border-gray-300 rounded max-h-48 overflow-y-auto p-3 space-y-2">
                {sources.length === 0 ? (
                  <p className="text-sm text-gray-500">No sources available</p>
                ) : (
                  sources.map((source) => (
                    <label
                      key={source.id}
                      className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedSources.includes(source.id)}
                        onChange={() => handleSourceToggle(source.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900">{source.name}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                All articles from selected sources will be added to this category
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domains
              </label>
              <input
                type="text"
                value={formData.domains}
                onChange={(e) => handleInputChange("domains", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="techcrunch.com, wired.com, arstechnica.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Comma-separated domain names to match article URLs
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
