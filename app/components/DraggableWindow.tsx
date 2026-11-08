"use client";

import { useState, useRef, useEffect } from "react";

export type WindowId = "a-propos" | "reglement" | "competition" | "liens" | "faq" | "inscriptions" | "bracket" | "formation" | "questions";
export type WindowState = {
  id: WindowId;
  title: string;
  x: number;
  y: number;
  z: number;
};

export type DesktopTheme = "dark" | "light";

type Props = {
  id: WindowId;
  title: string;
  x: number;
  y: number;
  z: number;
  onClose: () => void;
  onDragMove: (id: WindowId, x: number, y: number) => void;
  onFocus: (id: WindowId) => void;
  theme?: DesktopTheme;
  resizable?: boolean;
  isMobile?: boolean;
  children: React.ReactNode;
};

const TITLE_H   = 36;
const DEFAULT_W = 800;
const DEFAULT_H = 450;
const MIN_W     = 400;
const MIN_H     = 300;

export function DraggableWindow({
  id,
  title,
  x,
  y,
  z,
  onClose,
  onDragMove,
  onFocus,
  theme = "dark",
  resizable = false,
  isMobile = false,
  children,
}: Props) {
  const isDark = theme === "dark";
  const isBracketWindow = id === "bracket" || id === "competition";
  // Fenêtres affichant un PDF plein-bord (sans padding, contenu pleine surface)
  const isPdfWindow = id === "reglement" || id === "formation";
  const downloadInfo =
    id === "reglement"
      ? { url: "/reglements.pdf", name: "Reglements-OCTOBOTS-2027.pdf" }
      : id === "formation"
        ? { url: "/formation.pdf", name: "Formation-OCTOBOTS-2027.pdf" }
        : null;

  // ── Drag ─────────────────────────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, x: 0, y: 0 });

  // ── Resize ────────────────────────────────────────────────────────────────
  const [size,       setSize]       = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStart = useRef({ mouseX: 0, mouseY: 0, w: DEFAULT_W, h: DEFAULT_H });

  useEffect(() => {
    if (isMobile) return;

    const MIN_Y = 70; // prevent windows from going under the header/logo

    function onMove(clientX: number, clientY: number) {
      if (isDragging) {
        const dx = clientX - dragStart.current.mouseX;
        const dy = clientY - dragStart.current.mouseY;
        const newY = Math.max(MIN_Y, dragStart.current.y + dy);
        onDragMove(id, dragStart.current.x + dx, newY);
      }
      if (isResizing) {
        const dx = clientX - resizeStart.current.mouseX;
        const dy = clientY - resizeStart.current.mouseY;
        setSize({
          w: Math.max(MIN_W, resizeStart.current.w + dx),
          h: Math.max(MIN_H, resizeStart.current.h + dy),
        });
      }
    }

    function onMouseMove(e: MouseEvent) { onMove(e.clientX, e.clientY); }
    function onTouchMove(e: TouchEvent) { if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY); }
    function onEnd() { setIsDragging(false); setIsResizing(false); }

    if (isDragging || isResizing) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onEnd);
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onEnd);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [isDragging, isResizing, id, onDragMove, isMobile]);

  function handleTitlePointerDown(e: React.MouseEvent | React.TouchEvent) {
    if (isMobile) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    if ("button" in e && e.button !== 0) return;
    setIsDragging(true);
    onFocus(id);
    dragStart.current = { mouseX: clientX, mouseY: clientY, x, y };
  }

  function handleResizePointerDown(e: React.MouseEvent | React.TouchEvent) {
    if (isMobile) return;
    e.stopPropagation();
    if ("preventDefault" in e) e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setIsResizing(true);
    onFocus(id);
    resizeStart.current = { mouseX: clientX, mouseY: clientY, w: size.w, h: size.h };
  }

  // ── Mobile: full-screen modal ──
  if (isMobile) {
    return (
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9999 }}
        className={`flex flex-col ${
          isDark ? "bg-[#050816]" : "bg-[#e8edf5]"
        }`}
      >
        {/* Title bar */}
        <div
          className={`h-12 flex items-center justify-between px-4 text-sm select-none border-b shrink-0 ${
            isDark
              ? "bg-[#111827] text-[#e5f9f0] border-[#1f2937]"
              : "bg-[#dbe4ef] text-[#0f172a] border-[#b7c2d3]"
          }`}
        >
          <span>{title}</span>
          <div className="flex items-center gap-2">
            {downloadInfo && (
              <a
                href={downloadInfo.url}
                download={downloadInfo.name}
                aria-label="Télécharger le PDF"
                title="Télécharger le PDF"
                className={`w-8 h-8 flex items-center justify-center border ${
                  isDark
                    ? "bg-[#1f2937] hover:bg-[#374151] text-white border-black/30"
                    : "bg-[#cbd5e1] hover:bg-[#b7c2d3] text-slate-900 border-black/20"
                }`}
              >
                <DownloadIcon />
              </a>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-none bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-base leading-none border border-black/30"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          style={{ position: "relative", minHeight: 0 }}
           className={`${id === "liens" ? "p-0 bg-black" : isPdfWindow ? "p-0" : "p-4"} text-sm ${id === "liens" ? "" : isPdfWindow ? "overflow-hidden flex flex-col *:flex-1" : isBracketWindow ? "bracket-window-content flex flex-col *:flex-1" : `overflow-y-auto ${resizable || isFullscreen ? "flex flex-col *:flex-1" : ""}`} ${isDark ? "text-slate-200" : "text-slate-800"}`}
        >
          {children}
        </div>
      </div>
    );
  }

  // ── Desktop: draggable window ──
  const contentH = resizable ? size.h - TITLE_H : 410;

  return (
    <div
      style={{
        position: "fixed",
        left: isFullscreen ? 0 : x,
        top: isFullscreen ? 0 : y,
        zIndex: 1000 + z,
        cursor: isDragging ? "grabbing" : "default",
        width: isFullscreen ? "100vw" : resizable ? size.w : DEFAULT_W,
        height: isFullscreen ? "100dvh" : resizable ? size.h : undefined,
        maxWidth: isFullscreen ? "100vw" : "95vw",
        maxHeight: isFullscreen ? "100dvh" : resizable ? "95vh" : undefined,
      }}
      className={`pixel-panel rounded-none border-2 overflow-hidden transition-colors duration-300 ${
        isFullscreen ? "flex flex-col" : ""
      } ${
        !resizable && !isFullscreen ? "min-h-112.5" : ""
      } ${
        isDark
          ? "bg-[#050816] border-[#1f2937] shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
          : "bg-[#e8edf5] border-[#b7c2d3] shadow-[0_20px_45px_rgba(15,23,42,0.22)]"
      }`}
    >
      {/* Title bar */}
      <div
        onMouseDown={handleTitlePointerDown}
        onTouchStart={handleTitlePointerDown}
        className={`h-9 flex shrink-0 items-center justify-between px-3 text-xs select-none border-b ${
          isDark
            ? "bg-[#111827] text-[#e5f9f0] border-[#1f2937]"
            : "bg-[#dbe4ef] text-[#0f172a] border-[#b7c2d3]"
        }`}
      >
        <span>{title}</span>
        <div className="flex items-center gap-1">
          {downloadInfo && (
            <a
              href={downloadInfo.url}
              download={downloadInfo.name}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              aria-label="Télécharger le PDF"
              title="Télécharger le PDF"
              className={`w-5 h-5 flex items-center justify-center border ${
                isDark
                  ? "bg-[#1f2937] hover:bg-[#374151] text-white border-black/30"
                  : "bg-[#cbd5e1] hover:bg-[#b7c2d3] text-slate-900 border-black/20"
              }`}
            >
              <DownloadIcon />
            </a>
          )}
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={() => {
              setIsFullscreen((current) => !current);
              onFocus(id);
            }}
            aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            className={`w-5 h-5 flex items-center justify-center border text-[11px] leading-none ${
              isDark
                ? "bg-[#1f2937] hover:bg-[#374151] text-white border-black/30"
                : "bg-[#cbd5e1] hover:bg-[#b7c2d3] text-slate-900 border-black/20"
            }`}
          >
            {isFullscreen ? (
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                <path d="M4.5 1.5v3h-3M7.5 10.5v-3h3M4.5 4.5l-3-3M7.5 7.5l3 3" />
              </svg>
            ) : (
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                <path d="M1.5 4V1.5H4M8 1.5h2.5V4M10.5 8v2.5H8M4 10.5H1.5V8" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={onClose}
            className="w-5 h-5 rounded-none bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-[11px] leading-none border border-black/30"
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          maxHeight: isFullscreen ? undefined : contentH,
          height: isFullscreen ? undefined : resizable ? contentH : undefined,
          flex: isFullscreen ? 1 : undefined,
          minHeight: isFullscreen || isBracketWindow ? 0 : undefined,
          position: "relative",
          paddingBottom: isPdfWindow && resizable && !isFullscreen ? 18 : undefined,
        }}
        className={`${id === "liens" || isPdfWindow || isBracketWindow ? "p-0" : "p-4"} ${id === "liens" ? "bg-black" : ""} text-sm ${id === "liens" ? "" : isPdfWindow ? "overflow-hidden flex flex-col *:flex-1" : isBracketWindow ? "bracket-window-content flex flex-col *:flex-1" : `overflow-y-auto ${resizable || isFullscreen ? "flex flex-col *:flex-1" : ""}`} ${isDark ? "text-slate-200" : "text-slate-800"}`}
      >
        {children}
      </div>

      {/* Resize handle */}
      {resizable && !isFullscreen && (
        <div
          onMouseDown={handleResizePointerDown}
          onTouchStart={handleResizePointerDown}
          title="Redimensionner"
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: 18,
            height: 18,
            cursor: "nwse-resize",
            zIndex: 10,
          }}
          className={isDark ? "text-slate-600 hover:text-slate-400" : "text-slate-400 hover:text-slate-600"}
        >
          <svg viewBox="0 0 18 18" fill="currentColor" style={{ width: 18, height: 18 }}>
            <circle cx="6"  cy="12" r="1.2" />
            <circle cx="10" cy="12" r="1.2" />
            <circle cx="14" cy="12" r="1.2" />
            <circle cx="10" cy="8"  r="1.2" />
            <circle cx="14" cy="8"  r="1.2" />
            <circle cx="14" cy="4"  r="1.2" />
          </svg>
        </div>
      )}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-3.5 h-3.5"
      aria-hidden="true"
    >
      <path d="M8 1.5v8m0 0 3-3m-3 3-3-3M2.5 10.5v3h11v-3" />
    </svg>
  );
}
