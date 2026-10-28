import EditPanel from "./edit_panel.tsx";

import style from "./edit_panel.module.scss";

/** 左右都没有选中项时的空态；由 Editor 决定是否渲染 */
export default function EmptyEditPanel() {
	return (
		<EditPanel rootLabel="编辑区" currentLabel="未选中">
			<div className={style.empty}>从左侧选择一个标签、动作或模板，或点击「+」新建</div>
		</EditPanel>
	);
}
