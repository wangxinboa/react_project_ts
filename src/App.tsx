import { HashRouter } from "react-router-dom";

import Router from "./router/router.tsx";

export default function App() {
	return (
		<HashRouter>
			<Router />
		</HashRouter>
	);
}
