const SFX_STORAGE_KEY = "octobots-sfx-enabled";

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

export function createArcadeToneWavDataUrl(segments: ToneSegment[]) {
	const sampleRate = 11025;
	const sampleCount = segments.reduce(
		(total, segment) => total + Math.max(1, Math.floor((sampleRate * segment.durationMs) / 1000)),
		0,
	);
	const dataSize = sampleCount * 2;
	const bytes = new Uint8Array(44 + dataSize);
	const view = new DataView(bytes.buffer);

	const writeAscii = (offset: number, text: string) => {
		for (let index = 0; index < text.length; index++) {
			view.setUint8(offset + index, text.charCodeAt(index));
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
	view.setUint32(28, sampleRate * 2, true);
	view.setUint16(32, 2, true);
	view.setUint16(34, 16, true);
	writeAscii(36, "data");
	view.setUint32(40, dataSize, true);

	let globalSampleIndex = 0;
	const amplitude = 0.3 * 32767;

	segments.forEach((segment) => {
		const segmentSamples = Math.max(1, Math.floor((sampleRate * segment.durationMs) / 1000));
		const attackSamples = Math.max(1, Math.floor(segmentSamples * 0.08));
		const releaseSamples = Math.max(1, Math.floor(segmentSamples * 0.18));
		const duty = Math.min(0.9, Math.max(0.1, segment.duty ?? 0.25));

		for (let localIndex = 0; localIndex < segmentSamples; localIndex++) {
			const progress = segmentSamples > 1 ? localIndex / (segmentSamples - 1) : 1;
			const frequency = segment.freqStart + (segment.freqEnd - segment.freqStart) * progress;
			const localTime = localIndex / sampleRate;
			let envelope = segment.gain;
			if (localIndex < attackSamples) envelope *= localIndex / attackSamples;
			else if (localIndex >= segmentSamples - releaseSamples) {
				envelope *= (segmentSamples - localIndex - 1) / releaseSamples;
			}

			const phase = ((localIndex * frequency) / sampleRate) % 1;
			let sample = segment.wave === "triangle"
				? 1 - 4 * Math.abs(phase - 0.5)
				: phase < duty ? 1 : -1;
			const sub = Math.sin(2 * Math.PI * (frequency * 0.5) * localTime);
			const tremolo = 0.9 + 0.1 * Math.sin(2 * Math.PI * 24 * localTime);
			sample = (sample * 0.88 + sub * 0.12) * tremolo;
			sample = Math.round(sample * 14) / 14;

			view.setInt16(44 + globalSampleIndex * 2, Math.floor(sample * envelope * amplitude), true);
			globalSampleIndex++;
		}
	});

	return `data:audio/wav;base64,${toBase64(bytes)}`;
}

const toggleTone = createArcadeToneWavDataUrl([
	{ freqStart: 740, freqEnd: 740, durationMs: 24, gain: 0.84, wave: "pulse", duty: 0.2 },
	{ freqStart: 988, freqEnd: 988, durationMs: 24, gain: 0.8, wave: "pulse", duty: 0.2 },
	{ freqStart: 740, freqEnd: 680, durationMs: 34, gain: 0.72, wave: "triangle" },
]);

export function getToggleToneDataUrl() {
	return toggleTone;
}

let messageAudio: HTMLAudioElement | null = null;
let messageSoundUnlocked = false;
let messageSoundUnlockInProgress = false;

function getMessageAudio() {
	if (typeof Audio === "undefined") return null;
	if (!messageAudio) {
		messageAudio = new Audio(toggleTone);
		messageAudio.volume = 0.32;
		messageAudio.preload = "auto";
		messageAudio.load();
	}
	return messageAudio;
}

export function unlockMessageSound() {
	if (messageSoundUnlocked || messageSoundUnlockInProgress) return;

	const audio = getMessageAudio();
	if (!audio) return;

	messageSoundUnlockInProgress = true;
	audio.volume = 0;
	void audio.play().then(() => {
		audio.pause();
		audio.currentTime = 0;
		messageSoundUnlocked = true;
	}).catch(() => undefined).finally(() => {
		audio.volume = 0.32;
		messageSoundUnlockInProgress = false;
	});
}

export function listenForMessageSoundUnlock() {
	window.addEventListener("pointerdown", unlockMessageSound);
	window.addEventListener("keydown", unlockMessageSound);

	return () => {
		window.removeEventListener("pointerdown", unlockMessageSound);
		window.removeEventListener("keydown", unlockMessageSound);
	};
}

export function playMessageSound() {
	if (typeof window === "undefined" || !messageSoundUnlocked) return;

	try {
		if (window.localStorage.getItem(SFX_STORAGE_KEY) === "false") return;
	} catch {
		// Continue with the default enabled preference when storage is unavailable.
	}

	const audio = getMessageAudio();
	if (!audio) return;
	audio.currentTime = 0;
	void audio.play().catch(() => {
		messageSoundUnlocked = false;
	});
}
