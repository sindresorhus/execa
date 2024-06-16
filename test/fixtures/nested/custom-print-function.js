export const getOptions = ({type, fdNumber, secondFdNumber}) => ({
	verbose: {
		[fdNumber](verboseLine, verboseObject) {
			if (verboseObject.type === type) {
				console.warn(verboseLine);
			}
		},
		[secondFdNumber]: 'none',
	},
});
