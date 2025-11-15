import { expect, test, describe } from "vitest";
import { decodeBool, decodeNat, decodeList, lcTerms, encodeBool, encodeNat, encodeList, decodePair, encodePair, decodeTriple, encodeTriple, encodeOrd, decodeOrd } from "./derangements.lc.js";
import fc from "fast-check";


describe("booleans", () => {
	const { not } = lcTerms;

	test("encode/decode round trip", () => {
		expect(decodeBool(encodeBool(true))).toBe(true);
		expect(decodeBool(encodeBool(false))).toBe(false);
	});

	test("`not`", () => {
		expect(decodeBool(not(encodeBool(true)))).toBe(false);
		expect(decodeBool(not(encodeBool(false)))).toBe(true);
	});

	test("`and`" , () => {
		const { and } = lcTerms;
		expect(decodeBool(and(encodeBool(true))(encodeBool(true)))).toBe(true);
		expect(decodeBool(and(encodeBool(true))(encodeBool(false)))).toBe(false);
		expect(decodeBool(and(encodeBool(false))(encodeBool(true)))).toBe(false);
		expect(decodeBool(and(encodeBool(false))(encodeBool(false)))).toBe(false);
	});

	test("`or`" , () => {
		const { or } = lcTerms;
		expect(decodeBool(or(encodeBool(true))(encodeBool(true)))).toBe(true);
		expect(decodeBool(or(encodeBool(true))(encodeBool(false)))).toBe(true);
		expect(decodeBool(or(encodeBool(false))(encodeBool(true)))).toBe(true);
		expect(decodeBool(or(encodeBool(false))(encodeBool(false)))).toBe(false);
	});
});

describe("pairs", () => {
	const { 'pair-fst': fst, 'pair-snd': snd } = lcTerms;

	test("encode/decode round trip", () => fc.assert(
		fc.property(fc.integer(), fc.integer(), (x, y) => {
			expect(decodePair(encodePair([x, y]))).toStrictEqual([x, y]);
		})
	));

	test("accessors", () => fc.assert(
		fc.property(fc.integer(), fc.integer(), (x, y) => {
			const p = encodePair([x, y]);
			expect(fst(p)).toBe(x);
			expect(snd(p)).toBe(y);
		})
	));
});

describe("triples", () => {
	const { 'triple-fst': fst, 'triple-snd': snd, 'triple-thd': thd, 'triple-map-fst': mapFst, 'triple-map-snd': mapSnd, 'triple-map-thd': mapThd } = lcTerms;

	test("encode/decode round trip", () => fc.assert(
		fc.property(fc.integer(), fc.integer(), fc.integer(), (x, y, z) => {
			expect(decodeTriple(encodeTriple([x, y, z]))).toStrictEqual([x, y, z]);
		})
	));

	test("accessors", () => fc.assert(
		fc.property(fc.integer(), fc.integer(), fc.integer(), (x, y, z) => {
			const t = encodeTriple([x, y, z]);
			expect(fst(t)).toBe(x);
			expect(snd(t)).toBe(y);
			expect(thd(t)).toBe(z);
		})
	));

	describe("mappers", () => {
		test("property test on fixed functions", () => fc.assert(
			fc.property(fc.integer(), fc.integer(), fc.integer(), (x, y, z) => {
				const f = n => n + 1;
				const g = n => n * n;
				const h = n => -n;

				expect(decodeTriple(mapThd(h)(mapSnd(g)(mapFst(f)(encodeTriple([x, y, z])))))).toStrictEqual([f(x), g(y), h(z)]);
			})
		));
	});
});

describe("orderings", () => {
	test("encode/decode round trip", () => {
		expect(decodeOrd(encodeOrd(-1))).toBe(-1);
		expect(decodeOrd(encodeOrd(0))).toBe(0);
		expect(decodeOrd(encodeOrd(1))).toBe(1);
	});
});

describe("natural numbers", () => {
	const { 'nat-cmp': cmp, 'nat-eq': eq, 'nat-ne': ne, 'nat-lt': lt, 'nat-le': le, 'nat-gt': gt, 'nat-ge': ge } = lcTerms;

	test("encode/decode round trip", () => fc.assert(
		fc.property(fc.integer({ min: 0, max: 200 }), n => {
			expect(decodeNat(encodeNat(n))).toBe(n);
		})
	));

	describe("nat comparisons", () => {
		test("`nat-cmp`", () => fc.assert(
			fc.property(fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 100 }), (n, m) => {
				const lcN = encodeNat(n);
				const lcM = encodeNat(m);
				const expected = n < m ? -1 : n > m ? 1 : 0;
				const actual = decodeOrd(cmp(lcN)(lcM));
				expect(actual).toBe(expected);
			})
		));

		test("derived comparisons", () => fc.assert(
			fc.property(fc.integer({ min: 0, max: 50 }), fc.integer({ min: 0, max: 50 }), (n, m) => {
				const lcN = encodeNat(n);
				const lcM = encodeNat(m);
				expect(decodeBool(eq(lcN)(lcM))).toBe(n === m);
				expect(decodeBool(ne(lcN)(lcM))).toBe(n !== m);
				expect(decodeBool(lt(lcN)(lcM))).toBe(n < m);
				expect(decodeBool(le(lcN)(lcM))).toBe(n <= m);
				expect(decodeBool(gt(lcN)(lcM))).toBe(n > m);
				expect(decodeBool(ge(lcN)(lcM))).toBe(n >= m);
			})
		));
	});
});

describe("lists", () => {
	const { nil, cons, foldr, concat, map, filter, any, all, 'group-by': groupBy, 'sort-by': sortBy, 'nat-cmp': natCmp } = lcTerms;

	test("encode/decode round trip", () => fc.assert(
		fc.property(fc.array(fc.integer({ min: 0, max: 100 })), xs => {
			expect(decodeList(encodeList(xs))).toStrictEqual(xs);
		})
	));

	describe("`foldr`", () => {
		test("identity with `foldr`", () => fc.assert(
			fc.property(fc.array(fc.integer({ min: 0, max: 100 })), xs => {
				const actual = decodeList(foldr(cons)(nil)(encodeList(xs)));
				expect(actual).toStrictEqual(xs);
			})
		));

		test("sum with `foldr`", () => fc.assert(
			fc.property(fc.array(fc.integer({ min: 0, max: 100 })), xs => {
				const actual = foldr(n => m => n + m)(0)(encodeList(xs));
				const expected = xs.reduce((n, m) => n + m, 0);
				expect(actual).toStrictEqual(expected);
			})
		));
	});

	test("`concat`", () => {
		fc.property(fc.array(fc.integer({ min: 0, max: 100 })), fc.array(fc.integer({ min: 0, max: 100 })), (xs, ys) => {
			const actual = decodeList(concat(encodeList(xs))(encodeList(ys)));
			const expected = xs.concat(ys);
			expect(actual).toStrictEqual(expected);
		})
	});

	test("`zipWith` for element-wise sum", () => {
		fc.property(fc.array(fc.integer({ min: 0, max: 100 })), fc.array(fc.integer({ min: 0, max: 100 })), (xs, ys) => {
			const actual = decodeList(lcTerms.zipWith(x => y => x + y)(encodeList(xs))(encodeList(ys)));

			const expected = [];
			for (let i = 0; i < Math.min(xs.length, ys.length); i++) {
				expected.push(xs[i] + ys[i]);
			}

			expect(actual).toStrictEqual(expected);
		})
	});

	test("`map` with squaring function", () => fc.assert(
		fc.property(fc.array(fc.integer({ min: 0, max: 100 })), xs => {
			const actual = decodeList(map(x => x * x)(encodeList(xs)));
			const expected = xs.map(x => x * x);
			expect(actual).toStrictEqual(expected);
		})
	));


	test("`filter` with threshold function", () => fc.assert(
		fc.property(fc.array(fc.integer({ min: 0, max: 100 })), fc.integer({ min: 0, max: 100 }), (xs, threshold) => {
			const actual = decodeList(filter(x => encodeBool(x < threshold))(encodeList(xs)));
			const expected = xs.filter(x => x < threshold);
			expect(actual).toStrictEqual(expected);
		})
	));

	describe("`any`", () => {
		test("fixed tests", () => {
			expect(decodeBool(any(x => encodeBool(x > 5))(encodeList([])))).toBe(false);
			expect(decodeBool(any(x => encodeBool(x > 5))(encodeList([1, 2, 3])))).toBe(false);
			expect(decodeBool(any(x => encodeBool(x > 5))(encodeList([1, 6, 3])))).toBe(true);
		});

		test("threshold function", () => fc.assert(
		fc.property(fc.array(fc.integer({ min: -20, max: 10 })), fc.integer({ min: -10, max: 20 }), (xs, threshold) => {
				const actual = decodeBool(any(x => encodeBool(x > threshold))(encodeList(xs)));
				const expected = xs.some(x => x > threshold);
				expect(actual).toBe(expected);
			})
		));
	});

	describe("`all`", () => {
		test("fixed tests", () => {
			expect(decodeBool(all(x => encodeBool(x > 5))(encodeList([])))).toBe(true);
			expect(decodeBool(all(x => encodeBool(x > 5))(encodeList([6, 7, 8])))).toBe(true);
			expect(decodeBool(all(x => encodeBool(x > 5))(encodeList([6, 4, 8])))).toBe(false);
		});

		test("threshold function", () => fc.assert(
		fc.property(fc.array(fc.integer({ min: -20, max: 10 })), fc.integer({ min: -10, max: 20 }), (xs, threshold) => {
				const actual = decodeBool(all(x => encodeBool(x >= threshold))(encodeList(xs)));
				const expected = xs.every(x => x >= threshold);
				expect(actual).toBe(expected);
			})
		));
	});

	test("`pairs`", () => {
		fc.property(fc.array(fc.integer({ min: 0, max: 100 })), xs => {
			const actual = decodeList(lcTerms.pairs(encodeList(xs)));

			const expected = [];

			for (let i = 0; i < xs.length; i++) {
				for (let j = i + 1; j < xs.length; j++) {
					expected.push([xs[i], xs[j]]);
				}
			}

			expect(actual).toStrictEqual(expected);
		})
	});

	test("`group-by` with equality", () => {
		fc.property(fc.array(fc.integer({ min: 0, max: 5 })), xs => {
			const actual = decodeList(map(decodeList)(groupBy(x => y => encodeBool(x === y))(encodeList(xs))));

			const expected = [];

			for (const x of xs) {
				if (expected.length && expected[expected.length - 1][0] === x) {
					expected[expected.length - 1].push(x);
				} else {
					expected.push([x]);
				}
			}

			expect(actual).toStrictEqual(expected);
		})
	});

	describe("list comparisons", () => {
		const { "list-nat-cmp": listNatCmp } = lcTerms;
		const cmpList = (xs, ys) => {
			for (let i = 0; i < Math.min(xs.length, ys.length); i++) {
				if (xs[i] < ys[i]) return -1;
				if (xs[i] > ys[i]) return 1;
			}

			// A more typical implementation:
			// return xs.length < ys.length ? -1 : xs.length > ys.length ? 1 : 0;
			return 0;
		};

		test("`list-nat-cmp`", () => fc.assert(
			fc.property(fc.array(fc.integer({ min: 0, max: 10 })), fc.array(fc.integer({ min: 0, max: 10 })), (xs, ys) => {
				const actual = decodeOrd(listNatCmp(encodeList(xs.map(encodeNat)))(encodeList(ys.map(encodeNat))));
				const expected = cmpList(xs, ys);
				expect(actual).toBe(expected);
			})
		));

		// Derived comparisons are already tested for nats, so `list-nat-eq` is not tested.
	});

	describe("`sort`", () => {
		test("sorts nats", () => fc.assert(
			fc.property(fc.array(fc.integer({ min: 0, max: 10 }), { maxLength: 7 }), xs => {
				const actual = decodeList(sortBy(natCmp)(encodeList(xs.map(encodeNat)))).map(decodeNat);
				const expected = xs.sort((x, y) => x - y);
				expect(actual).toStrictEqual(expected);
			})
		));
	});
});
