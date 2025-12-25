"use client";

import { useState, useEffect } from "react";
import { FaBlog, FaTimes, FaSpinner, FaExternalLinkAlt, FaSync } from "react-icons/fa";

interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  status: string;
  createdAt: string;
}

interface BlogSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (
    blog: Blog,
    posts: Record<string, string>,
    blogUrl: string
  ) => void;
  selectedPlatforms: string[];
}

export default function BlogSelector({
  isOpen,
  onClose,
  onSelect,
  selectedPlatforms,
}: BlogSelectorProps) {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [blogUrl, setBlogUrl] = useState("");
  const [blogFilter, setBlogFilter] = useState<string>("all");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBlogs();
    }
  }, [isOpen, blogFilter]);

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (blogFilter !== "all") {
        params.append("blog", blogFilter);
      }
      const response = await fetch(`/api/blogs/list?${params}`);
      const data = await response.json();
      if (data.success) {
        setBlogs(data.blogs || []);
      }
    } catch (error) {
      console.error("Failed to load blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncRSS = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/blogs/sync-rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogFilter: blogFilter !== "all" ? blogFilter : undefined }),
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        loadBlogs(); // Reload blogs after sync
      } else {
        alert(data.error || "Failed to sync RSS feeds");
      }
    } catch (error) {
      console.error("RSS sync error:", error);
      alert("Failed to sync RSS feeds");
    } finally {
      setSyncing(false);
    }
  };

  const handleConvert = async () => {
    if (!selectedBlog) return;

    if (selectedPlatforms.length === 0) {
      alert("Please select at least one platform first");
      return;
    }

    setConverting(true);
    try {
      const response = await fetch("/api/blogs/convert-to-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogId: selectedBlog.id,
          blogUrl: blogUrl || undefined,
          platforms: selectedPlatforms,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSelect(selectedBlog, data.posts, data.blogUrl);
        onClose();
      } else {
        alert(data.error || "Failed to convert blog");
      }
    } catch (error) {
      console.error("Convert error:", error);
      alert("Failed to convert blog to social posts");
    } finally {
      setConverting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <FaBlog className="text-2xl text-blue-600" />
            <h2 className="text-2xl font-semibold">
              Convert Blog to Social Posts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Filter */}
        <div className="px-6 pt-4 pb-2 border-b">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Blog
          </label>
          <select
            value={blogFilter}
            onChange={(e) => setBlogFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="all">All Blogs</option>
            <option value="sagesure">SageSure AI (sagesure.io)</option>
            <option value="maplesage">MapleSage Blog (blog.maplesage.com)</option>
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <FaSpinner className="text-4xl text-gray-400 animate-spin" />
            </div>
          ) : blogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FaBlog className="text-6xl mb-4 opacity-50" />
              <p className="text-lg mb-2">No blogs yet</p>
              <p className="text-sm mb-4">
                Sync RSS feeds to import blog posts from SageSure AI and MapleSage
              </p>
              <button
                onClick={handleSyncRSS}
                disabled={syncing}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 flex items-center gap-2">
                {syncing ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Syncing RSS Feeds...
                  </>
                ) : (
                  <>
                    <FaSync />
                    Sync RSS Feeds
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {blogs.map((blog) => (
                <div
                  key={blog.id}
                  onClick={() => setSelectedBlog(blog)}
                  className={`border-2 rounded-lg cursor-pointer transition-all overflow-hidden ${
                    selectedBlog?.id === blog.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}>
                  {(blog as any).featuredImageUrl && (
                    <div className="w-full h-32 overflow-hidden">
                      <img
                        src={(blog as any).featuredImageUrl}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {blog.title}
                          </h3>
                          {(blog as any).blogName && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {(blog as any).blogName}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {blog.excerpt || blog.content.substring(0, 150)}...
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {new Date(blog.createdAt).toLocaleDateString()}
                          </span>
                          <span
                            className={`px-2 py-1 rounded ${
                              blog.status === "published"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                            {blog.status}
                          </span>
                          {(blog as any).source === "rss" && (
                            <span className="text-xs text-purple-600">
                              RSS Feed
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedBlog?.id === blog.id && (
                        <div className="ml-4">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <FaTimes className="text-white text-xs rotate-45" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedBlog && (
          <div className="p-6 border-t bg-gray-50">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blog URL (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={blogUrl}
                  onChange={(e) => setBlogUrl(e.target.value)}
                  placeholder="https://yourblog.com/post-url"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100"
                  title="Preview blog">
                  <FaExternalLinkAlt />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                If not provided, will use internal blog link
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Selected:{" "}
                <span className="font-medium">{selectedBlog.title}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                  Cancel
                </button>
                <button
                  onClick={handleConvert}
                  disabled={converting || selectedPlatforms.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2">
                  {converting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>Convert to Social Posts</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
