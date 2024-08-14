// Mimics Node.js when built without ICU support
// See https://github.com/sindresorhus/execa/issues/1143
globalThis.RegExp = class extends RegExp {
	constructor(regExpString, flags) {
		if (flags?.includes('u') && regExpString.includes('\\p{')) {
			throw new Error('Invalid property name');
		}

		super(regExpString, flags);
	}

	static isMocked = true;
};

// Execa computes the RegExp when first loaded, so we must delay this import
await import('./escape.js');
