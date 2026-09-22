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

/*
`subprocess.pid` is `undefined` when the subprocess failed to spawn, e.g. with `ENOENT`.
`ChildProcess.prototype.kill()` then signals the current process group, since its process id is `0`.
So, like `ChildProcess.prototype.kill()` does for a subprocess which already exited, nothing is signaled and `false` is returned.
*/

// Returns the low-level function used to send a signal to the subprocess.
// With the `killDescendants` option, the signal is sent to the whole process tree.
export const getKillFunction = (subprocess, {killDescendants}, {signal: controllerSignal}) => {
	if (!killDescendants) {
		const killSubprocess = subprocess.kill.bind(subprocess);
		return (...arguments_) => (subprocess.pid === undefined ? false : killSubprocess(...arguments_));
	}

	const killDescendantsFunction = isWindows ? killDescendantsWindows : killDescendantsUnix;
	return killDescendantsFunction.bind(undefined, subprocess, controllerSignal);
};

/*
Unlike `subprocess.kill()`, signaling a process group or a process tree uses the PID directly, without going through the subprocess' handle. The OS can re-assign that PID once the tree is gone, and signaling it then would terminate an unrelated process, and on Windows its own descendants too.
On Unix, a PID stays reserved as long as it is the process group ID of a running process, so it can only be re-assigned once every descendant exited too. While Execa is still waiting on the subprocess, the signal is still useful, e.g. for the `forceKillAfterDelay` escalation, which happens after the subprocess exited but while a descendant might still be running. Once Execa is done with the subprocess, no internal logic sends signals anymore, so only `subprocess.kill()` can. Like `ChildProcess.kill()`, it then becomes a noop returning `false`. This narrows the window during which a re-assigned PID could be signaled, without removing it, e.g. when Execa is still waiting on a slow transform after the whole process group exited.
On Windows, there are no process groups: a PID is only reserved while a handle to the process is open, which Node.js closes once the subprocess exits. `taskkill /T` also cannot find the descendants of a process which exited. So the process tree is never signaled once the subprocess exited.
*/
const isAbandoned = (subprocess, controllerSignal) => subprocess.pid === undefined
	|| (hasExited(subprocess) && (isWindows || controllerSignal.aborted));

const hasExited = ({exitCode, signalCode}) => exitCode !== null || signalCode !== null;

// On Unix, the subprocess is its own process group leader (its PGID equals its PID), since it
// was spawned with `detached: true`. Sending the signal to `-pid` targets the whole group.
const killDescendantsUnix = (subprocess, controllerSignal, signal) => {
	if (isAbandoned(subprocess, controllerSignal)) {
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
const killDescendantsWindows = (subprocess, controllerSignal, signal) => {
	if (isAbandoned(subprocess, controllerSignal)) {
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
