"use client";

import { useState } from "react";
import { FaPalette, FaExternalLinkAlt } from "react-icons/fa";
import { SiCanva, SiAdobe } from "react-icons/si";

interface ImageEditorIntegrationProps {
  onImageCreated: (url: string) => void;
}

export default function ImageEditorIntegration({
  onImageCreated,
}: ImageEditorIntegrationProps) {
  const [showModal, setShowModal] = useState(false);

  const openCanva = () => {
    // Canva Design Button integration
    // https://www.canva.com/developers/docs/design-button/
    const canvaUrl = `https://www.canva.com/design?create&type=InstagramPost&category=tACZCvjI6mE`;
    window.open(canvaUrl, "_blank", "width=1200,height=800");
    setShowModal(false);
  };

  const openAdobeExpress = () => {
    // Adobe Express integration
    const adobeUrl = `https://new.express.adobe.com/`;
    window.open(adobeUrl, "_blank", "width=1200,height=800");
    setShowModal(false);
  };

  const openPixlr = () => {
    // Pixlr - free alternative
    const pixlrUrl = `https://pixlr.com/express/`;
    window.open(pixlrUrl, "_blank", "width=1200,height=800");
    setShowModal(false);
  };

  const openPhotopea = () => {
    // Photopea - free Photoshop alternative
    const photopeaUrl = `https://www.photopea.com/`;
    window.open(photopeaUrl, "_blank", "width=1200,height=800");
    setShowModal(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center gap-2">
        <FaPalette /> Edit with Design Tools
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-semibold mb-4">Choose Design Tool</h3>
            <p className="text-sm text-gray-600 mb-6">
              Create or edit images with professional design tools. After
              creating your design, download it and upload to the media library.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Canva */}
              <button
                onClick={openCanva}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group">
                <div className="flex flex-col items-center gap-3">
                  <SiCanva className="text-5xl text-purple-600" />
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900">Canva</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Easy drag-and-drop design
                    </p>
                  </div>
                  <FaExternalLinkAlt className="text-gray-400 group-hover:text-purple-600" />
                </div>
              </button>

              {/* Adobe Express */}
              <button
                onClick={openAdobeExpress}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all group">
                <div className="flex flex-col items-center gap-3">
                  <SiAdobe className="text-5xl text-red-600" />
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900">
                      Adobe Express
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Professional templates
                    </p>
                  </div>
                  <FaExternalLinkAlt className="text-gray-400 group-hover:text-red-600" />
                </div>
              </button>

              {/* Pixlr */}
              <button
                onClick={openPixlr}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group">
                <div className="flex flex-col items-center gap-3">
                  <FaPalette className="text-5xl text-blue-600" />
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900">Pixlr</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Free photo editor
                    </p>
                  </div>
                  <FaExternalLinkAlt className="text-gray-400 group-hover:text-blue-600" />
                </div>
              </button>

              {/* Photopea */}
              <button
                onClick={openPhotopea}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group">
                <div className="flex flex-col items-center gap-3">
                  <FaPalette className="text-5xl text-green-600" />
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900">Photopea</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Advanced editing (like Photoshop)
                    </p>
                  </div>
                  <FaExternalLinkAlt className="text-gray-400 group-hover:text-green-600" />
                </div>
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>How to use:</strong>
              </p>
              <ol className="text-sm text-blue-800 mt-2 space-y-1 list-decimal list-inside">
                <li>Click a design tool to open it in a new window</li>
                <li>Create or edit your image</li>
                <li>Download the image to your computer</li>
                <li>Return here and upload it to the media library</li>
              </ol>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
