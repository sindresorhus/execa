import {$} from './index.js';

// Basic
const {stdout} = await $`echo foo`;

console.log(stdout);

// With options
await $({stdio: 'inherit'})`echo bar`;

const buffer = await $({encoding: null})`echo bar`;

console.log('buffer:', buffer);

// With pre-defined options
const my$ = $({stdio: 'inherit', shell: true});

await my$`echo bar | sed 's/bar/baz/'`;

const flags = ['--oneline', '--decorate', '--color', '-n 5'];

await $({stdio: 'inherit'})`git --no-pager log ${flags}`;
