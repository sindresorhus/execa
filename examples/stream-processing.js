import {execa} from 'execa';

// Example: Processing command output with transforms
// Shows how to filter and transform stdout/stderr streams

async function streamProcessing() {
	console.log('🔄 Stream Processing Examples\n');

	// Example 1: Simple transform - prefix each line
	console.log('1️⃣  Prefixing output lines:');
	const prefixTransform = function* (line) {
		yield `[${new Date().toISOString()}] ${line}`;
	};

	await execa({stdout: prefixTransform})`echo -e "line1\nline2\nline3"`;

	// Example 2: Filter lines containing specific text
	console.log('\n2️⃣  Filtering npm audit output for high severity:');
	const filterHighSeverity = function* (line) {
		if (line.includes('high') || line.includes('critical')) {
			yield line;
		}
	};

	try {
		// Simulated: in real usage, this would be `npm audit`
		await execa({stdout: filterHighSeverity})`echo -e "low: package1\nhigh: vulnerable-package\ninfo: package2"`;
	} catch (error) {
		// npm audit exits with non-zero on vulnerabilities
		console.log('   (Example output only)');
	}

	// Example 3: Count lines transform
	console.log('\n3️⃣  Line counter transform:');
	let lineCount = 0;
	const countTransform = function* (line) {
		lineCount++;
		yield `${lineCount}: ${line}`;
	};

	const {stdout} = await execa({stdout: countTransform, lines: true})`ls -la`;
	console.log(`   Total lines processed: ${lineCount}`);

	// Example 4: Transform to uppercase
	console.log('\n4️⃣  Uppercase transform:');
	const upperTransform = function* (line) {
		yield line.toUpperCase();
	};

	await execa({stdout: upperTransform})`echo "hello world"`;
}

streamProcessing().catch(console.error);
