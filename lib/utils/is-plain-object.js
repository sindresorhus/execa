export default function isPlainObject(v) {
	return v && typeof v === 'object' && (Object.getPrototypeOf(v) === null || Object.getPrototypeOf(v) === Object.prototype);
}
