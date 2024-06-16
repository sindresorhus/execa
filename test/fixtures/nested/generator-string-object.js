import {getOutputGenerator} from '../../helpers/generator.js';
import {simpleFull} from '../../helpers/lines.js';

export const getOptions = () => ({stdout: getOutputGenerator(simpleFull)(true)});
