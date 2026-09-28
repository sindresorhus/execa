import stripFinalNewlineFunction from 'strip-final-newline';

// Apply `stripFinalNewline` option, which applies to `result.stdout|stderr|all|stdio[*]`.
// If the `lines` option is used, it is applied on each line, but using a different function.
export const stripNewline = (value, {stripFinalNewline}, fdNumber, allFds) => value !== undefined && !Array.isArray(value) && getStripFinalNewline(stripFinalNewline, fdNumber, allFds)
	? stripFinalNewlineFunction(value)
	: value;

// Retrieve `stripFinalNewline` option value, including with `subprocess.all`
// With `subprocess.all`, `allFds` are the file descriptors it actually interleaves. Only those are considered, otherwise a single one would be stripped because another one defaults to being stripped.
export const getStripFinalNewline = (stripFinalNewline, fdNumber, allFds) => fdNumber === 'all'
	? allFds.some(allFd => stripFinalNewline[allFd])
	: stripFinalNewline[fdNumber];
