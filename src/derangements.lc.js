import { readFileSync } from "fs";
import * as LC from "@codewars/lambda-calculus";
import path from "path";
import { fileURLToPath } from "url";
import { memo1 } from "./util.js";
import words from "./words-small.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

LC.configure({
	purity: "Let",
	// Do not automatically encode or decode
	numEncoding: { fromInt: x => x, toInt: x => x },
});

const code = readFileSync(path.join(__dirname, "derangements.lc"), { encoding: "utf8" });
export const lcTerms = LC.compile(code);

export const decodeBool = b => b(true)(false);
export const encodeBool = b => b ? lcTerms["true"] : lcTerms["false"];

export const decodeNat = n => n(0)(nPred => (decodeNat(nPred) + 1));
export const encodeNat = memo1(n => {
	const { zero, succ } = lcTerms;
	if (n === 0) return zero;
	if (n < 0) throw new Error("Can only encode non-negative integers.");
	return succ(encodeNat(n - 1));
});

export const decodeList = xs => xs ([]) (head => tail => [head, ...decodeList(tail)]);
export const encodeList = xs => {
	const { nil, cons } = lcTerms;
	return xs.reduceRight((xs, x) => cons(x)(xs), nil);
};

export const decodeChar = n => String.fromCharCode(decodeNat(n) + "A".charCodeAt(0));
export const encodeChar = c => {
	if (c.length !== 1 || c < "A" || c > "Z") {
		throw new Error("Can only encode single uppercase letters.");
	}
	return encodeNat(c.charCodeAt(0) - "A".charCodeAt(0));
}

export const encodeString = str => encodeList(str.split("").map(encodeChar));
export const decodeString = str => decodeList(str).map(decodeChar).join("");

export const encodePair = ([x, y]) => {
	const { pair } = lcTerms;
	return pair(x)(y);
}
export const decodePair = p => p(x => y => [x, y]);

export const encodeTriple = ([x, y, z]) => {
	const { triple } = lcTerms;
	return triple(x)(y)(z);
}
export const decodeTriple = t => t(x => y => z => [x, y, z]);


export const decodeOrd = ord => ord(-1)(0)(1);
export const encodeOrd = ord => {
	const { lt, eq, gt } = lcTerms;
	if (ord === -1) return lt;
	if (ord === 0) return eq;
	if (ord === 1) return gt;
	throw new Error("Can only encode -1, 0, or 1 as Ord.");
}

const main = () => {
	const { main } = lcTerms;
	const lcWords = encodeList(words.map(encodeString));
	const result = decodeList(main(lcWords)).map(e => decodeList(e).map(f => decodePair(f).map(decodeString)));
	console.log(JSON.stringify(result, null, 2));
}

main();
