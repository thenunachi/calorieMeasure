import { useState, useRef, useCallback } from "react";

export default function ImageCapture({ onImageReady }) {
  const [mode, setMode] = useState("upload"); // "upload" or "camera"
  const [preview, setPreview] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // use back camera on mobile
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch {
      setCameraError("Could not access camera. Please allow camera permission.");
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      setPreview(url);
      onImageReady(file);
      stopCamera();
    }, "image/jpeg");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onImageReady(file);
  };

  const switchMode = (newMode) => {
    stopCamera();
    setPreview(null);
    onImageReady(null);
    setMode(newMode);
  };

  const retake = () => {
    setPreview(null);
    onImageReady(null);
    if (mode === "camera") startCamera();
  };

  return (
    <div className="capture-container">
      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button
          className={mode === "upload" ? "active" : ""}
          onClick={() => switchMode("upload")}
        >
          Upload Photo
        </button>
        <button
          className={mode === "camera" ? "active" : ""}
          onClick={() => switchMode("camera")}
        >
          Take Photo
        </button>
      </div>

      {/* Upload Mode */}
      {mode === "upload" && !preview && (
        <label className="upload-area">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <div className="upload-placeholder">
            <span className="upload-icon">🍽️</span>
            <p>Click to upload a food photo</p>
            <p className="upload-hint">JPG, PNG, WEBP supported</p>
          </div>
        </label>
      )}

      {/* Camera Mode */}
      {mode === "camera" && !preview && (
        <div className="camera-area">
          {cameraError && <p className="error-text">{cameraError}</p>}
          {!cameraActive ? (
            <button className="btn-primary" onClick={startCamera}>
              Open Camera
            </button>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="camera-preview"
              />
              <button className="btn-capture" onClick={takePhoto}>
                Capture
              </button>
            </>
          )}
        </div>
      )}

      {/* Hidden canvas for capturing frame */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Image Preview */}
      {preview && (
        <div className="preview-area">
          <img src={preview} alt="Food preview" className="preview-image" />
          <button className="btn-secondary" onClick={retake}>
            Retake / Change
          </button>
        </div>
      )}
    </div>
  );
}
