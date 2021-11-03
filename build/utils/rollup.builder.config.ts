import * as fs from "fs";
import * as path from "path";
import { RollupArgsInterface } from "../interfaces/project.args.interface";
import NodeArgs from "./node.args";
import { ApplicationPackageInterface } from "../interfaces/application.package.interface";
import ts from "typescript";
import { RollupOptions } from "rollup";
import resolve, { DEFAULTS as RESOLVE_DEFAULTS } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import * as rollTs from "rollup-plugin-ts";
import { safePackageName, safeVariableName } from "./build.helpers";
import replace from "@rollup/plugin-replace";
import { DEFAULT_EXTENSIONS as DEFAULT_BABEL_EXTENSIONS } from "@babel/core";
import sourceMaps from "rollup-plugin-sourcemaps";
import { terser } from "rollup-plugin-terser";
import { createBabelInputPluginFactory } from "@rollup/plugin-babel";
import _ from "lodash";
// @ts-ignore
import { folderInput } from "rollup-plugin-folder-input";
import createLogger, { ProgressEstimator } from "progress-estimator";
import progress from "rollup-plugin-progress";

export default class RollupBuilderConfig {
	readonly applicationPath: string;
	public readonly nodeArgs: NodeArgs<RollupArgsInterface>;
	private readonly applicationInfo: ApplicationPackageInterface;
	private logger!: ProgressEstimator;

	constructor(applicationPath: string, rollupBuilderConfig: NodeArgs<RollupArgsInterface>) {
		this.applicationPath = applicationPath;
		this.nodeArgs = rollupBuilderConfig;
		this.applicationInfo = this.getPackageInfo();
		this.load();
	}

	static getCompilerOptionsJSONFollowExtends(filename: string): { [key: string]: any } {
		let compopts = {};
		const config = ts.readConfigFile(filename, ts.sys.readFile).config;
		if (config.extends) {
			const rqrpath = require.resolve(config.extends);
			compopts = this.getCompilerOptionsJSONFollowExtends(rqrpath);
			delete config.extends;
		}
		return _.merge(compopts, config);
	}

	getLogger() {
		if (!this.logger) {
			this.logger = createLogger({});
		}
		return this.logger;
	}

	load() {
		this.nodeArgs.load().setDefaults({
			format: "esm",
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

	getTsConfigPath() {
		return this.getFilePath("tsconfig.json");
	}

	getTsConfigData() {
		return RollupBuilderConfig.getCompilerOptionsJSONFollowExtends(this.getFilePath("tsconfig.json"));
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

		// const outputDir = `${this.getDist()}/${opts.env}-${this.applicationInfo.version}`;
		const outputDir = `${this.getDist()}`;

		const tsCompilerOptions = this.getTsConfigData();

		const babelPluginForESMBundle = createBabelInputPluginFactory();

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
				dir: outputDir,
				// Pass through the file format
				format: opts.format,
				// Do not let Rollup call Object.freeze() on namespace import objects
				// (i.e. import * as namespaceImportObject from...) that are accessed dynamically.
				freeze: false,
				// Respect tsconfig esModuleInterop when setting __esModule.
				esModule: Boolean(tsCompilerOptions?.compilerOptions?.esModuleInterop),
				name: this.applicationInfo.name || safeVariableName(this.applicationInfo.name),
				sourcemap: tsCompilerOptions?.compilerOptions?.sourceMap && opts.env != "production",
				exports: "named",
				preserveModules: true,
			},
			plugins: [
				folderInput(),
				progress(),
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
				rollTs.default({
					...tsCompilerOptions?.compilerOptions,
				}),
				babelPluginForESMBundle({
					presets: [["@babel/preset-env"]],
					exclude: "node_modules/!**",
					extensions: [...DEFAULT_BABEL_EXTENSIONS, "ts", "tsx"],
					babelHelpers: "bundled",
					// plugins: rollupBabelPlugins(opts),
				}),
				opts.env !== undefined &&
					replace({
						preventAssignment: true,
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

	private getPackageInfo() {
		return this.readFileAsJson("package.json");
	}
}
