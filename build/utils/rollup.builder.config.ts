import fs from "fs";
import path from "path";
import { RollupArgsInterface } from "../interfaces/project.args.interface";
import NodeArgs from "./node.args";
import { ApplicationPackageInterface } from "../interfaces/application.package.interface";
import ts from "typescript";
import { RollupOptions } from "rollup";
import resolve, { DEFAULTS as RESOLVE_DEFAULTS } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import { safePackageName, safeVariableName } from "./build.helpers";
import replace from "@rollup/plugin-replace";
import { rollupBabelBuilder } from "../rollupBabelBuilder";
import { DEFAULT_EXTENSIONS as DEFAULT_BABEL_EXTENSIONS } from "@babel/core";
import sourceMaps from "rollup-plugin-sourcemaps";
import { terser } from "rollup-plugin-terser";

export default class RollupBuilderConfig {
	readonly applicationPath: string;
	public readonly nodeArgs: NodeArgs<RollupArgsInterface>;
	private readonly applicationInfo: ApplicationPackageInterface;

	constructor(applicationPath: string, rollupBuilderConfig: NodeArgs<RollupArgsInterface>) {
		this.applicationPath = applicationPath;
		this.nodeArgs = rollupBuilderConfig;
		this.applicationInfo = this.getPackageInfo();
		this.load();
	}

	load() {
		this.nodeArgs.load().setDefaults({
			format: "cjs",
			env: "production",
			target: "browser",
		});
	}

	getDist() {
		return this.getFilePath("dist");
	}

	getAppDirectory() {
		return fs.realpathSync(this.applicationPath);
	}

	getFilePath(relativePath: string) {
		return path.resolve(this.getAppDirectory(), relativePath);
	}

	readFile(path: string) {
		return fs.readFileSync(this.getFilePath(path), "utf8");
	}

	readFileAsJson(path: string) {
		return JSON.parse(this.readFile(path));
	}

	private getPackageInfo() {
		return this.readFileAsJson("package.json");
	}

	getTsConfigPath() {
		return this.getFilePath("tsconfig.json");
	}

	getTsConfigData() {
		return ts.readConfigFile(this.getFilePath("tsconfig.json"), ts.sys.readFile);
	}

	getConfig(options: RollupOptions) {
		const opts = this.nodeArgs.getKeyValueArgs();
		const outputName = [
			`${this.getDist()}/${opts.env}-${this.applicationInfo.version}/${safePackageName(
				this.applicationInfo.name
			)}`,
			opts.format,
			"js",
		]
			.filter(Boolean)
			.join(".");

		const tsCompilerOptions = this.getTsConfigData().config;

		console.log(outputName, tsCompilerOptions, options);

		return <RollupOptions>{
			input: options.input,
			treeshake: {
				// We assume reading a property of an object never has side-effects.
				// This means tsdx WILL remove getters and setters defined directly on objects.
				// Any getters or setters defined on classes will not be effected.
				//
				// @example
				//
				// const foo = {
				//  get bar() {
				//    console.log('effect');
				//    return 'bar';
				//  }
				// }
				//
				// const result = foo.bar;
				// const illegalAccess = foo.quux.tooDeep;
				//
				// Punchline....Don't use getters and setters
				propertyReadSideEffects: false,
			},
			output: {
				// Set filenames of the consumer's package
				file: outputName,
				// Pass through the file format
				format: opts.format,
				// Do not let Rollup call Object.freeze() on namespace import objects
				// (i.e. import * as namespaceImportObject from...) that are accessed dynamically.
				freeze: false,
				// Respect tsconfig esModuleInterop when setting __esModule.
				esModule: Boolean(tsCompilerOptions?.esModuleInterop),
				name: this.applicationInfo.name || safeVariableName(this.applicationInfo.name),
				sourcemap: opts.sorucemap,
				exports: "named",
			},
			plugins: [
				resolve({
					mainFields: ["module", "main", opts.target !== "node" ? "browser" : undefined].filter(
						Boolean
					) as string[],
					extensions: [...RESOLVE_DEFAULTS.extensions, ".jsx"],
				}),
				commonjs({
					// use a regex to make sure to include eventual hoisted packages
					include: opts.format === "umd" ? /\/node_modules\// : /\/regenerator-runtime\//,
				}),
				json(),
				typescript({
					typescript: ts,
					tsconfig: this.getTsConfigPath(),
					tsconfigDefaults: {
						exclude: [
							// all TS test files, regardless whether co-located or in test/ etc
							"**/*.spec.ts",
							"**/*.test.ts",
							"**/*.spec.tsx",
							"**/*.test.tsx",
							// TS defaults below
							"node_modules",
							"bower_components",
							"jspm_packages",
							this.getDist(),
						],
						compilerOptions: {
							sourceMap: true,
							declaration: true,
							jsx: "react",
						},
					},
					tsconfigOverride: {
						compilerOptions: {
							// TS -> esnext, then leave the rest to babel-preset-env
							target: "esnext",
						},
					},
					check: true,
					useTsconfigDeclarationDir: Boolean(tsCompilerOptions?.declarationDir),
				}),
				rollupBabelBuilder({
					exclude: "node_modules/**",
					extensions: [...DEFAULT_BABEL_EXTENSIONS, "ts", "tsx"],
					babelHelpers: "bundled",
				}),
				opts.env !== undefined &&
					replace({
						"process.env.NODE_ENV": JSON.stringify(opts.env),
					}),
				sourceMaps(),
				opts.env === "production" &&
					terser({
						output: { comments: false },
						compress: {
							keep_infinity: true,
							pure_getters: true,
							passes: 10,
						},
						ecma: 5,
						toplevel: opts.format === "cjs",
					}),
			],
		};
	}
}
