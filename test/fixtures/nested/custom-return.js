export const getOptions = ({verboseOutput}) => ({
	verbose(verboseLine, {type}) {
		return type === 'command' ? verboseOutput : undefined;
	},
});
