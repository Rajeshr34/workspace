import * as rb from "rollup-builder";

const rollUpBuilder = new rb.RollupBuilder(process.cwd(), process.argv);
rollUpBuilder
	.load({
		input: ["./src/!**!/!*.ts"],
	})
	.then(() => {
		// build completed
	});
