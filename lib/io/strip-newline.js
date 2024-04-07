import stripFinalNewlineFunction from 'strip-final-newline';

export const stripNewline = (value, {stripFinalNewline}, fdNumber) => getStripFinalNewline(stripFinalNewline, fdNumber) && value !== undefined && !Array.isArray(value)
	? stripFinalNewlineFunction(value)
	: value;

export const getStripFinalNewline = (stripFinalNewline, fdNumber) => fdNumber === 'all'
	? stripFinalNewline[1] || stripFinalNewline[2]
	: stripFinalNewline[fdNumber];
