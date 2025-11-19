"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaCalendar, FaArrowLeft, FaSpinner, FaCog } from "react-icons/fa";

export default function CalendarDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [socialAgentUrl, setSocialAgentUrl] = useState("");
  const [settings, setSettings] = useState({
    companyName: "",
    brandIdentity: "",
    customerProfile: "",
  });
  const [showSettings, setShowSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
          loadSettings(data.user.sub);
          setLoading(false);
        } else {
          router.push("/");
        }
      })
      .catch(() => router.push("/"));
  }, [router]);

  const loadSettings = async (userId: string) => {
    try {
      const response = await fetch("/api/settings", {
        headers: { "x-user-id": userId },
      });
      const data = await response.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Load settings error:", error);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setSavingSettings(true);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.sub,
          ...settings,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert("Settings saved successfully!");
        setShowSettings(false);
      }
    } catch (error) {
      console.error("Save settings error:", error);
      alert("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleGenerate = async () => {
    if (!user) return;

    // Check if company name is set
    if (!settings.companyName) {
      alert("Please set your company name in settings first!");
      setShowSettings(true);
      return;
    }

    setGenerating(true);
    try {
      // Step 1: Generate calendar events
      const eventsResponse = await fetch("/api/events/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.sub }),
      });
      const eventsData = await eventsResponse.json();

      if (!eventsData.success) {
        alert(eventsData.error || "Failed to generate events");
        setGenerating(false);
        return;
      }

      setEvents(eventsData.events);

      // Step 2: Generate post suggestions
      const suggestionsResponse = await fetch("/api/events/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.sub,
          events: eventsData.events,
        }),
      });
      const suggestionsData = await suggestionsResponse.json();

      if (suggestionsData.success) {
        setSocialAgentUrl(suggestionsData.socialAgentUrl);
      }
    } catch (error) {
      console.error("Generation error:", error);
      alert("Failed to generate content");
    } finally {
      setGenerating(false);
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
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-600 hover:text-gray-900">
                <FaArrowLeft className="text-xl" />
              </button>
              <img src="/logo.png" alt="SageSure" className="h-10 w-10" />
              <h1 className="text-2xl font-bold text-gray-900">
                Calendar Events & Post Suggestions
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 border rounded-lg">
                <FaCog /> Settings
              </button>
              <span className="text-sm text-gray-600">{user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showSettings && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Portal Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) =>
                    setSettings({ ...settings, companyName: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Your Company Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Identity
                </label>
                <textarea
                  value={settings.brandIdentity}
                  onChange={(e) =>
                    setSettings({ ...settings, brandIdentity: e.target.value })
                  }
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg"
                  placeholder="Describe your brand's voice, values, and personality..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ideal Customer Profile
                </label>
                <textarea
                  value={settings.customerProfile}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      customerProfile: e.target.value,
                    })
                  }
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg"
                  placeholder="Describe your target audience, their needs, and interests..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings || !settings.companyName}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300">
                  {savingSettings ? "Saving..." : "Save Settings"}
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="text-center">
            <FaCalendar className="text-6xl text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              Generate Calendar Events & Post Suggestions
            </h2>
            <p className="text-gray-600 mb-6">
              AI will generate business-relevant calendar events for the next 30
              days and create social post suggestions tailored to your brand.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating || !settings.companyName}
              className="px-8 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-300 flex items-center gap-2 mx-auto">
              {generating ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FaCalendar />
                  Generate Events & Suggestions
                </>
              )}
            </button>
            {!settings.companyName && (
              <p className="text-sm text-red-500 mt-2">
                Please set your company name in settings first
              </p>
            )}
          </div>
        </div>

        {socialAgentUrl && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="text-center">
              <a
                href={socialAgentUrl}
                className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                View Suggested Posts
              </a>
            </div>
          </div>
        )}

        {events.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Events Generated</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Event</th>
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-left py-3 px-4">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 whitespace-nowrap">
                        {new Date(event.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-medium">{event.title}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {event.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {event.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">
                Post Suggestions Generated
              </h4>
              <p className="text-sm text-green-800">
                Social post suggestions have been created and saved as drafts.
                These posts reflect your brand identity and are tailored for
                your ideal customer profile. Click "View Suggested Posts" above
                to review and publish them.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
