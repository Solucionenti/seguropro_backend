export interface SuscripcionProvider {
  findById(id: string): Promise<{ id: string; companyId: string } | null>
  updateFechaProximoPago(id: string, fecha: Date): Promise<void>
}
