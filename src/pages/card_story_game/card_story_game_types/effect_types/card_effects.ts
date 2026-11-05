/** sourceBackpack：进入执行者背包；sourceLocation：生成在执行者当前地点。 */
export type AddCardDestination = "sourceBackpack" | "sourceLocation";
/** 生成一张新卡；默认进入执行者背包。 */
export type AddCardEffect = {
	kind: "addCard";
	templateId: number;
	to?: AddCardDestination;
};

/** 从场景中移除目标卡。 */
export type RemoveCardEffect = {
	kind: "removeCard";
};
