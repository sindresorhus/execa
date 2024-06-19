import {pathToFileURL} from 'node:url';

export const getOptions = ({stdout: {file}}) => ({stdout: pathToFileURL(file)});
