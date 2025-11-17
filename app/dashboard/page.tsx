"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaLinkedin, FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";

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
    if (data.logoutUrl) {
      window.location.href = data.logoutUrl;
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
                    const isSelected = selectedPlatforms.includes(platform.id);

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

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What do you want to share with your followers?
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your post..."
                  className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  maxLength={3000}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {content.length} / 3000
                </div>
              </div>

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
                    const platform = platforms.find((p) => p.id === platformId);
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
      </div>
    </div>
  );
}
