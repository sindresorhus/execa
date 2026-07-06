import process from 'node:process';
import {execFile} from 'node:child_process';

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
// It must run while the tree is still intact, so it is the only termination performed: killing the
// direct subprocess first would orphan its descendants before `taskkill` could enumerate them.
// Windows does not support signals, so the signal argument is ignored (`/F` terminates the tree).
const killDescendantsWindows = subprocess => {
	if (subprocess.pid === undefined) {
		return false;
	}

	// This is best-effort: any error (such as the subprocess having already exited) is ignored.
	execFile('taskkill', ['/pid', `${subprocess.pid}`, '/T', '/F'], () => {});
	return true;
};
