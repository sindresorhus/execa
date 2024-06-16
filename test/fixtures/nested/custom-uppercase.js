export const getOptions = () => ({
	verbose(verboseLine, {type}) {
		return type === 'command' ? verboseLine.replace('noop', 'NOOP') : undefined;
	},
});
