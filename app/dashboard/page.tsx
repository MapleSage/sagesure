"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaLinkedin,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaPlus,
  FaHistory,
  FaCog,
  FaMagic,
  FaSpellCheck,
  FaLightbulb,
} from "react-icons/fa";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [posting, setPosting] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "history" | "settings">(
    "create"
  );
  const [posts, setPosts] = useState<any[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

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
      fetch("/api/platforms/connected")
        .then((res) => res.json())
        .then((data) => setConnectedPlatforms(data.platforms || []))
        .catch(console.error);

      fetch("/api/posts/list")
        .then((res) => res.json())
        .then((data) => setPosts(data.posts || []))
        .catch(console.error);
    }
  }, [user]);

  const platforms = [
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: FaLinkedin,
      color: "text-blue-600",
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: FaFacebook,
      color: "text-blue-700",
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: FaInstagram,
      color: "text-pink-600",
    },
    {
      id: "twitter",
      name: "X (Twitter)",
      icon: FaTwitter,
      color: "text-sky-500",
    },
  ];

  const togglePlatform = (platformId: string) => {
    if (!connectedPlatforms.includes(platformId)) {
      window.location.href = `/api/oauth/${platformId}/authorize`;
      return;
    }
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleLogout = async () => {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    const data = await res.json();
    if (data.logoutUrl) window.location.href = data.logoutUrl;
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setGeneratingAI(true);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          platforms: selectedPlatforms,
        }),
      });
      const data = await response.json();
      if (data.content) {
        setContent(data.content);
        setAiPrompt("");
        setShowAIPanel(false);
      }
    } catch (error) {
      console.error("AI generation error:", error);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSpellCheck = async () => {
    if (!content.trim()) return;
    try {
      const response = await fetch("/api/ai/spellcheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (data.corrected) {
        setContent(data.corrected);
        alert("Spelling and grammar checked!");
      }
    } catch (error) {
      console.error("Spell check error:", error);
    }
  };

  const handleGetSuggestions = async () => {
    if (!content.trim()) return;
    try {
      const response = await fetch("/api/ai/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Suggestions error:", error);
    }
  };

  const handlePost = async () => {
    if (!content || selectedPlatforms.length === 0) return;
    setPosting(true);
    try {
      const payload: any = {
        content,
        platforms: selectedPlatforms,
        imageUrl: imageUrl || undefined,
      };
      if (isScheduled && scheduledDate && scheduledTime) {
        payload.scheduledFor = new Date(
          `${scheduledDate}T${scheduledTime}`
        ).toISOString();
      }
      const response = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        alert(
          isScheduled ? "Post scheduled successfully!" : "Posted successfully!"
        );
        setContent("");
        setImageUrl("");
        setSelectedPlatforms([]);
        setIsScheduled(false);
        setScheduledDate("");
        setScheduledTime("");
        setSuggestions([]);
        fetch("/api/posts/list")
          .then((res) => res.json())
          .then((data) => setPosts(data.posts || []))
          .catch(console.error);
      } else {
        alert("Failed to post: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Post error:", error);
      alert("Failed to post");
    } finally {
      setPosting(false);
    }
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
            <h1 className="text-2xl font-bold text-gray-900">
              SageSure Social
            </h1>
            <div className="flex items-center gap-4">
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
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab("create")}
              className={`pb-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "create"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              <FaPlus /> Create Post
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "history"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              <FaHistory /> Posts History
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`pb-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "settings"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              <FaCog /> Connected Accounts
            </button>
          </nav>
        </div>

        {activeTab === "create" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Create new social post
                </h2>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select accounts
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {platforms.map((platform) => {
                      const Icon = platform.icon;
                      const isConnected = connectedPlatforms.includes(
                        platform.id
                      );
                      const isSelected = selectedPlatforms.includes(
                        platform.id
                      );
                      return (
                        <button
                          key={platform.id}
                          onClick={() => togglePlatform(platform.id)}
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          } ${!isConnected && "opacity-50"}`}>
                          <Icon className={`text-2xl ${platform.color}`} />
                          <div className="text-left">
                            <div className="font-medium">{platform.name}</div>
                            <div className="text-xs text-gray-500">
                              {isConnected ? "Connected" : "Not connected"}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      What do you want to share with your followers?
                    </label>
                    <button
                      onClick={() => setShowAIPanel(!showAIPanel)}
                      className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700">
                      <FaMagic /> AI Composer
                    </button>
                  </div>

                  {showAIPanel && (
                    <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="Describe what you want to post about..."
                          className="flex-1 p-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleGenerateAI()
                          }
                        />
                        <button
                          onClick={handleGenerateAI}
                          disabled={generatingAI || !aiPrompt.trim()}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300">
                          {generatingAI ? "Generating..." : "Generate"}
                        </button>
                      </div>
                    </div>
                  )}

                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your post..."
                    className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    maxLength={3000}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-2">
                      <button
                        onClick={handleSpellCheck}
                        disabled={!content.trim()}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:text-gray-400">
                        <FaSpellCheck /> Spell Check
                      </button>
                      <button
                        onClick={handleGetSuggestions}
                        disabled={!content.trim()}
                        className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1 disabled:text-gray-400">
                        <FaLightbulb /> Get Suggestions
                      </button>
                    </div>
                    <div className="text-sm text-gray-500">
                      {content.length} / 3000
                    </div>
                  </div>
                </div>

                {suggestions.length > 0 && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">
                      AI Suggestions:
                    </h4>
                    <ul className="space-y-2">
                      {suggestions.map((suggestion, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-green-800 flex items-start gap-2">
                          <span className="text-green-600">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add media (optional)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Publishing options
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsScheduled(false)}
                      className={`px-4 py-2 rounded-lg ${
                        !isScheduled
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                      Publish now
                    </button>
                    <button
                      onClick={() => setIsScheduled(true)}
                      className={`px-4 py-2 rounded-lg ${
                        isScheduled
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                      Schedule for later
                    </button>
                  </div>
                </div>

                {isScheduled && (
                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time
                      </label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handlePost}
                    disabled={
                      posting || !content || selectedPlatforms.length === 0
                    }
                    className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed">
                    {posting
                      ? "Posting..."
                      : isScheduled
                      ? "Schedule"
                      : "Publish"}
                  </button>
                  <button
                    onClick={() => {
                      setContent("");
                      setImageUrl("");
                      setSelectedPlatforms([]);
                      setSuggestions([]);
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-8">
                <h3 className="text-lg font-semibold mb-4">Preview</h3>
                {selectedPlatforms.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    Select platforms to see preview
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedPlatforms.map((platformId) => {
                      const platform = platforms.find(
                        (p) => p.id === platformId
                      );
                      if (!platform) return null;
                      const Icon = platform.icon;
                      return (
                        <div key={platformId} className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Icon className={`text-xl ${platform.color}`} />
                            <span className="font-medium text-sm">
                              {platform.name}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {content || "Your post content will appear here..."}
                          </div>
                          {imageUrl && (
                            <div className="mt-3">
                              <img
                                src={imageUrl}
                                alt="Preview"
                                className="w-full rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Posts History</h2>
              {posts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FaHistory className="text-4xl mx-auto mb-4 opacity-50" />
                  <p>No posts yet. Create your first post!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2">
                          {JSON.parse(post.platforms || "[]").map(
                            (platform: string) => {
                              const p = platforms.find(
                                (pl) => pl.id === platform
                              );
                              if (!p) return null;
                              const Icon = p.icon;
                              return (
                                <Icon
                                  key={platform}
                                  className={`text-lg ${p.color}`}
                                />
                              );
                            }
                          )}
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            post.status === "published"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                          {post.status}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{post.content}</p>
                      <div className="text-xs text-gray-500">
                        {post.scheduledFor
                          ? `Scheduled for: ${new Date(
                              post.scheduledFor
                            ).toLocaleString()}`
                          : `Posted: ${new Date(
                              post.createdAt
                            ).toLocaleString()}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
              <div className="space-y-4">
                {platforms.map((platform) => {
                  const Icon = platform.icon;
                  const isConnected = connectedPlatforms.includes(platform.id);
                  return (
                    <div
                      key={platform.id}
                      className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon className={`text-3xl ${platform.color}`} />
                        <div>
                          <div className="font-medium">{platform.name}</div>
                          <div className="text-sm text-gray-500">
                            {isConnected ? "Connected" : "Not connected"}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (!isConnected) {
                            window.location.href = `/api/oauth/${platform.id}/authorize`;
                          }
                        }}
                        className={`px-4 py-2 rounded-lg ${
                          isConnected
                            ? "bg-green-100 text-green-700 cursor-default"
                            : "bg-orange-500 text-white hover:bg-orange-600"
                        }`}>
                        {isConnected ? "Connected" : "Connect"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
