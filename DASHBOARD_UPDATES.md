# Dashboard UI Updates - Implementation Guide

## New State Variables (Add to existing state)

```typescript
const [drafts, setDrafts] = useState<any[]>([]);
const [platformContent, setPlatformContent] = useState<Record<string, string>>(
  {}
);
const [useSameContent, setUseSameContent] = useState(true);
const [showImageGenerator, setShowImageGenerator] = useState(false);
const [imagePrompt, setImagePrompt] = useState("");
const [generatingImage, setGeneratingImage] = useState(false);
const [activeTab, setActiveTab] = useState<
  "create" | "drafts" | "history" | "settings"
>("create");
```

## Add to useEffect (fetch drafts)

```typescript
fetch("/api/posts/drafts")
  .then((res) => res.json())
  .then((data) => setDrafts(data.drafts || []))
  .catch(console.error);
```

## New Handler Functions

```typescript
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
      // Refresh drafts
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
        `Enhanced prompt: ${data.enhancedPrompt}\n\nUse this with DALL-E or Midjourney`
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
```

## Update handlePost function

```typescript
const handlePost = async () => {
  if (!validateBeforePublish()) return;

  setPosting(true);
  try {
    const payload: any = {
      content,
      platforms: selectedPlatforms,
      imageUrl: imageUrl || undefined,
      platformContent: useSameContent ? {} : platformContent,
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
      setPlatformContent({});
      setIsScheduled(false);
      setScheduledDate("");
      setScheduledTime("");
      setSuggestions([]);
      // Refresh posts
      fetch("/api/posts/list")
        .then((res) => res.json())
        .then((data) => setPosts(data.posts || []));
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
```

## UI Components to Add

### 1. Drafts Tab (add to nav)

```tsx
<button
  onClick={() => setActiveTab("drafts")}
  className={`pb-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
    activeTab === "drafts"
      ? "border-orange-500 text-orange-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}>
  <FaPlus /> Drafts ({drafts.length})
</button>
```

### 2. Platform-Specific Content Toggle

```tsx
<div className="mb-4">
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={useSameContent}
      onChange={(e) => setUseSameContent(e.target.checked)}
    />
    <span className="text-sm">Use same content for all platforms</span>
  </label>
</div>;

{
  !useSameContent &&
    selectedPlatforms.map((platform) => (
      <div key={platform} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {platform.charAt(0).toUpperCase() + platform.slice(1)} Content
          {platform === "instagram" && " (Image required)"}
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
          maxLength={platform === "twitter" ? 280 : 3000}
        />
        <div className="text-xs text-gray-500 mt-1">
          {(platformContent[platform] || "").length} /{" "}
          {platform === "twitter" ? 280 : 3000}
        </div>
      </div>
    ));
}
```

### 3. Image Generator Modal

```tsx
{
  showImageGenerator && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Generate Image with AI</h3>
        <textarea
          value={imagePrompt}
          onChange={(e) => setImagePrompt(e.target.value)}
          placeholder="Describe the image you want..."
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
  );
}
```

### 4. Save Draft Button

```tsx
<div className="flex gap-3">
  <button
    onClick={handleSaveDraft}
    className="px-6 py-3 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50">
    Save Draft
  </button>
  <button
    onClick={handlePost}
    disabled={posting || !content || selectedPlatforms.length === 0}
    className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-300">
    {posting ? "Posting..." : isScheduled ? "Schedule" : "Publish"}
  </button>
</div>
```

### 5. Drafts Tab Content

```tsx
{
  activeTab === "drafts" && (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Drafts</h2>
        {drafts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No drafts yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="border rounded-lg p-4 hover:bg-gray-50">
                <p className="text-gray-700 mb-2">
                  {draft.content.substring(0, 100)}...
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {new Date(draft.createdAt).toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleLoadDraft(draft)}
                    className="text-sm text-orange-600 hover:text-orange-700">
                    Load Draft
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 6. Image Upload Section with AI Generator

```tsx
<div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Add media (optional)
    {selectedPlatforms.includes("instagram") && (
      <span className="text-red-500 ml-1">* Required for Instagram</span>
    )}
  </label>
  <div className="flex gap-2">
    <input
      type="url"
      value={imageUrl}
      onChange={(e) => setImageUrl(e.target.value)}
      placeholder="https://example.com/image.jpg"
      className="flex-1 p-3 border border-gray-300 rounded-lg"
    />
    <button
      onClick={() => setShowImageGenerator(true)}
      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
      <FaMagic /> AI Generate
    </button>
  </div>
</div>
```

## Deploy

After making these changes, commit and deploy:

```bash
git add -A
git commit -m "Add draft management, platform-specific content, and image generation UI"
vercel --prod
```
