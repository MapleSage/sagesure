"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaFacebook, FaInstagram, FaSpinner } from "react-icons/fa";

export default function SelectFacebookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const accessToken = searchParams.get("token");
    if (!accessToken) {
      setError("No access token provided");
      setLoading(false);
      return;
    }

    // Fetch user's Facebook pages
    fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`)
      .then((res) => res.json())
      .then(async (data) => {
        if (data.error) {
          throw new Error(data.error.message);
        }

        if (!data.data || data.data.length === 0) {
          setError("No Facebook pages found. Please create a Facebook Page first.");
          setLoading(false);
          return;
        }

        // For each page, check if it has an Instagram account
        const pagesWithInstagram = await Promise.all(
          data.data.map(async (page: any) => {
            try {
              const igResponse = await fetch(
                `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account,picture&access_token=${page.access_token}`
              );
              const igData = await igResponse.json();
              return {
                ...page,
                instagramAccountId: igData.instagram_business_account?.id,
                hasInstagram: !!igData.instagram_business_account,
                picture: igData.picture?.data?.url,
              };
            } catch (err) {
              return {
                ...page,
                instagramAccountId: null,
                hasInstagram: false,
              };
            }
          })
        );

        setPages(pagesWithInstagram);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching pages:", err);
        setError(err.message || "Failed to fetch Facebook pages");
        setLoading(false);
      });
  }, [searchParams]);

  const handleSelectPage = async (page: any) => {
    setSaving(true);
    try {
      const accessToken = searchParams.get("token");
      const expiresIn = searchParams.get("expires_in");

      // Save the selected page
      const response = await fetch("/api/oauth/facebook/save-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          expiresIn: parseInt(expiresIn || "5184000"),
          pageId: page.id,
          pageName: page.name,
          pageAccessToken: page.access_token,
          instagramAccountId: page.instagramAccountId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/dashboard?connected=facebook,instagram");
      } else {
        setError(data.error || "Failed to save page selection");
        setSaving(false);
      }
    } catch (err: any) {
      console.error("Error saving page:", err);
      setError(err.message || "Failed to save page selection");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your Facebook pages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-600 text-center mb-4">
            <p className="font-semibold text-lg">Error</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-2">Select Your Facebook Page</h1>
          <p className="text-gray-600 mb-6">
            Choose which Facebook Page you want to connect for posting to Facebook and Instagram.
          </p>

          <div className="space-y-4">
            {pages.map((page) => (
              <div
                key={page.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {page.picture && (
                      <img
                        src={page.picture}
                        alt={page.name}
                        className="w-16 h-16 rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{page.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">ID: {page.id}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-sm">
                          <FaFacebook className="text-blue-600" />
                          <span className="text-green-600">✓ Facebook Page</span>
                        </div>
                        {page.hasInstagram ? (
                          <div className="flex items-center gap-1 text-sm">
                            <FaInstagram className="text-pink-600" />
                            <span className="text-green-600">✓ Instagram Connected</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-sm">
                            <FaInstagram className="text-gray-400" />
                            <span className="text-gray-500">No Instagram</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectPage(page)}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2">
                    {saving ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Select"
                    )}
                  </button>
                </div>
                {!page.hasInstagram && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    ⚠️ This page doesn't have an Instagram Business Account linked. You'll only be able to post to Facebook.
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            <p className="font-semibold mb-1">💡 Need Instagram?</p>
            <p>
              To post to Instagram, make sure your Facebook Page has an Instagram Business Account linked.
              You can link it in your Facebook Page settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
