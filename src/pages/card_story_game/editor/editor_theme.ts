import { theme } from "antd";
import type { ThemeConfig } from "antd";

// ============================================================
// 编辑器专用的 antd 主题：暗色算法 + 现有暖色色板
// 色板来源：src/pages/card_story_game/editor/editor.module.scss
// 只有编辑器路由会包这层 Provider，不影响首页和后续游戏页面。
// ============================================================
export const editorTheme: ThemeConfig = {
	algorithm: theme.darkAlgorithm,
	token: {
		colorPrimary: "#c9a227",
		colorInfo: "#c9a227",
		colorLink: "#c9a227",
		colorSuccess: "#4ade80",
		colorWarning: "#fbbf24",
		colorError: "#f87171",

		colorBgBase: "#12100e",
		colorBgLayout: "#12100e",
		colorBgContainer: "#12100e",
		colorBgElevated: "#1a1714",
		colorBgMask: "rgba(0, 0, 0, 0.6)",

		colorBorder: "#2e2a25",
		colorBorderSecondary: "#241f1b",

		colorText: "#d9d2c7",
		colorTextSecondary: "#b8ae9e",
		colorTextTertiary: "#8a8276",
		colorTextQuaternary: "#6b6459",
		colorTextDescription: "#6b6459",
		colorTextPlaceholder: "#4a443b",

		borderRadius: 3,
		controlHeight: 34,
		fontSize: 13,
	},
	components: {
		Form: {
			labelColor: "#8a8276",
			labelFontSize: 12,
			// 必须 >= explain 行高（当前约 21px）：antd 用 marginBottom 预留错误行空间，
			// 低于这个值时报错会把下方内容顶动。
			itemMarginBottom: 24,
			verticalLabelPadding: "0 0 6px",
		},
		Input: {
			activeBorderColor: "#c9a227",
			hoverBorderColor: "#3a352e",
			activeShadow: "0 0 0 2px rgba(201, 162, 39, 0.15)",
			paddingInline: 10,
			paddingBlock: 6,
		},
		Modal: {
			contentBg: "#1a1714",
			headerBg: "#1a1714",
		},
		Message: {
			contentBg: "#1a1714",
		},
	},
};
