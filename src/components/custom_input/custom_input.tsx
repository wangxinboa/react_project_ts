import { memo, useCallback } from "react";
import type { ChangeEvent } from "react";
import { Input } from "antd";
import type { InputProps } from "antd";

export interface CustomInputProps extends Omit<InputProps, "value" | "onChange"> {
	value?: string;
	onChange?: (value: string) => void;
}

/** antd Input 封装：受控值自动去除首尾空白。 */
const CustomInput = memo(function CustomInput({ value, onChange, ...rest }: CustomInputProps) {
	const handleChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			onChange?.(event.target.value.trim());
		},
		[onChange],
	);

	return (
		<Input
			{...rest}
			value={value}
			onChange={handleChange}
		/>
	);
});

export default CustomInput;
