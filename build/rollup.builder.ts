import RollupBuilderConfig from "./utils/rollup.builder.config";
import EslintBuilder from "./eslint.builder";
import NodeArgs from "./utils/node.args";
import { OutputOptions, rollup, RollupOptions } from "rollup";

export default class RollupBuilder {
	private readonly configService: RollupBuilderConfig;

	constructor(applicationPath: string, argv: string[]) {
		this.configService = new RollupBuilderConfig(applicationPath, new NodeArgs(argv));
	}

	load(options: RollupOptions) {
		new EslintBuilder(this.configService.applicationPath, this.configService.nodeArgs).load();
		const configObject = this.configService.getConfig(options);
		this.build(configObject).then();
	}

	async build(configObject: RollupOptions) {
		// create a bundle
		const bundle = await rollup(configObject);
		const { output } = await bundle.generate(<OutputOptions>configObject.output);
		// or write the bundle to disk
		const writeData = await bundle.write(<OutputOptions>configObject.output);
		console.log(writeData);
	}
}
