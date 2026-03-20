import {$} from 'execa';

// Example: Build script with error handling
// Demonstrates common patterns for build automation

async function build() {
	console.log('🚀 Starting build process...\n');

	try {
		// Clean previous build
		console.log('🧹 Cleaning previous build...');
		await $`rm -rf dist`;

		// Run linting
		console.log('🔍 Running linter...');
		await $`eslint src/`;

		// Run tests
		console.log('🧪 Running tests...');
		await $`npm test`;

		// Build the project
		console.log('📦 Building project...');
		await $`npm run build`;

		console.log('\n✅ Build completed successfully!');
	} catch (error) {
		console.error('\n❌ Build failed:', error.shortMessage || error.message);
		process.exit(1);
	}
}

build();
