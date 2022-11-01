// node playground.js
import { $ } from "./index.js";

// Basic
const { stdout } = await $`echo foo`;

console.log(stdout);

// With options
await $({ stdio: "inherit" })`echo bar`;

// With pre-defined options
const my$ = (templates, ...expressions) =>
	$({ stdio: "inherit", shell: true })(templates, ...expressions);

await my$`echo baz | sed 's/baz/qux/'`;
