///<reference types="jest" />
import { assert } from "chai";
import { ArrayUtilities } from "../../src/utils/ArrayUtilities";
describe("ArrayUtilities", () => {
	test.each([
		[
			[1, 2, 3, 4, 5, 6],
			2,
			[[1, 2], [3, 4], [5, 6]]
		],
		[
			[1, 2, 3, 4, 5, 6],
			1,
			[[1], [2], [3], [4], [5], [6]]
		],
		[
			[1, 2, 3, 4, 5, 6],
			6,
			[[1, 2, 3, 4, 5, 6]]
		],
		[
			[1, 2, 3, 4, 5, 6],
			4,
			[[1, 2, 3, 4], [5, 6]]
		]
	])("should split to sub array of n", (array, length, expectedArray) => {
		let actualResult = ArrayUtilities.splitToMaxLength(array, length);
		assert.deepEqual(actualResult, expectedArray);
	});
	test("should getSubMap", () => {
		let map = new Map<string, string>();
		map.set("test1", "testValue1");
		map.set("test2", "testValue2");
		map.set("test3", "testValue3");
		map.set("test4", "testValue4");

		let expectedMap = new Map<string, string>();
		expectedMap.set("test2", "testValue2");
		expectedMap.set("test3", "testValue3");

		let actualResult = ArrayUtilities.getSubMap(map, ["test2", "test3"]);

		assert.deepEqual(actualResult, expectedMap);
	});
});
