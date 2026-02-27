export interface HealthRepository {
  checkDatabaseConnection(): Promise<boolean>
}
