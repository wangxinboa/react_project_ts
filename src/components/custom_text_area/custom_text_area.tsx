import { memo, useCallback } from "react";
import type { ChangeEvent, ComponentProps } from "react";
import { Input } from "antd";

type AntTextAreaProps = ComponentProps<typeof Input.TextArea>;

export type CustomTextAreaProps = Omit<AntTextAreaProps, "value" | "onChange"> & {
	value?: string;
	onChange?: (value: string) => void;
};

/** antd TextArea 封装：受控值自动去除首尾空白。 */
const CustomTextArea = memo(function CustomTextArea({ value, onChange, ...rest }: CustomTextAreaProps) {
	const handleChange = useCallback(
		(event: ChangeEvent<HTMLTextAreaElement>) => {
			onChange?.(event.target.value.trim());
		},
		[onChange],
	);

	return (
		<Input.TextArea
			{...rest}
			value={value}
			onChange={handleChange}
		/>
	);
});

export default CustomTextArea;
