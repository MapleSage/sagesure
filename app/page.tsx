"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to dashboard (no auth required)
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="text-center text-white">
        <img
          src="/logo_netural.png"
          alt="SageSure"
          className="h-20 w-20 mx-auto mb-4"
        />
        <h1 className="text-4xl font-bold mb-4">SageSure Social</h1>
        <p className="text-xl">Loading...</p>
      </div>
    </div>
  );
}
