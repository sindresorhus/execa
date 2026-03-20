import {execa} from 'execa';

// Example: Git helper functions
// Common git operations wrapped for programmatic usage

/**
 * Get the current git branch
 */
export async function getCurrentBranch() {
	const {stdout} = await execa`git branch --show-current`;
	return stdout;
}

/**
 * Check if working directory is clean
 */
export async function isWorkingDirectoryClean() {
	try {
		await execa`git diff --quiet`;
		return true;
	} catch {
		return false;
	}
}

/**
 * Get the latest commit message
 */
export async function getLastCommitMessage() {
	const {stdout} = await execa`git log -1 --pretty=%B`;
	return stdout.trim();
}

/**
 * Get list of changed files
 */
export async function getChangedFiles() {
	const {stdout} = await execa`git status --porcelain`;
	if (!stdout) return [];
	return stdout.split('\n').map(line => line.slice(3).trim()).filter(Boolean);
}

// Demo: Run examples if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	console.log('📁 Git Helpers Demo\n');

	const branch = await getCurrentBranch();
	console.log(`Current branch: ${branch}`);

	const isClean = await isWorkingDirectoryClean();
	console.log(`Working directory clean: ${isClean ? '✅' : '⚠️ Has uncommitted changes'}`);

	const lastCommit = await getLastCommitMessage();
	console.log(`Last commit: ${lastCommit.slice(0, 50)}${lastCommit.length > 50 ? '...' : ''}`);

	const changedFiles = await getChangedFiles();
	console.log(`Changed files: ${changedFiles.length > 0 ? changedFiles.join(', ') : 'None'}`);
}
