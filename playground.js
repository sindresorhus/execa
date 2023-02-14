import {$} from './index.js';

let $$ = $({stdio: 'inherit'});

await $$({shell: true})`ls *.ts`;

await $$`echo "$TEST"`;

$$ = $$({shell: true, env: {TEST: 'test'}});

// eslint-disable-next-line no-unused-expressions
$$.sync`echo "$TEST"`;
