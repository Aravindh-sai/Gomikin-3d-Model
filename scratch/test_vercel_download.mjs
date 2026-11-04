import { DEFAULT_MODEL_CONFIG, ResilientModelLoader } from '../src/utils/resilientModelLoader.js';

// Polyfill window and indexedDB if running in node
if (typeof window === 'undefined') {
  global.window = {
    indexedDB: null,
    location: { search: '' }
  };
}

async function run() {
  console.log('Testing ResilientModelLoader with production Vercel Blob GLB URL...');
  const loader = new ResilientModelLoader({
    sources: [
      {
        id: 'vercel-blob',
        label: 'Vercel Cloud Storage',
        url: 'https://eqvmxwue8iejzeky.public.blob.vercel-storage.com/3dmodel.glb',
        isLocal: false
      }
    ],
    chunkSize: 16 * 1024 * 1024
  });

  let lastPct = 0;
  const buffer = await loader.loadModelBuffer({
    onStatus: (status) => console.log('STATUS:', status),
    onProgress: (p) => {
      if (p.percent - lastPct >= 10 || p.percent === 100) {
        lastPct = p.percent;
        console.log(`PROGRESS: ${p.percent}% (${(p.loaded / 1024 / 1024).toFixed(1)} / ${(p.total / 1024 / 1024).toFixed(1)} MB) - ${p.speedMBps.toFixed(1)} MB/s`);
      }
    }
  });

  console.log('Download completed successfully!');
  console.log('Buffer byteLength:', buffer.byteLength);
  console.log('Expected byteLength:', 87008968);
  if (buffer.byteLength === 87008968) {
    console.log('VERIFICATION PASSED: Exact byte match for 3dmodel.glb!');
  } else {
    throw new Error(`Byte length mismatch: got ${buffer.byteLength}, expected 87008968`);
  }

  // Check glTF magic header: 'glTF' = 0x46546C67 (little endian)
  const view = new DataView(buffer);
  const magic = view.getUint32(0, false);
  console.log('Magic uint32:', magic.toString(16));
  if (magic === 0x676C5446) {
    console.log('VERIFICATION PASSED: Valid GLB magic header 0x676C5446 (glTF)!');
  } else {
    throw new Error('Invalid magic header');
  }
}

run().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
