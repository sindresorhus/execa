export const getOptions = ({type}) => ({
	verbose: (verboseLine, verboseObject) => verboseObject.type === type ? JSON.stringify(verboseObject) : undefined,
});
