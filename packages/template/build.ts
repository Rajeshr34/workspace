import RollupBuilder from "../../build/rollup.builder";

const rollUpBuilder = new RollupBuilder(process.cwd(), process.argv);
rollUpBuilder
	.load({
		input: ["./src/**/*.ts"],
	})
	.then(() => {
		// build completed
	});
