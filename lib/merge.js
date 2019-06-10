'use strict';

// Merge two objects, including their prototypes
function mergePrototypes(to, from) {
	const prototypes = [...getPrototypes(to), ...getPrototypes(from)];
	const newPrototype = prototypes.reduce(reducePrototype, {});
	return Object.assign(Object.setPrototypeOf(to, newPrototype), to, from);
}

function getPrototypes(object, prototypes = []) {
	const prototype = Object.getPrototypeOf(object);
	if (prototype !== null) {
		return getPrototypes(prototype, [...prototypes, prototype]);
	}

	return prototypes;
}

function reducePrototype(prototype, constructor) {
	return Object.defineProperties(prototype, Object.getOwnPropertyDescriptors(constructor));
}

module.exports = mergePrototypes;

