export interface UploadFileInput {
  body: ArrayBuffer
  contentType: string
  originalName: string
}

export interface StoredFile {
  storageKey: string
  sizeBytes: number
}

// only the storageKey is persisted: signed urls expire, so the url is derived on read
export interface FileStorage {
  upload(input: UploadFileInput): Promise<StoredFile>
  signedUrl(storageKey: string): Promise<string>
  delete(storageKey: string): Promise<void>
}
