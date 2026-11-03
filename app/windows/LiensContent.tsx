// app/windows/LiensContent.tsx
"use client";

export function LiensContent() {
  return (
    <iframe
      src="https://www.youtube.com/embed/bgowteJ1bkY"
      title="OCTOBOTS 2026 - CRUQAC"
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
