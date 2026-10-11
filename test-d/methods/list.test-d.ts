import {expectTypeOf} from 'nz';
import {
	type ExecaMethod,
	type ExecaSyncMethod,
	type ExecaNodeMethod,
	type ExecaScriptMethod,
	type ExecaScriptSyncMethod,
	execa,
	execaSync,
	execaNode,
	$,
} from '../../index.js';

const options = {preferLocal: true} as const;
const secondOptions = {node: true} as const;

expectTypeOf(execa).toBeAssignableTo<ExecaMethod>();
expectTypeOf(execa({})).toBeAssignableTo<ExecaMethod>();
expectTypeOf(execa({})({})).toBeAssignableTo<ExecaMethod>();
expectTypeOf(execa(options)).toBeAssignableTo<ExecaMethod>();
expectTypeOf(execa(options)(secondOptions)).toBeAssignableTo<ExecaMethod>();
expectTypeOf(execa(options)({})).toBeAssignableTo<ExecaMethod>();
expectTypeOf(execa({})(options)).toBeAssignableTo<ExecaMethod>();

expectTypeOf(execaSync).toBeAssignableTo<ExecaSyncMethod>();
expectTypeOf(execaSync({})).toBeAssignableTo<ExecaSyncMethod>();
expectTypeOf(execaSync({})({})).toBeAssignableTo<ExecaSyncMethod>();
expectTypeOf(execaSync(options)).toBeAssignableTo<ExecaSyncMethod>();
expectTypeOf(execaSync(options)(secondOptions)).toBeAssignableTo<ExecaSyncMethod>();
expectTypeOf(execaSync(options)({})).toBeAssignableTo<ExecaSyncMethod>();
expectTypeOf(execaSync({})(options)).toBeAssignableTo<ExecaSyncMethod>();

expectTypeOf(execaNode).toBeAssignableTo<ExecaNodeMethod>();
expectTypeOf(execaNode({})).toBeAssignableTo<ExecaNodeMethod>();
expectTypeOf(execaNode({})({})).toBeAssignableTo<ExecaNodeMethod>();
expectTypeOf(execaNode(options)).toBeAssignableTo<ExecaNodeMethod>();
expectTypeOf(execaNode(options)(secondOptions)).toBeAssignableTo<ExecaNodeMethod>();
expectTypeOf(execaNode(options)({})).toBeAssignableTo<ExecaNodeMethod>();
expectTypeOf(execaNode({})(options)).toBeAssignableTo<ExecaNodeMethod>();

expectTypeOf($).toBeAssignableTo<ExecaScriptMethod>();
expectTypeOf($({})).toBeAssignableTo<ExecaScriptMethod>();
expectTypeOf($({})({})).toBeAssignableTo<ExecaScriptMethod>();
expectTypeOf($(options)).toBeAssignableTo<ExecaScriptMethod>();
expectTypeOf($(options)(secondOptions)).toBeAssignableTo<ExecaScriptMethod>();
expectTypeOf($(options)({})).toBeAssignableTo<ExecaScriptMethod>();
expectTypeOf($({})(options)).toBeAssignableTo<ExecaScriptMethod>();

expectTypeOf($.sync).toBeAssignableTo<ExecaScriptSyncMethod>();
expectTypeOf($.sync({})).toBeAssignableTo<ExecaScriptSyncMethod>();
expectTypeOf($.sync({})({})).toBeAssignableTo<ExecaScriptSyncMethod>();
expectTypeOf($.sync(options)).toBeAssignableTo<ExecaScriptSyncMethod>();
expectTypeOf($.sync(options)(secondOptions)).toBeAssignableTo<ExecaScriptSyncMethod>();
expectTypeOf($.sync(options)({})).toBeAssignableTo<ExecaScriptSyncMethod>();
expectTypeOf($.sync({})(options)).toBeAssignableTo<ExecaScriptSyncMethod>();

expectTypeOf($.s).toBeAssignableTo<ExecaScriptSyncMethod>();
expectTypeOf($.s({})).toBeAssignableTo<ExecaScriptSyncMethod>();
expectTypeOf($.s({})({})).toBeAssignableTo<ExecaScriptSyncMethod>();
expectTypeOf($.s(options)).toBeAssignableTo<ExecaScriptSyncMethod>();
expectTypeOf($.s(options)(secondOptions)).toBeAssignableTo<ExecaScriptSyncMethod>();
expectTypeOf($.s(options)({})).toBeAssignableTo<ExecaScriptSyncMethod>();
expectTypeOf($.s({})(options)).toBeAssignableTo<ExecaScriptSyncMethod>();
