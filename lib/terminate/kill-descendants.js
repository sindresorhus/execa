import process from 'node:process';
import {execFile} from 'node:child_process';
import path from 'node:path/win32';

const isWindows = process.platform === 'win32';

// The `killDescendants` option terminates the whole process tree, not just the direct child.
// On Unix, this requires spawning the subprocess in its own process group, so we override the
// `detached` argument passed to `child_process.spawn()`.
// This is kept separate from the user-facing `detached` option, which must keep its own value,
// so the `cleanup` behavior is not affected.
export const getSpawnOptions = options => options.killDescendants && !isWindows
	? {...options, detached: true}
	: options;

// Returns the low-level function used to send a signal to the subprocess.
// With the `killDescendants` option, the signal is sent to the whole process tree.
export const getKillFunction = (subprocess, {killDescendants}) => {
	if (!killDescendants) {
		return subprocess.kill.bind(subprocess);
	}

	const killDescendantsFunction = isWindows ? killDescendantsWindows : killDescendantsUnix;
	return killDescendantsFunction.bind(undefined, subprocess);
};

// On Unix, the subprocess is its own process group leader (its PGID equals its PID), since it
// was spawned with `detached: true`. Sending the signal to `-pid` targets the whole group.
const killDescendantsUnix = (subprocess, signal) => {
	if (subprocess.pid === undefined) {
		return false;
	}

	try {
		return process.kill(-subprocess.pid, signal);
	} catch {
		// The process group might already be gone, or signaling it might not be permitted, so we
		// fall back to the direct child. Like `ChildProcess.kill()`, this returns `false` instead of throwing.
		return subprocess.kill(signal);
	}
};

// Windows has no process groups. Instead, `taskkill /T` recursively terminates the process tree.
// It must run while the tree is still intact, so direct subprocess termination is only used as a
// fallback: killing the direct subprocess first would orphan its descendants before `taskkill` could enumerate them.
// If `taskkill` is unavailable or fails, the fallback only terminates the direct subprocess.
// `taskkill` ignores the signal (`/F` terminates the tree).
const killDescendantsWindows = (subprocess, signal) => {
	if (subprocess.pid === undefined) {
		return false;
	}

	const taskkillFile = getTaskkillFile();
	if (taskkillFile === undefined) {
		return subprocess.kill(signal);
	}

	// This is best-effort: if `taskkill` fails, still try the direct subprocess.
	execFile(taskkillFile, ['/pid', `${subprocess.pid}`, '/T', '/F'], error => {
		if (error) {
			subprocess.kill(signal);
		}
	});
	return true;
};

export const getTaskkillFile = () => {
	const windowsDirectory = [process.env.SystemRoot, process.env.windir]
		.find(directory => directory && isWindowsDriveAbsolutePath(directory));

	return windowsDirectory === undefined
		? undefined
		: path.join(windowsDirectory, 'System32', 'taskkill.exe');
};

const isWindowsDriveAbsolutePath = directory => {
	const {root} = path.parse(directory);
	return /^[a-z]:[/\\]/i.test(root);
};
