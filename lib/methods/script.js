export const setScriptSync = (boundExeca, createNested, boundOptions) => {
	boundExeca.sync = createNested(mapScriptSync, boundOptions);
	boundExeca.s = boundExeca.sync;
};

export const mapScriptAsync = ({options}) => getScriptOptions(options);
const mapScriptSync = ({options}) => ({...getScriptOptions(options), isSync: true});

const getScriptOptions = options => ({options: {...getScriptStdinOption(options), ...options}});

const getScriptStdinOption = ({input, inputFile, stdio}) => input === undefined && inputFile === undefined && stdio === undefined
	? {stdin: 'inherit'}
	: {};

export const deepScriptOptions = {preferLocal: true};
