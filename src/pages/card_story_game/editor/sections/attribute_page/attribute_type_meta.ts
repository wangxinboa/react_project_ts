import { AttributeType } from "../../../card_story_game_types/index.ts";

/** 属性类型的中文名称，表格和下拉共用。 */
export const AttributeTypeLabel: Record<AttributeType, string> = {
	[AttributeType.BASE_NUMBER]: "基础数值",
	[AttributeType.DERIVED_NUMBER]: "派生数值",
	[AttributeType.CARD_REF]: "卡牌引用",
	[AttributeType.CARD_REF_LIST]: "卡牌引用列表",
	[AttributeType.RELATIONSHIP_NUMBER]: "关系数值",
};

/** 属性类型下拉选项。 */
export const AttributeTypeOptions = [
	{
		value: AttributeType.BASE_NUMBER,
		label: AttributeTypeLabel[AttributeType.BASE_NUMBER],
	},
	{
		value: AttributeType.DERIVED_NUMBER,
		label: AttributeTypeLabel[AttributeType.DERIVED_NUMBER],
	},
	{
		value: AttributeType.CARD_REF,
		label: AttributeTypeLabel[AttributeType.CARD_REF],
	},
	{
		value: AttributeType.CARD_REF_LIST,
		label: AttributeTypeLabel[AttributeType.CARD_REF_LIST],
	},
	{
		value: AttributeType.RELATIONSHIP_NUMBER,
		label: AttributeTypeLabel[AttributeType.RELATIONSHIP_NUMBER],
	},
];
