// 卡牌故事配置；当前只恢复标签，其他字段先原样保留，后续页面逐步补类型。
export interface TagItem {
	id: number;
	key: string;
	desc: string;
	createdAt: number;
}

export interface GameConfig {
	allTags: TagItem[];
	[key: string]: unknown;
}
