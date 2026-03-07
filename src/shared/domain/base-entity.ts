import type { ResourceStatus } from '@gen/enums'

export interface BaseEntity {
  id: string
  status: ResourceStatus
  createdAt: Date
  updatedAt: Date
}
