import { EslintArgsInterface } from "./interfaces/project.args.interface";
import NodeArgs from "./utils/node.args";

export default class EslintBuilder {
	private applicationPath: string;
	private nodeArgs: NodeArgs<EslintArgsInterface>;

	constructor(applicationPath: string, nodeArgs: NodeArgs<EslintArgsInterface>) {
		this.applicationPath = applicationPath;
		this.nodeArgs = nodeArgs;
	}

	load() {}
}
