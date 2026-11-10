import type { NumberExpression } from "../formula_types.ts";

/** 数值比较条件的公共部分。 */
export interface BaseNumberCheck {
	gt?: NumberExpression;
	gte?: NumberExpression;
	lt?: NumberExpression;
	lte?: NumberExpression;
	eq?: NumberExpression;
}
