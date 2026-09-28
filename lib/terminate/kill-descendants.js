import process from 'node:process';
import {execFile} from 'node:child_process';
import path from 'node:path/win32';

const isWindows = process.platform === 'win32';

// The `killDescendants` option terminates the whole process tree, not just the direct child.
// On Unix, this requires spawning the subprocess in its own process group, so we override the
// `detached` argument passed to `child_process.spawn()`.
// This is kept separate from the user-facing `detached` option, which must keep its own value,
// so the `cleanup` behavior is not affected.
export const getSpawnOptions = options => !isWindows && options.killDescendants
	? {...options, detached: true}
	: options;

// Returns the low-level function used to send a signal to the subprocess.
// With the `killDescendants` option, the signal is sent to the whole process tree.
export const getKillFunction = (subprocess, {killDescendants}) => {
	if (!killDescendants) {
		/*
		`subprocess.pid` is `undefined` when the subprocess failed to spawn, e.g. with `ENOENT`.
		`ChildProcess.prototype.kill()` then signals the current process group, since its process id is `0`.
		So, like `ChildProcess.prototype.kill()` does for a subprocess which already exited, nothing is signaled and `false` is returned.
		*/
		const killSubprocess = subprocess.kill.bind(subprocess);
		return (...arguments_) => (subprocess.pid === undefined ? false : killSubprocess(...arguments_));
	}

	const killDescendantsFunction = isWindows ? killDescendantsWindows : killDescendantsUnix;
	return killDescendantsFunction.bind(undefined, subprocess);
};

/*
Unlike `subprocess.kill()`, signaling a process group or a process tree uses the PID directly, without going through the subprocess' handle. The OS can re-assign that PID once it is not used anymore, and signaling it then would terminate an unrelated process, and on Windows its own descendants too.
On Unix, a PID stays reserved as long as it is the process group ID of a running process, i.e. as long as any descendant in that group is still running. So signaling the process group after the subprocess exited is still useful, e.g. for the `forceKillAfterDelay` escalation while Execa is waiting on a descendant, or with `subprocess.kill()` to terminate background descendants once the subprocess has settled. Once the whole group exited, the PID can only be signaled if the OS re-assigned it to a new process group leader, which is unlikely, so this is a documented limitation.
On Windows, there are no process groups: a PID is only reserved while a handle to the process is open, which Node.js closes once the subprocess exits. `taskkill /T` also cannot find the descendants of a process which exited. So the process tree is never signaled once the subprocess exited.
*/
const isAbandoned = subprocess => subprocess.pid === undefined
	|| (isWindows && hasExited(subprocess));

const hasExited = ({exitCode, signalCode}) => exitCode !== null || signalCode !== null;

// On Unix, the subprocess is its own process group leader (its PGID equals its PID), since it
// was spawned with `detached: true`. Sending the signal to `-pid` targets the whole group.
const killDescendantsUnix = (subprocess, signal) => {
	if (isAbandoned(subprocess)) {
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
	if (isAbandoned(subprocess)) {
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
