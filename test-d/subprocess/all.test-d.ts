import type {Readable} from 'node:stream';
import {expectType} from 'tsd';
import {execa} from '../../index.js';

const allPromise = execa('unicorns', {all: true});
expectType<Readable>(allPromise.all);

const noAllPromise = execa('unicorns');
expectType<undefined>(noAllPromise.all);
