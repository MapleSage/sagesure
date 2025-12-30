"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaFacebook, FaLinkedin, FaTwitter, FaInstagram, FaSpinner, FaCog, FaKey, FaTimes, FaSave } from "react-icons/fa";
import type { Brand } from "@/lib/brand-detection";

interface ConnectedAccount {
  platform: string;
  brand: Brand;
  platformKey: string;
  connected: boolean;
  accountName?: string;
  accountHandle?: string;
  organizationId?: string;
  pageId?: string;
  expiresAt?: number;
}

interface OAuthCredentials {
  platformBrandKey: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<Brand>("sagesure");
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  // OAuth Credentials state
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [credentialsForm, setCredentialsForm] = useState({
    clientId: "",
    clientSecret: "",
    redirectUri: "",
  });
  const [savingCredentials, setSavingCredentials] = useState(false);

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

  const handleConnect = (platform: string, brand: Brand) => {
    window.location.href = `/api/oauth/${platform}/authorize?brand=${brand}`;
  };

  const handleDisconnect = async (platformKey: string) => {
    if (!confirm(`Are you sure you want to disconnect this account?`)) {
      return;
    }

    setDisconnecting(platformKey);
    try {
      const response = await fetch("/api/platforms/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformKey }),
      });

      const data = await response.json();
      if (data.success) {
        await loadConnectedAccounts();
      } else {
        alert(data.error || "Failed to disconnect");
      }
    } catch (error) {
      console.error("Disconnect error:", error);
      alert("Failed to disconnect account");
    } finally {
      setDisconnecting(null);
    }
  };

  const handleConfigureOAuth = (platform: string) => {
    const platformBrandKey = `${platform}-${selectedBrand}`;
    setEditingPlatform(platformBrandKey);
    setCredentialsForm({
      clientId: "",
      clientSecret: "",
      redirectUri: `${window.location.origin}/api/oauth/${platform}/callback`,
    });
    setShowCredentialsModal(true);
  };

  const handleSaveCredentials = async () => {
    if (!editingPlatform) return;

    if (!credentialsForm.clientId || !credentialsForm.clientSecret) {
      alert("Client ID and Client Secret are required");
      return;
    }

    setSavingCredentials(true);
    try {
      const response = await fetch("/api/oauth/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformBrandKey: editingPlatform,
          ...credentialsForm,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert("OAuth credentials saved successfully!");
        setShowCredentialsModal(false);
        setEditingPlatform(null);
      } else {
        alert(data.error || "Failed to save credentials");
      }
    } catch (error) {
      console.error("Save credentials error:", error);
      alert("Failed to save credentials");
    } finally {
      setSavingCredentials(false);
    }
  };

  const handleLogout = async () => {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    const data = await res.json();
    if (data.logoutUrl) window.location.href = data.logoutUrl;
  };

  const getAccountForBrand = (platform: string, brand: Brand): ConnectedAccount | undefined => {
    return connectedAccounts.find(
      (acc) => acc.platform === platform && acc.brand === brand
    );
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return <FaFacebook className="text-blue-600" />;
      case "linkedin":
        return <FaLinkedin className="text-blue-700" />;
      case "twitter":
        return <FaTwitter className="text-blue-400" />;
      case "instagram":
        return <FaInstagram className="text-pink-600" />;
      default:
        return null;
    }
  };

  const getPlatformDisplayName = (platform: string) => {
    if (platform === "twitter") return "Twitter/X";
    return platform.charAt(0).toUpperCase() + platform.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  const platforms = ["linkedin", "facebook", "instagram", "twitter"];
  const brandsConfig = {
    sagesure: { name: "SageSure", icon: <img src="/logo.png" className="w-6 h-6" alt="SageSure" /> },
    maplesage: { name: "MapleSage", icon: <span className="text-2xl">🍁</span> },
  };

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
        <div className="bg-white rounded-lg shadow">
          {/* Brand Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setSelectedBrand("sagesure")}
                className={`px-6 py-4 text-sm font-medium border-b-2 flex items-center gap-2 ${
                  selectedBrand === "sagesure"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}>
                {brandsConfig.sagesure.icon}
                {brandsConfig.sagesure.name}
              </button>
              <button
                onClick={() => setSelectedBrand("maplesage")}
                className={`px-6 py-4 text-sm font-medium border-b-2 flex items-center gap-2 ${
                  selectedBrand === "maplesage"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}>
                {brandsConfig.maplesage.icon}
                {brandsConfig.maplesage.name}
              </button>
            </nav>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Connected Accounts</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage your {brandsConfig[selectedBrand].name} social media accounts
              </p>
            </div>

            <div className="space-y-3">
              {platforms.map((platform) => {
                const account = getAccountForBrand(platform, selectedBrand);
                const isConnected = account?.connected;
                const isExpired = account?.expiresAt && account.expiresAt < Date.now();

                return (
                  <div
                    key={platform}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{getPlatformIcon(platform)}</div>
                      <div>
                        <div className="font-medium">{getPlatformDisplayName(platform)}</div>
                        {isConnected ? (
                          <>
                            <div className="text-sm text-gray-600">
                              {account.accountName || "Connected"}
                            </div>
                            {account.organizationId && (
                              <div className="text-xs text-gray-500">
                                Org ID: {account.organizationId}
                              </div>
                            )}
                            {account.pageId && (
                              <div className="text-xs text-gray-500">
                                Page ID: {account.pageId}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">Not connected</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isConnected && (
                        <div className="text-right">
                          <div
                            className={`text-sm ${
                              isExpired ? "text-red-600" : "text-green-600"
                            }`}>
                            {isExpired ? "● Expired" : "● Active"}
                          </div>
                        </div>
                      )}

                      {/* OAuth Config Button */}
                      <button
                        onClick={() => handleConfigureOAuth(platform)}
                        className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 flex items-center gap-2"
                        title="Configure OAuth credentials">
                        <FaKey className="text-xs" />
                      </button>

                      {isConnected ? (
                        <button
                          onClick={() => handleDisconnect(account.platformKey)}
                          disabled={disconnecting === account.platformKey}
                          className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center gap-2">
                          {disconnecting === account.platformKey ? (
                            <>
                              <FaSpinner className="animate-spin" />
                              Disconnecting...
                            </>
                          ) : (
                            "Disconnect"
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(platform, selectedBrand)}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* OAuth Credentials Modal */}
      {showCredentialsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold">OAuth Credentials</h3>
              <button
                onClick={() => setShowCredentialsModal(false)}
                className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform & Brand
                </label>
                <input
                  type="text"
                  value={editingPlatform || ""}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  App ID / Client ID
                </label>
                <input
                  type="text"
                  value={credentialsForm.clientId}
                  onChange={(e) => setCredentialsForm({ ...credentialsForm, clientId: e.target.value })}
                  placeholder="Enter your app/client ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  App Secret / Client Secret
                </label>
                <input
                  type="password"
                  value={credentialsForm.clientSecret}
                  onChange={(e) => setCredentialsForm({ ...credentialsForm, clientSecret: e.target.value })}
                  placeholder="Enter your app/client secret"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OAuth Redirect URI
                </label>
                <input
                  type="text"
                  value={credentialsForm.redirectUri}
                  onChange={(e) => setCredentialsForm({ ...credentialsForm, redirectUri: e.target.value })}
                  placeholder="https://social.sagesure.io/api/oauth/platform/callback"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add this URL to your OAuth app's allowed redirect URIs
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowCredentialsModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleSaveCredentials}
                disabled={savingCredentials}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {savingCredentials ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Save Credentials
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
