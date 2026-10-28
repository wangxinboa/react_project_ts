export const FormMode = {
	CREATE: "create",
	EDIT: "edit",
} as const;

export type FormMode = (typeof FormMode)[keyof typeof FormMode];
