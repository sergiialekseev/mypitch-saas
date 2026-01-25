export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function encode(bytes: Uint8Array) {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function createAudioData(inputData: Float32Array): { data: string; mimeType: string } {
  const length = inputData.length;
  const int16 = new Int16Array(length);
  for (let i = 0; i < length; i += 1) {
    const sample = Math.max(-1, Math.min(1, inputData[i]));
    int16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  const base64Data = encode(new Uint8Array(int16.buffer));

  return {
    data: base64Data,
    mimeType: "audio/pcm;rate=16000"
  };
}

export async function pcmToAudioBuffer(pcmData: ArrayBuffer, context: AudioContext): Promise<AudioBuffer> {
  const dataView = new DataView(pcmData);
  const numSamples = pcmData.byteLength / 2;
  const audioBuffer = context.createBuffer(1, numSamples, 24000);
  const channelData = audioBuffer.getChannelData(0);

  for (let i = 0; i < numSamples; i += 1) {
    const sample = dataView.getInt16(i * 2, true);
    channelData[i] = sample / 32768;
  }

  return audioBuffer;
}
