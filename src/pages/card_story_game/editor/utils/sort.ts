export function compareByCreatedAtDesc<T extends { createdAt: number; id: number }>(a: T, b: T): number {
	return b.createdAt - a.createdAt || b.id - a.id;
}
