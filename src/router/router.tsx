import { useRoutes, type RouteObject } from "react-router-dom";
import type { ComponentType } from "react";

const modules: Record<string, { default: ComponentType }> = import.meta.glob("../pages/**/index.tsx", { eager: true });

const INDEX_PAGE = "index";
const routeMap: Record<string, { Component: ComponentType }> = {};
const routes: RouteObject[] = [];
const filePaths = Object.keys(modules);

for (let i = 0, len = filePaths.length; i < len; i++) {
	const filePath = filePaths[i];

	const routePath = filePath.replace(/^\.\.\/pages/, "").replace(/\.tsx$/, "");

	const segments = routePath.split("/");
	const fileName = segments[segments.length - 1];
	const parentDir = segments.length > 1 ? segments[segments.length - 2] : "";

	let isRoot = false;

	if (fileName === INDEX_PAGE || (parentDir && fileName === parentDir)) {
		segments.pop();
		isRoot = true;
	}

	const finalPath = segments.join("/") || "/";
	const Component = modules[filePath].default;

	if (isRoot) {
		if (!routeMap[finalPath]) {
			routeMap[finalPath] = { Component };
			routes.push({ path: finalPath, element: <Component /> });
		}
	} else {
		routeMap[finalPath] = { Component };
		routes.push({ path: finalPath, element: <Component /> });
	}
}

export default function Router() {
	return useRoutes(routes);
}
