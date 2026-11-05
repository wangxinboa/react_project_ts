/** 改变卡牌所在地点。 */
export type ChangeLocationEffect = {
	kind: "changeLocation";
	toLocation: string;
};
