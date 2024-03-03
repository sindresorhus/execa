import {execa, execaSync} from '../../index.js';

export const earlyErrorOptions = {killSignal: false};
export const getEarlyErrorProcess = options => execa('empty.js', {...earlyErrorOptions, ...options});
export const getEarlyErrorProcessSync = options => execaSync('empty.js', {...earlyErrorOptions, ...options});

export const expectedEarlyError = {code: 'ERR_INVALID_ARG_TYPE'};
