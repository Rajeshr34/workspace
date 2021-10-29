export const safePackageName = (name: string) =>
	name.toLowerCase().replace(/(^@.*\/)|((^[^a-zA-Z]+)|[^\w.-])|([^a-zA-Z0-9]+$)/g, "");

export const removeScope = (name: string) => name.replace(/^@.*\//, "");

// UMD-safe package name
export const safeVariableName = (name: string) =>
	removeScope(name.toUpperCase())
		.toLowerCase()
		.replace(/((^[^a-zA-Z]+)|[^\w.-])|([^a-zA-Z0-9]+$)/g, "");
