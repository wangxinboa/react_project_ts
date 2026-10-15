import { useRoutes } from "react-router-dom";
import type { ComponentType } from "react";

const modules: Record<string, { default: ComponentType }> = import.meta.glob("../pages/**/*.tsx", { eager: true });

function fileToRoutePath(file: string): string {
	return (
		file
			.replace("../pages", "")
			.replace(/\.tsx$/, "")
			.replace(/\/index$/, "")
			.replace(/\[\.\.\.(.+)\]/, "*")
			.replace(/\[(.+)\]/, ":$1") || "/"
	);
}

export default function Router() {
	return useRoutes(
		Object.keys(modules).map((filePath) => {
			const Component = modules[filePath].default;
			return {
				path: fileToRoutePath(filePath),
				element: <Component />,
			};
		}),
	);
}
