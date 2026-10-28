import { theme } from "antd";
import type { ThemeConfig } from "antd";

// 编辑器专用暗色暖金主题；只有编辑器路由会包这层 Provider
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
		colorBgContainer: "#15120f",
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
		Input: {
			activeBorderColor: "#c9a227",
			hoverBorderColor: "#3a352e",
			activeShadow: "0 0 0 2px rgba(201, 162, 39, 0.15)",
			paddingInline: 10,
			paddingBlock: 6,
		},
		Button: {
			defaultBg: "#1a1714",
			defaultBorderColor: "#3a352e",
			defaultColor: "#b8ae9e",
		},
		Menu: {
			itemBorderRadius: 3,
			itemHeight: 40,
			itemMarginBlock: 4,
			itemMarginInline: 8,
			itemPaddingInline: 12,
			iconSize: 14,
			darkItemBg: "transparent",
			darkSubMenuItemBg: "transparent",
			darkItemColor: "#a89f90",
			darkItemHoverBg: "#1c1917",
			darkItemHoverColor: "#e6ddcc",
			darkItemSelectedBg: "#2a2620",
			darkItemSelectedColor: "#e6ddcc",
			darkItemDisabledColor: "#4a443b",
			darkPopupBg: "#1a1714",
		},
	},
};
