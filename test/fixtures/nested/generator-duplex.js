import {uppercaseBufferDuplex} from '../../helpers/duplex.js';

export const getOptions = () => ({stdout: uppercaseBufferDuplex()});
