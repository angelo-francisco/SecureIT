import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts", "src/tailwind.ts"],
	format: ["esm"],
	dts: true,
	clean: true,
	external: ["react", "react-dom"],
	outDir: "dist",
	loader: {
		".css": "copy",
		".png": "copy",
	},
});
