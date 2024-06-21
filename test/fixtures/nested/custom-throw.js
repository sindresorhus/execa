export const getOptions = ({type, errorMessage}) => ({
	verbose(verboseLine, verboseObject) {
		if (verboseObject.type === type) {
			throw new Error(errorMessage);
		}
	},
});
