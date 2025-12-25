"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FaTimes,
  FaSearch,
  FaUpload,
  FaMagic,
  FaFolder,
  FaCheck,
  FaSpinner,
} from "react-icons/fa";
import dynamic from "next/dynamic";

const GoogleDrivePicker = dynamic(() => import("./GoogleDrivePicker"), {
  ssr: false,
});
const CanvaButton = dynamic(() => import("./CanvaButton"), { ssr: false });

interface Media {
  id: string;
  url: string;
  thumbnail: string;
  filename: string;
  type: "image" | "video";
  size: number;
  width?: number;
  height?: number;
  folder?: string;
  createdAt: string;
  selected?: boolean;
}

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: Media[]) => void;
  maxSelection?: number;
  allowedTypes?: ("image" | "video")[];
}

export default function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  maxSelection = 20,
  allowedTypes = ["image", "video"],
}: MediaLibraryModalProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [folders, setFolders] = useState<{ name: string; count: number }[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<Media[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showGoogleDrive, setShowGoogleDrive] = useState(false);
  const [showCanva, setShowCanva] = useState(false);
  const [showAllMedia, setShowAllMedia] = useState(false);

  // Load media library
  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);

      const response = await fetch(`/api/media/library?${params}`);
      const data = await response.json();

      if (data.success) {
        setMedia(data.media || []);
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error("Failed to load media:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen, loadMedia]);

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    console.log("[MediaLibrary] Starting upload of", files.length, "files");
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(
          "[MediaLibrary] Uploading file:",
          file.name,
          file.type,
          file.size
        );

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        console.log("[MediaLibrary] Upload response status:", response.status);
        const data = await response.json();
        console.log("[MediaLibrary] Upload response data:", data);
        if (data.success) {
          setMedia((prev) => [data.media, ...prev]);
        } else {
          alert(`Failed to upload ${file.name}: ${data.error}`);
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  // Handle import from URL
  const handleImportFromUrl = async (url: string) => {
    setUploading(true);
    try {
      const response = await fetch("/api/media/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (data.success) {
        setMedia((prev) => [data.media, ...prev]);
        alert("Image imported successfully!");
      } else {
        alert(`Failed to import: ${data.error}`);
      }
    } catch (error) {
      console.error("Import failed:", error);
      alert("Failed to import from URL");
    } finally {
      setUploading(false);
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Toggle media selection
  const toggleMediaSelection = (item: Media) => {
    setSelectedMedia((prev) => {
      const isSelected = prev.find((m) => m.id === item.id);
      if (isSelected) {
        return prev.filter((m) => m.id !== item.id);
      } else if (prev.length < maxSelection) {
        return [...prev, item];
      }
      return prev;
    });
  };

  // Handle insert
  const handleInsert = () => {
    onSelect(selectedMedia);
    setSelectedMedia([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold">
            Select up to {maxSelection} images
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, descriptions, folders, or stock images"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <FaSpinner className="text-4xl text-gray-400 animate-spin" />
            </div>
          ) : (
            <>
              {/* Recently Updated */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {showAllMedia ? "All Media" : "Recently updated"}
                  </h3>
                  {media.length > 12 && (
                    <button
                      onClick={() => setShowAllMedia(!showAllMedia)}
                      className="text-sm text-teal-600 hover:text-teal-700">
                      {showAllMedia ? "← Show recent" : `View all (${media.length}) →`}
                    </button>
                  )}
                </div>
                <div
                  className="grid grid-cols-4 gap-4"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}>
                  {(showAllMedia ? media : media.slice(0, 12)).map((item) => {
                    const isSelected = selectedMedia.find(
                      (m) => m.id === item.id
                    );
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleMediaSelection(item)}
                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                          isSelected
                            ? "border-teal-500 ring-2 ring-teal-200"
                            : "border-gray-200 hover:border-gray-300"
                        }`}>
                        <img
                          src={item.thumbnail}
                          alt={item.filename}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-teal-500 text-white rounded-full p-1">
                            <FaCheck className="text-sm" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recently Updated Folders */}
              {folders.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Recently updated folders
                    </h3>
                    <button className="text-sm text-teal-600 hover:text-teal-700">
                      View all →
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {folders.slice(0, 4).map((folder) => (
                      <div
                        key={folder.name}
                        className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer">
                        <FaFolder className="text-4xl text-blue-400 mb-2" />
                        <span className="text-sm font-medium text-center">
                          {folder.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {folder.count} items
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {media.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <FaFolder className="text-6xl mb-4 opacity-50" />
                  <p className="text-lg mb-2">No media files yet</p>
                  <p className="text-sm">
                    Upload your first file to get started
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center gap-3">
            <button
              onClick={handleInsert}
              disabled={selectedMedia.length === 0}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
              Insert files ({selectedMedia.length}/{maxSelection})
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUploadMenu(!showUploadMenu)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2">
                <FaUpload /> Upload
              </button>

              {showUploadMenu && (
                <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-64 z-10">
                  <label className="block px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept={allowedTypes
                        .map((t) => (t === "image" ? "image/*" : "video/*"))
                        .join(",")}
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFileUpload(e.target.files);
                          setShowUploadMenu(false);
                        }
                      }}
                      className="hidden"
                    />
                    📁 Upload from computer
                  </label>
                  <button
                    onClick={() => {
                      const url = prompt("Enter image URL:");
                      if (url) {
                        handleImportFromUrl(url);
                        setShowUploadMenu(false);
                      }
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100">
                    🔗 Import from URL
                  </button>
                  <button
                    onClick={() => {
                      alert(
                        "Google Drive integration coming soon! For now, please use 'Upload from computer' or 'Import from URL'."
                      );
                      setShowUploadMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-400">
                    ☁️ Import from Google Drive (Coming soon)
                  </button>
                  <button
                    onClick={() => {
                      alert(
                        "Dropbox integration coming soon! For now, please use 'Upload from computer' or 'Import from URL'."
                      );
                      setShowUploadMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-400">
                    📦 Import from Dropbox (Coming soon)
                  </button>
                  <button
                    onClick={() => {
                      alert(
                        "OneDrive integration coming soon! For now, please use 'Upload from computer' or 'Import from URL'."
                      );
                      setShowUploadMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-400">
                    📊 Import from OneDrive (Coming soon)
                  </button>
                  <button
                    onClick={() => {
                      alert("Canva integration coming soon!");
                      setShowUploadMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-400">
                    🎨 Import from Canva (Coming soon)
                  </button>
                  <button
                    onClick={() => {
                      alert("Adobe Express integration coming soon!");
                      setShowUploadMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-400">
                    🎨 Import from Adobe Express (Coming soon)
                  </button>
                </div>
              )}
            </div>

            <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2">
              <FaMagic /> Generate with AI
            </button>
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-gray-600">
              <FaSpinner className="animate-spin" />
              <span>Uploading...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
