// ============================================================
// 卡牌标签定义
// ============================================================
export interface TagItem {
	/** 标签的唯一标识符（正整数）。规则、卡牌模板将来都以 id 引用标签 */
	id: number;
	/** 标签的展示名（可重命名，不参与引用） */
	key: string;
	/** 标签的展示描述 */
	desc: string;
}

// ============================================================
// 动作参数
// ============================================================
// 项目开启了 erasableSyntaxOnly，不能用 enum；用 as const 对象提供同样的运行时常量
export const ActionParamType = {
	CARD: "card",
	NUMBER: "number",
} as const;

export type ActionParamType = (typeof ActionParamType)[keyof typeof ActionParamType];

export interface ActionParam {
	/** 参数名，在动作体里用 args.<name> 访问 */
	name: string;
	/** card 表示卡牌引用，number 表示数值 */
	type: ActionParamType;
	/** 仅 number 参数使用的默认值 */
	default?: number;
}

// ============================================================
// 全局动作库（allRules）
// ============================================================
export interface RuleAction {
	/** 全局唯一 id，模板通过 id 引用 */
	id: number;
	/** 动作协议标识，同一 verb 可以有多条动作 */
	verb: string;
	/** 动作参数声明 */
	params: ActionParam[];
	/** 目标选择 AST，后续定义 */
	targets: unknown[];
	/** 条件 AST，后续定义 */
	conditions: unknown[];
	/** 效果 AST，后续定义 */
	effects: unknown[];
}

// ============================================================
// 卡牌模板（类）
// ============================================================
export interface TemplateAttribute {
	name: string;
	value: number;
}

export interface CardTemplate {
	/** 模板的唯一 id */
	id: number;
	/** 展示名，可改名 */
	key: string;
	/** 初始标签 id */
	tags: number[];
	/** 字段初始值；字段类型定义在后续版本补 */
	attributes: TemplateAttribute[];
	/** 引用 allRules 中的动作 id，数组顺序即执行顺序 */
	auto: number[];
	outgoing: number[];
	incoming: number[];
}

// ============================================================
// 全局游戏配置
// ============================================================
export interface GameConfig {
	allTags: TagItem[];
	allRules: RuleAction[];
	cardTemplates: CardTemplate[];
}
