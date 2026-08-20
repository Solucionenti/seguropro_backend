/**
 * the plan storage cap is per company and spans every kind of file, so the usage
 * has to be summed across all file tables. keeping this in one port is what stops
 * a company from going over its plan by splitting uploads between polizas and
 * siniestros
 */
export interface StorageQuota {
  assertCanStore(companyId: string, incomingBytes: number): Promise<void>
}
