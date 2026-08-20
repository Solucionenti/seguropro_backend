import { mkdir, unlink } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { AppError } from '@/shared/domain/app-error'
import type { FileStorage, StoredFile, UploadFileInput } from '@/shared/domain/file-storage'

interface LocalDiskConfig {
  dir: string
  apiUrl: string
  secret: string
  ttlSeconds: number
}

// flat uuid keys: no directories means no path traversal to defend against
const KEY_PATTERN = /^[0-9a-f-]{36}(\.[a-z0-9]{1,12})?$/i

export class LocalDiskFileStorage implements FileStorage {
  // imported once: listing a page of files signs one url per row
  private hmacKey?: Promise<CryptoKey>

  constructor(private readonly config: LocalDiskConfig) {}

  async upload({ body, originalName }: UploadFileInput): Promise<StoredFile> {
    const storageKey = `${crypto.randomUUID()}${extname(originalName).toLowerCase()}`

    await mkdir(this.config.dir, { recursive: true })
    await Bun.write(this.pathFor(storageKey), body)

    return { storageKey, sizeBytes: body.byteLength }
  }

  async signedUrl(storageKey: string): Promise<string> {
    const expiresAt = Math.floor(Date.now() / 1000) + this.config.ttlSeconds
    const signature = await this.sign(storageKey, expiresAt)

    return `${this.config.apiUrl}/api/v1/files/${storageKey}?expires=${expiresAt}&signature=${signature}`
  }

  async delete(storageKey: string): Promise<void> {
    this.assertKey(storageKey)
    try {
      await unlink(this.pathFor(storageKey))
    } catch {
      // already gone, the db row is the source of truth
    }
  }

  async verifySignature(storageKey: string, expires: number, signature: string): Promise<boolean> {
    if (!KEY_PATTERN.test(storageKey)) return false
    if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) return false

    const expected = await this.sign(storageKey, expires)
    return timingSafeEqual(expected, signature)
  }

  async read(storageKey: string): Promise<ArrayBuffer | null> {
    this.assertKey(storageKey)

    const file = Bun.file(this.pathFor(storageKey))
    if (!(await file.exists())) return null

    return file.arrayBuffer()
  }

  private pathFor(storageKey: string): string {
    return join(this.config.dir, storageKey)
  }

  private assertKey(storageKey: string): void {
    if (!KEY_PATTERN.test(storageKey)) {
      throw new AppError('Invalid storage key', 400, 'INVALID_STORAGE_KEY')
    }
  }

  private async sign(storageKey: string, expiresAt: number): Promise<string> {
    this.hmacKey ??= crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(this.config.secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )

    const mac = await crypto.subtle.sign(
      'HMAC',
      await this.hmacKey,
      new TextEncoder().encode(`${storageKey}:${expiresAt}`),
    )

    return Buffer.from(mac).toString('base64url')
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false

  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}
