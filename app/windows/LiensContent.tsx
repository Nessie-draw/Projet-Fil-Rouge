// app/windows/LiensContent.tsx
"use client";

export function LiensContent() {
  return (
    <iframe
      src="https://www.youtube.com/embed/V2DfM0RfG1U"
      title="CRUQAC Live Stream"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      style={{
        border: "none",
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    />
  );
}
