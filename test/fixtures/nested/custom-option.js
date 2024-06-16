export const getOptions = ({type, optionName}) => ({
	verbose: (verboseLine, verboseObject) => verboseObject.type === type ? `${verboseObject.options[optionName]}` : undefined,
});
