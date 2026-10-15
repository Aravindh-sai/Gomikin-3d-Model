/**
 * ResilientModelLoader for Gomikin 3D USDZ Model
 * 
 * Features:
 * 1. Automatic Local-to-Remote Fallback:
 *    - Tries local path (/Gomikin/gomikin_disection.usdz) first.
 *    - If unavailable (404, network error, or SPA HTML rewrite), seamlessly falls back
 *      to the Vercel Blob URL without raising an unhandled error to the user.
 * 2. Resumable Chunked Range Downloads:
 *    - Uses HTTP Range requests in 8MB chunks.
 *    - Automatically retries interrupted chunks with exponential backoff.
 *    - Preserves downloaded progress on network drops.
 * 3. Client-Side Persistent Cache (IndexedDB):
 *    - Caches the loaded 268MB ArrayBuffer in browser IndexedDB.
 *    - Subsequent visits / page reloads load instantly (<300ms) with zero network overhead.
 * 4. Rich Diagnostic Telemetry:
 *    - Real-time download progress (MB / total MB), percentage, MB/s speed, ETA, and connection recovery state.
 */

export const DEFAULT_MODEL_CONFIG = {
  sources: [
    {
      id: 'local',
      label: 'Local CAD Archive',
      url: '/Gomikin/gomikin_disection.usdz',
      isLocal: true
    },
    {
      id: 'vercel-blob',
      label: 'Vercel Cloud Storage',
      url: 'https://eqvmxwue8iejzeky.public.blob.vercel-storage.com/gomikin_disection.usdz',
      isLocal: false
    }
  ],
  chunkSize: 16 * 1024 * 1024, // 16 MB chunks for optimal balance of handshake speed and resumption
  maxRetriesPerChunk: 5,
  chunkTimeoutMs: 35000,
  probeTimeoutMs: 6000,
  dbName: 'GomikinModelCache',
  storeName: 'models',
  cacheKey: 'gomikin_disection_usdz_v1',
  expectedMinBytes: 50 * 1024 * 1024 // 50MB minimum to distinguish from HTML 404 responses
};

class ModelCacheDB {
  constructor(dbName = DEFAULT_MODEL_CONFIG.dbName, storeName = DEFAULT_MODEL_CONFIG.storeName) {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  async openDB() {
    if (!window.indexedDB) return null;
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = (err) => {
        console.warn('[ModelCacheDB] IndexedDB open error:', err);
        resolve(null);
      };
    });
  }

  async get(key) {
    try {
      const db = await this.openDB();
      if (!db) return null;
      return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(null), 4000);
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.get(key);
        req.onsuccess = async () => {
          clearTimeout(timeout);
          const res = req.result;
          if (!res) return resolve(null);
          // If stored as Blob, convert to ArrayBuffer
          if (res.blob instanceof Blob) {
            try {
              const buf = await res.blob.arrayBuffer();
              resolve({ ...res, buffer: buf });
            } catch {
              resolve(null);
            }
          } else if (res.buffer instanceof ArrayBuffer) {
            resolve(res);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => {
          clearTimeout(timeout);
          resolve(null);
        };
      });
    } catch (err) {
      console.warn('[ModelCacheDB] Get failed:', err);
      return null;
    }
  }

  async set(key, value) {
    try {
      const db = await this.openDB();
      if (!db) return false;
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('[ModelCacheDB] Put timed out after 5s');
          resolve(false);
        }, 5000);

        // Store as Blob to let browser handle large binary stream directly to disk
        const record = {
          blob: new Blob([value.buffer], { type: 'model/vnd.usdz+zip' }),
          source: value.source,
          timestamp: value.timestamp,
          length: value.length
        };

        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.put(record, key);
        req.onsuccess = () => {
          clearTimeout(timeout);
          resolve(true);
        };
        req.onerror = (err) => {
          clearTimeout(timeout);
          console.warn('[ModelCacheDB] Set failed (quota exceeded?):', err);
          resolve(false);
        };
      });
    } catch (err) {
      console.warn('[ModelCacheDB] Put error:', err);
      return false;
    }
  }

  async delete(key) {
    try {
      const db = await this.openDB();
      if (!db) return false;
      return new Promise((resolve) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.delete(key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }
}

export class ResilientModelLoader {
  constructor(config = {}) {
    this.config = { ...DEFAULT_MODEL_CONFIG, ...config };
    this.cacheDB = new ModelCacheDB(this.config.dbName, this.config.storeName);
    this.abortController = null;
  }

  /**
   * Resolves priority sources based on URL query parameters and defaults.
   * e.g., ?source=local or ?source=vercel or ?nocache=1
   */
  getEffectiveSources() {
    const params = new URLSearchParams(window.location.search);
    const forceSource = params.get('source');
    if (forceSource === 'local') {
      return this.config.sources.filter(s => s.isLocal);
    }
    if (forceSource === 'vercel' || forceSource === 'remote' || forceSource === 'blob') {
      return this.config.sources.filter(s => !s.isLocal);
    }
    return [...this.config.sources];
  }

  /**
   * Determines if browser cache should be bypassed.
   */
  shouldBypassCache() {
    const params = new URLSearchParams(window.location.search);
    return params.get('nocache') === '1' || params.get('nocache') === 'true';
  }

  /**
   * Probes a source to verify it exists and serves valid binary data
   * (distinguishing from HTML 404 SPA fallback responses).
   */
  async probeSource(source) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.probeTimeoutMs);

      // Try Range request for first byte to verify range support and size
      const res = await fetch(source.url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type') || '';
      const isHtml = contentType.includes('text/html') || contentType.includes('application/xhtml');

      if (!res.ok || isHtml) {
        return {
          ok: false,
          reason: `HTTP ${res.status}${isHtml ? ' (HTML SPA redirect)' : ''}`
        };
      }

      // Check content-range or content-length
      const contentRange = res.headers.get('content-range');
      let totalBytes = 0;
      if (contentRange) {
        const match = contentRange.match(/\/(\d+)/);
        if (match) totalBytes = parseInt(match[1], 10);
      }
      if (!totalBytes) {
        const len = res.headers.get('content-length');
        if (len && res.status === 200) totalBytes = parseInt(len, 10);
      }

      // If status was 206, server supports range requests!
      const supportsRanges = res.status === 206;

      // Validate size is sensible for our CAD model
      if (totalBytes > 0 && totalBytes < this.config.expectedMinBytes) {
        return {
          ok: false,
          reason: `Size too small (${totalBytes} bytes) - likely not the 3D model asset.`
        };
      }

      return {
        ok: true,
        totalBytes: totalBytes || 268571020, // Default to known asset size if unstated
        supportsRanges
      };
    } catch (err) {
      return {
        ok: false,
        reason: err.name === 'AbortError' ? 'Probe timed out' : err.message
      };
    }
  }

  /**
   * Main entry point: Loads the model with automatic fallback, chunked resumption,
   * client caching, and progress reporting.
   * 
   * @param {Object} options
   * @param {Function} options.onProgress - Receives progress telemetry
   * @param {Function} options.onStatus - Receives status updates
   * @returns {Promise<ArrayBuffer>}
   */
  async loadModelBuffer({ onProgress, onStatus } = {}) {
    const notifyProgress = (data) => {
      if (typeof onProgress === 'function') onProgress(data);
    };
    const notifyStatus = (text) => {
      if (typeof onStatus === 'function') onStatus(text);
    };

    // 1. Check client-side IndexedDB cache (unless bypassed via ?nocache=1)
    if (!this.shouldBypassCache()) {
      notifyStatus('Checking local browser cache...');
      try {
        const cached = await this.cacheDB.get(this.config.cacheKey);
        if (cached && cached.buffer instanceof ArrayBuffer && cached.buffer.byteLength >= this.config.expectedMinBytes) {
          console.log(`[ResilientModelLoader] Loaded CAD model from IndexedDB cache (${(cached.buffer.byteLength / (1024 * 1024)).toFixed(1)} MB)`);
          notifyProgress({
            phase: 'cache',
            sourceLabel: 'Browser Cache (Instant)',
            sourceId: 'cache',
            percent: 100,
            loaded: cached.buffer.byteLength,
            total: cached.buffer.byteLength,
            speedMBps: 0,
            etaSeconds: 0
          });
          notifyStatus('Loaded from local browser cache.');
          return cached.buffer;
        }
      } catch (cacheErr) {
        console.warn('[ResilientModelLoader] Cache check error, proceeding to network:', cacheErr);
      }
    }

    // 2. Select source via probing and silent fallback
    const candidateSources = this.getEffectiveSources();
    let selectedSource = null;
    let sourceMeta = null;

    for (let i = 0; i < candidateSources.length; i++) {
      const source = candidateSources[i];
      notifyStatus(`Probing ${source.label}...`);
      console.log(`[ResilientModelLoader] Probing candidate source: ${source.id} (${source.url})`);

      const probe = await this.probeSource(source);
      if (probe.ok) {
        selectedSource = source;
        sourceMeta = probe;
        console.log(`[ResilientModelLoader] Source selected: ${source.label} (${(probe.totalBytes / (1024 * 1024)).toFixed(1)} MB, ranges: ${probe.supportsRanges})`);
        break;
      } else {
        console.warn(`[ResilientModelLoader] Candidate source "${source.id}" unavailable (${probe.reason}). Falling back to next source without error.`);
        if (i < candidateSources.length - 1) {
          notifyStatus(`Local model archive unavailable. Falling back to Vercel Cloud Storage...`);
        }
      }
    }

    // If probing failed for all sources, fallback to the last source directly
    if (!selectedSource && candidateSources.length > 0) {
      selectedSource = candidateSources[candidateSources.length - 1];
      sourceMeta = { ok: true, totalBytes: 268571020, supportsRanges: true };
      console.warn(`[ResilientModelLoader] All probes inconclusive. Direct attempting fallback source: ${selectedSource.label}`);
    }

    if (!selectedSource) {
      throw new Error('No candidate CAD model sources configured.');
    }

    notifyStatus(`Connected to ${selectedSource.label}. Starting download...`);

    // 3. Perform Resumable Chunked Range Download
    const buffer = await this.downloadWithResumption(selectedSource, sourceMeta, {
      onProgress: notifyProgress,
      onStatus: notifyStatus
    });

    // 4. Save to IndexedDB cache
    if (buffer && buffer.byteLength >= this.config.expectedMinBytes && !this.shouldBypassCache()) {
      try {
        notifyStatus('Saving model to local cache for instant reload...');
        const saved = await this.cacheDB.set(this.config.cacheKey, {
          buffer,
          source: selectedSource.id,
          timestamp: Date.now(),
          length: buffer.byteLength
        });
        if (saved) {
          console.log('[ResilientModelLoader] Successfully cached CAD model into IndexedDB for instant subsequent visits.');
        }
      } catch (cacheSaveErr) {
        console.warn('[ResilientModelLoader] Cache save error (quota exceeded?):', cacheSaveErr);
      }
    }

    return buffer;
  }

  /**
   * Resumable download engine with range requests, chunk tracking, and exponential backoff retry.
   */
  async downloadWithResumption(source, meta, { onProgress, onStatus }) {
    const totalBytes = meta.totalBytes || 268571020;
    const chunkSize = this.config.chunkSize;
    const numChunks = Math.ceil(totalBytes / chunkSize);

    console.log(`[ResilientModelLoader] Downloading ${totalBytes} bytes in ${numChunks} chunks (${(chunkSize / (1024 * 1024)).toFixed(1)} MB each) from ${source.url}`);

    const chunks = new Array(numChunks);
    let downloadedBytes = 0;
    let startTime = performance.now();
    let speedSamples = [];

    for (let chunkIdx = 0; chunkIdx < numChunks; chunkIdx++) {
      const start = chunkIdx * chunkSize;
      const end = Math.min(start + chunkSize - 1, totalBytes - 1);
      const expectedChunkLength = end - start + 1;

      let chunkDownloaded = false;
      let attempt = 0;

      while (!chunkDownloaded && attempt < this.config.maxRetriesPerChunk) {
        attempt++;
        const chunkStartTime = performance.now();

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.config.chunkTimeoutMs);

          const res = await fetch(source.url, {
            headers: { Range: `bytes=${start}-${end}` },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!res.ok && res.status !== 206 && res.status !== 200) {
            throw new Error(`HTTP ${res.status} ${res.statusText}`);
          }

          const arrayBuf = await res.arrayBuffer();
          if (arrayBuf.byteLength === 0) {
            throw new Error('Received 0 bytes for chunk');
          }

          const uint8Data = new Uint8Array(arrayBuf);
          chunks[chunkIdx] = uint8Data;
          downloadedBytes += uint8Data.byteLength;
          chunkDownloaded = true;

          // Speed and ETA calculation
          const chunkDurationSec = (performance.now() - chunkStartTime) / 1000;
          if (chunkDurationSec > 0.05) {
            const currentSpeedMBps = (uint8Data.byteLength / (1024 * 1024)) / chunkDurationSec;
            speedSamples.push(currentSpeedMBps);
            if (speedSamples.length > 5) speedSamples.shift();
          }

          const avgSpeedMBps = speedSamples.length > 0
            ? speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length
            : 0;

          const remainingBytes = Math.max(0, totalBytes - downloadedBytes);
          const etaSeconds = avgSpeedMBps > 0 ? Math.ceil((remainingBytes / (1024 * 1024)) / avgSpeedMBps) : 0;
          const pct = Math.min(100, (downloadedBytes / totalBytes) * 100);

          console.log(`[ResilientModelLoader] Chunk ${chunkIdx + 1}/${numChunks} loaded (${pct.toFixed(0)}%) - ${avgSpeedMBps.toFixed(1)} MB/s`);

          onProgress({
            phase: 'downloading',
            sourceLabel: source.label,
            sourceId: source.id,
            percent: pct,
            loaded: downloadedBytes,
            total: totalBytes,
            speedMBps: avgSpeedMBps,
            etaSeconds,
            retrying: false
          });

        } catch (chunkErr) {
          const isTimeout = chunkErr.name === 'AbortError';
          console.warn(`[ResilientModelLoader] Chunk ${chunkIdx + 1}/${numChunks} failed (Attempt ${attempt}/${this.config.maxRetriesPerChunk}):`, isTimeout ? 'Timed out' : chunkErr.message);

          if (attempt < this.config.maxRetriesPerChunk) {
            const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 6000) + Math.random() * 300;
            onStatus(`Connection interrupted. Resuming at ${(downloadedBytes / (1024 * 1024)).toFixed(1)} MB (Attempt ${attempt + 1}/${this.config.maxRetriesPerChunk})...`);
            onProgress({
              phase: 'downloading',
              sourceLabel: source.label,
              sourceId: source.id,
              percent: Math.min(100, (downloadedBytes / totalBytes) * 100),
              loaded: downloadedBytes,
              total: totalBytes,
              speedMBps: 0,
              etaSeconds: 0,
              retrying: true,
              attempt,
              maxRetries: this.config.maxRetriesPerChunk
            });

            await new Promise(r => setTimeout(r, backoffMs));
          } else {
            throw new Error(`Failed to download CAD model after ${this.config.maxRetriesPerChunk} attempts at ${(downloadedBytes / (1024 * 1024)).toFixed(1)} MB.`);
          }
        }
      }
    }

    // Assemble all chunks into a unified ArrayBuffer
    onStatus('Assembling downloaded data...');
    const combinedBuffer = new Uint8Array(totalBytes);
    let offset = 0;
    for (let i = 0; i < chunks.length; i++) {
      if (chunks[i]) {
        combinedBuffer.set(chunks[i], offset);
        offset += chunks[i].byteLength;
      }
    }

    const elapsedSec = ((performance.now() - startTime) / 1000).toFixed(1);
    console.log(`[ResilientModelLoader] Download complete! ${(combinedBuffer.byteLength / (1024 * 1024)).toFixed(1)} MB in ${elapsedSec}s.`);

    return combinedBuffer.buffer;
  }
}
