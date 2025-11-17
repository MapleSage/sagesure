"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");

    if (code) {
      fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            router.push("/dashboard");
          } else {
            router.push("/?error=auth_failed");
          }
        })
        .catch(() => {
          router.push("/?error=auth_failed");
        });
    } else {
      router.push("/?error=no_code");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Completing sign in...</h2>
        <p className="text-gray-600">Please wait</p>
      </div>
    </div>
  );
}
