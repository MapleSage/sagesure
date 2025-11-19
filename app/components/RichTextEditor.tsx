"use client";

import { useState, useRef } from "react";
import {
  FaBold,
  FaItalic,
  FaLink,
  FaListUl,
  FaListOl,
  FaMicrophone,
  FaStop,
} from "react-icons/fa";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  platform?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your post...",
  maxLength = 3000,
  platform,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );

  const insertFormatting = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newText);

    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const handleBold = () => {
    if (platform === "linkedin" || platform === "facebook") {
      insertFormatting("**", "**");
    } else {
      insertFormatting("*", "*");
    }
  };

  const handleItalic = () => {
    insertFormatting("_", "_");
  };

  const handleLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      if (platform === "linkedin") {
        insertFormatting(`[`, `](${url})`);
      } else {
        insertFormatting(`${url} `);
      }
    }
  };

  const handleList = (ordered: boolean) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lines = value.substring(0, start).split("\n");
    const currentLine = lines[lines.length - 1];

    if (currentLine.trim() === "") {
      insertFormatting(ordered ? "1. " : "• ");
    } else {
      insertFormatting("\n" + (ordered ? "1. " : "• "));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        await transcribeAudio(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const response = await fetch("/api/ai/speech-to-text", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.text) {
        onChange(value + (value ? "\n\n" : "") + data.text);
      }
    } catch (error) {
      console.error("Transcription error:", error);
      alert("Failed to transcribe audio");
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleBold}
          className="p-2 hover:bg-gray-200 rounded"
          title="Bold">
          <FaBold />
        </button>
        <button
          type="button"
          onClick={handleItalic}
          className="p-2 hover:bg-gray-200 rounded"
          title="Italic">
          <FaItalic />
        </button>
        <button
          type="button"
          onClick={handleLink}
          className="p-2 hover:bg-gray-200 rounded"
          title="Insert Link">
          <FaLink />
        </button>
        <button
          type="button"
          onClick={() => handleList(false)}
          className="p-2 hover:bg-gray-200 rounded"
          title="Bullet List">
          <FaListUl />
        </button>
        <button
          type="button"
          onClick={() => handleList(true)}
          className="p-2 hover:bg-gray-200 rounded"
          title="Numbered List">
          <FaListOl />
        </button>

        <div className="ml-auto flex gap-2">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="p-2 hover:bg-gray-200 rounded text-red-600"
              title="Voice Input">
              <FaMicrophone />
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="p-2 bg-red-100 hover:bg-red-200 rounded text-red-600 animate-pulse"
              title="Stop Recording">
              <FaStop />
            </button>
          )}
        </div>
      </div>

      {/* Text Area */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-40 p-4 focus:outline-none resize-none"
        maxLength={maxLength}
      />

      {/* Character Count */}
      <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 text-sm text-gray-500 text-right">
        {value.length} / {maxLength}
      </div>
    </div>
  );
}
