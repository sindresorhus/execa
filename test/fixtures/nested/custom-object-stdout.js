import {foobarObject} from '../../helpers/input.js';

export const getOptions = () => ({
	verbose: (verboseLine, {type}) => type === 'output' ? verboseLine : undefined,
	stdout: {
		* transform() {
			yield foobarObject;
		},
		objectMode: true,
	},
});
