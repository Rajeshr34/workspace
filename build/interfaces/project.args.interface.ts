export interface RollupArgsInterface {
	target?: "node" | "browser";
	sorucemap?: boolean | "inline" | "hidden";
	env?: "production" | "development";
	format?: "cjs" | "umd" | "esm" | "system";
}

export interface EslintArgsInterface {}
