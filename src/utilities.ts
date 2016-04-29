/**
 * Converts a boolean string to boolean. Returns true if s is equal to "true" (case insensitive), false othwerwise.
 * @param s The string to convert.
 */
export function stringToBoolean(s: string): boolean {
    "use strict";
    return (s && s.toUpperCase().trim() === "TRUE") || false;
}

/**
 * Converts a boolean string to boolean. Returns null if s is null or empty, true if s is equal to "true" (case insensitive), false othwerwise.
 * @param s The string to convert.
 */
export function stringToNullableBoolean(s: string): boolean {
    "use strict";
    if (!s) {
        return null;
    }
    return s.toUpperCase().trim() === "TRUE";
}

/**
 * Gets all combinations of items from the array provided.
 * @param a The array to process.
 * @param minLength Minimal length of the combinations. Defaults to 1.
 */
export function getAllCombinations<T>(a: T[], minLength: number = 1): T[][] {
    "use strict";
    //http://stackoverflow.com/a/5752056/2546338
    var fn = (n: number, src, got, all) => {
        if (n === 0) {
            if (got.length > 0) {
                all[all.length] = got;
            }
            return;
        }
        for (let j = 0; j < src.length; j++) {
            fn(n - 1, src.slice(j + 1), got.concat([src[j]]), all);
        }
        return;
    }
    const all = [];
    for (let i = minLength; i < a.length; i++) {
        fn(i, a, [], all);
    }
    all.push(a);
    return all;
}