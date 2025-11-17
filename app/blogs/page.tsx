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

  const fetchBlogs = () => {
    fetch("/api/blogs/list")
      .then((res) => res.json())
      .then((data) => setBlogs(data.blogs || []))
      .catch(console.error);
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

  const handleSaveBlog = async (status: string) => {
    if (!title || !content) return;
    setSaving(true);
    try {
      const response = await fetch("/api/blogs/create", {
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
        alert(
          `Blog ${status === "published" ? "published" : "saved as draft"}!`
        );
        setTitle("");
        setContent("");
        setExcerpt("");
        setTags("");
        setView("list");
        fetchBlogs();
      }
    } catch (error) {
      console.error("Save blog error:", error);
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
              <img src="/logo.svg" alt="SageSure" className="h-8 w-8" />
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
              <h2 className="text-2xl font-bold">Your Blog Posts</h2>
              <button
                onClick={() => setView("create")}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2">
                <FaMagic /> Create New Blog
              </button>
            </div>

            {blogs.length === 0 ? (
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
            ) : (
              <div className="grid gap-6">
                {blogs.map((blog) => (
                  <div
                    key={blog.id}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-gray-900">
                        {blog.title}
                      </h3>
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
                      <div className="text-sm text-gray-500">
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                    {saving ? "Publishing..." : "Publish"}
                  </button>
                  <button
                    onClick={() => setView("preview")}
                    disabled={!content}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                    <FaEye /> Preview
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
