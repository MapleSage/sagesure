"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaFacebook, FaLinkedin, FaTwitter, FaInstagram, FaYoutube, FaSpinner } from "react-icons/fa";
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

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"accounts" | "publishing" | "email">("accounts");
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

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
    // Redirect to OAuth with brand parameter
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
      case "youtube":
        return <FaYoutube className="text-red-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
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
        <div className="bg-white rounded-lg shadow">
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
            </nav>
          </div>

          <div className="p-6">
            {/* Accounts Tab */}
            {activeTab === "accounts" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">Connected Accounts</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage your social media accounts across different brands
                  </p>
                </div>

                {/* Brand: MapleSage */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-2xl">🍁</span> MapleSage
                  </h3>
                  <div className="space-y-3">
                    {["linkedin", "facebook", "instagram", "twitter"].map((platform) => {
                      const account = getAccountForBrand(platform, "maplesage");
                      return (
                        <BrandAccountRow
                          key={platform}
                          platform={platform}
                          brand="maplesage"
                          icon={getPlatformIcon(platform)}
                          account={account}
                          onConnect={() => handleConnect(platform, "maplesage")}
                          onDisconnect={() => handleDisconnect(account!.platformKey)}
                          disconnecting={disconnecting === account?.platformKey}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Brand: SageSure */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <img src="/logo.png" className="w-6 h-6" alt="SageSure" /> SageSure
                  </h3>
                  <div className="space-y-3">
                    {["linkedin", "facebook", "instagram", "twitter"].map((platform) => {
                      const account = getAccountForBrand(platform, "sagesure");
                      return (
                        <BrandAccountRow
                          key={platform}
                          platform={platform}
                          brand="sagesure"
                          icon={getPlatformIcon(platform)}
                          account={account}
                          onConnect={() => handleConnect(platform, "sagesure")}
                          onDisconnect={() => handleDisconnect(account!.platformKey)}
                          disconnecting={disconnecting === account?.platformKey}
                        />
                      );
                    })}
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

// Brand Account Row Component
function BrandAccountRow({
  platform,
  brand,
  icon,
  account,
  onConnect,
  onDisconnect,
  disconnecting,
}: {
  platform: string;
  brand: Brand;
  icon: React.ReactNode;
  account?: ConnectedAccount;
  onConnect: () => void;
  onDisconnect: () => void;
  disconnecting: boolean;
}) {
  const isConnected = account?.connected;
  const isExpired = account?.expiresAt && account.expiresAt < Date.now();

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-4">
        <div className="text-2xl">{icon}</div>
        <div>
          <div className="font-medium capitalize">{platform}</div>
          {isConnected ? (
            <>
              <div className="text-sm text-gray-600">
                {account.accountName || "Connected"}
              </div>
              {account.accountHandle && (
                <div className="text-xs text-gray-500">{account.accountHandle}</div>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-500">Not connected</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
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
        {isConnected ? (
          <button
            onClick={onDisconnect}
            disabled={disconnecting}
            className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">
            {disconnecting ? (
              <FaSpinner className="animate-spin" />
            ) : (
              "Disconnect"
            )}
          </button>
        ) : (
          <button
            onClick={onConnect}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Connect
          </button>
        )}
      </div>
    </div>
  );
}
