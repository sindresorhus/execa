import { $ } from "./index.js";

let $$ = $.create({ stdio: "inherit" });

await $$({ shell: true })`ls *.ts`;

await $$`echo "$TEST"`;

$$ = $$.create({ shell: true, env: { TEST: "test" } });

$$.sync`echo "$TEST"`;
