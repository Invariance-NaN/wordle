import words from "./words.json" with { type: "json" };

const pairs = function*(arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            yield [arr[i], arr[j]];
        }
    }
}

const range = (lo, hi) => Array.from({ length: hi - lo }, (_, i) => lo + i);

const sortStr = str => str.split("").sort().join("");

const anagramBuckets = (() => {
    const result = new Map();

    for (const word of words) {
        const key = sortStr(word);
        if (result.has(key)) {
            result.get(key).push(word);
        } else {
            result.set(key, [word]);
        }
    }

    return result;
})();

for (const [_key, anagrams] of anagramBuckets) {
    for (const [x, y] of pairs(anagrams)) {
        if (range(0, 5).every(i => x[i] != y[i])) {
            console.log(x, y);
        }
    }
}
