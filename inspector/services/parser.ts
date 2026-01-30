
import { Decoder } from '@msgpack/msgpack';
import { AIFBINFile, AIFBINHeader, ChunkType, ContentChunk, AIFBINVersion } from '../types';

/**
 * AIF-BIN Binary Parser (Little-Endian)
 * Professional-grade parser with robust MessagePack decoding.
 */
export class AIFBINParser {
  private view: DataView;
  private buffer: Uint8Array;
  private decoder: Decoder;

  constructor(buffer: Uint8Array) {
    this.buffer = buffer;
    this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    this.decoder = new Decoder();
  }

  /**
   * Safely decodes MessagePack data even if trailing bytes exist in the buffer.
   */
  private safeDecode(data: Uint8Array): any {
    try {
      // Using a Decoder instance avoids the "Extra bytes" error thrown by the top-level decode()
      return this.decoder.decode(data);
    } catch (err) {
      console.warn("MessagePack decode warning:", err);
      return { error: "Failed to decode MessagePack data", rawSize: data.length };
    }
  }

  public parse(): AIFBINFile {
    const header = this.parseHeader();
    
    // Check Magic - Using hex escapes \x00\x01 to avoid octal escape errors in strict mode
    if (header.magic !== "AIFBIN\x00\x01") {
      throw new Error("Invalid AIF-BIN magic signature");
    }

    // Fix: Pass bigint offsets directly to parser methods to maintain precision for sentinel checks and fix type overlap errors.
    const metadata = this.parseMetadata(header.metadataOffset);
    const originalRaw = this.parseOriginalRaw(header.originalRawOffset);
    const chunks = this.parseChunks(header.contentChunksOffset);
    const versions = this.parseVersions(header.versionsOffset);
    const footer = this.parseFooter(header.footerOffset);

    return {
      header,
      metadata,
      originalRaw,
      chunks,
      versions,
      footer,
      binary: this.buffer
    };
  }

  private parseHeader(): AIFBINHeader {
    const magicArr = this.buffer.slice(0, 8);
    const magic = new TextDecoder().decode(magicArr);
    
    return {
      magic,
      version: this.view.getUint32(8, true),
      metadataOffset: this.view.getBigUint64(16, true),
      originalRawOffset: this.view.getBigUint64(24, true),
      contentChunksOffset: this.view.getBigUint64(32, true),
      versionsOffset: this.view.getBigUint64(40, true),
      footerOffset: this.view.getBigUint64(48, true),
      totalSize: this.view.getBigUint64(56, true)
    };
  }

  // Fix: Changed offset parameter to bigint to support large file offsets and correct OOB checks.
  private parseMetadata(offset: bigint): any {
    if (offset >= BigInt(this.buffer.length)) return { error: "Metadata offset OOB" };
    const nOffset = Number(offset);
    const length = Number(this.view.getBigUint64(nOffset, true));
    const data = this.buffer.slice(nOffset + 8, nOffset + 8 + length);
    return this.safeDecode(data);
  }

  // Fix: Changed offset parameter to bigint and updated comparison logic to fix the 0xFFFFFFFFFFFFFFFFn overlap error (line 82).
  private parseOriginalRaw(offset: bigint): Uint8Array | null {
    if (offset === 0xFFFFFFFFFFFFFFFFn || offset >= BigInt(this.buffer.length)) return null;
    const nOffset = Number(offset);
    const length = Number(this.view.getBigUint64(nOffset, true));
    return this.buffer.slice(nOffset + 8, nOffset + 8 + length);
  }

  // Fix: Changed offset parameter to bigint for consistent binary parsing across all sections.
  private parseChunks(offset: bigint): ContentChunk[] {
    if (offset >= BigInt(this.buffer.length)) return [];
    const nOffset = Number(offset);
    const count = this.view.getUint32(nOffset, true);
    let currentPos = nOffset + 4;
    const chunks: ContentChunk[] = [];

    for (let i = 0; i < count; i++) {
      if (currentPos + 20 > this.buffer.length) break;
      
      const type = this.view.getUint32(currentPos, true) as ChunkType;
      const dataLen = this.view.getBigUint64(currentPos + 4, true);
      const metaLen = this.view.getBigUint64(currentPos + 12, true);
      
      const metaStart = currentPos + 20;
      const metaEnd = metaStart + Number(metaLen);
      const metadata = this.safeDecode(this.buffer.slice(metaStart, metaEnd));

      const dataStart = metaEnd;
      const dataEnd = dataStart + Number(dataLen);
      const data = this.buffer.slice(dataStart, dataEnd);

      chunks.push({
        id: i,
        type,
        dataLength: dataLen,
        metadataLength: metaLen,
        metadata,
        data,
        embedding: null,
        byteRange: [currentPos, dataEnd]
      });

      currentPos = dataEnd;
    }

    return chunks;
  }

  // Fix: Changed offset parameter to bigint and updated comparison logic to fix the 0xFFFFFFFFFFFFFFFFn overlap error (line 126).
  private parseVersions(offset: bigint): AIFBINVersion[] {
    if (offset >= BigInt(this.buffer.length) || offset === 0xFFFFFFFFFFFFFFFFn) return [];
    const nOffset = Number(offset);
    const count = this.view.getUint32(nOffset, true);
    let currentPos = nOffset + 4;
    const versions: AIFBINVersion[] = [];

    for (let i = 0; i < count; i++) {
      if (currentPos + 4 > this.buffer.length) break;
      const descLen = this.view.getUint32(currentPos, true);
      const desc = new TextDecoder().decode(this.buffer.slice(currentPos + 4, currentPos + 4 + descLen));
      currentPos += 4 + descLen;

      if (currentPos + 4 > this.buffer.length) break;
      const deltaLen = this.view.getUint32(currentPos, true);
      const delta = this.safeDecode(this.buffer.slice(currentPos + 4, currentPos + 4 + deltaLen));
      currentPos += 4 + deltaLen;

      if (currentPos + 8 > this.buffer.length) break;
      const timestamp = Number(this.view.getBigUint64(currentPos, true));
      currentPos += 8;

      versions.push({ description: desc, delta, timestamp });
    }
    return versions;
  }

  // Fix: Changed offset parameter to bigint and updated comparison logic to fix the 0xFFFFFFFFFFFFFFFFn overlap error (line 152).
  private parseFooter(offset: bigint): any {
    if (offset >= BigInt(this.buffer.length) || offset === 0xFFFFFFFFFFFFFFFFn) {
      return { indices: [], checksum: 0n };
    }
    const nOffset = Number(offset);
    const indexCount = this.view.getUint32(nOffset, true);
    const indices = [];
    let currentPos = nOffset + 4;

    for (let i = 0; i < indexCount; i++) {
      if (currentPos + 12 > this.buffer.length) break;
      indices.push({
        chunkId: this.view.getUint32(currentPos, true),
        offset: this.view.getBigUint64(currentPos + 4, true)
      });
      currentPos += 12;
    }

    const checksum = (currentPos + 8 <= this.buffer.length) 
      ? this.view.getBigUint64(currentPos, true) 
      : 0n;
      
    return { indices, checksum };
  }
}
