export const getStdinOption = stdioOption => ({stdin: stdioOption});
export const getStdoutOption = stdioOption => ({stdout: stdioOption});
export const getStderrOption = stdioOption => ({stderr: stdioOption});
export const getStdioOption = stdioOption => ({stdio: ['pipe', 'pipe', 'pipe', stdioOption]});
export const getPlainStdioOption = stdioOption => ({stdio: stdioOption});
export const getInputOption = input => ({input});
export const getInputFileOption = inputFile => ({inputFile});

export const getScriptSync = $ => $.sync;

export const identity = value => value;
