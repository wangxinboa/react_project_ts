import { Drawer } from "antd";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";

import type { CardTemplate } from "../../../../card_story_game_types.ts";
import { FormMode } from "../../../../../../utils/form_mode.ts";

import style from "./template_drawer.module.scss";

export interface TemplateDrawerHandle {
	create: () => void;
	edit: (template: CardTemplate) => void;
	close: () => void;
}

const TemplateDrawer = forwardRef<TemplateDrawerHandle>(function TemplateDrawer(_props, ref) {
	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState<FormMode>(FormMode.CREATE);
	const [template, setTemplate] = useState<CardTemplate | null>(null);

	const handleClose = useCallback(() => {
		setOpen(false);
	}, []);

	useImperativeHandle(
		ref,
		() => ({
			create() {
				setMode(FormMode.CREATE);
				setTemplate(null);
				setOpen(true);
			},
			edit(nextTemplate) {
				setMode(FormMode.EDIT);
				setTemplate(nextTemplate);
				setOpen(true);
			},
			close() {
				setOpen(false);
			},
		}),
		[],
	);

	return (
		<Drawer title={mode === FormMode.CREATE ? "新建模板" : "编辑模板"} open={open} onClose={handleClose} size={420}>
			<div className={style.placeholder}>
				<div className={style.mark}>◇</div>
				<div className={style.title}>{template ? template.key : "新建模板"}</div>
				<div className={style.hint}>模板编辑表单将在属性系统完成后实现。</div>
			</div>
		</Drawer>
	);
});

export default TemplateDrawer;
