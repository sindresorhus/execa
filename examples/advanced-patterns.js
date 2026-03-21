import { execa, $ } from 'execa';

/**
 * Advanced patterns with execa
 * Demonstrates powerful features: lines, pipes, verbose mode, and script syntax
 */

/**
 * Process command output line by line using the lines option
 * Perfect for log analysis and line-oriented processing
 */
async function processLinesExample() {
	console.log('📋 Processing git log line by line:\n');

	// Get recent commits and process each line individually
	const { stdout } = await execa({
		lines: true,
		verbose: 'short',
	}) `git log --oneline -5`;

	// stdout is now an array of lines
	for (const [index, line] of stdout.entries()) {
		console.log(`  ${index + 1}. ${line}`);
	}
}

/**
 * Pipe multiple commands together
 * Equivalent to: git log --oneline | grep -i "docs" | wc -l
 */
async function pipeExample() {
	console.log('\n🔗 Piping commands together:\n');

	// Count docs commits in recent history
	// Note: Using reject: false for grep since it exits 1 when no matches
	try {
		const count = await execa({
			lines: true,
		}) `git log --oneline -30`
			.pipe({
				lines: true,
				reject: false,  // Don't throw on non-zero exit
			}) `grep -i docs`
			.pipe `wc -l`;

		console.log(`  Found ${count.stdout.trim()} docs-related commits in recent history`);
	} catch (error) {
		console.log(`  Note: ${error.message}`);
	}
}

/**
 * Use verbose mode for debugging
 * Shows exactly what's being executed
 */
async function verboseExample() {
	console.log('\n🐛 Verbose mode (shows command execution details):\n');

	// 'short' shows command name and main options
	await execa({
		verbose: 'short',
	}) `node --version`;

	// 'full' also shows environment variables, data, etc.
	console.log('\n  --- Full verbose example (truncated output) ---');
	await execa({
		verbose: 'full',
	}) `echo "Hello from execa"`;
}

/**
 * Script syntax with $ - perfect for shell-like scripts
 */
async function scriptSyntaxExample() {
	console.log('\n📜 Script syntax with $:\n');

	// The $ function provides a shell-like experience
	const os = process.platform;
	console.log(`  Running on: ${os}`);

	if (os === 'darwin') {
		// macOS
		const { stdout } = await $ `sw_vers -productVersion`;
		console.log(`  macOS version: ${stdout}`);
	} else if (os === 'linux') {
		// Linux
		try {
			const { stdout } = await $ `lsb_release -d -s`;
			console.log(`  Linux distro: ${stdout}`);
		} catch {
			console.log('  Linux (lsb_release not available)');
		}
	}

	// Template expressions are escaped automatically
	const filename = 'file with spaces.txt';
	console.log(`  Safe filename handling: "${filename}"`);
	// await $ `cat ${filename}`; // Automatically escaped, no shell injection risk
}

/**
 * Graceful error handling with detailed error information
 */
async function errorHandlingExample() {
	console.log('\n❌ Graceful error handling:\n');

	try {
		await execa({
			verbose: 'short',
		}) `nonexistent-command-xyz`;
	} catch (error) {
		console.log(`  Command failed with exit code: ${error.exitCode}`);
		console.log(`  Error message: ${error.message}`);
		console.log('  💡 Tip: Use reject: false option to prevent throwing');
	}
}

/**
 * All-in-one: Practical CI/CD pipeline example
 */
async function ciPipelineExample() {
	console.log('\n🚀 CI Pipeline simulation:\n');

	const steps = [
		{ name: 'Lint', cmd: () => $ `echo "Running linter..."` },
		{ name: 'Test', cmd: () => $ `echo "Running tests..."` },
		{ name: 'Build', cmd: () => $ `echo "Building project..."` },
	];

	for (const step of steps) {
		process.stdout.write(`  ${step.name}... `);
		try {
			await step.cmd();
			console.log('✅');
		} catch {
			console.log('❌');
			return;
		}
	}
	console.log('\n  🎉 All steps completed successfully!');
}

// Run all examples
if (import.meta.url === `file://${process.argv[1]}`) {
	console.log('🎯 Advanced Execa Patterns\n');
	console.log('='.repeat(50));

	await processLinesExample();
	await pipeExample();
	await verboseExample();
	await scriptSyntaxExample();
	await errorHandlingExample();
	await ciPipelineExample();

	console.log('\n' + '='.repeat(50));
	console.log('\n✨ Learn more: https://github.com/sindresorhus/execa#readme');
}

export {
	processLinesExample,
	pipeExample,
	verboseExample,
	scriptSyntaxExample,
	errorHandlingExample,
	ciPipelineExample,
};
