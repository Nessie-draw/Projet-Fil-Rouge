"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  DraggableWindow,
  type DesktopTheme,
  type WindowId,
  type WindowState,
} from "./components/DraggableWindow";
import { WindowContent } from "./components/windowContent";

function useIsMobile(breakpoint = 768) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches,
    () => false,
  );
}

type UiTone = "open" | "close" | "toggle";
type ToneSegment = {
  freqStart: number;
  freqEnd: number;
  durationMs: number;
  gain: number;
  wave?: "pulse" | "triangle";
  duty?: number;
};

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function createArcadeToneWavDataUrl(segments: ToneSegment[]) {
  const safeSegments =
    segments.length > 0
      ? segments
      : [{ freqStart: 523, freqEnd: 523, durationMs: 45, gain: 0.8, wave: "pulse" as const, duty: 0.25 }] as ToneSegment[];

  const sampleRate = 11025;
  const sampleCount = safeSegments.reduce((total, segment) => {
    const durationSamples = Math.max(
      1,
      Math.floor((sampleRate * segment.durationMs) / 1000),
    );
    return total + durationSamples;
  }, 0);

  const byteRate = sampleRate * 2;
  const dataSize = sampleCount * 2;

  const bytes = new Uint8Array(44 + dataSize);
  const view = new DataView(bytes.buffer);

  const writeAscii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, "data");
  view.setUint32(40, dataSize, true);

  let globalSampleIndex = 0;
  const amplitude = 0.3 * 32767;

  safeSegments.forEach((segment) => {
    const segmentSamples = Math.max(
      1,
      Math.floor((sampleRate * segment.durationMs) / 1000),
    );
    const attackSamples = Math.max(1, Math.floor(segmentSamples * 0.08));
    const releaseSamples = Math.max(1, Math.floor(segmentSamples * 0.18));
    const duty = Math.min(0.9, Math.max(0.1, segment.duty ?? 0.25));

    for (let localIndex = 0; localIndex < segmentSamples; localIndex++) {
      const progress =
        segmentSamples > 1 ? localIndex / (segmentSamples - 1) : 1;
      const frequency =
        segment.freqStart + (segment.freqEnd - segment.freqStart) * progress;
      const localTime = localIndex / sampleRate;

      let envelope = segment.gain;
      if (localIndex < attackSamples) {
        envelope *= localIndex / attackSamples;
      } else if (localIndex >= segmentSamples - releaseSamples) {
        envelope *= (segmentSamples - localIndex - 1) / releaseSamples;
      }

      const phase = ((localIndex * frequency) / sampleRate) % 1;
      let sample =
        segment.wave === "triangle"
          ? 1 - 4 * Math.abs(phase - 0.5)
          : phase < duty
            ? 1
            : -1;

      const sub = Math.sin(2 * Math.PI * (frequency * 0.5) * localTime);
      const tremolo = 0.9 + 0.1 * Math.sin(2 * Math.PI * 24 * localTime);
      sample = (sample * 0.88 + sub * 0.12) * tremolo;

      const bitDepthSteps = 14;
      sample = Math.round(sample * bitDepthSteps) / bitDepthSteps;

      const sampleValue = Math.floor(sample * envelope * amplitude);
      view.setInt16(44 + globalSampleIndex * 2, sampleValue, true);

      globalSampleIndex += 1;
    }
  });

  return `data:audio/wav;base64,${toBase64(bytes)}`;
}

function SocialIcon({ href, label, isDark, imgDark, imgLight, imgClicking }: {
  href: string; label: string; isDark: boolean; imgDark: string; imgLight: string; imgClicking: string;
}) {
  const [isPressing, setIsPressing] = useState(false);
  const src = isPressing ? imgClicking : isDark ? imgDark : imgLight;
  return (
    <a
      href={href}
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel="noopener noreferrer"
      aria-label={label}
      onMouseDown={() => setIsPressing(true)}
      onMouseUp={() => setIsPressing(false)}
      onMouseLeave={() => setIsPressing(false)}
    >
      <Image src={src} alt={label} width={32} height={32} className="opacity-70 hover:opacity-100 transition-opacity" />
    </a>
  );
}

export default function Bureau() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [theme, setTheme] = useState<DesktopTheme>("dark");
  const [sfxEnabled, setSfxEnabled] = useState(true);

  const zCounterRef = useRef(1);
  const soundRef = useRef<Record<UiTone, HTMLAudioElement | null>>({
    open: null,
    close: null,
    toggle: null,
  });
  const activePlayersRef = useRef<HTMLAudioElement[]>([]);

  const isDark = theme === "dark";
  const isMobile = useIsMobile();

  const toneMap = useMemo(
    () => ({
      open: createArcadeToneWavDataUrl([
        { freqStart: 523, freqEnd: 523, durationMs: 32, gain: 0.92, wave: "pulse", duty: 0.22 },
        { freqStart: 659, freqEnd: 659, durationMs: 32, gain: 0.88, wave: "pulse", duty: 0.22 },
        { freqStart: 784, freqEnd: 784, durationMs: 38, gain: 0.88, wave: "pulse", duty: 0.22 },
        { freqStart: 1046, freqEnd: 1046, durationMs: 58, gain: 0.82, wave: "triangle" },
      ]),
      close: createArcadeToneWavDataUrl([
        { freqStart: 784, freqEnd: 784, durationMs: 40, gain: 0.9, wave: "pulse", duty: 0.25 },
        { freqStart: 659, freqEnd: 659, durationMs: 36, gain: 0.86, wave: "pulse", duty: 0.25 },
        { freqStart: 523, freqEnd: 523, durationMs: 44, gain: 0.82, wave: "triangle" },
        { freqStart: 392, freqEnd: 350, durationMs: 62, gain: 0.75, wave: "pulse", duty: 0.28 },
      ]),
      toggle: createArcadeToneWavDataUrl([
        { freqStart: 740, freqEnd: 740, durationMs: 24, gain: 0.84, wave: "pulse", duty: 0.2 },
        { freqStart: 988, freqEnd: 988, durationMs: 24, gain: 0.8, wave: "pulse", duty: 0.2 },
        { freqStart: 740, freqEnd: 680, durationMs: 34, gain: 0.72, wave: "triangle" },
      ]),
    }),
    [],
  );

  useEffect(() => {
    const sounds: Record<UiTone, HTMLAudioElement> = {
      open: new Audio(toneMap.open),
      close: new Audio(toneMap.close),
      toggle: new Audio(toneMap.toggle),
    };

    sounds.open.volume = 0.3;
    sounds.close.volume = 0.3;
    sounds.toggle.volume = 0.32;
    sounds.open.preload = "auto";
    sounds.close.preload = "auto";
    sounds.toggle.preload = "auto";
    sounds.open.load();
    sounds.close.load();
    sounds.toggle.load();
    soundRef.current = sounds;

    return () => {
      Object.values(sounds).forEach((audio) => {
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
      });
      activePlayersRef.current.forEach((audio) => {
        audio.pause();
      });
      activePlayersRef.current = [];
    };
  }, [toneMap]);

  const playUiTone = (tone: UiTone, force = false) => {
    if (!force && !sfxEnabled) return;

    const baseAudio = soundRef.current[tone];
    if (!baseAudio) return;

    // Clone to avoid interrupted playback when users click quickly.
    const player = baseAudio.cloneNode(true) as HTMLAudioElement;
    player.volume = baseAudio.volume;
    player.currentTime = 0;
    activePlayersRef.current.push(player);

    const cleanup = () => {
      activePlayersRef.current = activePlayersRef.current.filter(
        (audio) => audio !== player,
      );
    };

    player.addEventListener("ended", cleanup, { once: true });
    player.addEventListener("error", cleanup, { once: true });

    void player.play().catch(() => {
      cleanup();
      // Ignore browser autoplay restrictions until the first interaction.
    });
  };

  const nextZ = () => {
    zCounterRef.current += 1;
    return zCounterRef.current;
  };

  const openWindow = (id: WindowId) => {
    playUiTone("open");

    setWindows((current) => {
      const existingWindow = current.find((windowState) => windowState.id === id);

      if (existingWindow) {
        const newZ = nextZ();
        return current.map((windowState) =>
          windowState.id === id ? { ...windowState, z: newZ } : windowState,
        );
      }

      const titleMap: Record<WindowId, string> = {
        "a-propos": "A-propos",
        reglement: "Reglement",
        competition: "Arbre du tournoi",
        liens: "Streaming",
        faq: "remerciements",
        inscriptions: "Inscriptions",
        bracket: "Arbre du tournoi",
        formation: "Formation",
      };

      const newWindow: WindowState = {
        id,
        title: titleMap[id],
        x: 120 + current.length * 34,
        y: 120 + current.length * 28,
        z: nextZ(),
      };

      return [...current, newWindow];
    });
  };

  const closeWindow = (id: WindowId) => {
    playUiTone("close");
    setWindows((current) => current.filter((windowState) => windowState.id !== id));
  };

  const bringToFront = (id: WindowId) => {
    setWindows((current) =>
      current.map((windowState) =>
        windowState.id === id ? { ...windowState, z: nextZ() } : windowState,
      ),
    );
  };

  const updatePosition = (id: WindowId, x: number, y: number) => {
    setWindows((current) =>
      current.map((windowState) =>
        windowState.id === id ? { ...windowState, x, y } : windowState,
      ),
    );
  };

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
    playUiTone("toggle");
  };

  const toggleSfx = () => {
    const nextValue = !sfxEnabled;
    // Always play feedback when pressing the icon, even when turning SFX off.
    playUiTone("toggle", true);
    setSfxEnabled(nextValue);
  };

  return (
    <div
      className={`pixel-ui min-h-screen w-full flex flex-col transition-colors duration-300 ${
        isDark ? "bg-[#050816]" : "bg-[#dfe6ee]"
      }`}
    >
<div className={`absolute top-1 left-2 z-50 ${isMobile ? "scale-50 origin-top-left" : ""}`}>
        <Image
          src={isDark ? "/images/Logo light big.webp" : "/images/Logo dark big.webp"}
          alt="Octobots"
          width={120}
          height={120}
          style={{ imageRendering: "pixelated" }}
        />
      </div>
      <div className={`absolute top-4 right-3 flex items-center gap-2 z-50 ${isMobile ? "top-2 right-2" : "top-6 right-4 gap-3"}`}>
        {!isMobile && (
          <a
            href="/admin/bracket"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-[11px] underline underline-offset-2 tracking-widest uppercase select-none transition-opacity opacity-40 hover:opacity-100 ${
              isDark ? "text-slate-400 hover:text-[#22c55e]" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            admin
          </a>
        )}
        <IconButton
          label="Changer theme"
          icon={isDark ? "◐" : "◑"}
          onClick={toggleTheme}
          isDark={isDark}
        />
        <IconButton
          label="Activer ou couper son"
          icon={sfxEnabled ? "♪" : "x"}
          onClick={toggleSfx}
          isDark={isDark}
        />
      </div>

      <main className="flex-1 flex flex-col justify-between relative">
        <div className={`${isMobile ? "flex items-start justify-center px-2 pt-16 pb-20" : "absolute inset-0 flex items-center justify-center px-4 pointer-events-none"}`} style={isMobile ? {} : { marginTop: '-10px' }}>
          <div className={isMobile ? "" : "pointer-events-auto"}>
            <MainWindow openWindow={openWindow} isDark={isDark} openWindowIds={windows.map(w => w.id)} isMobile={isMobile} />
          </div>
        </div>

        {windows.map((windowState) => (
          <DraggableWindow
            key={windowState.id}
            id={windowState.id}
            title={windowState.title}
            x={windowState.x}
            y={windowState.y}
            z={windowState.z}
            onClose={() => closeWindow(windowState.id)}
            onDragMove={updatePosition}
            onFocus={bringToFront}
            theme={theme}
            resizable={windowState.id === "bracket" || windowState.id === "competition" || windowState.id === "liens" || windowState.id === "reglement" || windowState.id === "formation"}
            isMobile={isMobile}
          >
            <WindowContent id={windowState.id} openWindow={openWindow} isDark={isDark} openWindowIds={windows.map(w => w.id)} />
          </DraggableWindow>
        ))}

        <footer className={`fixed bottom-0 left-0 w-screen pointer-events-none transition-colors duration-300 ${isDark ? "bg-[#050816]" : "bg-[#dfe6ee]"}`}>
          <div className={`flex justify-center items-center ${isMobile ? "gap-3 pt-2 pb-0.5" : "gap-4 pt-3 pb-1"} pointer-events-auto`}>
            <SocialIcon href="https://www.facebook.com/share/14ZexcTKDPQ/?mibextid=wwXIfr" label="Facebook" isDark={isDark} imgDark="/images/Dark Facebook.webp" imgLight="/images/Light Facebook.webp" imgClicking={isDark ? "/images/Clicking Dark Facebook.webp" : "/images/Clicking Light Facebook.webp"} />
            <SocialIcon href="https://www.instagram.com/cruqac_robotique?igsh=MWo3NmRxZTRjem9hMw==" label="Instagram" isDark={isDark} imgDark="/images/Dark Instagram.webp" imgLight="/images/Light Instagram.webp" imgClicking={isDark ? "/images/Clicking Dark Instagram.webp" : "/images/Clicking Light Instagram.webp"} />
            <SocialIcon href="https://www.linkedin.com/in/club-de-robotique-cruqac-94ab29385?utm_source=share_via&utm_content=profile&utm_medium=member_ios" label="LinkedIn" isDark={isDark} imgDark="/images/Dark LinkedIn.webp" imgLight="/images/Light LinkedIn.webp" imgClicking={isDark ? "/images/Clicking Dark LinkedIn.webp" : "/images/Clicking Light LinkedIn.webp"} />
            <SocialIcon href="mailto:clubrobotuqac@gmail.com" label="Email" isDark={isDark} imgDark="/images/Dark Email.webp" imgLight="/images/Light Email.webp" imgClicking={isDark ? "/images/Clicking Dark Email.webp" : "/images/Clicking Light Email.webp"} />
            <SocialIcon href="https://youtube.com/@cruqac?si=DxKoucBYjS6de_yB" label="YouTube" isDark={isDark} imgDark="/images/Dark YouTube.webp" imgLight="/images/Light YouTube.webp" imgClicking={isDark ? "/images/Clicking Dark YouTube.webp" : "/images/Clicking Light Youtube.webp"} />
          </div>
          <p
            className={`text-center text-[11px] tracking-[0.08em] uppercase pb-2 ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            © 2026 Octobots-CRUQAC 
          </p>
        </footer>
      </main>
    </div>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  isDark,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  isDark: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`w-9 h-9 rounded-none border-2 text-sm leading-none flex items-center justify-center transition ${
        isDark
          ? "border-[#334155] bg-[#0f172a] text-slate-200 hover:border-[#22c55e] hover:text-white"
          : "border-[#9aa8bb] bg-[#f8fafc] text-slate-700 hover:border-[#0284c7] hover:text-slate-900"
      }`}
    >
      {icon}
    </button>
  );
}

function MainWindow({
  openWindow,
  isDark,
  openWindowIds,
  isMobile = false,
}: {
  openWindow: (id: WindowId) => void;
  isDark: boolean;
  openWindowIds: WindowId[];
  isMobile?: boolean;
}) {
  return (
    <section
      className={`${isMobile ? "w-full" : "w-[860px]"} max-w-[92vw] overflow-hidden ${isMobile ? "min-h-0" : "min-h-[460px]"} transition-colors duration-300 border ${
        isDark
          ? "pixel-panel rounded-none bg-[#050816] border-[#1f2937] shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
          : "pixel-panel rounded-none bg-[#e8edf5] border-[#b7c2d3] shadow-[0_20px_45px_rgba(15,23,42,0.22)]"
      }`}
    >
      <div
        className={`h-12 flex items-center px-5 text-sm border-b ${
          isDark
            ? "bg-[#111827] border-[#1f2937] text-[#e5f9f0]"
            : "bg-[#dbe4ef] border-[#b7c2d3] text-[#0f172a]"
        }`}
      >
        Navigation 
      </div>

      <div className={`${isMobile ? "px-4 pt-4 pb-6" : "px-10 pt-5 pb-10"} ${isDark ? "bg-[#020617]" : "bg-[#f3f6fb]"}`}>
        <div className={isMobile ? "mb-4" : "mb-8"}>
          <p className={`text-2xl mb-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            A-propos d&apos;
            <span className={isDark ? "text-[#22c55e] font-bold" : "text-[#0284c7] font-bold"}>
              Octobots
            </span>
          </p>
          <style>{`
            @keyframes tp-scroll {
              0% { transform: translateY(0); }
              100% { transform: translateY(-50%); }
            }
            .tp-inner { animation: tp-scroll 30s linear infinite; }
          `}</style>
          <div className="overflow-hidden" style={{ height: "7.5em" }}>
            <div className="tp-inner">
              <p className={isDark ? "text-slate-400" : "text-slate-600"}>
                OCTOBTS est de retour pour sa troisieme edition de combats de robots, organisé par les
                etudiants du club de robotique de l&apos;UQAC.
                Vous etes tous bienvenus à participer et à assister à la compétition ainsi qu&apos;à nos
                nombreuses formations, où nous enseignons aux débutants à faire leur premier robot.
                Pas de destruction ne veut pas dire pas de fun! Nos combats de style sumo invitent des robots
                originaux, réflechis et amusants.
              </p>
              <p className={isDark ? "text-slate-400" : "text-slate-600"}>
                Serez-vous le prochain à vaincre tous les robots?
              </p>
              <div style={{ height: "1em" }} />
              <p className={isDark ? "text-slate-400" : "text-slate-600"}>
                OCTOBTS est de retour pour sa troisieme edition de combats de robots, organisé par les
                etudiants du club de robotique de l&apos;UQAC.
                Vous etes tous bienvenus à participer et à assister à la compétition ainsi qu&apos;à nos
                nombreuses formations, où nous enseignons aux débutants à faire leur premier robot.
                Pas de destruction ne veut pas dire pas de fun! Nos combats de style sumo invitent des robots
                originaux, réflechis et amusants.
              </p>
              <p className={isDark ? "text-slate-400" : "text-slate-600"}>
                Serez vous le prochain à vaincre tous les robots?
              </p>
              <div style={{ height: "1em" }} />
            </div>
          </div>
        </div>

        <div className={`${isMobile ? "m-2 gap-4" : "m-6 gap-8"} flex flex-wrap justify-center items-start`}>
          <WindowIcon label="Reglement" iconKey="shield" onClick={() => openWindow("reglement")} isDark={isDark} isOpen={openWindowIds.includes("reglement")} imgDark="/images/Dark Rules.webp" imgLight="/images/Light Rules.webp" imgClicking="/images/Clicking Rules.webp" imgClicked="/images/Clicked Rules.webp" />
          <WindowIcon label="Arbre" iconKey="arena" onClick={() => openWindow("competition")} isDark={isDark} isOpen={openWindowIds.includes("competition")} imgDark="/images/Dark Competition.webp" imgLight="/images/Light Competition.gif.webp" imgClicking="/images/Clicking Competition.webp" imgClicked="/images/Clicked Competition.webp" />
          <WindowIcon label="streaming" iconKey="link" onClick={() => openWindow("liens")} isDark={isDark} isOpen={openWindowIds.includes("liens")} imgDark="/images/Dark Stream.webp" imgLight="/images/Light Stream.webp" imgClicking="/images/Clicking Stream.webp" imgClicked="/images/Clicked Stream.webp" />
          <WindowIcon label="Remerciements" iconKey="help" onClick={() => openWindow("faq")} isDark={isDark} isOpen={openWindowIds.includes("faq")} imgDark="/images/Dark Thanks.webp" imgLight="/images/Light Thanks.webp" imgClicking="/images/Clicking Thanks.webp" imgClicked="/images/Clicked Thanks.webp" />
          <WindowIcon label="Formation" iconKey="radio" onClick={() => openWindow("formation")} isDark={isDark} isOpen={openWindowIds.includes("formation")} imgDark="/images/Dark Formation.webp" imgLight="/images/Light Formation.webp" imgClicking="/images/Clicking Formation.webp" imgClicked="/images/Clicked Formation.webp" />
        </div>
      </div>
    </section>
  );
}

type IconKey = "chip" | "shield" | "arena" | "link" | "help" | "radio";

const PIXEL_ICONS: Record<IconKey, string[]> = {
  chip: [
    "00111100",
    "01100110",
    "11000011",
    "11011011",
    "11011011",
    "11000011",
    "01100110",
    "00111100",
  ],
  shield: [
    "00111100",
    "01111110",
    "11111111",
    "11111111",
    "11111111",
    "01111110",
    "00111100",
    "00011000",
  ],
  arena: [
    "00011000",
    "00111100",
    "01111110",
    "11111111",
    "11100111",
    "11000011",
    "01100110",
    "00111100",
  ],
  link: [
    "00111100",
    "01100110",
    "11000011",
    "00011000",
    "00011000",
    "11000011",
    "01100110",
    "00111100",
  ],
  help: [
    "00111100",
    "01100110",
    "00000110",
    "00001100",
    "00011000",
    "00000000",
    "00011000",
    "00011000",
  ],
  radio: [
    "11000011",
    "01100110",
    "00111100",
    "00011000",
    "00011000",
    "00111100",
    "01100110",
    "11000011",
  ],
};

function PixelGlyph({ iconKey, isDark }: { iconKey: IconKey; isDark: boolean }) {
  const pattern = PIXEL_ICONS[iconKey];

  return (
    <svg
      className={`pixel-glyph ${isDark ? "pixel-glyph-dark" : "pixel-glyph-light"}`}
      viewBox="0 0 8 8"
      aria-hidden
    >
      {pattern.flatMap((row, y) =>
        row.split("").map((bit, x) =>
          bit === "1" ? (
            <rect
              key={`${iconKey}-${x}-${y}`}
              x={x}
              y={y}
              width="1"
              height="1"
              fill="currentColor"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

function WindowIcon({
  label,
  iconKey,
  onClick,
  isDark,
  isOpen = false,
  imgDark,
  imgLight,
  imgClicking,
  imgClicked,
}: {
  label: string;
  iconKey: IconKey;
  onClick: () => void;
  isDark: boolean;
  isOpen?: boolean;
  imgDark?: string;
  imgLight?: string;
  imgClicking?: string;
  imgClicked?: string;
}) {
  const [isPressing, setIsPressing] = useState(false);

  const imgSrc = (() => {
    if (isPressing && imgClicking) return imgClicking;
    if (isOpen && imgClicked) return imgClicked;
    if (imgDark && imgLight) return isDark ? imgDark : imgLight;
    return null;
  })();

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressing(true)}
      onMouseUp={() => setIsPressing(false)}
      onMouseLeave={() => setIsPressing(false)}
      className="flex flex-col items-center gap-2 text-xs group w-20"
    >
      <div
        className={`w-16 h-16 rounded-none border-2 flex items-center justify-center shadow-sm transition ${
          isOpen
            ? isDark
              ? "border-[#ec4899] shadow-[0_0_16px_rgba(236,72,153,0.45)]"
              : "border-[#ec4899] shadow-[0_0_16px_rgba(236,72,153,0.25)]"
            : isDark
            ? "border-[#1f2937] bg-[#020617] group-hover:border-[#ec4899] group-hover:shadow-[0_0_16px_rgba(236,72,153,0.45)]"
            : "border-[#a8b5c8] bg-[#f8fafc] group-hover:border-[#ec4899] group-hover:shadow-[0_0_16px_rgba(236,72,153,0.25)]"
        }`}
      >
        {imgSrc ? (
          <Image src={imgSrc} alt={label} width={40} height={40} />
        ) : (
          <PixelGlyph iconKey={iconKey} isDark={isDark} />
        )}
      </div>
      <span
        className={`uppercase tracking-[0.16em] text-[10px] transition ${
          isDark ? "text-slate-400 group-hover:text-[#ec4899]" : "text-slate-600 group-hover:text-[#ec4899]"
        }`}
      >
        {label}
      </span>
    </button>
  );
}