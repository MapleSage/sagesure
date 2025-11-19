"use client";

import { useEffect } from "react";

interface CanvaButtonProps {
  onDesignOpen: (design: any) => void;
  onDesignPublish: (exportUrl: string) => void;
}

declare global {
  interface Window {
    Canva: any;
  }
}

export default function CanvaButton({
  onDesignOpen,
  onDesignPublish,
}: CanvaButtonProps) {
  useEffect(() => {
    // Load Canva SDK
    const script = document.createElement("script");
    script.src = "https://sdk.canva.com/v2/canva.js";
    script.async = true;
    script.onload = () => {
      if (window.Canva) {
        window.Canva.DesignButton.initialize({
          apiKey: process.env.NEXT_PUBLIC_CANVA_API_KEY,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const openCanva = () => {
    if (window.Canva) {
      window.Canva.DesignButton.createDesign({
        design: {
          type: "SocialMedia",
        },
        onDesignOpen: (opts: any) => {
          console.log("Design opened:", opts);
          onDesignOpen(opts);
        },
        onDesignPublish: (opts: any) => {
          console.log("Design published:", opts);
          if (opts.exportUrl) {
            onDesignPublish(opts.exportUrl);
          }
        },
      });
    } else {
      alert("Canva SDK not loaded. Please refresh and try again.");
    }
  };

  return (
    <button
      onClick={openCanva}
      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
      <span>🎨</span>
      <span>Create with Canva</span>
    </button>
  );
}
