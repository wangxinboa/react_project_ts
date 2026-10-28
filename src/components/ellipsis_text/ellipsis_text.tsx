import { Typography } from "antd";

import style from "./ellipsis_text.module.scss";

interface EllipsisTextProps {
	text: string;
}

export default function EllipsisText({ text }: EllipsisTextProps) {
	return (
		<div className={style.container}>
			<Typography.Text className={style.text} ellipsis={{ tooltip: text }}>
				{text}
			</Typography.Text>
		</div>
	);
}
