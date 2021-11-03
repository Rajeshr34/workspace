export default class NodeArgs<T> {
	private argv: string[];
	private keyValueArgs: { [key: string]: any } = {};

	constructor(argv: string[]) {
		this.argv = argv.slice(2);
	}

	load() {
		this.argv.forEach((item) => {
			this.splitArg(item);
		});
		return this;
	}

	public getKeyValueArgs() {
		return <T>this.keyValueArgs;
	}

	setDefaults(param: T) {
		Object.keys(param).forEach((item) => {
			if (!this.keyValueArgs[item]) {
				// @ts-ignore
				this.keyValueArgs[item] = param[item];
			}
		});
	}

	private splitArg(item: string) {
		const itemSplit = item.split(":");
		if (itemSplit[0].startsWith("-")) {
			itemSplit[0] = itemSplit[0].replace(/^-+/g, "");
		}
		this.keyValueArgs[itemSplit[0]] = itemSplit[1] ? itemSplit[1].trim() : true;
	}
}
