/**
 * 스피치 제출용 음성 파일 유틸.
 *
 * 서버(POST /speech-practices/questions/{id}/submissions)는 파일 **확장자**로만
 * 형식을 판단하고 mp3/wav 외에는 400(SPEECH_FILE_400)을 돌려준다.
 * 용량 한도는 100MB(413, SPEECH_FILE_413).
 */

export const ALLOWED_AUDIO_EXTENSIONS = [".mp3", ".wav"] as const;
export const MAX_AUDIO_BYTES = 100 * 1024 * 1024;

/** STT 가 쓰는 샘플레이트. 이보다 높게 담아도 인식률이 올라가지 않고 용량만 커진다. */
const TARGET_SAMPLE_RATE = 16000;

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

/** 문제가 없으면 null, 있으면 사용자에게 보여줄 메시지를 돌려준다. */
export function validateAudioFile(file: File): string | null {
  const ext = extensionOf(file.name);

  if (!ALLOWED_AUDIO_EXTENSIONS.includes(ext as (typeof ALLOWED_AUDIO_EXTENSIONS)[number])) {
    return `MP3 또는 WAV 파일만 올릴 수 있어요. (선택한 파일: ${ext || "확장자 없음"})`;
  }

  if (file.size > MAX_AUDIO_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `음성 파일은 100MB 이하여야 해요. (선택한 파일: ${mb}MB)`;
  }

  if (file.size === 0) {
    return "빈 파일이에요. 다른 파일을 선택해주세요.";
  }

  return null;
}

/**
 * 녹음 결과를 실제 WAV 파일로 변환한다.
 *
 * MediaRecorder 는 브라우저마다 webm/opus(Chrome), mp4/aac(Safari) 등을 내놓고
 * WAV 는 어디서도 지원하지 않는다. Blob 의 type 만 "audio/wav" 로 바꿔 붙이면
 * 이름만 wav 인 다른 포맷이 서버에 저장되므로, 디코딩한 뒤 16-bit PCM 으로 다시 쓴다.
 */
export async function encodeRecordingToWav(
  chunks: Blob[],
  mimeType: string,
  fileName = "recorded-audio.wav"
): Promise<File> {
  const raw = new Blob(chunks, { type: mimeType });
  const arrayBuffer = await raw.arrayBuffer();

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioCtx) {
    throw new Error("이 브라우저에서는 녹음 변환을 지원하지 않아요.");
  }

  const ctx = new AudioCtx();
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(arrayBuffer);
  } finally {
    void ctx.close();
  }

  const mono16k = await resampleToMono16k(decoded);
  return new File([encodeWav(mono16k)], fileName, { type: "audio/wav" });
}

/**
 * 16kHz 모노로 다시 샘플링한다.
 *
 * WAV 는 무압축이라 브라우저 기본 48kHz 로 담으면 초당 96KB 가 된다.
 * STT 가 어차피 16kHz 로 내려 쓰므로 인식 품질 손해 없이 용량을 1/3로 줄인다
 * (48kHz 스테레오 대비 약 1/6).
 */
async function resampleToMono16k(buffer: AudioBuffer): Promise<AudioBuffer> {
  if (buffer.sampleRate === TARGET_SAMPLE_RATE && buffer.numberOfChannels === 1) {
    return buffer;
  }

  const OfflineCtx =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;

  // 구형 브라우저에서 OfflineAudioContext 가 없으면 원본 그대로 쓴다 (용량만 커짐).
  if (!OfflineCtx) return buffer;

  const frames = Math.max(1, Math.ceil(buffer.duration * TARGET_SAMPLE_RATE));
  const offline = new OfflineCtx(1, frames, TARGET_SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.connect(offline.destination);
  source.start();

  return offline.startRendering();
}

/** AudioBuffer → 모노 16-bit PCM WAV */
function encodeWav(buffer: AudioBuffer): ArrayBuffer {
  const length = buffer.length;
  const channels = buffer.numberOfChannels;

  // 서버는 발화 속도·침묵만 보므로 모노로 합쳐 용량을 절반 이하로 줄인다.
  const samples = new Float32Array(length);
  for (let ch = 0; ch < channels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) samples[i] += data[i] / channels;
  }

  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2;
  const out = new ArrayBuffer(44 + length * bytesPerSample);
  const view = new DataView(out);

  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + length * bytesPerSample, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // fmt 청크 길이
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // 채널 수(모노)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true); // byte rate
  view.setUint16(32, bytesPerSample, true); // block align
  view.setUint16(34, 8 * bytesPerSample, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, length * bytesPerSample, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += bytesPerSample;
  }

  return out;
}
