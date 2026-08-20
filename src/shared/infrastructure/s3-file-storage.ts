import { extname } from 'node:path'
import { S3Client } from 'bun'
import type { FileStorage, StoredFile, UploadFileInput } from '@/shared/domain/file-storage'

interface S3Config {
  bucket: string
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  region: string
  ttlSeconds: number
}

/**
 * works against any s3-compatible provider (r2, backblaze b2, supabase storage, aws)
 * by pointing endpoint somewhere else. uses bun's native S3Client, so no sdk is needed
 */
export class S3FileStorage implements FileStorage {
  private readonly client: S3Client

  constructor(private readonly config: S3Config) {
    this.client = new S3Client({
      bucket: config.bucket,
      endpoint: config.endpoint,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region,
    })
  }

  async upload({ body, contentType, originalName }: UploadFileInput): Promise<StoredFile> {
    const storageKey = `${crypto.randomUUID()}${extname(originalName).toLowerCase()}`

    await this.client.file(storageKey).write(body, { type: contentType })

    return { storageKey, sizeBytes: body.byteLength }
  }

  // the provider signs and serves the file itself, the api never streams bytes
  async signedUrl(storageKey: string): Promise<string> {
    return this.client.file(storageKey).presign({
      expiresIn: this.config.ttlSeconds,
      method: 'GET',
    })
  }

  async delete(storageKey: string): Promise<void> {
    await this.client.file(storageKey).delete()
  }
}
