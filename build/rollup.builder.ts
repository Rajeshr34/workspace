import RollupBuilderConfig from "./utils/rollup.builder.config";
import EslintBuilder from "./eslint.builder";
import NodeArgs from "./utils/node.args";
import { OutputOptions, rollup, RollupOptions } from "rollup";
import * as fs from "fs";

export default class RollupBuilder {
	private readonly configService: RollupBuilderConfig;

	constructor(applicationPath: string, argv: string[]) {
		this.configService = new RollupBuilderConfig(applicationPath, new NodeArgs(argv));
	}

	async load(options: RollupOptions) {
		new EslintBuilder(this.configService.applicationPath, this.configService.nodeArgs).load();
		const configObject = this.configService.getConfig(options);
		await this.build(configObject);
	}

	async build(configObject: RollupOptions) {
		await this.cleanDistFolder();
		// create a bundle
		const bundle = await rollup(configObject);
		const { output } = await bundle.generate(<OutputOptions>configObject.output);
		// or write the bundle to disk
		const writeData = await bundle.write(<OutputOptions>configObject.output);
		console.log(writeData);
	}

	async cleanDistFolder() {
		fs.rmdirSync(this.configService.getDist(), { recursive: true });
	}
}
