import {Duplex} from 'node:stream';
import {TransformStream} from 'node:stream/web';
import {expectTypeOf} from 'nz';
import {execa, type ExecaError} from '../../index.js';

const duplexStream = new Duplex();
const duplex = {transform: duplexStream} as const;
const duplexObject = {transform: duplexStream as Duplex & {readonly readableObjectMode: true}} as const;
const duplexNotObject = {transform: duplexStream as Duplex & {readonly readableObjectMode: false}} as const;
const duplexObjectProperty = {transform: duplexStream, objectMode: true as const} as const;
const duplexNotObjectProperty = {transform: duplexStream, objectMode: false as const} as const;

const webTransformInstance = new TransformStream();
const webTransform = {transform: webTransformInstance} as const;
const webTransformObject = {transform: webTransformInstance, objectMode: true as const} as const;
const webTransformNotObject = {transform: webTransformInstance, objectMode: false as const} as const;

const objectGenerator = function * (line: unknown) {
	yield JSON.parse(line as string) as object;
};

const objectFinal = function * () {
	yield {};
};

const objectTransformLinesStdoutResult = await execa('unicorns', {lines: true, stdout: {transform: objectGenerator, final: objectFinal, objectMode: true} as const});
expectTypeOf(objectTransformLinesStdoutResult.stdout).toBe<unknown[]>();
expectTypeOf(objectTransformLinesStdoutResult.stdio).toBe<[undefined, unknown[], string[]]>();

const objectWebTransformStdoutResult = await execa('unicorns', {stdout: webTransformObject});
expectTypeOf(objectWebTransformStdoutResult.stdout).toBe<unknown[]>();
expectTypeOf(objectWebTransformStdoutResult.stdio).toBe<[undefined, unknown[], string]>();

const objectDuplexStdoutResult = await execa('unicorns', {stdout: duplexObject});
expectTypeOf(objectDuplexStdoutResult.stdout).toBe<unknown[]>();
expectTypeOf(objectDuplexStdoutResult.stdio).toBe<[undefined, unknown[], string]>();

const objectDuplexPropertyStdoutResult = await execa('unicorns', {stdout: duplexObjectProperty});
expectTypeOf(objectDuplexPropertyStdoutResult.stdout).toBe<unknown[]>();
expectTypeOf(objectDuplexPropertyStdoutResult.stdio).toBe<[undefined, unknown[], string]>();

const objectTransformStdoutResult = await execa('unicorns', {stdout: {transform: objectGenerator, final: objectFinal, objectMode: true} as const});
expectTypeOf(objectTransformStdoutResult.stdout).toBe<unknown[]>();
expectTypeOf(objectTransformStdoutResult.stdio).toBe<[undefined, unknown[], string]>();

const objectWebTransformStderrResult = await execa('unicorns', {stderr: webTransformObject});
expectTypeOf(objectWebTransformStderrResult.stderr).toBe<unknown[]>();
expectTypeOf(objectWebTransformStderrResult.stdio).toBe<[undefined, string, unknown[]]>();

const objectDuplexStderrResult = await execa('unicorns', {stderr: duplexObject});
expectTypeOf(objectDuplexStderrResult.stderr).toBe<unknown[]>();
expectTypeOf(objectDuplexStderrResult.stdio).toBe<[undefined, string, unknown[]]>();

const objectDuplexPropertyStderrResult = await execa('unicorns', {stderr: duplexObjectProperty});
expectTypeOf(objectDuplexPropertyStderrResult.stderr).toBe<unknown[]>();
expectTypeOf(objectDuplexPropertyStderrResult.stdio).toBe<[undefined, string, unknown[]]>();

const objectTransformStderrResult = await execa('unicorns', {stderr: {transform: objectGenerator, final: objectFinal, objectMode: true} as const});
expectTypeOf(objectTransformStderrResult.stderr).toBe<unknown[]>();
expectTypeOf(objectTransformStderrResult.stdio).toBe<[undefined, string, unknown[]]>();

const objectWebTransformStdioResult = await execa('unicorns', {stdio: ['pipe', 'pipe', webTransformObject]});
expectTypeOf(objectWebTransformStdioResult.stderr).toBe<unknown[]>();
expectTypeOf(objectWebTransformStdioResult.stdio).toBe<[undefined, string, unknown[]]>();

const objectDuplexStdioResult = await execa('unicorns', {stdio: ['pipe', 'pipe', duplexObject]});
expectTypeOf(objectDuplexStdioResult.stderr).toBe<unknown[]>();
expectTypeOf(objectDuplexStdioResult.stdio).toBe<[undefined, string, unknown[]]>();

const objectDuplexPropertyStdioResult = await execa('unicorns', {stdio: ['pipe', 'pipe', duplexObjectProperty]});
expectTypeOf(objectDuplexPropertyStdioResult.stderr).toBe<unknown[]>();
expectTypeOf(objectDuplexPropertyStdioResult.stdio).toBe<[undefined, string, unknown[]]>();

const objectTransformStdioResult = await execa('unicorns', {stdio: ['pipe', 'pipe', {transform: objectGenerator, final: objectFinal, objectMode: true} as const]});
expectTypeOf(objectTransformStdioResult.stderr).toBe<unknown[]>();
expectTypeOf(objectTransformStdioResult.stdio).toBe<[undefined, string, unknown[]]>();

const singleObjectWebTransformStdoutResult = await execa('unicorns', {stdout: [webTransformObject]});
expectTypeOf(singleObjectWebTransformStdoutResult.stdout).toBe<unknown[]>();
expectTypeOf(singleObjectWebTransformStdoutResult.stdio).toBe<[undefined, unknown[], string]>();

const singleObjectDuplexStdoutResult = await execa('unicorns', {stdout: [duplexObject]});
expectTypeOf(singleObjectDuplexStdoutResult.stdout).toBe<unknown[]>();
expectTypeOf(singleObjectDuplexStdoutResult.stdio).toBe<[undefined, unknown[], string]>();

const singleObjectDuplexPropertyStdoutResult = await execa('unicorns', {stdout: [duplexObjectProperty]});
expectTypeOf(singleObjectDuplexPropertyStdoutResult.stdout).toBe<unknown[]>();
expectTypeOf(singleObjectDuplexPropertyStdoutResult.stdio).toBe<[undefined, unknown[], string]>();

const singleObjectTransformStdoutResult = await execa('unicorns', {stdout: [{transform: objectGenerator, final: objectFinal, objectMode: true} as const]});
expectTypeOf(singleObjectTransformStdoutResult.stdout).toBe<unknown[]>();
expectTypeOf(singleObjectTransformStdoutResult.stdio).toBe<[undefined, unknown[], string]>();

const manyObjectWebTransformStdoutResult = await execa('unicorns', {stdout: [webTransformObject, webTransformObject]});
expectTypeOf(manyObjectWebTransformStdoutResult.stdout).toBe<unknown[]>();
expectTypeOf(manyObjectWebTransformStdoutResult.stdio).toBe<[undefined, unknown[], string]>();

const manyObjectDuplexStdoutResult = await execa('unicorns', {stdout: [duplexObject, duplexObject]});
expectTypeOf(manyObjectDuplexStdoutResult.stdout).toBe<unknown[]>();
expectTypeOf(manyObjectDuplexStdoutResult.stdio).toBe<[undefined, unknown[], string]>();

const manyObjectDuplexPropertyStdoutResult = await execa('unicorns', {stdout: [duplexObjectProperty, duplexObjectProperty]});
expectTypeOf(manyObjectDuplexPropertyStdoutResult.stdout).toBe<unknown[]>();
expectTypeOf(manyObjectDuplexPropertyStdoutResult.stdio).toBe<[undefined, unknown[], string]>();

const manyObjectTransformStdoutResult = await execa('unicorns', {stdout: [{transform: objectGenerator, final: objectFinal, objectMode: true} as const, {transform: objectGenerator, final: objectFinal, objectMode: true} as const]});
expectTypeOf(manyObjectTransformStdoutResult.stdout).toBe<unknown[]>();
expectTypeOf(manyObjectTransformStdoutResult.stdio).toBe<[undefined, unknown[], string]>();

const falseObjectWebTransformStdoutResult = await execa('unicorns', {stdout: webTransformNotObject});
expectTypeOf(falseObjectWebTransformStdoutResult.stdout).toBe<string>();
expectTypeOf(falseObjectWebTransformStdoutResult.stdio).toBe<[undefined, string, string]>();

const falseObjectDuplexStdoutResult = await execa('unicorns', {stdout: duplexNotObject});
expectTypeOf(falseObjectDuplexStdoutResult.stdout).toBe<string>();
expectTypeOf(falseObjectDuplexStdoutResult.stdio).toBe<[undefined, string, string]>();

const falseObjectDuplexPropertyStdoutResult = await execa('unicorns', {stdout: duplexNotObjectProperty});
expectTypeOf(falseObjectDuplexPropertyStdoutResult.stdout).toBe<string>();
expectTypeOf(falseObjectDuplexPropertyStdoutResult.stdio).toBe<[undefined, string, string]>();

const falseObjectTransformStdoutResult = await execa('unicorns', {stdout: {transform: objectGenerator, final: objectFinal, objectMode: false} as const});
expectTypeOf(falseObjectTransformStdoutResult.stdout).toBe<string>();
expectTypeOf(falseObjectTransformStdoutResult.stdio).toBe<[undefined, string, string]>();

const falseObjectWebTransformStderrResult = await execa('unicorns', {stderr: webTransformNotObject});
expectTypeOf(falseObjectWebTransformStderrResult.stderr).toBe<string>();
expectTypeOf(falseObjectWebTransformStderrResult.stdio).toBe<[undefined, string, string]>();

const falseObjectDuplexStderrResult = await execa('unicorns', {stderr: duplexNotObject});
expectTypeOf(falseObjectDuplexStderrResult.stderr).toBe<string>();
expectTypeOf(falseObjectDuplexStderrResult.stdio).toBe<[undefined, string, string]>();

const falseObjectDuplexPropertyStderrResult = await execa('unicorns', {stderr: duplexNotObjectProperty});
expectTypeOf(falseObjectDuplexPropertyStderrResult.stderr).toBe<string>();
expectTypeOf(falseObjectDuplexPropertyStderrResult.stdio).toBe<[undefined, string, string]>();

const falseObjectTransformStderrResult = await execa('unicorns', {stderr: {transform: objectGenerator, final: objectFinal, objectMode: false} as const});
expectTypeOf(falseObjectTransformStderrResult.stderr).toBe<string>();
expectTypeOf(falseObjectTransformStderrResult.stdio).toBe<[undefined, string, string]>();

const falseObjectWebTransformStdioResult = await execa('unicorns', {stdio: ['pipe', 'pipe', webTransformNotObject]});
expectTypeOf(falseObjectWebTransformStdioResult.stderr).toBe<string>();
expectTypeOf(falseObjectWebTransformStdioResult.stdio).toBe<[undefined, string, string]>();

const falseObjectDuplexStdioResult = await execa('unicorns', {stdio: ['pipe', 'pipe', duplexNotObject]});
expectTypeOf(falseObjectDuplexStdioResult.stderr).toBe<string>();
expectTypeOf(falseObjectDuplexStdioResult.stdio).toBe<[undefined, string, string]>();

const falseObjectDuplexPropertyStdioResult = await execa('unicorns', {stdio: ['pipe', 'pipe', duplexNotObjectProperty]});
expectTypeOf(falseObjectDuplexPropertyStdioResult.stderr).toBe<string>();
expectTypeOf(falseObjectDuplexPropertyStdioResult.stdio).toBe<[undefined, string, string]>();

const falseObjectTransformStdioResult = await execa('unicorns', {stdio: ['pipe', 'pipe', {transform: objectGenerator, final: objectFinal, objectMode: false} as const]});
expectTypeOf(falseObjectTransformStdioResult.stderr).toBe<string>();
expectTypeOf(falseObjectTransformStdioResult.stdio).toBe<[undefined, string, string]>();

const topObjectWebTransformStdoutResult = await execa('unicorns', {stdout: webTransformInstance});
expectTypeOf(topObjectWebTransformStdoutResult.stdout).toBe<string>();
expectTypeOf(topObjectWebTransformStdoutResult.stdio).toBe<[undefined, string, string]>();

const undefinedObjectWebTransformStdoutResult = await execa('unicorns', {stdout: webTransform});
expectTypeOf(undefinedObjectWebTransformStdoutResult.stdout).toBe<string>();
expectTypeOf(undefinedObjectWebTransformStdoutResult.stdio).toBe<[undefined, string, string]>();

const undefinedObjectDuplexStdoutResult = await execa('unicorns', {stdout: duplex});
expectTypeOf(undefinedObjectDuplexStdoutResult.stdout).toBe<string | unknown[]>();
expectTypeOf(undefinedObjectDuplexStdoutResult.stdio).toBe<[undefined, string | unknown[], string]>();

const undefinedObjectTransformStdoutResult = await execa('unicorns', {stdout: {transform: objectGenerator, final: objectFinal}});
expectTypeOf(undefinedObjectTransformStdoutResult.stdout).toBe<string>();
expectTypeOf(undefinedObjectTransformStdoutResult.stdio).toBe<[undefined, string, string]>();

const noObjectTransformStdoutResult = await execa('unicorns', {stdout: objectGenerator, final: objectFinal});
expectTypeOf(noObjectTransformStdoutResult.stdout).toBe<string>();
expectTypeOf(noObjectTransformStdoutResult.stdio).toBe<[undefined, string, string]>();

const trueTrueObjectTransformResult = await execa('unicorns', {stdout: {transform: objectGenerator, final: objectFinal, objectMode: true} as const, stderr: {transform: objectGenerator, final: objectFinal, objectMode: true} as const, all: true});
expectTypeOf(trueTrueObjectTransformResult.stdout).toBe<unknown[]>();
expectTypeOf(trueTrueObjectTransformResult.stderr).toBe<unknown[]>();
expectTypeOf(trueTrueObjectTransformResult.all).toBe<unknown[]>();
expectTypeOf(trueTrueObjectTransformResult.stdio).toBe<[undefined, unknown[], unknown[]]>();

const trueFalseObjectTransformResult = await execa('unicorns', {stdout: {transform: objectGenerator, final: objectFinal, objectMode: true} as const, stderr: {transform: objectGenerator, final: objectFinal, objectMode: false} as const, all: true});
expectTypeOf(trueFalseObjectTransformResult.stdout).toBe<unknown[]>();
expectTypeOf(trueFalseObjectTransformResult.stderr).toBe<string>();
expectTypeOf(trueFalseObjectTransformResult.all).toBe<unknown[]>();
expectTypeOf(trueFalseObjectTransformResult.stdio).toBe<[undefined, unknown[], string]>();

const falseTrueObjectTransformResult = await execa('unicorns', {stdout: {transform: objectGenerator, final: objectFinal, objectMode: false} as const, stderr: {transform: objectGenerator, final: objectFinal, objectMode: true} as const, all: true});
expectTypeOf(falseTrueObjectTransformResult.stdout).toBe<string>();
expectTypeOf(falseTrueObjectTransformResult.stderr).toBe<unknown[]>();
expectTypeOf(falseTrueObjectTransformResult.all).toBe<unknown[]>();
expectTypeOf(falseTrueObjectTransformResult.stdio).toBe<[undefined, string, unknown[]]>();

const falseFalseObjectTransformResult = await execa('unicorns', {stdout: {transform: objectGenerator, final: objectFinal, objectMode: false} as const, stderr: {transform: objectGenerator, final: objectFinal, objectMode: false} as const, all: true});
expectTypeOf(falseFalseObjectTransformResult.stdout).toBe<string>();
expectTypeOf(falseFalseObjectTransformResult.stderr).toBe<string>();
expectTypeOf(falseFalseObjectTransformResult.all).toBe<string>();
expectTypeOf(falseFalseObjectTransformResult.stdio).toBe<[undefined, string, string]>();

const objectTransformStdoutError = new Error('.') as ExecaError<{stdout: {transform: typeof objectGenerator; final: typeof objectFinal; readonly objectMode: true}}>;
expectTypeOf(objectTransformStdoutError.stdout).toBe<unknown[]>();
expectTypeOf(objectTransformStdoutError.stdio).toBe<[undefined, unknown[], string]>();

const objectTransformStderrError = new Error('.') as ExecaError<{stderr: {transform: typeof objectGenerator; final: typeof objectFinal; readonly objectMode: true}}>;
expectTypeOf(objectTransformStderrError.stderr).toBe<unknown[]>();
expectTypeOf(objectTransformStderrError.stdio).toBe<[undefined, string, unknown[]]>();

const objectTransformStdioError = new Error('.') as ExecaError<{stdio: ['pipe', 'pipe', {transform: typeof objectGenerator; final: typeof objectFinal; readonly objectMode: true}]}>;
expectTypeOf(objectTransformStdioError.stderr).toBe<unknown[]>();
expectTypeOf(objectTransformStdioError.stdio).toBe<[undefined, string, unknown[]]>();

const falseObjectTransformStdoutError = new Error('.') as ExecaError<{stdout: {transform: typeof objectGenerator; final: typeof objectFinal; readonly objectMode: false}}>;
expectTypeOf(falseObjectTransformStdoutError.stdout).toBe<string>();
expectTypeOf(falseObjectTransformStdoutError.stdio).toBe<[undefined, string, string]>();

const falseObjectTransformStderrError = new Error('.') as ExecaError<{stderr: {transform: typeof objectGenerator; final: typeof objectFinal; readonly objectMode: false}}>;
expectTypeOf(falseObjectTransformStderrError.stderr).toBe<string>();
expectTypeOf(falseObjectTransformStderrError.stdio).toBe<[undefined, string, string]>();

const falseObjectTransformStdioError = new Error('.') as ExecaError<{stdio: ['pipe', 'pipe', {transform: typeof objectGenerator; final: typeof objectFinal; readonly objectMode: false}]}>;
expectTypeOf(falseObjectTransformStdioError.stderr).toBe<string>();
expectTypeOf(falseObjectTransformStdioError.stdio).toBe<[undefined, string, string]>();
