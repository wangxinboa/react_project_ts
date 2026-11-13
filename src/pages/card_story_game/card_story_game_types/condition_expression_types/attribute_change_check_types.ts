import type { BaseNumberCheck } from "./base_number_check_types.ts";

/** 反应中可读取的属性变化。 */
export interface AttributeChangeCheck {
	attributeId: number;
	/** 变化前属性是否存在 */
	oldExists?: boolean;
	/** 变化后属性是否存在 */
	newExists?: boolean;
	/** 变化前值 */
	oldValue?: BaseNumberCheck;
	/** 变化后值 */
	newValue?: BaseNumberCheck;
}
