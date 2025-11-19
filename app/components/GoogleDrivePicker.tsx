"use client";

import { useEffect } from "react";

interface GoogleDrivePickerProps {
  onSelect: (files: any[]) => void;
  onCancel: () => void;
}

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

export default function GoogleDrivePicker({
  onSelect,
  onCancel,
}: GoogleDrivePickerProps) {
  useEffect(() => {
    // Load Google API
    const loadGoogleAPI = () => {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => {
        window.gapi.load("client:picker", initializePicker);
      };
      document.body.appendChild(script);
    };

    const initializePicker = () => {
      window.gapi.client
        .init({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
          clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
          ],
          scope: "https://www.googleapis.com/auth/drive.readonly",
        })
        .then(() => {
          createPicker();
        });
    };

    const createPicker = () => {
      const picker = new window.google.picker.PickerBuilder()
        .addView(
          new window.google.picker.DocsView(
            window.google.picker.ViewId.DOCS_IMAGES
          )
            .setIncludeFolders(true)
            .setSelectFolderEnabled(false)
        )
        .setOAuthToken(window.gapi.auth.getToken().access_token)
        .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY)
        .setCallback(pickerCallback)
        .setOrigin(window.location.protocol + "//" + window.location.host)
        .build();

      picker.setVisible(true);
    };

    const pickerCallback = (data: any) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const files = data.docs.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          url: doc.url,
          thumbnailUrl: doc.thumbnailUrl,
          mimeType: doc.mimeType,
        }));
        onSelect(files);
      } else if (data.action === window.google.picker.Action.CANCEL) {
        onCancel();
      }
    };

    loadGoogleAPI();
  }, [onSelect, onCancel]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6">
        <p>Loading Google Drive Picker...</p>
      </div>
    </div>
  );
}
