// the cap is per company and spans every file table, so usage is summed across all
export interface StorageQuota {
  assertCanStore(companyId: string, incomingBytes: number): Promise<void>
}
