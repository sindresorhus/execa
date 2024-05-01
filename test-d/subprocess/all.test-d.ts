import type {Readable} from 'node:stream';
import {expectType} from 'tsd';
import {execa} from '../../index.js';

const allSubprocess = execa('unicorns', {all: true});
expectType<Readable>(allSubprocess.all);

const noAllSubprocess = execa('unicorns');
expectType<undefined>(noAllSubprocess.all);
