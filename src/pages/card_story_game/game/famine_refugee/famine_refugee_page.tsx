import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, ConfigProvider, Popover } from "antd";
import { editorTheme } from "../../editor/editor_theme.ts";
import { CardType } from "../../card_story_game_types/index.ts";
import type { DragEvent } from "react";

import { serviceGetFamineRefugeeConfig } from "../../../../services/famine_refugee.ts";
import { getNumberAttribute, getStringAttribute, getStringListAttribute } from "./attribute_value.ts";
import {
	applyAction,
	createInitialState,
	deriveCard,
	getActionTimeCost,
	getEligibleCards,
	getPlayerCard,
	getSlotRange,
	getIncomingActions,
	getVisibleActions,
	getVisibleCards,
	applyIncomingAction,
	previewAction,
	getDialogueOptions,
	chooseDialogueOption,
	advanceDialogue,
	getDialogueSpeakerCard,
} from "./famine_refugee_engine.ts";
import type {
	ActionSlot,
	CardDerived,
	CardState,
	FamineAction,
	FamineRefugeeConfig,
	FamineState,
	FamineTag,
} from "./famine_refugee_types.ts";

import style from "./famine_refugee_page.module.scss";

function getTagLabel(tags: FamineTag[], id: number): string {
	for (let i = 0; i < tags.length; i++) if (tags[i].id === id) return tags[i].key;
	return `#${id}`;
}

function getAttributeLabel(config: FamineRefugeeConfig, id: number): string {
	for (let i = 0; i < config.allAttributes.length; i++)
		if (config.allAttributes[i].id === id) return config.allAttributes[i].label;
	return `#${id}`;
}

const SYSTEM_ATTRIBUTE_KEYS = new Set([
	"location",
	"carrier",
	"backpack",
	"baseCarryCapacity",
	"capacityBonus",
	"backpackCount",
	"carryCapacity",
	"weight",
	"baseCarrySlots",
	"slotBonus",
	"carrySlots",
]);

function isDisplayedAttribute(config: FamineRefugeeConfig, id: number): boolean {
	for (let i = 0; i < config.allAttributes.length; i++) {
		const definition = config.allAttributes[i];
		if (definition.id !== id) continue;
		return !definition.key.endsWith("Max") && !SYSTEM_ATTRIBUTE_KEYS.has(definition.key);
	}
	return false;
}

function getAttributeMaxValue(config: FamineRefugeeConfig, id: number, values: Record<number, number>): number | null {
	const definition = config.allAttributes.find((attribute) => attribute.id === id);
	if (!definition || definition.key.endsWith("Max")) return null;
	const maxDefinition = config.allAttributes.find((attribute) => attribute.key === `${definition.key}Max`);
	if (!maxDefinition) return null;
	return values[maxDefinition.id] ?? null;
}

function getAttributeId(config: FamineRefugeeConfig, key: string): number {
	for (let i = 0; i < config.allAttributes.length; i++) {
		if (config.allAttributes[i].key === key) return config.allAttributes[i].id;
	}
	return 0;
}

function getAction(config: FamineRefugeeConfig, id: number | null): FamineAction | null {
	if (id === null) return null;
	for (let i = 0; i < config.allActions.length; i++) if (config.allActions[i].id === id) return config.allActions[i];
	return null;
}

function formatClock(time: number): string {
	const day = Math.floor(time / 1440) + 1;
	const minutesOfDay = time % 1440;
	const hour = Math.floor(minutesOfDay / 60);
	const minute = minutesOfDay % 60;
	return `第 ${day} 天 ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatDuration(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (hours === 0) return `${rest} 分钟`;
	if (rest === 0) return `${hours} 小时`;
	return `${hours} 小时 ${rest} 分`;
}

interface CardView {
	card: CardState;
	derived: CardDerived;
}

export default function FamineRefugeePage() {
	const [config, setConfig] = useState<FamineRefugeeConfig | null>(null);
	const [game, setGame] = useState<FamineState | null>(null);
	const [selectedCardId, setSelectedCardId] = useState("");
	const [placementActionId, setPlacementActionId] = useState<number | null>(null);
	const [slotAssignments, setSlotAssignments] = useState<Record<string, string[]>>({});
	const [activeSlotId, setActiveSlotId] = useState("");
	const [loadError, setLoadError] = useState("");
	const [previewTitle, setPreviewTitle] = useState("");
	const [previewLines, setPreviewLines] = useState<string[]>([]);

	useEffect(() => {
		let cancelled = false;
		async function loadConfig() {
			try {
				const loaded = await serviceGetFamineRefugeeConfig();
				if (!cancelled) {
					setConfig(loaded);
					setGame(createInitialState(loaded));
					setSelectedCardId(loaded.saveData.playerCardId);
				}
			} catch (error) {
				if (!cancelled) setLoadError(error instanceof Error ? error.message : "原型配置加载失败");
			}
		}
		void loadConfig();
		return () => {
			cancelled = true;
		};
	}, []);

	const cardViews = useMemo<CardView[]>(() => {
		if (!config || !game) return [];
		const views: CardView[] = [];
		for (let i = 0; i < game.cards.length; i++)
			views.push({ card: game.cards[i], derived: deriveCard(config, game.cards[i], game.cards) });
		return views;
	}, [config, game]);

	const sceneViews = useMemo(() => {
		if (!config || !game) return [];
		const visible = getVisibleCards(config, game);
		const ids = new Set<string>();
		for (let i = 0; i < visible.length; i++) ids.add(visible[i].id);
		const views: CardView[] = [];
		for (let i = 0; i < cardViews.length; i++) {
			if (ids.has(cardViews[i].card.id)) views.push(cardViews[i]);
		}
		return views;
	}, [cardViews, config, game]);

	const playerView = useMemo(() => {
		if (!config || !game) return null;
		const player = getPlayerCard(config, game);
		return player ? (cardViews.find((view) => view.card.id === player.id) ?? null) : null;
	}, [config, game, cardViews]);

	const selectedView = useMemo(() => {
		return cardViews.find((view) => view.card.id === selectedCardId) ?? playerView;
	}, [cardViews, selectedCardId, playerView]);

	const sharedAgreements = useMemo(() => {
		if (!config || !game || !playerView || !selectedView || selectedView.card.id === playerView.card.id) return [];
		return Object.values(game.agreements)
			.filter((agreement) => agreement.participants.includes(playerView.card.id) && agreement.participants.includes(selectedView.card.id))
			.map((agreement) => config.allAgreements.find((definition) => definition.id === agreement.definitionId))
			.filter((definition): definition is NonNullable<typeof definition> => Boolean(definition));
	}, [config, game, playerView, selectedView]);

	const backpackViews = useMemo(() => {
		if (!config || !playerView) return [];
		const ids = getStringListAttribute(playerView.card.values, getAttributeId(config, "backpack"));
		const views: CardView[] = [];
		for (let i = 0; i < ids.length; i++) {
			const view = cardViews.find((item) => item.card.id === ids[i]);
			if (view) views.push(view);
		}
		return views;
	}, [config, cardViews, playerView]);

	const currentLocationName = useMemo(() => {
		if (!config || !playerView) return "未知地点";
		const locationAttribute = config.allAttributes.find((attribute) => attribute.key === "location");
		if (!locationAttribute) return "未知地点";
		const locationId = getStringAttribute(playerView.card.values, locationAttribute.id);
		if (!locationId) return "未知地点";
		const place = cardViews.find((view) => view.card.id === locationId);
		return place?.derived.template.key ?? "未知地点";
	}, [cardViews, config, playerView]);

	const dialogueDefinition = useMemo(() => {
		if (!config || !game?.dialogue) return null;
		return config.allDialogues.find((dialogue) => dialogue.id === game.dialogue?.dialogueId) ?? null;
	}, [config, game]);

	const dialogueNode = useMemo(() => {
		if (!dialogueDefinition || !game?.dialogue) return null;
		return dialogueDefinition.nodes.find((node) => node.id === game.dialogue?.nodeId) ?? null;
	}, [dialogueDefinition, game]);

	const dialogueOptions = useMemo(() => {
		return config && game?.dialogue ? getDialogueOptions(config, game) : [];
	}, [config, game]);

	const dialogueSpeaker = useMemo(() => {
		return game?.dialogue && dialogueNode ? getDialogueSpeakerCard(game, dialogueNode.speaker) : null;
	}, [game, dialogueNode]);

	const dialogueSpeakerName = useMemo(() => {
		if (!dialogueSpeaker) return "旁白";
		return cardViews.find((view) => view.card.id === dialogueSpeaker.id)?.derived.template.key ?? dialogueSpeaker.id;
	}, [dialogueSpeaker, cardViews]);

	const visibleActions = useMemo(() => {
		return config && game ? getVisibleActions(config, game) : [];
	}, [config, game]);

	const incomingActions = useMemo(() => {
		if (!config || !game || selectedCardId === config.saveData.playerCardId) return [];
		return getIncomingActions(config, game, selectedCardId);
	}, [config, game, selectedCardId]);

	const placementAction = useMemo(() => {
		return config ? getAction(config, placementActionId) : null;
	}, [config, placementActionId]);

	const slotEligible = useMemo(() => {
		const result: Record<string, CardState[]> = {};
		if (!config || !game || !placementAction) return result;
		for (let i = 0; i < (placementAction.slots ?? []).length; i++) {
			const slot = (placementAction.slots ?? [])[i];
			result[slot.id] = getEligibleCards(config, game, placementAction, slot.id);
		}
		return result;
	}, [config, game, placementAction]);

	const assignedCardIds = useMemo(() => {
		const ids = new Set<string>();
		const keys = Object.keys(slotAssignments);
		for (let i = 0; i < keys.length; i++) {
			for (let j = 0; j < slotAssignments[keys[i]].length; j++) ids.add(slotAssignments[keys[i]][j]);
		}
		return ids;
	}, [slotAssignments]);

	const gridViews = useMemo(() => {
		if (placementActionId === null) return sceneViews;
		const candidates = [...sceneViews, ...backpackViews];
		const views: CardView[] = [];
		for (let i = 0; i < candidates.length; i++) {
			if (!assignedCardIds.has(candidates[i].card.id)) views.push(candidates[i]);
		}
		return views;
	}, [sceneViews, backpackViews, placementActionId, assignedCardIds]);

	const activeSlot = useMemo(() => {
		if (!placementAction) return null;
		for (let i = 0; i < (placementAction.slots ?? []).length; i++) {
			if ((placementAction.slots ?? [])[i].id === activeSlotId) return (placementAction.slots ?? [])[i];
		}
		return (placementAction.slots ?? [])[0] ?? null;
	}, [placementAction, activeSlotId]);

	const canExecute = useMemo(() => {
		if (!placementAction || !config || !playerView || !game) return false;
		for (let i = 0; i < (placementAction.slots ?? []).length; i++) {
			const slot = (placementAction.slots ?? [])[i];
			const range = getSlotRange(config, slot, playerView.card, game.cards);
			if (!range.valid) return false;
			const count = (slotAssignments[slot.id] ?? []).length;
			if (count < range.min || count > range.max) return false;
		}
		return true;
	}, [placementAction, slotAssignments, config, playerView, game]);

	const handleActionClick = useCallback(
		(action: FamineAction) => {
			if ((action.slots ?? []).length > 0) {
				setPlacementActionId(action.id);
				setSlotAssignments({});
				setActiveSlotId((action.slots ?? [])[0]?.id ?? "");
				return;
			}
			if (!config) return;
			setGame((prev) => (prev ? applyAction(config, prev, action.id) : prev));
		},
		[config],
	);

	const handleIncomingAction = useCallback(
		(actionId: number) => {
			if (!config) return;
			setGame((prev) => (prev ? applyIncomingAction(config, prev, selectedCardId, actionId) : prev));
			setSelectedCardId(config.saveData.playerCardId);
			setPlacementActionId(null);
			setSlotAssignments({});
		},
		[config, selectedCardId],
	);

	const handlePreview = useCallback(
		(action: FamineAction, targetId?: string, assignments: Record<string, string[]> = {}) => {
			if (!config || !game) return;
			setPreviewTitle(action.title);
			setPreviewLines(previewAction(config, game, action.id, targetId, assignments));
		},
		[config, game],
	);

	const clearPreview = useCallback(() => {
		setPreviewTitle("");
		setPreviewLines([]);
	}, []);

	const addToSlot = useCallback(
		(slotId: string, cardId: string) => {
			if (!placementAction) return;
			const slot = (placementAction.slots ?? []).find((item) => item.id === slotId);
			if (!slot) return;
			if (!config || !playerView || !game) return;
			const range = getSlotRange(config, slot, playerView.card, game.cards);
			setSlotAssignments((prev) => {
				const current = prev[slotId] ?? [];
				if (current.includes(cardId) || current.length >= range.max) return prev;
				const next: Record<string, string[]> = {};
				const keys = Object.keys(prev);
				for (let i = 0; i < keys.length; i++) {
					next[keys[i]] = prev[keys[i]].filter((id) => id !== cardId);
				}
				next[slotId] = [...current, cardId];
				return next;
			});
			setActiveSlotId(slotId);
		},
		[placementAction, config, playerView, game],
	);

	const handleCardClick = useCallback(
		(cardId: string) => {
			if (placementAction) {
				if (!config || !game || !playerView) return;
				const preferred = activeSlot;
				if (preferred) {
					const eligible = slotEligible[preferred.id] ?? [];
					const range = getSlotRange(config, preferred, playerView.card, game.cards);
					const assigned = slotAssignments[preferred.id] ?? [];
					for (let i = 0; i < eligible.length; i++) {
						if (eligible[i].id === cardId && assigned.length < range.max) {
							addToSlot(preferred.id, cardId);
							return;
						}
					}
				}
				for (let i = 0; i < (placementAction.slots ?? []).length; i++) {
					const slot = (placementAction.slots ?? [])[i];
					const eligible = slotEligible[slot.id] ?? [];
					const range = getSlotRange(config, slot, playerView.card, game.cards);
					const assigned = slotAssignments[slot.id] ?? [];
					for (let j = 0; j < eligible.length; j++) {
						if (eligible[j].id === cardId && assigned.length < range.max) {
							addToSlot(slot.id, cardId);
							return;
						}
					}
				}
				return;
			}
			setSelectedCardId(cardId);
		},
		[activeSlot, addToSlot, config, game, placementAction, playerView, slotAssignments, slotEligible],
	);

	const handleDrop = useCallback(
		(event: DragEvent<HTMLDivElement>, slotId: string) => {
			event.preventDefault();
			const cardId = event.dataTransfer.getData("text/plain");
			if (!cardId) return;
			const eligible = slotEligible[slotId] ?? [];
			for (let i = 0; i < eligible.length; i++) {
				if (eligible[i].id === cardId) {
					addToSlot(slotId, cardId);
					break;
				}
			}
		},
		[addToSlot, slotEligible],
	);

	const handleDragStart = useCallback(
		(event: DragEvent<HTMLButtonElement>, cardId: string) => {
			if (!placementAction) {
				event.preventDefault();
				return;
			}
			let canDrag = false;
			for (let i = 0; i < (placementAction.slots ?? []).length; i++) {
				const eligible = slotEligible[(placementAction.slots ?? [])[i].id] ?? [];
				for (let j = 0; j < eligible.length; j++) {
					if (eligible[j].id === cardId) {
						canDrag = true;
						break;
					}
				}
				if (canDrag) break;
			}
			if (!canDrag) {
				event.preventDefault();
				return;
			}
			event.dataTransfer.setData("text/plain", cardId);
			event.dataTransfer.effectAllowed = "move";
		},
		[placementAction, slotEligible],
	);

	const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
	}, []);

	const handleRemoveFromSlot = useCallback((slotId: string, cardId: string) => {
		setSlotAssignments((prev) => ({ ...prev, [slotId]: (prev[slotId] ?? []).filter((id) => id !== cardId) }));
	}, []);

	const handleExecute = useCallback(() => {
		if (!config || placementActionId === null || !canExecute) return;
		setGame((prev) => (prev ? applyAction(config, prev, placementActionId, slotAssignments) : prev));
		setPlacementActionId(null);
		setSlotAssignments({});
		setActiveSlotId("");
	}, [canExecute, config, placementActionId, slotAssignments]);

	const handleCancelPlacement = useCallback(() => {
		setPlacementActionId(null);
		setSlotAssignments({});
		setActiveSlotId("");
	}, []);

	const handleSelectCard = useCallback((cardId: string) => {
		setSelectedCardId(cardId);
		setPlacementActionId(null);
		setSlotAssignments({});
		setActiveSlotId("");
	}, []);

	const handleReset = useCallback(() => {
		if (!config) return;
		setGame(createInitialState(config));
		setSelectedCardId(config.saveData.playerCardId);
		setPlacementActionId(null);
		setSlotAssignments({});
		setActiveSlotId("");
	}, [config]);

	if (loadError) return <div className={style.loading}>{loadError}</div>;
	if (!config || !game || !playerView || !selectedView) return <div className={style.loading}>正在加载原型配置…</div>;

	const isPlayerSelected = selectedView.card.id === config.saveData.playerCardId;
	const isDead = playerView.derived.gameOver;
	const backpackIds = getStringListAttribute(playerView.card.values, getAttributeId(config, "backpack"));
	let backpackWeight = 0;
	for (let i = 0; i < backpackIds.length; i++) {
		const item = cardViews.find((view) => view.card.id === backpackIds[i]);
		if (item) backpackWeight += getNumberAttribute(item.card.values, getAttributeId(config, "weight"));
	}

	const previewContent = (
		<div className={style.actionPreview}>
			<div className={style.actionPreviewTitle}>{previewTitle}</div>
			{previewLines.map((line, index) => (
				<div key={`${line}-${index}`}>{line}</div>
			))}
		</div>
	);

	const isEligible = (cardId: string): boolean => {
		if (!placementAction) return false;
		for (let i = 0; i < (placementAction.slots ?? []).length; i++) {
			const eligible = slotEligible[(placementAction.slots ?? [])[i].id] ?? [];
			for (let j = 0; j < eligible.length; j++) if (eligible[j].id === cardId) return true;
		}
		return false;
	};

	const getSlotCards = (slot: ActionSlot): CardView[] => {
		const ids = slotAssignments[slot.id] ?? [];
		const views: CardView[] = [];
		for (let i = 0; i < ids.length; i++) {
			for (let j = 0; j < cardViews.length; j++) {
				if (cardViews[j].card.id === ids[i]) {
					views.push(cardViews[j]);
					break;
				}
			}
		}
		return views;
	};

	return (
		<ConfigProvider theme={editorTheme}>
			<div className={style.gamePage}>
				<header className={style.tableHeader}>
					<button
						type="button"
						className={`${style.playerAvatar} ${isPlayerSelected ? style.playerAvatarActive : ""}`}
						onClick={() => handleSelectCard(config.saveData.playerCardId)}
					>
						<span className={style.avatarPortrait}>{playerView.derived.template.key.slice(0, 1)}</span>
					</button>
					<div className={style.topAttributes}>
						{(playerView.derived.template.attributes ?? [])
							.filter((binding) => isDisplayedAttribute(config, binding.id))
							.map((binding) => (
								<div key={binding.id} className={style.topAttribute}>
									<span>{getAttributeLabel(config, binding.id)}</span>
									<strong>
										{Math.round(playerView.derived.values[binding.id] ?? 0)}
										{getAttributeMaxValue(config, binding.id, playerView.derived.values) !== null
											? ` / ${Math.round(getAttributeMaxValue(config, binding.id, playerView.derived.values) ?? 0)}`
											: ""}
									</strong>
								</div>
							))}
						<div className={style.topAttribute}>
							<span>负重</span>
							<strong>
								{backpackWeight} / {Math.round(playerView.derived.values[getAttributeId(config, "carryCapacity")] ?? 0)}
							</strong>
						</div>
						<div className={style.topAttribute}>
							<span>背包</span>
							<strong>
								{backpackIds.length} / {Math.round(playerView.derived.values[getAttributeId(config, "carrySlots")] ?? 0)}
							</strong>
						</div>
					</div>
					<div className={style.headerActions}>
						<span className={style.locationName}>{currentLocationName}</span>
						<span className={style.clock}>{formatClock(game.time)}</span>
						<button type="button" className={style.resetButton} onClick={handleReset}>
							重置
						</button>
					</div>
				</header>

				<div className={style.tableLayout}>
					<section className={style.cardGrid} aria-label="场景卡牌">
						{gridViews.map((view) => {
							const eligible = placementAction !== null && isEligible(view.card.id);
							const dimmed = placementAction !== null && !eligible;
							return (
								<button
									key={view.card.id}
									type="button"
									className={`${style.cardTile} ${selectedCardId === view.card.id ? style.cardTileSelected : ""} ${eligible ? style.cardTileEligible : ""} ${dimmed ? style.cardTileDimmed : ""}`}
									onClick={() => handleCardClick(view.card.id)}
									draggable={eligible}
									onDragStart={(event) => handleDragStart(event, view.card.id)}
								>
									<div className={style.cardTileTop}>
										<span className={style.cardTileName}>{view.derived.template.key}</span>
									</div>
									<div className={style.cardTileDesc}>{view.derived.template.desc}</div>
									<div className={style.cardTileTags}>
										{view.derived.tagIds.length === 0 ? (
											<span className={style.cardTileEmpty}>无标签</span>
										) : (
											view.derived.tagIds.map((tagId) => (
												<span key={tagId} className={style.cardTileTag}>
													{getTagLabel(config.allTags, tagId)}
												</span>
											))
										)}
									</div>
									{eligible ? <span className={style.cardTileHint}>放入 {activeSlot?.desc ?? "卡槽"}</span> : null}
								</button>
							);
						})}
					</section>

					<aside className={style.inspector}>
						<div className={style.inspectorHeader}>
							<div>
								<div className={style.inspectorName}>{selectedView.derived.template.key}</div>
								<div className={style.inspectorDesc}>{selectedView.derived.template.desc}</div>
							</div>
						</div>

						<div className={style.tags}>
							{selectedView.derived.tagIds.length === 0 ? (
								<span className={style.emptyTag}>暂无异常</span>
							) : (
								selectedView.derived.tagIds.map((tagId) => (
									<span key={tagId} className={style.tag}>
										{getTagLabel(config.allTags, tagId)}
									</span>
								))
							)}
						</div>

						{!isPlayerSelected ? (
							<div className={style.attributeList}>
								{(selectedView.derived.template.attributes ?? []).filter((binding) =>
									isDisplayedAttribute(config, binding.id),
								).length === 0 ? (
									<div className={style.emptyAttributes}>这张卡没有数值属性。</div>
								) : (
									(selectedView.derived.template.attributes ?? [])
										.filter((binding) => isDisplayedAttribute(config, binding.id))
										.map((binding) => {
											const value = selectedView.derived.values[binding.id] ?? 0;
											const max = getAttributeMaxValue(config, binding.id, selectedView.derived.values);
											const width = max !== null && max > 0 ? Math.min(100, (value / max) * 100) : value;
											return (
												<div key={binding.id} className={style.attributeRow}>
													<div className={style.attributeHeader}>
														<span>{getAttributeLabel(config, binding.id)}</span>
														<span>{Math.round(value)}{max !== null ? ` / ${Math.round(max)}` : ""}</span>
													</div>
													<div className={style.bar}>
														<div className={style.barFill} style={{ width: `${width}%` }} />
													</div>
												</div>
											);
										})
								)}
							</div>
						) : null}

						{placementAction ? (
							<div className={style.targetPanel}>
								<div className={style.inspectorSectionTitle}>卡槽 · {placementAction.title}</div>
								<div className={style.slotList}>
									{(placementAction.slots ?? []).map((slot) => {
										const range = getSlotRange(config, slot, playerView.card, game.cards);
										const assigned = getSlotCards(slot);
										const active = activeSlot?.id === slot.id;
										return (
											<div
												key={slot.id}
												className={`${style.slotCard} ${active ? style.slotCardActive : ""}`}
												onClick={() => setActiveSlotId(slot.id)}
											>
												<div className={style.slotHeader}>
													<span className={style.slotTitle}>{slot.desc}</span>
													<span className={style.slotCount}>
														{assigned.length}/{range.max === Number.POSITIVE_INFINITY ? "∞" : range.max}
													</span>
												</div>
												<div
													className={style.slotDropZone}
													onDragOver={handleDragOver}
													onDrop={(event) => handleDrop(event, slot.id)}
												>
													{assigned.length === 0 ? (
														<span className={style.slotEmpty}>拖入卡牌</span>
													) : (
														assigned.map((view) => (
															<button
																key={view.card.id}
																type="button"
																className={style.targetSlot}
																onClick={(event) => {
																	event.stopPropagation();
																	handleRemoveFromSlot(slot.id, view.card.id);
																}}
															>
																{view.derived.template.key} ×
															</button>
														))
													)}
												</div>
											</div>
										);
									})}
								</div>
								<div className={style.targetHint}>
									{canExecute
										? `卡槽已满足 · ${formatDuration(getActionTimeCost(config, placementAction, playerView.card, slotAssignments, game.cards))}`
										: "把符合条件的卡放入对应卡槽"}
								</div>
								<div className={style.targetActions}>
									<button type="button" className={style.cancelPlacement} onClick={handleCancelPlacement}>
										取消
									</button>
									{canExecute ? (
										<Popover
											trigger="hover"
											placement="left"
											onOpenChange={(open) => {
												if (open) handlePreview(placementAction, undefined, slotAssignments);
												else clearPreview();
											}}
											content={previewContent}
										>
											<button type="button" className={style.executePlacement} onClick={handleExecute}>
												执行 {placementAction.title}
											</button>
										</Popover>
									) : null}
								</div>
							</div>
						) : isPlayerSelected ? (
							<>
								<div className={style.inspectorSectionTitle}>背包</div>
								<div className={style.backpackList}>
									{backpackIds.length === 0 ? (
										<span className={style.emptyTag}>背包为空</span>
									) : (
										backpackIds.map((itemId) => {
											const item = cardViews.find((view) => view.card.id === itemId);
											if (!item) return null;
											return (
												<button
													key={itemId}
													type="button"
													className={style.backpackItem}
													onClick={() => setSelectedCardId(itemId)}
												>
													{item.derived.template.key} · {getNumberAttribute(item.card.values, getAttributeId(config, "weight"))}
												</button>
											);
										})
									)}
								</div>
								<div className={style.inspectorSectionTitle}>玩家行动</div>
								<div className={style.actions}>
									{visibleActions.map((action) => {
										const actionButton = (
											<button
												type="button"
												className={style.actionButton}
												onClick={() => handleActionClick(action)}
												disabled={isDead}
											>
												<span>{action.title}</span>
												<small>
													{action.verb} ·{" "}
													{formatDuration(getActionTimeCost(config, action, playerView.card, {}, game.cards))}
												</small>
											</button>
										);
										if ((action.slots ?? []).length > 0) {
											return <button key={action.id} type="button" className={style.actionButton} onClick={() => handleActionClick(action)} disabled={isDead}><span>{action.title}</span><small>{action.verb} · {formatDuration(getActionTimeCost(config, action, playerView.card, {}, game.cards))}</small></button>;
										}
										return (
											<Popover
												key={action.id}
												trigger="hover"
												placement="left"
												onOpenChange={(open) => {
													if (open) handlePreview(action);
													else clearPreview();
												}}
												content={previewContent}
											>
												{actionButton}
											</Popover>
										);
									})}
									{visibleActions.length === 0 && !isDead ? (
										<div className={style.emptyActions}>当前没有满足条件的动作。</div>
									) : null}
								</div>
								{isDead ? <div className={style.deadHint}>你已经倒下了。重置后再试一次。</div> : null}
							</>
						) : (
							<>
								{selectedView.derived.template.cardType === CardType.BEING ? (
									<div className={style.relationshipBlock}>
										<div className={style.inspectorSectionTitle}>对玩家的态度</div>
										<div className={style.relationshipValues}>
											<span>信任 {getNumberAttribute(selectedView.card.relationships?.[playerView.card.id]?.values ?? {}, getAttributeId(config, "trust"))}</span>
											<span>恐惧 {getNumberAttribute(selectedView.card.relationships?.[playerView.card.id]?.values ?? {}, getAttributeId(config, "fear"))}</span>
										</div>
										{sharedAgreements.length > 0 ? (
											<div className={style.agreementList}>
												<div className={style.agreementLabel}>共同约定</div>
												{sharedAgreements.map((agreement) => (
													<div key={agreement.id} className={style.agreementItem}>{agreement.title}</div>
												))}
											</div>
										) : null}
									</div>
								) : null}
								<div className={style.inspectorSectionTitle}>「{selectedView.derived.template.key}」的 incoming</div>
								{incomingActions.length === 0 ? (
									<div className={style.emptyActions}>当前没有可用的 incoming 动作。</div>
								) : (
									<div className={style.actions}>
										{incomingActions.map((action) => (
											<Popover
												key={action.id}
												trigger="hover"
												placement="left"
												onOpenChange={(open) => {
													if (open) handlePreview(action, selectedView.card.id);
													else clearPreview();
												}}
												content={previewContent}
											>
												<button
													type="button"
													className={style.actionButton}
													onClick={() => handleIncomingAction(action.id)}
													disabled={isDead}
												>
													<span>{action.title}</span>
													<small>
														玩家 → {selectedView.derived.template.key} ·{" "}
														{formatDuration(getActionTimeCost(config, action, playerView.card, {}, game.cards))}
													</small>
												</button>
											</Popover>
										))}
									</div>
								)}
							</>
						)}
					</aside>
				</div>

				<section className={style.logPanel}>
					<div className={style.inspectorSectionTitle}>经历</div>
					<div className={style.logList}>
						{game.logs
							.slice()
							.reverse()
							.map((log, index) => (
								<div key={`${log}-${index}`} className={style.logItem}>
									{log}
								</div>
							))}
					</div>
				</section>

				<footer className={style.footer}>
					每个动作按命名卡槽放置目标；卡槽之间不能复用同一张卡。修改 `public/famine_refugee_config.json`
					后刷新页面调整配置。
				</footer>
				{game.dialogue && dialogueNode ? (
					<div className={style.dialogueOverlay} onClick={() => setGame((prev) => (config && prev ? advanceDialogue(config, prev) : prev))}>
						{dialogueOptions.length > 0 ? (
							<div className={style.dialogueOptionLayer} onClick={(event) => event.stopPropagation()}>
								{dialogueOptions.map((option) => (
									<Button
										key={option.id}
										type="default"
										className={style.dialogueOptionButton}
										onClick={() => setGame((prev) => (config && prev ? chooseDialogueOption(config, prev, option.id) : prev))}
									>
										{option.text}
									</Button>
								))}
							</div>
						) : null}
						<div className={style.dialogueBar} onClick={(event) => event.stopPropagation()}>
							<div className={style.dialogueAvatar}>{dialogueSpeakerName.slice(0, 1)}</div>
							<div className={style.dialogueBody}>
								<div className={style.dialogueSpeaker}>{dialogueSpeakerName}</div>
								<div className={style.dialogueText}>{dialogueNode.text}</div>
								<div className={style.dialogueHint}>
									{dialogueOptions.length > 0 ? "选择一项回应" : "点击空白处继续"}
								</div>
							</div>
						</div>
					</div>
				) : null}
			</div>
		</ConfigProvider>
	);
}
