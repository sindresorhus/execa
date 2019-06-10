'use strict';

// Merge two objects, including their prototypes
function mergePrototypes(to, from) {
	const prototypes = [...getPrototypes(to), ...getPrototypes(from)];
	const prototype = prototypes.reduce(shallowMerge, {});
	return Object.assign(Object.setPrototypeOf(to, prototype), from);
}

function getPrototypes(object, prototypes = []) {
	const prototype = Object.getPrototypeOf(object);
	if (prototype !== null) {
		return getPrototypes(prototype, [...prototypes, prototype]);
	}

	return prototypes;
}

function shallowMerge(toObject, fromObject) {
	return Object.defineProperties(toObject, Object.getOwnPropertyDescriptors(fromObject));
}

module.exports = mergePrototypes;

