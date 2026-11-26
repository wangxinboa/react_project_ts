export const FormMode = {
	CREATE: "create",
	EDIT: "edit",
	COPY: "copy",
} as const;

export type FormMode = (typeof FormMode)[keyof typeof FormMode];
