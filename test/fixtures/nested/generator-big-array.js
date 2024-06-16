import {getOutputGenerator} from '../../helpers/generator.js';

const bigArray = Array.from({length: 100}, (_, index) => index);
export const getOptions = () => ({stdout: getOutputGenerator(bigArray)(true)});
