export const memo1 = fn => {
	const cache = new Map();
	return function memoized(n) {
		if (cache.has(n)) {
			return cache.get(n);
		}
		const result = fn(n);
		cache.set(n, result);
		return result;
	};
}
