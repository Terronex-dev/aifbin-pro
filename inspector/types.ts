
export interface AIFBINHeader {
  magic: string;
  version: number;
  metadataOffset: bigint;
  originalRawOffset: bigint;
  contentChunksOffset: bigint;
  versionsOffset: bigint;
  footerOffset: bigint;
  totalSize: bigint;
}

export enum ChunkType {
  TEXT = 1,
  TABLE_JSON = 2,
  IMAGE = 3,
  AUDIO = 4,
  VIDEO = 5,
  CODE = 6
}

export interface ContentChunk {
  id: number;
  type: ChunkType;
  dataLength: bigint;
  metadataLength: bigint;
  metadata: any;
  data: Uint8Array;
  embedding: Float32Array | null;
  byteRange: [number, number];
}

export interface AIFBINVersion {
  description: string;
  delta: any;
  timestamp: number;
}

export interface AIFBINFile {
  header: AIFBINHeader;
  metadata: any;
  originalRaw: Uint8Array | null;
  chunks: ContentChunk[];
  versions: AIFBINVersion[];
  footer: {
    indices: { chunkId: number; offset: bigint }[];
    checksum: bigint;
  };
  binary: Uint8Array;
}
