import type {Readable} from 'node:stream';
import {expectTypeOf} from 'nz';
import {execa} from '../../index.js';

const allSubprocess = execa('unicorns', {all: true});
expectTypeOf(allSubprocess.all).toBe<Readable>();

const noAllSubprocess = execa('unicorns');
expectTypeOf(noAllSubprocess.all).toBe<undefined>();
