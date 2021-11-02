import RollupBuilderConfig from "./utils/rollup.builder.config";
import EslintBuilder from "./eslint.builder";
import NodeArgs from "./utils/node.args";
import { rollup, RollupOptions } from "rollup";

export default class RollupBuilder {
	private readonly configService: RollupBuilderConfig;

	constructor(applicationPath: string, argv: string[]) {
		this.configService = new RollupBuilderConfig(applicationPath, new NodeArgs(argv));
	}

	load(options: RollupOptions) {
		new EslintBuilder(this.configService.applicationPath, this.configService.nodeArgs).load();
		const configObject = this.configService.getConfig(options);
		rollup(configObject)
			.then((r) => {
				console.log(r);
			})
			.then((error) => {
				console.log(error);
			});
	}
}
