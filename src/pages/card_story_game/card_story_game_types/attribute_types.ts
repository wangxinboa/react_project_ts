import type { Formula } from "./formula_types.ts";

/** 属性值：number / cardRef / cardRefList。 */
export type AttributeValue = number | string | string[];

/** 属性种类：同时表达存储位置、计算方式和值类型。 */
export const AttributeType = {
	BASE_NUMBER: "baseNumber",
	DERIVED_NUMBER: "derivedNumber",
	CARD_REF: "cardRef",
	CARD_REF_LIST: "cardRefList",
	RELATIONSHIP_NUMBER: "relationshipNumber",
} as const;

export type AttributeType = (typeof AttributeType)[keyof typeof AttributeType];

/** 模板/标签上的属性初始绑定。 */
export interface AttributeBinding {
	id: number;
	value: AttributeValue;
}

interface AttributeDefinitionBase {
	id: number;
	key: string;
	label?: string;
	desc: string;
}

/** 全局属性定义，卡牌模板和标签共用。 */
export type AttributeDefinition =
	| (AttributeDefinitionBase & {
		type: typeof AttributeType.BASE_NUMBER;
	})
	| (AttributeDefinitionBase & {
		type: typeof AttributeType.DERIVED_NUMBER;
		formula: Formula;
	})
	| (AttributeDefinitionBase & {
		type: typeof AttributeType.CARD_REF;
	})
	| (AttributeDefinitionBase & {
		type: typeof AttributeType.CARD_REF_LIST;
	})
	| (AttributeDefinitionBase & {
		type: typeof AttributeType.RELATIONSHIP_NUMBER;
	});
