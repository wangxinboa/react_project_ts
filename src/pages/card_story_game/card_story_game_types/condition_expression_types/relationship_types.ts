import type { TargetRef } from "./target_ref.ts";

/** 有向关系边：source → target。 */
export interface RelationshipRef {
	source: TargetRef;
	target: TargetRef;
}
