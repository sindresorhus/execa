import {Duplex} from 'node:stream';
import {expectType} from 'tsd';
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
expectType<unknown[]>(objectTransformLinesStdoutResult.stdout);
expectType<[undefined, unknown[], string[]]>(objectTransformLinesStdoutResult.stdio);

const objectWebTransformStdoutResult = await execa('unicorns', {stdout: webTransformObject});
expectType<unknown[]>(objectWebTransformStdoutResult.stdout);
expectType<[undefined, unknown[], string]>(objectWebTransformStdoutResult.stdio);

const objectDuplexStdoutResult = await execa('unicorns', {stdout: duplexObject});
expectType<unknown[]>(objectDuplexStdoutResult.stdout);
expectType<[undefined, unknown[], string]>(objectDuplexStdoutResult.stdio);

const objectDuplexPropertyStdoutResult = await execa('unicorns', {stdout: duplexObjectProperty});
expectType<unknown[]>(objectDuplexPropertyStdoutResult.stdout);
expectType<[undefined, unknown[], string]>(objectDuplexPropertyStdoutResult.stdio);

const objectTransformStdoutResult = await execa('unicorns', {stdout: {transform: objectGenerator, final: objectFinal, objectMode: true} as const});
expectType<unknown[]>(objectTransformStdoutResult.stdout);
expectType<[undefined, unknown[], string]>(objectTransformStdoutResult.stdio);

const objectWebTransformStderrResult = await execa('unicorns', {stderr: webTransformObject});
expectType<unknown[]>(objectWebTransformStderrResult.stderr);
expectType<[undefined, string, unknown[]]>(objectWebTransformStderrResult.stdio);

const objectDuplexStderrResult = await execa('unicorns', {stderr: duplexObject});
expectType<unknown[]>(objectDuplexStderrResult.stderr);
expectType<[undefined, string, unknown[]]>(objectDuplexStderrResult.stdio);

const objectDuplexPropertyStderrResult = await execa('unicorns', {stderr: duplexObjectProperty});
expectType<unknown[]>(objectDuplexPropertyStderrResult.stderr);
expectType<[undefined, string, unknown[]]>(objectDuplexPropertyStderrResult.stdio);

const objectTransformStderrResult = await execa('unicorns', {stderr: {transform: objectGenerator, final: objectFinal, objectMode: true} as const});
expectType<unknown[]>(objectTransformStderrResult.stderr);
expectType<[undefined, string, unknown[]]>(objectTransformStderrResult.stdio);

const objectWebTransformStdioResult = await execa('unicorns', {stdio: ['pipe', 'pipe', webTransformObject]});
expectType<unknown[]>(objectWebTransformStdioResult.stderr);
expectType<[undefined, string, unknown[]]>(objectWebTransformStdioResult.stdio);

const objectDuplexStdioResult = await execa('unicorns', {stdio: ['pipe', 'pipe', duplexObject]});
expectType<unknown[]>(objectDuplexStdioResult.stderr);
expectType<[undefined, string, unknown[]]>(objectDuplexStdioResult.stdio);

const objectDuplexPropertyStdioResult = await execa('unicorns', {stdio: ['pipe', 'pipe', duplexObjectProperty]});
expectType<unknown[]>(objectDuplexPropertyStdioResult.stderr);
expectType<[undefined, string, unknown[]]>(objectDuplexPropertyStdioResult.stdio);

const objectTransformStdioResult = await execa('unicorns', {stdio: ['pipe', 'pipe', {transform: objectGenerator, final: objectFinal, objectMode: true} as const]});
expectType<unknown[]>(objectTransformStdioResult.stderr);
expectType<[undefined, string, unknown[]]>(objectTransformStdioResult.stdio);

const singleObjectWebTransformStdoutResult = await execa('unicorns', {stdout: [webTransformObject]});
expectType<unknown[]>(singleObjectWebTransformStdoutResult.stdout);
expectType<[undefined, unknown[], string]>(singleObjectWebTransformStdoutResult.stdio);

const singleObjectDuplexStdoutResult = await execa('unicorns', {stdout: [duplexObject]});
expectType<unknown[]>(singleObjectDuplexStdoutResult.stdout);
expectType<[undefined, unknown[], string]>(singleObjectDuplexStdoutResult.stdio);

const singleObjectDuplexPropertyStdoutResult = await execa('unicorns', {stdout: [duplexObjectProperty]});
expectType<unknown[]>(singleObjectDuplexPropertyStdoutResult.stdout);
expectType<[undefined, unknown[], string]>(singleObjectDuplexPropertyStdoutResult.stdio);

const singleObjectTransformStdoutResult = await execa('unicorns', {stdout: [{transform: objectGenerator, final: objectFinal, objectMode: true} as const]});
expectType<unknown[]>(singleObjectTransformStdoutResult.stdout);
expectType<[undefined, unknown[], string]>(singleObjectTransformStdoutResult.stdio);

const manyObjectWebTransformStdoutResult = await execa('unicorns', {stdout: [webTransformObject, webTransformObject]});
expectType<unknown[]>(manyObjectWebTransformStdoutResult.stdout);
expectType<[undefined, unknown[], string]>(manyObjectWebTransformStdoutResult.stdio);

const manyObjectDuplexStdoutResult = await execa('unicorns', {stdout: [duplexObject, duplexObject]});
expectType<unknown[]>(manyObjectDuplexStdoutResult.stdout);
expectType<[undefined, unknown[], string]>(manyObjectDuplexStdoutResult.stdio);

const manyObjectDuplexPropertyStdoutResult = await execa('unicorns', {stdout: [duplexObjectProperty, duplexObjectProperty]});
expectType<unknown[]>(manyObjectDuplexPropertyStdoutResult.stdout);
expectType<[undefined, unknown[], string]>(manyObjectDuplexPropertyStdoutResult.stdio);

const manyObjectTransformStdoutResult = await execa('unicorns', {stdout: [{transform: objectGenerator, final: objectFinal, objectMode: true} as const, {transform: objectGenerator, final: objectFinal, objectMode: true} as const]});
expectType<unknown[]>(manyObjectTransformStdoutResult.stdout);
expectType<[undefined, unknown[], string]>(manyObjectTransformStdoutResult.stdio);

const falseObjectWebTransformStdoutResult = await execa('unicorns', {stdout: webTransformNotObject});
expectType<string>(falseObjectWebTransformStdoutResult.stdout);
expectType<[undefined, string, string]>(falseObjectWebTransformStdoutResult.stdio);

const falseObjectDuplexStdoutResult = await execa('unicorns', {stdout: duplexNotObject});
expectType<string>(falseObjectDuplexStdoutResult.stdout);
expectType<[undefined, string, string]>(falseObjectDuplexStdoutResult.stdio);

const falseObjectDuplexPropertyStdoutResult = await execa('unicorns', {stdout: duplexNotObjectProperty});
expectType<string>(falseObjectDuplexPropertyStdoutResult.stdout);
expectType<[undefined, string, string]>(falseObjectDuplexPropertyStdoutResult.stdio);

const falseObjectTransformStdoutResult = await execa('unicorns', {stdout: {transform: objectGenerator, final: objectFinal, objectMode: false} as const});
expectType<string>(falseObjectTransformStdoutResult.stdout);
expectType<[undefined, string, string]>(falseObjectTransformStdoutResult.stdio);

const falseObjectWebTransformStderrResult = await execa('unicorns', {stderr: webTransformNotObject});
expectType<string>(falseObjectWebTransformStderrResult.stderr);
expectType<[undefined, string, string]>(falseObjectWebTransformStderrResult.stdio);

const falseObjectDuplexStderrResult = await execa('unicorns', {stderr: duplexNotObject});
expectType<string>(falseObjectDuplexStderrResult.stderr);
expectType<[undefined, string, string]>(falseObjectDuplexStderrResult.stdio);

const falseObjectDuplexPropertyStderrResult = await execa('unicorns', {stderr: duplexNotObjectProperty});
expectType<string>(falseObjectDuplexPropertyStderrResult.stderr);
expectType<[undefined, string, string]>(falseObjectDuplexPropertyStderrResult.stdio);

const falseObjectTransformStderrResult = await execa('unicorns', {stderr: {transform: objectGenerator, final: objectFinal, objectMode: false} as const});
expectType<string>(falseObjectTransformStderrResult.stderr);
expectType<[undefined, string, string]>(falseObjectTransformStderrResult.stdio);

const falseObjectWebTransformStdioResult = await execa('unicorns', {stdio: ['pipe', 'pipe', webTransformNotObject]});
expectType<string>(falseObjectWebTransformStdioResult.stderr);
expectType<[undefined, string, string]>(falseObjectWebTransformStdioResult.stdio);

const falseObjectDuplexStdioResult = await execa('unicorns', {stdio: ['pipe', 'pipe', duplexNotObject]});
expectType<string>(falseObjectDuplexStdioResult.stderr);
expectType<[undefined, string, string]>(falseObjectDuplexStdioResult.stdio);

const falseObjectDuplexPropertyStdioResult = await execa('unicorns', {stdio: ['pipe', 'pipe', duplexNotObjectProperty]});
expectType<string>(falseObjectDuplexPropertyStdioResult.stderr);
expectType<[undefined, string, string]>(falseObjectDuplexPropertyStdioResult.stdio);

const falseObjectTransformStdioResult = await execa('unicorns', {stdio: ['pipe', 'pipe', {transform: objectGenerator, final: objectFinal, objectMode: false} as const]});
expectType<string>(falseObjectTransformStdioResult.stderr);
expectType<[undefined, string, string]>(falseObjectTransformStdioResult.stdio);

const topObjectWebTransformStdoutResult = await execa('unicorns', {stdout: webTransformInstance});
expectType<string>(topObjectWebTransformStdoutResult.stdout);
expectType<[undefined, string, string]>(topObjectWebTransformStdoutResult.stdio);

const undefinedObjectWebTransformStdoutResult = await execa('unicorns', {stdout: webTransform});
expectType<string>(undefinedObjectWebTransformStdoutResult.stdout);
expectType<[undefined, string, string]>(undefinedObjectWebTransformStdoutResult.stdio);

const undefinedObjectDuplexStdoutResult = await execa('unicorns', {stdout: duplex});
expectType<string | unknown[]>(undefinedObjectDuplexStdoutResult.stdout);
expectType<[undefined, string | unknown[], string]>(undefinedObjectDuplexStdoutResult.stdio);

const undefinedObjectTransformStdoutResult = await execa('unicorns', {stdout: {transform: objectGenerator, final: objectFinal}});
expectType<string>(undefinedObjectTransformStdoutResult.stdout);
expectType<[undefined, string, string]>(undefinedObjectTransformStdoutResult.stdio);

const noObjectTransformStdoutResult = await execa('unicorns', {stdout: objectGenerator, final: objectFinal});
expectType<string>(noObjectTransformStdoutResult.stdout);
expectType<[undefined, string, string]>(noObjectTransformStdoutResult.stdio);

const trueTrueObjectTransformResult = await execa('unicorns', {stdout: {transform: objectGenerator, final: objectFinal, objectMode: true} as const, stderr: {transform: objectGenerator, final: objectFinal, objectMode: true} as const, all: true});
expectType<unknown[]>(trueTrueObjectTransformResult.stdout);
expectType<unknown[]>(trueTrueObjectTransformResult.stderr);
expectType<unknown[]>(trueTrueObjectTransformResult.all);
expectType<[undefined, unknown[], unknown[]]>(trueTrueObjectTransformResult.stdio);

const trueFalseObjectTransformResult = await execa('unicorns', {stdout: {transform: objectGenerator, final: objectFinal, objectMode: true} as const, stderr: {transform: objectGenerator, final: objectFinal, objectMode: false} as const, all: true});
expectType<unknown[]>(trueFalseObjectTransformResult.stdout);
expectType<string>(trueFalseObjectTransformResult.stderr);
expectType<unknown[]>(trueFalseObjectTransformResult.all);
expectType<[undefined, unknown[], string]>(trueFalseObjectTransformResult.stdio);

const falseTrueObjectTransformResult = await execa('unicorns', {stdout: {transform: objectGenerator, final: objectFinal, objectMode: false} as const, stderr: {transform: objectGenerator, final: objectFinal, objectMode: true} as const, all: true});
expectType<string>(falseTrueObjectTransformResult.stdout);
expectType<unknown[]>(falseTrueObjectTransformResult.stderr);
expectType<unknown[]>(falseTrueObjectTransformResult.all);
expectType<[undefined, string, unknown[]]>(falseTrueObjectTransformResult.stdio);

const falseFalseObjectTransformResult = await execa('unicorns', {stdout: {transform: objectGenerator, final: objectFinal, objectMode: false} as const, stderr: {transform: objectGenerator, final: objectFinal, objectMode: false} as const, all: true});
expectType<string>(falseFalseObjectTransformResult.stdout);
expectType<string>(falseFalseObjectTransformResult.stderr);
expectType<string>(falseFalseObjectTransformResult.all);
expectType<[undefined, string, string]>(falseFalseObjectTransformResult.stdio);

const objectTransformStdoutError = new Error('.') as ExecaError<{stdout: {transform: typeof objectGenerator; final: typeof objectFinal; readonly objectMode: true}}>;
expectType<unknown[]>(objectTransformStdoutError.stdout);
expectType<[undefined, unknown[], string]>(objectTransformStdoutError.stdio);

const objectTransformStderrError = new Error('.') as ExecaError<{stderr: {transform: typeof objectGenerator; final: typeof objectFinal; readonly objectMode: true}}>;
expectType<unknown[]>(objectTransformStderrError.stderr);
expectType<[undefined, string, unknown[]]>(objectTransformStderrError.stdio);

const objectTransformStdioError = new Error('.') as ExecaError<{stdio: ['pipe', 'pipe', {transform: typeof objectGenerator; final: typeof objectFinal; readonly objectMode: true}]}>;
expectType<unknown[]>(objectTransformStdioError.stderr);
expectType<[undefined, string, unknown[]]>(objectTransformStdioError.stdio);

const falseObjectTransformStdoutError = new Error('.') as ExecaError<{stdout: {transform: typeof objectGenerator; final: typeof objectFinal; readonly objectMode: false}}>;
expectType<string>(falseObjectTransformStdoutError.stdout);
expectType<[undefined, string, string]>(falseObjectTransformStdoutError.stdio);

const falseObjectTransformStderrError = new Error('.') as ExecaError<{stderr: {transform: typeof objectGenerator; final: typeof objectFinal; readonly objectMode: false}}>;
expectType<string>(falseObjectTransformStderrError.stderr);
expectType<[undefined, string, string]>(falseObjectTransformStderrError.stdio);

const falseObjectTransformStdioError = new Error('.') as ExecaError<{stdio: ['pipe', 'pipe', {transform: typeof objectGenerator; final: typeof objectFinal; readonly objectMode: false}]}>;
expectType<string>(falseObjectTransformStdioError.stderr);
expectType<[undefined, string, string]>(falseObjectTransformStdioError.stdio);
