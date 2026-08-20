export interface UploadFileInput {
  body: ArrayBuffer
  contentType: string
  originalName: string
}

export interface StoredFile {
  storageKey: string
  sizeBytes: number
}

/**
 * only the storageKey is persisted, never a url: signed urls expire, so the url is
 * derived on read. swapping local disk for an s3-compatible provider (r2, b2,
 * supabase, aws) means writing one more adapter, nothing above this port changes
 */
export interface FileStorage {
  upload(input: UploadFileInput): Promise<StoredFile>
  signedUrl(storageKey: string): Promise<string>
  delete(storageKey: string): Promise<void>
}
