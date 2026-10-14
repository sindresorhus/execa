import {expectTypeOf} from 'nz';
import {
	execa,
	execaSync,
	execaNode,
	$,
	type Options,
	type SyncOptions,
	type ResultPromise,
} from '../../index.js';

// Options from a generic type parameter, e.g. in a wrapper function
const runGeneric = <OptionsType extends Options>(options: OptionsType) => {
	execa('unicorns', options).stdin?.write('input');
	execa(options)`unicorns`.stdin?.write('input');
	execaNode('unicorns', options).stdin?.write('input');
	$('unicorns', options).stdin?.write('input');
	$(options)`unicorns`.stdin?.write('input');
	$('unicorns', [], options).stdin?.write('input');
	$(options)`unicorns`.kill();
	return $('unicorns', options);
};

expectTypeOf(runGeneric({})).toBeAssignableTo<ResultPromise>();

const runGenericSync = <OptionsType extends SyncOptions>(options: OptionsType) => {
	execaSync('unicorns', options).command.trim();
	$.sync('unicorns', options).command.trim();
};

runGenericSync({});

// Options inferred while the return value has an expected type, e.g. a type annotation
const scriptSubprocess: ResultPromise = $('unicorns');
const scriptOptionsSubprocess: ResultPromise = $('unicorns', {node: true});
const scriptArgumentsSubprocess: ResultPromise = $('unicorns', [], {input: 'input'});
const getScriptSubprocess = (): ResultPromise => $('unicorns', {cwd: '.'});
expectTypeOf([scriptSubprocess, scriptOptionsSubprocess, scriptArgumentsSubprocess, getScriptSubprocess()]).toBeAssignableTo<ResultPromise[]>();
