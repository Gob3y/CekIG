/**
 * Zero-dependency client-side ZIP reader using End-of-Central-Directory (EOCD).
 * Supports Method 0 (Store) and Method 8 (Deflate via native DecompressionStream).
 */
(function (global) {
  'use strict';

  const EOCD_SIG = 0x06054b50;
  const CD_SIG = 0x02014b50;
  const LFH_SIG = 0x04034b50;

  async function inflateRaw(compressedBytes) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error(
        'Your browser does not support DecompressionStream. Please extract the ZIP manually and use "Separate Files".'
      );
    }
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    writer.write(compressedBytes);
    writer.close();

    const response = new Response(ds.readable);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  function findEOCD(view, totalLen) {
    const minOffset = Math.max(0, totalLen - 65557);
    for (let offset = totalLen - 22; offset >= minOffset; offset--) {
      if (view.getUint32(offset, true) === EOCD_SIG) {
        const commentLen = view.getUint16(offset + 20, true);
        if (offset + 22 + commentLen === totalLen) {
          return offset;
        }
      }
    }
    return -1;
  }

  async function extractMatchingTextFiles(arrayBuffer, filterFn) {
    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(arrayBuffer);
    const decoder = new TextDecoder('utf-8');

    const eocdOffset = findEOCD(view, bytes.length);
    if (eocdOffset === -1) {
      throw new Error('Invalid or corrupted ZIP archive.');
    }

    const totalEntries = view.getUint16(eocdOffset + 10, true);
    const cdSize = view.getUint32(eocdOffset + 12, true);
    const cdOffset = view.getUint32(eocdOffset + 16, true);

    if (cdOffset + cdSize > bytes.length) {
      throw new Error('ZIP Central Directory is truncated or invalid.');
    }

    const results = [];
    let cursor = cdOffset;

    for (let i = 0; i < totalEntries; i++) {
      if (cursor + 46 > bytes.length || view.getUint32(cursor, true) !== CD_SIG) {
        break;
      }

      const method = view.getUint16(cursor + 10, true);
      const compSize = view.getUint32(cursor + 20, true);
      const nameLen = view.getUint16(cursor + 28, true);
      const extraLen = view.getUint16(cursor + 30, true);
      const commentLen = view.getUint16(cursor + 32, true);
      const localHeaderOffset = view.getUint32(cursor + 42, true);

      const nameBytes = bytes.subarray(cursor + 46, cursor + 46 + nameLen);
      const name = decoder.decode(nameBytes);

      cursor += 46 + nameLen + extraLen + commentLen;

      if (name.endsWith('/') || !filterFn(name)) {
        continue;
      }

      if (localHeaderOffset + 30 > bytes.length || view.getUint32(localHeaderOffset, true) !== LFH_SIG) {
        continue;
      }

      const lfhNameLen = view.getUint16(localHeaderOffset + 26, true);
      const lfhExtraLen = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + lfhNameLen + lfhExtraLen;
      const dataEnd = dataStart + compSize;

      if (dataEnd > bytes.length) {
        continue;
      }

      const rawSlice = bytes.subarray(dataStart, dataEnd);
      let contentBytes;

      if (method === 0) {
        contentBytes = rawSlice;
      } else if (method === 8) {
        contentBytes = await inflateRaw(rawSlice);
      } else {
        throw new Error(`Unsupported ZIP compression method (${method}) for "${name}".`);
      }

      results.push({
        name,
        text: decoder.decode(contentBytes)
      });
    }

    return results;
  }

  global.ZipReader = {
    extractMatchingTextFiles
  };
})(window);
