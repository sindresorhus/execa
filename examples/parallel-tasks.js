import { execa } from 'execa';

/**
 * Running commands in parallel
 * Demonstrates concurrent execution with proper error handling
 */

/**
 * Run multiple linting tasks in parallel
 */
async function runParallelLints() {
	console.log('🔍 Running linters in parallel...\n');

	try {
		const tasks = [
			{ name: 'ESLint', cmd: ['eslint', '.'] },
			{ name: 'Prettier', cmd: ['prettier', '--check', '.'] },
			{ name: 'TypeScript', cmd: ['tsc', '--noEmit'] },
		];

		const results = await Promise.allSettled(
			tasks.map(async ({ name, cmd }) => {
				console.log(`🚀 Starting ${name}...`);
				await execa('npx', cmd);
				return { name, status: 'passed' };
			})
		);

		console.log('\n📊 Results:');
		let hasErrors = false;
		
		for (const result of results) {
			if (result.status === 'fulfilled') {
				console.log(`  ✅ ${result.value.name}`);
			} else {
				console.log(`  ❌ ${result.reason.name || 'Task'}`);
				hasErrors = true;
			}
		}

		if (hasErrors) {
			process.exit(1);
		}

	} catch (error) {
		console.error('Unexpected error:', error);
		process.exit(1);
	}
}

/**
 * Run multiple independent commands in parallel
 * with a limit on concurrency
 */
async function runWithLimit(tasks, limit = 3) {
	const results = [];
	const executing = [];

	for (const [index, task] of tasks.entries()) {
		const promise = task().then(result => ({ index, result }));
		results.push(promise);

		if (tasks.length >= limit) {
			executing.push(promise);
			if (executing.length >= limit) {
				await Promise.race(executing);
				executing.splice(executing.findIndex(p => p === promise), 1);
			}
		}
	}

	return Promise.all(results);
}

// Demo
if (import.meta.url === `file://${process.argv[1]}`) {
	runParallelLints();
}

export { runParallelLints, runWithLimit };
