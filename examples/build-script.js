import { execa } from 'execa';

/**
 * Build automation example with error handling
 * Demonstrates running build commands with proper error handling
 */

async function runBuild() {
	console.log('🔨 Starting build process...\n');

	try {
		// Clean previous build
		console.log('🧹 Cleaning previous build...');
		await execa('rm', ['-rf', 'dist']);
		console.log('✅ Clean complete\n');

		// Type checking
		console.log('🔍 Running type check...');
		await execa('tsc', ['--noEmit'], { stdio: 'inherit' });
		console.log('✅ Type check passed\n');

		// Building
		console.log('📦 Building project...');
		const { stdout } = await execa('npm', ['run', 'build']);
		console.log(stdout);
		console.log('✅ Build successful!\n');

	} catch (error) {
		console.error('❌ Build failed:', error.message);
		process.exit(1);
	}
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	runBuild();
}

export { runBuild };
