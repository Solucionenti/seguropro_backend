import type { PasswordHasher } from '@/shared/domain/password-hasher'

export class BunPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return Bun.password.hash(password, {
      algorithm: 'argon2id',
      memoryCost: 65536,
      timeCost: 3,
    })
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return Bun.password.verify(password, hash)
  }
}
