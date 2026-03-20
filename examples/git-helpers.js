import { execa } from 'execa';

/**
 * Git helper functions using execa
 * Wrappers for common git operations
 */

/**
 * Get the current git branch
 */
async function getCurrentBranch() {
	const { stdout } = await execa('git', ['branch', '--show-current']);
	return stdout.trim();
}

/**
 * Get the latest commit message
 */
async function getLatestCommit() {
	const { stdout } = await execa('git', ['log', '-1', '--pretty=%s']);
	return stdout.trim();
}

/**
 * Check if working directory is clean
 */
async function isWorkingDirectoryClean() {
	try {
		await execa('git', ['diff', '--quiet']);
		await execa('git', ['diff', '--staged', '--quiet']);
		return true;
	} catch {
		return false;
	}
}

/**
 * Get repository status
 */
async function getStatus() {
	const { stdout } = await execa('git', ['status', '--short']);
	return stdout || 'Working directory clean';
}

/**
 * Stage all changes and commit
 */
async function stageAndCommit(message) {
	await execa('git', ['add', '.']);
	await execa('git', ['commit', '-m', message]);
	console.log(`✅ Committed: ${message}`);
}

// Demo
if (import.meta.url === `file://${process.argv[1]}`) {
	console.log('📁 Git Repository Info\n');
	
	console.log(`Branch: ${await getCurrentBranch()}`);
	console.log(`Last commit: ${await getLatestCommit()}`);
	console.log(`Working directory: ${await isWorkingDirectoryClean() ? '✅ Clean' : '⚠️  Dirty'}`);
	console.log(`Status:\n${await getStatus()}`);
}

export {
	getCurrentBranch,
	getLatestCommit,
	isWorkingDirectoryClean,
	getStatus,
	stageAndCommit,
};
