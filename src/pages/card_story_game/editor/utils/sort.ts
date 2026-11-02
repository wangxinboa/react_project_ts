export function compareByCreatedAtDesc<T extends { createdAt?: number; id: number }>(a: T, b: T): number {
	return (b.createdAt ?? 0) - (a.createdAt ?? 0) || b.id - a.id;
}
