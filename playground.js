// node playground.js
import { $ } from "./index.js";

// Basic
const { stdout } = await $`echo foo`;

console.log(stdout);

// With options
await $({ stdio: "inherit" })`echo bar`;

// With pre-defined options
const my$ = $({ stdio: "inherit", shell: true });

await my$`echo baz | sed 's/baz/qux/'`;

let flags = ["--oneline", "--decorate", "--color", "-n 5"];

await $({ stdio: "inherit" })`git --no-pager log ${flags}`;
