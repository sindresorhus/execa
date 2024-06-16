export const getOptions = ({type, eventProperty}) => ({
	verbose: (verboseLine, verboseObject) => verboseObject.type === type ? `${verboseObject[eventProperty]}` : undefined,
});
