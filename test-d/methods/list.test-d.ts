import {expectAssignable} from 'tsd';
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

expectAssignable<ExecaMethod>(execa);
expectAssignable<ExecaMethod>(execa({}));
expectAssignable<ExecaMethod>(execa({})({}));
expectAssignable<ExecaMethod>(execa(options));
expectAssignable<ExecaMethod>(execa(options)(secondOptions));
expectAssignable<ExecaMethod>(execa(options)({}));
expectAssignable<ExecaMethod>(execa({})(options));

expectAssignable<ExecaSyncMethod>(execaSync);
expectAssignable<ExecaSyncMethod>(execaSync({}));
expectAssignable<ExecaSyncMethod>(execaSync({})({}));
expectAssignable<ExecaSyncMethod>(execaSync(options));
expectAssignable<ExecaSyncMethod>(execaSync(options)(secondOptions));
expectAssignable<ExecaSyncMethod>(execaSync(options)({}));
expectAssignable<ExecaSyncMethod>(execaSync({})(options));

expectAssignable<ExecaNodeMethod>(execaNode);
expectAssignable<ExecaNodeMethod>(execaNode({}));
expectAssignable<ExecaNodeMethod>(execaNode({})({}));
expectAssignable<ExecaNodeMethod>(execaNode(options));
expectAssignable<ExecaNodeMethod>(execaNode(options)(secondOptions));
expectAssignable<ExecaNodeMethod>(execaNode(options)({}));
expectAssignable<ExecaNodeMethod>(execaNode({})(options));

expectAssignable<ExecaScriptMethod>($);
expectAssignable<ExecaScriptMethod>($({}));
expectAssignable<ExecaScriptMethod>($({})({}));
expectAssignable<ExecaScriptMethod>($(options));
expectAssignable<ExecaScriptMethod>($(options)(secondOptions));
expectAssignable<ExecaScriptMethod>($(options)({}));
expectAssignable<ExecaScriptMethod>($({})(options));

expectAssignable<ExecaScriptSyncMethod>($.sync);
expectAssignable<ExecaScriptSyncMethod>($.sync({}));
expectAssignable<ExecaScriptSyncMethod>($.sync({})({}));
expectAssignable<ExecaScriptSyncMethod>($.sync(options));
expectAssignable<ExecaScriptSyncMethod>($.sync(options)(secondOptions));
expectAssignable<ExecaScriptSyncMethod>($.sync(options)({}));
expectAssignable<ExecaScriptSyncMethod>($.sync({})(options));

expectAssignable<ExecaScriptSyncMethod>($.s);
expectAssignable<ExecaScriptSyncMethod>($.s({}));
expectAssignable<ExecaScriptSyncMethod>($.s({})({}));
expectAssignable<ExecaScriptSyncMethod>($.s(options));
expectAssignable<ExecaScriptSyncMethod>($.s(options)(secondOptions));
expectAssignable<ExecaScriptSyncMethod>($.s(options)({}));
expectAssignable<ExecaScriptSyncMethod>($.s({})(options));
