"use client";

import { useState } from "react";
import { FaVideo, FaYoutube, FaUpload, FaTimes } from "react-icons/fa";

interface VideoUploaderProps {
  onVideoSelect: (url: string, type: "upload" | "youtube") => void;
  currentVideo?: string;
  onRemove: () => void;
}

export default function VideoUploader({
  onVideoSelect,
  currentVideo,
  onRemove,
}: VideoUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate video file
    if (!file.type.startsWith("video/")) {
      alert("Please select a video file");
      return;
    }

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      alert("Video file too large. Maximum size is 100MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "videos");

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        onVideoSelect(data.media.url, "upload");
        setShowModal(false);
      } else {
        alert("Upload failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  const handleYoutubeSubmit = () => {
    if (!youtubeUrl.trim()) return;

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(youtubeUrl)) {
      alert("Please enter a valid YouTube URL");
      return;
    }

    onVideoSelect(youtubeUrl, "youtube");
    setYoutubeUrl("");
    setShowModal(false);
  };

  return (
    <>
      {currentVideo ? (
        <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
          {currentVideo.includes("youtube.com") ||
          currentVideo.includes("youtu.be") ? (
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              <FaYoutube className="text-6xl text-red-600" />
              <div className="ml-4">
                <p className="font-medium">YouTube Video</p>
                <p className="text-sm text-gray-600 truncate max-w-xs">
                  {currentVideo}
                </p>
              </div>
            </div>
          ) : (
            <video
              src={currentVideo}
              controls
              className="w-full aspect-video object-cover"
            />
          )}
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600">
            <FaTimes />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center gap-3 text-gray-600 hover:text-blue-600 transition-all">
          <FaVideo className="text-4xl" />
          <span className="font-medium">Add Video</span>
          <span className="text-sm">Upload or link YouTube video</span>
        </button>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Video</h3>

            <div className="space-y-4">
              {/* Upload Video */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Video File
                </label>
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer">
                  <FaUpload />
                  <span>
                    {uploading ? "Uploading..." : "Choose video file"}
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  MP4, MOV, AVI (max 100MB)
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* YouTube URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube Video URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="flex-1 p-3 border border-gray-300 rounded-lg"
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleYoutubeSubmit()
                    }
                  />
                  <button
                    onClick={handleYoutubeSubmit}
                    disabled={!youtubeUrl.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300">
                    <FaYoutube />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
