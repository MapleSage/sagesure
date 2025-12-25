"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaMagic, FaArrowLeft, FaSave, FaEye } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function BlogsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [view, setView] = useState<"list" | "create" | "preview">("list");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiKeywords, setAiKeywords] = useState("");
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [socialPosts, setSocialPosts] = useState<string[]>([]);
  const [generatingSocial, setGeneratingSocial] = useState(false);
  const [showHubSpotBlogs, setShowHubSpotBlogs] = useState(false);
  const [hubspotBlogs, setHubspotBlogs] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
          setLoading(false);
        } else {
          router.push("/");
        }
      })
      .catch(() => router.push("/"));
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchBlogs();
    }
  }, [user]);

  // Reset to page 1 when switching between blog sources
  useEffect(() => {
    setCurrentPage(1);
  }, [showHubSpotBlogs]);

  const fetchBlogs = () => {
    fetch("/api/blogs/list")
      .then((res) => res.json())
      .then((data) => setBlogs(data.blogs || []))
      .catch(console.error);
  };

  const syncHubSpotBlogs = () => {
    setSyncing(true);
    fetch("/api/blogs/sync-hubspot")
      .then((res) => res.json())
      .then((data) => {
        setHubspotBlogs(data.blogs || []);
        setShowHubSpotBlogs(true);
      })
      .catch(console.error)
      .finally(() => setSyncing(false));
  };

  const handleGenerateBlog = async () => {
    if (!aiTopic.trim()) return;
    setGenerating(true);
    try {
      const response = await fetch("/api/ai/blog-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic,
          keywords: aiKeywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
        }),
      });
      const data = await response.json();
      if (data.title && data.content) {
        setTitle(data.title);
        setContent(data.content);
        setExcerpt(data.excerpt);
        setAiTopic("");
        setAiKeywords("");
        setShowAIPanel(false);
      }
    } catch (error) {
      console.error("Blog generation error:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveBlog = async (status: string, publishToHubSpot = false) => {
    if (!title || !content) return;
    setSaving(true);
    try {
      const endpoint = publishToHubSpot
        ? "/api/blogs/publish-hubspot"
        : "/api/blogs/create";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          excerpt,
          status,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const data = await response.json();
      if (data.success) {
        if (publishToHubSpot && data.hubspot?.url) {
          alert(`Blog published to HubSpot!\n\nView at: ${data.hubspot.url}`);
        } else {
          alert(
            `Blog ${status === "published" ? "published" : "saved as draft"}!`
          );
        }
        setTitle("");
        setContent("");
        setExcerpt("");
        setTags("");
        setView("list");
        fetchBlogs();
      } else {
        alert(`Error: ${data.error || "Failed to save blog"}`);
      }
    } catch (error: any) {
      console.error("Save blog error:", error);
      alert(`Error: ${error.message || "Failed to save blog"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSocialPosts = async () => {
    if (!content) return;
    setGeneratingSocial(true);
    try {
      const response = await fetch("/api/ai/blog-to-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogContent: content, count: 5 }),
      });
      const data = await response.json();
      if (data.posts) {
        setSocialPosts(data.posts);
      }
    } catch (error) {
      console.error("Generate social posts error:", error);
    } finally {
      setGeneratingSocial(false);
    }
  };

  const handleLogout = async () => {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    const data = await res.json();
    if (data.logoutUrl) window.location.href = data.logoutUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="SageSure" className="h-10 w-10" />
              <h1 className="text-2xl font-bold text-gray-900">
                SageSure Blogs
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-sm text-gray-600 hover:text-gray-900">
                Back to Dashboard
              </button>
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === "list" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Your Blog Posts</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowHubSpotBlogs(false)}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      !showHubSpotBlogs
                        ? "bg-orange-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}>
                    Local Drafts
                  </button>
                  <button
                    onClick={syncHubSpotBlogs}
                    disabled={syncing}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      showHubSpotBlogs
                        ? "bg-orange-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}>
                    {syncing ? "Syncing..." : "HubSpot Blogs"}
                  </button>
                  <button
                    onClick={async () => {
                      setSyncing(true);
                      try {
                        const response = await fetch("/api/blogs/sync-rss", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ blogFilter: undefined }),
                        });
                        const data = await response.json();
                        if (data.success) {
                          alert(data.message);
                          fetchBlogs();
                        } else {
                          alert(data.error || "Failed to sync RSS feeds");
                        }
                      } catch (error) {
                        console.error("RSS sync error:", error);
                        alert("Failed to sync RSS feeds");
                      } finally {
                        setSyncing(false);
                      }
                    }}
                    disabled={syncing}
                    className="px-4 py-2 rounded-lg text-sm bg-purple-500 text-white hover:bg-purple-600 disabled:bg-gray-300">
                    {syncing ? "Syncing..." : "Sync RSS Feeds"}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setView("create")}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2">
                <FaMagic /> Create New Blog
              </button>
            </div>

            {!showHubSpotBlogs && blogs.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-4">
                  No blog posts yet. Create your first one!
                </p>
                <button
                  onClick={() => setView("create")}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600">
                  Create Blog Post
                </button>
              </div>
            ) : showHubSpotBlogs && hubspotBlogs.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-4">No HubSpot blogs found.</p>
              </div>
            ) : (
              <>
                {/* Pagination Controls - Top */}
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-700">Show:</label>
                        <select
                          value={perPage}
                          onChange={(e) => {
                            setPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="border border-gray-300 rounded px-3 py-1 text-sm">
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                        <span className="text-sm text-gray-700">per page</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Showing {((currentPage - 1) * perPage) + 1} to{" "}
                        {Math.min(currentPage * perPage, (showHubSpotBlogs ? hubspotBlogs : blogs).length)} of{" "}
                        {(showHubSpotBlogs ? hubspotBlogs : blogs).length} blogs
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        First
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        Prev
                      </button>
                      <span className="px-3 py-1 text-sm">
                        Page {currentPage} of {Math.ceil((showHubSpotBlogs ? hubspotBlogs : blogs).length / perPage)}
                      </span>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage >= Math.ceil((showHubSpotBlogs ? hubspotBlogs : blogs).length / perPage)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        Next
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.ceil((showHubSpotBlogs ? hubspotBlogs : blogs).length / perPage))}
                        disabled={currentPage >= Math.ceil((showHubSpotBlogs ? hubspotBlogs : blogs).length / perPage)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        Last
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6">
                {(showHubSpotBlogs ? hubspotBlogs : blogs)
                  .slice((currentPage - 1) * perPage, currentPage * perPage)
                  .map((blog) => (
                  <div
                    key={blog.id}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
                    {blog.featuredImageUrl && (
                      <div className="w-full h-48 overflow-hidden">
                        <img
                          src={blog.featuredImageUrl}
                          alt={blog.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-gray-900">
                              {blog.title}
                            </h3>
                            {blog.source === "rss" && (
                              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                                RSS
                              </span>
                            )}
                            {blog.blogName && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                {blog.blogName}
                              </span>
                            )}
                          </div>
                        {blog.link && (
                          <a
                            href={blog.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline">
                            View Original →
                          </a>
                        )}
                        {blog.hubspotUrl && (
                          <a
                            href={blog.hubspotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline">
                            View on HubSpot →
                          </a>
                        )}
                        {blog.author && (
                          <p className="text-xs text-gray-500 mt-1">
                            By {blog.author}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-xs px-3 py-1 rounded ${
                          blog.status === "published"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                        {blog.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{blog.excerpt}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        {blog.tags?.map((tag: string) => (
                          <span
                            key={tag}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        {showHubSpotBlogs && (
                          <button
                            onClick={async () => {
                              setContent(blog.content);
                              setGeneratingSocial(true);
                              try {
                                const response = await fetch(
                                  "/api/ai/blog-to-social",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      blogContent: blog.content,
                                      count: 5,
                                    }),
                                  }
                                );
                                const data = await response.json();
                                if (data.posts) {
                                  alert(
                                    `Generated ${data.posts.length} social posts! Check the dashboard to schedule them.`
                                  );
                                }
                              } catch (error) {
                                console.error(error);
                              } finally {
                                setGeneratingSocial(false);
                              }
                            }}
                            disabled={generatingSocial}
                            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-300">
                            {generatingSocial
                              ? "Generating..."
                              : "Generate Social Posts"}
                          </button>
                        )}
                        <div className="text-sm text-gray-500">
                          {new Date(blog.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls - Bottom */}
              <div className="bg-white rounded-lg shadow p-4 mt-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * perPage) + 1} to{" "}
                    {Math.min(currentPage * perPage, (showHubSpotBlogs ? hubspotBlogs : blogs).length)} of{" "}
                    {(showHubSpotBlogs ? hubspotBlogs : blogs).length} blogs
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                      Prev
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {currentPage} of {Math.ceil((showHubSpotBlogs ? hubspotBlogs : blogs).length / perPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= Math.ceil((showHubSpotBlogs ? hubspotBlogs : blogs).length / perPage)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.ceil((showHubSpotBlogs ? hubspotBlogs : blogs).length / perPage))}
                      disabled={currentPage >= Math.ceil((showHubSpotBlogs ? hubspotBlogs : blogs).length / perPage)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                      Last
                    </button>
                  </div>
                </div>
              </div>
            </>
            )}
          </div>
        )}

        {view === "create" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Create Blog Post</h2>
                  <button
                    onClick={() => setView("list")}
                    className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
                    <FaArrowLeft /> Back
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Blog Title
                    </label>
                    <button
                      onClick={() => setShowAIPanel(!showAIPanel)}
                      className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
                      <FaMagic /> AI Generate
                    </button>
                  </div>

                  {showAIPanel && (
                    <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <input
                        type="text"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        placeholder="Blog topic (e.g., 'The Future of Specialty Insurance')"
                        className="w-full p-2 border border-purple-300 rounded-lg mb-2"
                      />
                      <input
                        type="text"
                        value={aiKeywords}
                        onChange={(e) => setAiKeywords(e.target.value)}
                        placeholder="Keywords (comma-separated, optional)"
                        className="w-full p-2 border border-purple-300 rounded-lg mb-2"
                      />
                      <button
                        onClick={handleGenerateBlog}
                        disabled={generating || !aiTopic.trim()}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300">
                        {generating ? "Generating..." : "Generate Blog Post"}
                      </button>
                    </div>
                  )}

                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter blog title..."
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content (Markdown)
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your blog post in markdown..."
                    className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Excerpt (Optional)
                  </label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Brief summary..."
                    className="w-full h-20 p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="insurance, technology, AI"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSaveBlog("draft")}
                      disabled={saving || !title || !content}
                      className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 disabled:bg-gray-300 flex items-center justify-center gap-2">
                      <FaSave /> Save Draft
                    </button>
                    <button
                      onClick={() => handleSaveBlog("published")}
                      disabled={saving || !title || !content}
                      className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 disabled:bg-gray-300">
                      {saving ? "Publishing..." : "Publish Locally"}
                    </button>
                    <button
                      onClick={() => setView("preview")}
                      disabled={!content}
                      className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                      <FaEye /> Preview
                    </button>
                  </div>
                  <button
                    onClick={() => handleSaveBlog("published", true)}
                    disabled={saving || !title || !content}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-lg hover:from-orange-600 hover:to-red-600 disabled:bg-gray-300 font-semibold">
                    {saving
                      ? "Publishing to HubSpot..."
                      : "🚀 Publish to HubSpot (SEO-Optimized)"}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-8">
                <h3 className="text-lg font-semibold mb-4">
                  Generate Social Posts
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Convert your blog into social media posts automatically
                </p>
                <button
                  onClick={handleGenerateSocialPosts}
                  disabled={generatingSocial || !content}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 mb-4">
                  {generatingSocial ? "Generating..." : "Generate 5 Posts"}
                </button>

                {socialPosts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Generated Posts:</h4>
                    {socialPosts.map((post, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 rounded text-sm border">
                        {post}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === "preview" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">{title || "Untitled"}</h2>
                <button
                  onClick={() => setView("create")}
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
                  <FaArrowLeft /> Back to Editor
                </button>
              </div>
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
