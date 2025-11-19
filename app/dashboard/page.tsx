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
  FaBlog,
  FaImage,
  FaTimes,
} from "react-icons/fa";
import MediaLibraryModal from "../components/MediaLibraryModal";
import BlogSelector from "../components/BlogSelector";

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
  const [activeTab, setActiveTab] = useState<
    "create" | "drafts" | "history" | "settings"
  >("create");
  const [posts, setPosts] = useState<any[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [platformContent, setPlatformContent] = useState<
    Record<string, string>
  >({});
  const [useSameContent, setUseSameContent] = useState(true);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [selectedMediaFiles, setSelectedMediaFiles] = useState<any[]>([]);
  const [showBlogSelector, setShowBlogSelector] = useState(false);
  const [linkedBlogUrl, setLinkedBlogUrl] = useState("");

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
      // Check if we just connected a platform
      const params = new URLSearchParams(window.location.search);
      const connected = params.get("connected");

      fetch("/api/platforms/connected")
        .then((res) => res.json())
        .then((data) => {
          setConnectedPlatforms(data.platforms || []);
          // Show success message if we just connected
          if (connected) {
            alert(`Successfully connected: ${connected}`);
            // Clean up URL
            window.history.replaceState({}, "", "/dashboard");
          }
        })
        .catch(console.error);

      fetch("/api/posts/list")
        .then((res) => res.json())
        .then((data) => setPosts(data.posts || []))
        .catch(console.error);

      fetch("/api/posts/drafts")
        .then((res) => res.json())
        .then((data) => setDrafts(data.drafts || []))
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
      // Instagram uses Facebook OAuth
      const oauthPlatform =
        platformId === "instagram" ? "facebook" : platformId;
      window.location.href = `/oauth/${oauthPlatform}/authorize`;
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

  const validateBeforePublish = () => {
    if (!content && useSameContent) {
      alert("Please enter content");
      return false;
    }
    if (selectedPlatforms.includes("instagram") && !imageUrl) {
      alert("Instagram requires an image");
      return false;
    }
    if (!useSameContent) {
      for (const platform of selectedPlatforms) {
        if (!platformContent[platform]) {
          alert(`Please enter content for ${platform}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSaveDraft = async () => {
    try {
      const response = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          platforms: selectedPlatforms,
          imageUrl,
          platformContent: useSameContent ? {} : platformContent,
          isDraft: true,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert("Draft saved!");
        fetch("/api/posts/drafts")
          .then((res) => res.json())
          .then((data) => setDrafts(data.drafts || []));
      }
    } catch (error) {
      console.error("Save draft error:", error);
    }
  };

  const handleLoadDraft = (draft: any) => {
    setContent(draft.content);
    setSelectedPlatforms(JSON.parse(draft.platforms));
    setImageUrl(draft.imageUrl || "");
    if (draft.platformContent) {
      setPlatformContent(JSON.parse(draft.platformContent));
      setUseSameContent(
        Object.keys(JSON.parse(draft.platformContent)).length === 0
      );
    }
    setActiveTab("create");
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setGeneratingImage(true);
    try {
      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt }),
      });
      const data = await response.json();
      if (data.success) {
        alert(
          `Gemini Enhanced Prompt:\n\n${data.enhancedPrompt}\n\nCopy this prompt and use it with your preferred image generation tool.`
        );
        setImagePrompt("");
        setShowImageGenerator(false);
      }
    } catch (error) {
      console.error("Image generation error:", error);
    } finally {
      setGeneratingImage(false);
    }
  };

  const handlePost = async () => {
    if (!validateBeforePublish()) return;
    if (!content || selectedPlatforms.length === 0) return;
    setPosting(true);
    try {
      // Append blog URL to content if present
      const finalPlatformContent: Record<string, string> = {};
      if (!useSameContent && linkedBlogUrl) {
        selectedPlatforms.forEach((platform) => {
          const postContent = platformContent[platform] || "";
          finalPlatformContent[platform] = postContent.includes(linkedBlogUrl)
            ? postContent
            : `${postContent}\n\n${linkedBlogUrl}`;
        });
      } else {
        Object.assign(finalPlatformContent, platformContent);
      }

      const finalContent =
        linkedBlogUrl && useSameContent && !content.includes(linkedBlogUrl)
          ? `${content}\n\n${linkedBlogUrl}`
          : content;

      const payload: any = {
        content: finalContent,
        platforms: selectedPlatforms,
        imageUrl: imageUrl || undefined,
        platformContent: useSameContent ? {} : finalPlatformContent,
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
        // Show detailed results
        if (data.summary) {
          const { succeeded, failed, failedPlatforms } = data.summary;
          let message = isScheduled
            ? "Post scheduled successfully!"
            : `Posted to ${succeeded} platform(s) successfully!`;

          if (failed > 0) {
            message += `\n\nFailed to post to ${failed} platform(s):`;
            failedPlatforms.forEach((p: any) => {
              message += `\n- ${p.platform}: ${p.error}`;
            });
          }
          alert(message);
        } else {
          alert(
            isScheduled
              ? "Post scheduled successfully!"
              : "Posted successfully!"
          );
        }

        setContent("");
        setImageUrl("");
        setSelectedPlatforms([]);
        setPlatformContent({});
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
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="SageSure" className="h-10 w-10" />
              <h1 className="text-2xl font-bold text-gray-900">
                SageSure Social
              </h1>
            </div>
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
              onClick={() => setActiveTab("drafts")}
              className={`pb-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "drafts"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              <FaPlus /> Drafts ({drafts.length})
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
              onClick={() => router.push("/blogs")}
              className="pb-4 px-2 border-b-2 border-transparent font-medium text-sm flex items-center gap-2 text-gray-500 hover:text-gray-700">
              <FaBlog /> Blogs
            </button>
            <button
              onClick={() => router.push("/calendar")}
              className="pb-4 px-2 border-b-2 border-transparent font-medium text-sm flex items-center gap-2 text-gray-500 hover:text-gray-700">
              <FaHistory /> Calendar Events
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    Create new social post
                  </h2>
                  <button
                    onClick={() => setShowBlogSelector(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
                    <FaBlog /> Convert from Blog
                  </button>
                </div>

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

                  {selectedPlatforms.length > 1 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useSameContent}
                          onChange={(e) => setUseSameContent(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-blue-900">
                          Use same content for all platforms
                        </span>
                      </label>
                      <p className="text-xs text-blue-700 mt-1 ml-6">
                        Uncheck to customize content for each platform
                      </p>
                    </div>
                  )}

                  {useSameContent ? (
                    <>
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
                    </>
                  ) : (
                    <div className="space-y-4">
                      {selectedPlatforms.map((platform) => {
                        const maxLength = platform === "twitter" ? 280 : 3000;
                        return (
                          <div key={platform}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {platform.charAt(0).toUpperCase() +
                                platform.slice(1)}{" "}
                              Content
                              {platform === "instagram" && (
                                <span className="text-red-500 ml-1">
                                  (Image required)
                                </span>
                              )}
                            </label>
                            <textarea
                              value={platformContent[platform] || ""}
                              onChange={(e) =>
                                setPlatformContent({
                                  ...platformContent,
                                  [platform]: e.target.value,
                                })
                              }
                              className="w-full h-24 p-3 border border-gray-300 rounded-lg"
                              maxLength={maxLength}
                            />
                            <div className="text-xs text-gray-500 mt-1">
                              {(platformContent[platform] || "").length} /{" "}
                              {maxLength}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                    Add media
                    {selectedPlatforms.includes("instagram") && (
                      <span className="text-red-500 ml-1">
                        * Required for Instagram
                      </span>
                    )}
                  </label>

                  {/* Selected Media Preview */}
                  {selectedMediaFiles.length > 0 && (
                    <div className="mb-4 grid grid-cols-4 gap-3">
                      {selectedMediaFiles.map((media) => (
                        <div
                          key={media.id}
                          className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                          <img
                            src={media.thumbnail}
                            alt={media.filename}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() =>
                              setSelectedMediaFiles((prev) =>
                                prev.filter((m) => m.id !== media.id)
                              )
                            }
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                            <FaTimes className="text-xs" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Media Selection Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowMediaLibrary(true)}
                      className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-500 hover:bg-teal-50 flex items-center justify-center gap-2 text-gray-600 hover:text-teal-600 transition-all">
                      <FaImage /> Select from Library
                    </button>
                    <button
                      onClick={() => setShowImageGenerator(true)}
                      className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                      <FaMagic /> Generate with AI
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Select an image or video, or drag and drop files straight
                    from your desktop
                  </p>
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
                    onClick={handleSaveDraft}
                    className="px-6 py-3 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50">
                    Save Draft
                  </button>
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
                      setPlatformContent({});
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

        {activeTab === "drafts" && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Drafts</h2>
              {drafts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FaPlus className="text-4xl mx-auto mb-4 opacity-50" />
                  <p>No drafts yet. Save a draft to see it here!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="border rounded-lg p-4 hover:bg-gray-50">
                      <p className="text-gray-700 mb-2">
                        {draft.content.substring(0, 100)}
                        {draft.content.length > 100 && "..."}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {new Date(draft.createdAt).toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleLoadDraft(draft)}
                          className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                          Load Draft
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                            const oauthPlatform =
                              platform.id === "instagram"
                                ? "facebook"
                                : platform.id;
                            window.location.href = `/oauth/${oauthPlatform}/authorize`;
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

      {showImageGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Generate Image with Gemini AI
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Describe the image you want and Gemini will create an enhanced
              prompt
            </p>
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="E.g., A professional business meeting in a modern office..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleGenerateImage}
                disabled={generatingImage || !imagePrompt.trim()}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-300">
                {generatingImage ? "Generating..." : "Generate Prompt"}
              </button>
              <button
                onClick={() => setShowImageGenerator(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={(media) => {
          setSelectedMediaFiles(media);
          if (media.length > 0) {
            setImageUrl(media[0].url);
          }
        }}
        maxSelection={20}
        allowedTypes={["image", "video"]}
      />

      {/* Blog Selector Modal */}
      <BlogSelector
        isOpen={showBlogSelector}
        onClose={() => setShowBlogSelector(false)}
        onSelect={(blog, posts, blogUrl) => {
          // Set platform-specific content
          const platformContentObj: Record<string, string> = {};
          selectedPlatforms.forEach((platform) => {
            if (posts[platform]) {
              platformContentObj[platform] = posts[platform];
            }
          });

          setPlatformContent(platformContentObj);
          setUseSameContent(false);
          setLinkedBlogUrl(blogUrl);

          // Set default content if no platforms selected
          if (selectedPlatforms.length === 0) {
            setContent(
              `${
                blog.excerpt || blog.content.substring(0, 200)
              }...\n\nRead the full story →`
            );
          }

          alert(
            `Blog converted! Platform-specific posts have been generated.\n\nBlog URL: ${blogUrl}\n\nYou can now edit the posts and publish.`
          );
        }}
        selectedPlatforms={selectedPlatforms}
      />
    </div>
  );
}
