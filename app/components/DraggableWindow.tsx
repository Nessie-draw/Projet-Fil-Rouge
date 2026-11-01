"use client";

import { useState, useRef, useEffect } from "react";

export type WindowId = "a-propos" | "reglement" | "competition" | "liens" | "faq" | "inscriptions" | "bracket" | "formation";
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
  // Fenêtres affichant un PDF plein-bord (sans padding, contenu pleine surface)
  const isPdfWindow = id === "reglement" || id === "formation";

  // ── Drag ─────────────────────────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false);
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
          className={`h-12 flex items-center justify-between px-4 text-sm select-none border-b flex-shrink-0 ${
            isDark
              ? "bg-[#111827] text-[#e5f9f0] border-[#1f2937]"
              : "bg-[#dbe4ef] text-[#0f172a] border-[#b7c2d3]"
          }`}
        >
          <span>{title}</span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-none bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-base leading-none border border-black/30"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div
          style={{ position: "relative", minHeight: 0 }}
          className={`flex-1 ${id === "liens" ? "p-0 bg-black overflow-hidden" : isPdfWindow ? "p-0 overflow-hidden flex flex-col [&>*]:flex-1" : "overflow-y-auto p-4"} text-sm ${isDark ? "text-slate-200" : "text-slate-800"}`}
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
        left: x,
        top: y,
        zIndex: z,
        cursor: isDragging ? "grabbing" : "default",
        width:  resizable ? size.w : DEFAULT_W,
        height: resizable ? size.h : undefined,
        maxWidth: "95vw",
        maxHeight: resizable ? "95vh" : undefined,
      }}
      className={`pixel-panel rounded-none border-2 overflow-hidden transition-colors duration-300 ${
        !resizable ? "min-h-[450px]" : ""
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
        className={`h-9 flex items-center justify-between px-3 text-xs select-none border-b ${
          isDark
            ? "bg-[#111827] text-[#e5f9f0] border-[#1f2937]"
            : "bg-[#dbe4ef] text-[#0f172a] border-[#b7c2d3]"
        }`}
      >
        <span>{title}</span>
        <button
          onClick={onClose}
          className="w-5 h-5 rounded-none bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-[11px] leading-none border border-black/30"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div
        style={{ maxHeight: contentH, height: resizable ? contentH : undefined, position: "relative" }}
        className={`${id === "liens" ? "p-0 bg-black" : isPdfWindow ? "p-0" : "p-4"} text-sm ${id === "liens" ? "" : isPdfWindow ? "overflow-hidden flex flex-col [&>*]:flex-1" : `overflow-y-auto ${resizable ? "flex flex-col [&>*]:flex-1" : ""}`} ${isDark ? "text-slate-200" : "text-slate-800"}`}
      >
        {children}
      </div>

      {/* Resize handle */}
      {resizable && (
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
