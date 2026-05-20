export type SortDirection = 'asc' | 'desc'

export interface Sort {
  field: string
  direction: SortDirection
}

export class Pageable {
  constructor(
    readonly page: number,
    readonly pageSize: number,
    readonly sort: readonly Sort[] = [],
  ) {}

  get skip(): number {
    return (this.page - 1) * this.pageSize
  }

  get take(): number {
    return this.pageSize
  }

  get orderBy(): Array<Record<string, SortDirection>> {
    if (this.sort.length === 0) return [{ createdAt: 'desc' }]
    return this.sort.map((s) => ({ [s.field]: s.direction }))
  }

  static of(page: number, pageSize: number, sort?: readonly Sort[]): Pageable {
    return new Pageable(page, pageSize, sort ?? [])
  }
}

export class Page<T> {
  constructor(
    readonly content: readonly T[],
    readonly total: number,
    readonly page: number,
    readonly pageSize: number,
  ) {}

  get totalPages(): number {
    if (this.total === 0) return 0
    return Math.ceil(this.total / this.pageSize)
  }

  get hasNext(): boolean {
    return this.page < this.totalPages
  }

  get hasPrevious(): boolean {
    return this.page > 1 && this.total > 0
  }

  get isEmpty(): boolean {
    return this.content.length === 0
  }

  map<U>(fn: (item: T) => U): Page<U> {
    return new Page(this.content.map(fn), this.total, this.page, this.pageSize)
  }

  static of<T>(content: readonly T[], total: number, pageable: Pageable): Page<T> {
    return new Page(content, total, pageable.page, pageable.pageSize)
  }

  static empty<T>(pageable: Pageable): Page<T> {
    return new Page<T>([], 0, pageable.page, pageable.pageSize)
  }
}
