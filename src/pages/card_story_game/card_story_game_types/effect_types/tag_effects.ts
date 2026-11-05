/** 给目标添加标签实例。 */
export type AddTagEffect = {
	kind: "addTag";
	tagId: number;
};

/** 从目标移除标签实例。 */
export type RemoveTagEffect = {
	kind: "removeTag";
	tagId: number;
};
