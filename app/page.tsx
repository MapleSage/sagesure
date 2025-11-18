"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLoginUrl } from "@/lib/cognito";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          router.push("/dashboard");
        } else {
          // Redirect to Cognito Managed Login
          window.location.href = getLoginUrl();
        }
      })
      .catch(() => {
        window.location.href = getLoginUrl();
      })
      .finally(() => setChecking(false));
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="text-center text-white">
        <img
          src="/logo.png"
          alt="SageSure"
          className="h-20 w-20 mx-auto mb-4"
        />
        <h1 className="text-4xl font-bold mb-4">SageSure Social</h1>
        <p className="text-xl">Redirecting to login...</p>
      </div>
    </div>
  );
}
