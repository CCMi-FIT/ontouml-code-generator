import * as chai from "chai";
const expect = chai.expect;
import {stringToBoolean, stringToNullableBoolean, getAllCombinations} from "../src/utilities";

describe("utilities'", (): void => {
    describe("stringToBoolean function", (): void => {
        it("returns true", (): void => {
            expect(stringToBoolean("true")).to.be.true;
        });
        it("ignores case", (): void => {
            expect(stringToBoolean("TrUe")).to.be.true;
        });
        it("ignores whitespace", (): void => {
            expect(stringToBoolean(" true  ")).to.be.true;
        });
        it("returns false for empty string", (): void => {
            expect(stringToBoolean("")).to.be.false;
        });
        it("returns false for unknown values", (): void => {
            expect(stringToBoolean("jibberish")).to.be.false;
        });
    });

    describe("stringToBoolean function", (): void => {
        it("returns true", (): void => {
            expect(stringToNullableBoolean("true")).to.be.true;
        });
        it("ignores case", (): void => {
            expect(stringToNullableBoolean("TrUe")).to.be.true;
        });
        it("ignores whitespace", (): void => {
            expect(stringToNullableBoolean(" true  ")).to.be.true;
        });
        it("returns null for empty string", (): void => {
            expect(stringToNullableBoolean("")).to.be.null;
        });
        it("returns null for null string", (): void => {
            expect(stringToNullableBoolean(null)).to.be.null;
        });
        it("returns false for unknown values", (): void => {
            expect(stringToNullableBoolean("jibberish")).to.be.false;
        });
    });

    describe("getAllCombinations function", (): void => {
        it("handles empty array", (): void => {
            expect(getAllCombinations([], 1)).to.have.deep.members([[]]);
        });
        it("handles non-empty array", (): void => {
            expect(getAllCombinations([1, 2, 3], 2)).to.have.deep.members([[1, 2], [2, 3], [1, 3], [1, 2, 3]]);
        });
    });
});