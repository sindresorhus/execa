import process from 'node:process';
import figures from 'figures';
import {
	gray as grayColor,
	bold as boldColor,
	redBright as redBrightColor,
	yellowBright as yellowBrightColor,
} from 'yoctocolors';

// `yoctocolors` checks whether the terminal type supports colors, but not whether `stderr`, where this is printed, is a terminal.
// Like `util.styleText()`, colors are not used when `stderr` is redirected, e.g. to a file, unless `FORCE_COLOR` is set.
const hasColors = process.env.FORCE_COLOR !== undefined || process.stderr.isTTY === true;
const identity = string => string;
const getColor = color => hasColors ? color : identity;
const gray = getColor(grayColor);
const bold = getColor(boldColor);
const redBright = getColor(redBrightColor);
const yellowBright = getColor(yellowBrightColor);

// Default when `verbose` is not a function
export const defaultVerboseFunction = ({
	type,
	message,
	timestamp,
	piped,
	commandId,
	result: {failed = false} = {},
	options: {reject = true},
}) => {
	const timestampString = serializeTimestamp(timestamp);
	const icon = ICONS[type]({failed, reject, piped});
	const color = COLORS[type]({reject});
	return `${gray(`[${timestampString}]`)} ${gray(`[${commandId}]`)} ${color(icon)} ${color(message)}`;
};

// Prepending the timestamp allows debugging the slow paths of a subprocess
const serializeTimestamp = timestamp => `${padField(timestamp.getHours(), 2)}:${padField(timestamp.getMinutes(), 2)}:${padField(timestamp.getSeconds(), 2)}.${padField(timestamp.getMilliseconds(), 3)}`;

const padField = (field, padding) => String(field).padStart(padding, '0');

const getFinalIcon = ({failed, reject}) => {
	if (!failed) {
		return figures.tick;
	}

	return reject ? figures.cross : figures.warning;
};

const ICONS = {
	command: ({piped}) => piped ? '|' : '$',
	output: () => ' ',
	ipc: () => '*',
	error: getFinalIcon,
	duration: getFinalIcon,
};

const COLORS = {
	command: () => bold,
	output: () => identity,
	ipc: () => identity,
	error: ({reject}) => reject ? redBright : yellowBright,
	duration: () => gray,
};
