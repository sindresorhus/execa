export const getOptions = ({type, fdNumber}) => ({
	verbose: setFdSpecific(
		fdNumber,
		(verboseLine, verboseObject) => verboseObject.type === type ? verboseLine : undefined,
	),
});

const setFdSpecific = (fdNumber, option) => fdNumber === undefined
	? option
	: {[fdNumber]: option};
