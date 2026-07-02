// Mimics Node.js when built without ICU support
// See https://github.com/sindresorhus/execa/issues/1143
// eslint-disable-next-line unicorn/no-global-object-property-assignment -- intentionally mocking the global `RegExp`
globalThis.RegExp = class extends RegExp {
	static isMocked = true;

	constructor(regExpString, flags) {
		if (flags?.includes('u') && regExpString.includes('\\p{')) {
			throw new Error('Invalid property name');
		}

		super(regExpString, flags);
	}
};

// Execa computes the RegExp when first loaded, so we must delay this import
await import('./escape.js');
