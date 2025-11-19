"use client";

import { useState } from "react";
import {
  FaLinkedin,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaMagic,
  FaSpellCheck,
  FaLightbulb,
  FaImage,
  FaVideo,
  FaBlog,
} from "react-icons/fa";

interface Platform {
  id: string;
  name: string;
  icon: any;
  color: string;
  maxLength: number;
}

const platforms: Platform[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: FaLinkedin,
    color: "text-blue-600",
    maxLength: 3000,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: FaFacebook,
    color: "text-blue-700",
    maxLength: 63206,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: FaInstagram,
    color: "text-pink-600",
    maxLength: 2200,
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: FaTwitter,
    color: "text-sky-500",
    maxLength: 280,
  },
];

interface PostComposerProps {
  connectedPlatforms: string[];
  onOpenMediaLibrary: () => void;
  onOpenBlogSelector: () => void;
  onOpenAIComposer: () => void;
}

export default function PostComposer({
  connectedPlatforms,
  onOpenMediaLibrary,
  onOpenBlogSelector,
  onOpenAIComposer,
}: PostComposerProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [useSameContent, setUseSameContent] = useState(true);
  const [platformContent, setPlatformContent] = useState<
    Record<string, string>
  >({});

  const togglePlatform = (platformId: string) => {
    if (!connectedPlatforms.includes(platformId)) {
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

  const getCharacterCount = (platform: string) => {
    const text = useSameContent ? content : platformContent[platform] || "";
    const maxLength =
      platforms.find((p) => p.id === platform)?.maxLength || 3000;
    return { current: text.length, max: maxLength };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Composer */}
      <div className="lg:col-span-2 space-y-6">
        {/* Account Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Select accounts
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              const isConnected = connectedPlatforms.includes(platform.id);
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
                  <div className="text-left flex-1">
                    <div className="font-medium text-sm">{platform.name}</div>
                    <div className="text-xs text-gray-500">
                      {isConnected ? "Connected" : "Not connected"}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Editor */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              What do you want to share with your followers?
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAIComposer}
                className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
                <FaMagic /> AI Composer
              </button>
              <button
                onClick={onOpenBlogSelector}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <FaBlog /> From Blog
              </button>
            </div>
          </div>

          {/* Same content toggle */}
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
            </div>
          )}

          {/* Text Editor */}
          {useSameContent ? (
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post..."
                className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                maxLength={3000}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-3">
                  <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <FaSpellCheck /> Spell Check
                  </button>
                  <button className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
                    <FaLightbulb /> Get Suggestions
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  {content.length} / 3000
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedPlatforms.map((platformId) => {
                const platform = platforms.find((p) => p.id === platformId);
                if (!platform) return null;
                const { current, max } = getCharacterCount(platformId);
                return (
                  <div key={platformId}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {platform.name}
                      {platformId === "instagram" && (
                        <span className="text-red-500 ml-1">
                          (Image required)
                        </span>
                      )}
                    </label>
                    <textarea
                      value={platformContent[platformId] || ""}
                      onChange={(e) =>
                        setPlatformContent({
                          ...platformContent,
                          [platformId]: e.target.value,
                        })
                      }
                      placeholder={`Write your ${platform.name} post...`}
                      className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      maxLength={max}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {current} / {max}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Media Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Add media
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onOpenMediaLibrary}
              className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all">
              <FaImage className="text-gray-400" />
              <span className="text-sm font-medium text-gray-600">
                Select from Library
              </span>
            </button>
            <button className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all">
              <FaMagic className="text-gray-400" />
              <span className="text-sm font-medium text-gray-600">
                Generate with AI
              </span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Select an image or video, or drag and drop files straight from your
            desktop
          </p>
        </div>

        {/* Publishing Options */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Publishing options
          </h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="publish"
                defaultChecked
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Publish now</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="publish" className="w-4 h-4" />
              <span className="text-sm font-medium">Schedule for later</span>
            </label>
          </div>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Preview</h3>
          {selectedPlatforms.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-sm">Select platforms to see preview</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedPlatforms.map((platformId) => {
                const platform = platforms.find((p) => p.id === platformId);
                if (!platform) return null;
                const Icon = platform.icon;
                const postContent = useSameContent
                  ? content
                  : platformContent[platformId] || "";
                return (
                  <div
                    key={platformId}
                    className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={`text-lg ${platform.color}`} />
                      <span className="font-medium text-sm">
                        {platform.name}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {postContent || "Your post content will appear here..."}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
