"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaCog, FaFacebook, FaLinkedin, FaTwitter, FaInstagram, FaYoutube } from "react-icons/fa";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"accounts" | "publishing" | "email">("accounts");
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);

  // Publishing schedule settings
  const [publishingSchedule, setPublishingSchedule] = useState({
    sunday: ["11:00 AM", "2:00 PM", "4:45 PM"],
    monday: ["11:00 AM", "2:00 PM", "4:45 PM"],
    tuesday: ["11:00 AM", "2:00 PM", "4:45 PM"],
    wednesday: ["11:00 AM", "2:00 PM", "4:45 PM"],
    thursday: ["11:00 AM", "2:00 PM", "4:45 PM"],
    friday: ["11:00 AM", "2:00 PM", "4:45 PM"],
    saturday: ["11:00 AM", "2:00 PM", "4:45 PM"],
  });

  const [publishNowByDefault, setPublishNowByDefault] = useState(false);
  const [publishLikeHuman, setPublishLikeHuman] = useState(true);
  const [nextPostDelay, setNextPostDelay] = useState("next-available");

  // Email notification settings
  const [emailNotifications, setEmailNotifications] = useState({
    activitySummary: "daily",
    socialReports: true,
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
          loadConnectedAccounts();
          setLoading(false);
        } else {
          router.push("/");
        }
      })
      .catch(() => router.push("/"));
  }, [router]);

  const loadConnectedAccounts = async () => {
    try {
      const response = await fetch("/api/platforms/connected");
      const data = await response.json();
      if (data.success) {
        setConnectedAccounts(data.platforms || []);
      }
    } catch (error) {
      console.error("Load accounts error:", error);
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
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-600 hover:text-gray-900">
                <FaArrowLeft className="text-xl" />
              </button>
              <img src="/logo.png" alt="SageSure" className="h-10 w-10" />
              <h1 className="text-2xl font-bold text-gray-900">Social Settings</h1>
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
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("accounts")}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === "accounts"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}>
                Accounts
              </button>
              <button
                onClick={() => setActiveTab("publishing")}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === "publishing"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}>
                Publishing
              </button>
              <button
                onClick={() => setActiveTab("email")}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === "email"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}>
                Email Notifications
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Accounts Tab */}
            {activeTab === "accounts" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">Connected Accounts</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Manage your social media accounts across different brands
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Connect accounts
                  </button>
                </div>

                {/* Brand: MapleSage */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-2xl">🍁</span> MapleSage (AI)
                  </h3>
                  <div className="space-y-3">
                    <AccountRow
                      platform="Facebook"
                      icon={<FaFacebook className="text-blue-600" />}
                      account="MapleSage.com"
                      handle="@maplesageinc"
                      status="active"
                      connectedBy="Parvind Dutta"
                    />
                    <AccountRow
                      platform="Instagram"
                      icon={<FaInstagram className="text-pink-600" />}
                      account="Team MapleSage"
                      handle="@maplesageinc"
                      status="active"
                      connectedBy="Parvind Dutta"
                    />
                    <AccountRow
                      platform="Twitter/X"
                      icon={<FaTwitter className="text-blue-400" />}
                      account="MapleSage Inc"
                      handle="@MaplesageInc"
                      status="active"
                      connectedBy="Parvind Dutta"
                    />
                    <AccountRow
                      platform="LinkedIn"
                      icon={<FaLinkedin className="text-blue-700" />}
                      account="MapleSage"
                      handle="@maplesage"
                      status="active"
                      connectedBy="Parvind Dutta"
                    />
                    <AccountRow
                      platform="YouTube"
                      icon={<FaYoutube className="text-red-600" />}
                      account="MapleSage"
                      handle="@maplesageinc"
                      status="expired"
                      connectedBy="Parvind Dutta"
                    />
                  </div>
                </div>

                {/* Brand: SageSure */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <img src="/logo.png" className="w-6 h-6" alt="SageSure" /> SageSure
                  </h3>
                  <div className="space-y-3">
                    <AccountRow
                      platform="Facebook"
                      icon={<FaFacebook className="text-blue-600" />}
                      account="SageSure"
                      handle="@sagesure-ai"
                      status="active"
                      connectedBy="Parvind Dutta"
                    />
                    <AccountRow
                      platform="Twitter/X"
                      icon={<FaTwitter className="text-blue-400" />}
                      account="SageSure AI"
                      handle="@SageSureAI"
                      status="active"
                      connectedBy="Parvind Dutta"
                    />
                    <AccountRow
                      platform="LinkedIn"
                      icon={<FaLinkedin className="text-blue-700" />}
                      account="SageSure AI"
                      handle="@sagesure-ai"
                      status="active"
                      connectedBy="Parvind Dutta"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Publishing Tab */}
            {activeTab === "publishing" && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Publishing Schedule</h2>

                {/* Schedule Grid */}
                <div className="mb-8">
                  <h3 className="text-base font-semibold mb-4">Schedule</h3>
                  <div className="grid grid-cols-7 gap-4">
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                      <div key={day} className="text-center">
                        <div className="font-medium text-sm mb-2">{day}</div>
                        <div className="space-y-1 text-xs text-blue-600">
                          <div>11:00 AM</div>
                          <div>2:00 PM</div>
                          <div>4:45 PM</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Publishing Options */}
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={publishNowByDefault}
                        onChange={(e) => setPublishNowByDefault(e.target.checked)}
                        className="w-5 h-5 text-blue-600"
                      />
                      <div>
                        <div className="font-medium">Publish now by default</div>
                        <div className="text-sm text-gray-600">
                          Save time by preselecting 'publish now' for all your posts.
                        </div>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={publishLikeHuman}
                        onChange={(e) => setPublishLikeHuman(e.target.checked)}
                        className="w-5 h-5 text-blue-600"
                      />
                      <div>
                        <div className="font-medium">Publish like a human</div>
                        <div className="text-sm text-gray-600">
                          Publish posts at various times within 10 minutes of your chosen time, to make it seem natural and spontaneous.
                        </div>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block mb-2">
                      <div className="font-medium mb-1">Next post delay</div>
                      <div className="text-sm text-gray-600 mb-3">
                        Choose how much time you'd like between each post if you're scheduling multiple post to the same account.
                      </div>
                    </label>
                    <select
                      value={nextPostDelay}
                      onChange={(e) => setNextPostDelay(e.target.value)}
                      className="w-64 px-4 py-2 border border-gray-300 rounded-lg">
                      <option value="next-available">Next available time slot</option>
                      <option value="15min">15 minutes</option>
                      <option value="30min">30 minutes</option>
                      <option value="1hour">1 hour</option>
                      <option value="2hours">2 hours</option>
                    </select>
                  </div>

                  <div className="pt-4">
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Email Notifications Tab */}
            {activeTab === "email" && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Email notifications</h2>

                <div className="space-y-8">
                  {/* Social Activity Summary */}
                  <div>
                    <h3 className="font-semibold mb-2">Social activity summary</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Get a round up of new interactions, conversations, and X followers.
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="activity"
                          checked={emailNotifications.activitySummary === "none"}
                          onChange={() => setEmailNotifications({...emailNotifications, activitySummary: "none"})}
                          className="w-4 h-4"
                        />
                        <span>No email summary</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="activity"
                          checked={emailNotifications.activitySummary === "daily"}
                          onChange={() => setEmailNotifications({...emailNotifications, activitySummary: "daily"})}
                          className="w-4 h-4"
                        />
                        <span>Daily (8:00 AM)</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="activity"
                          checked={emailNotifications.activitySummary === "twice-daily"}
                          onChange={() => setEmailNotifications({...emailNotifications, activitySummary: "twice-daily"})}
                          className="w-4 h-4"
                        />
                        <span>Twice daily (8:00 AM & 4:00 PM)</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="activity"
                          checked={emailNotifications.activitySummary === "weekly"}
                          onChange={() => setEmailNotifications({...emailNotifications, activitySummary: "weekly"})}
                          className="w-4 h-4"
                        />
                        <span>Weekly (Monday 8:00 AM)</span>
                      </label>
                    </div>
                  </div>

                  {/* Social Reports */}
                  <div>
                    <h3 className="font-semibold mb-2">Social Reports</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Get a monthly email with all your social reports.
                    </p>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={emailNotifications.socialReports}
                        onChange={(e) => setEmailNotifications({...emailNotifications, socialReports: e.target.checked})}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span>Yes, send me a monthly email with my social reports</span>
                    </label>
                  </div>

                  <div className="pt-4">
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Account Row Component
function AccountRow({ platform, icon, account, handle, status, connectedBy }: any) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-4">
        <div className="text-2xl">{icon}</div>
        <div>
          <div className="font-medium">{platform}</div>
          <div className="text-sm text-gray-600">{account}</div>
          <div className="text-xs text-gray-500">{handle}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className={`text-sm ${status === "active" ? "text-green-600" : "text-red-600"}`}>
            {status === "active" ? "● Active" : "● Expired"}
          </div>
          <div className="text-xs text-gray-500">Connected by {connectedBy}</div>
        </div>
        <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
          Manage blogs (1)
        </button>
      </div>
    </div>
  );
}
