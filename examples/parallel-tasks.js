import {execa} from 'execa';

// Example: Running multiple commands in parallel
// Demonstrates Promise.all() patterns with Execa

async function runParallel() {
	console.log('⚡ Running parallel tasks...\n');

	// Example 1: Run independent commands in parallel
	console.log('1️⃣  Running independent commands in parallel:');
	const startTime = Date.now();

	const [nodeVersion, npmVersion, gitVersion] = await Promise.all([
		execa`node --version`,
		execa`npm --version`,
		execa`git --version`,
	]);

	console.log(`   Node: ${nodeVersion.stdout}`);
	console.log(`   npm: v${npmVersion.stdout}`);
	console.log(`   Git: ${gitVersion.stdout}`);
	console.log(`   ⏱️  Time: ${Date.now() - startTime}ms\n`);

	// Example 2: Parallel with error handling
	console.log('2️⃣  Parallel with individual error handling:');
	const results = await Promise.allSettled([
		execa`node --version`,
		execa`nonexistent-command`,
		execa`git --version`,
	]);

	results.forEach((result, index) => {
		if (result.status === 'fulfilled') {
			console.log(`   ✅ Task ${index + 1}: ${result.value.stdout.slice(0, 30)}`);
		} else {
			console.log(`   ❌ Task ${index + 1}: Failed`);
		}
	});

	// Example 3: Parallel with timeout
	console.log('\n3️⃣  Parallel with timeout:');
	try {
		const {stdout} = await execa({timeout: 5000})`sleep 1 && echo "Completed"`;
		console.log(`   ✅ Result: ${stdout}`);
	} catch (error) {
		console.log(`   ⏱️  Timed out or failed: ${error.shortMessage}`);
	}
}

runParallel().catch(console.error);
