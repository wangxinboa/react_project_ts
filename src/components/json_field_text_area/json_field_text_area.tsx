import { memo, useCallback, useMemo } from "react";
import type { ChangeEvent, ComponentProps } from "react";
import { Input } from "antd";
import type { Formula } from "../../pages/card_story_game/card_story_game_types/index.ts";

type AntTextAreaProps = ComponentProps<typeof Input.TextArea>;

export type JsonFieldTextAreaProps = Omit<AntTextAreaProps, "value" | "onChange"> & {
	value?: Formula;
	onChange?: (value: Formula) => void;
};

function parseFormula(value: string): Formula | null {
	try {
		const parsed: unknown = JSON.parse(value);
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
		return parsed as Formula;
	} catch {
		return null;
	}
}

/** JSON 文本域：文本由 Formula 序列化，只有合法 JSON 对象才向外输出。 */
const JsonFieldTextArea = memo(function JsonFieldTextArea({ value, onChange, ...rest }: JsonFieldTextAreaProps) {
	const text = useMemo(() => (value ? JSON.stringify(value, null, 2) : ""), [value]);

	const handleChange = useCallback(
		(event: ChangeEvent<HTMLTextAreaElement>) => {
			const parsed = parseFormula(event.target.value);
			if (parsed) onChange?.(parsed);
		},
		[onChange],
	);

	return <Input.TextArea {...rest} value={text} onChange={handleChange} />;
});

export default JsonFieldTextArea;
