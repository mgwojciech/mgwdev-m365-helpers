/**
 * @jest-environment jsdom
 */
///<reference types="jest" />
import { assert } from "chai";
import { queueRequest, useStorage } from "../../src/utils/FunctionUtils";
var sessionStorageMock = (function () {
	var store = {};
	return {
	  getItem: function (key) {
		let result = store[key];
		return result || null;
	  },
	  setItem: function (key, value) {
		store[key] = value ? value.toString() : "";
		this.length = Object.keys(store).length;
	  },
	  clear: function () {
		store = {};
	  },
	  key: function (id) {
		return Object.keys(store)[id];
	  },
	  removeItem: function (key) {
		delete store[key];
	  },
	  length: 0
	};
  })();
  Object.defineProperty(window, 'sessionStorage', {
	value: sessionStorageMock
  });
describe("FunctionUtils", ()=>{
	class TestClass {
		constructor(protected err?:string){

		}
		@useStorage("test-key")
		public getData(): Promise<string> {
			if(this.err){
				throw new Error(this.err);
			}
			return Promise.resolve("data");
		}
	}
	class TestClassComputedKey {
		constructor(protected err?:string){

		}
		@useStorage("test-key-{0}")
		public getData(testArgument: string): Promise<string> {
			if(this.err){
				throw new Error(this.err);
			}
			return Promise.resolve("data");
		}
	}
	class TestQueueClass {
		constructor(protected getDataMethod: () => Promise<string>) {
		}
		@queueRequest("getDataFunctionKey")
		public getData(): Promise<string> {
			return this.getDataMethod();
		}
		@queueRequest("getDataFunctionKey-{0}")
		public getDataWithArgs(arg): Promise<string> {
			return this.getDataMethod().then((result) => `${result}-${arg}`);
		}
	}
	beforeEach(()=>{
		sessionStorage.clear();
	})
	test("should get data and store it", async () => {
		let testClass = new TestClass();
		let data = await testClass.getData();
		expect(data).toBe("data");
		assert.equal(JSON.parse(sessionStorage.getItem("test-key")), "data");
	});
	test("should return from cache", async () => {
		sessionStorage.setItem("test-key", JSON.stringify("cached-data"));
		let testClass = new TestClass("test-error");
		let data = await testClass.getData();
		expect(data).toBe("cached-data");
		assert.equal(JSON.parse(sessionStorage.getItem("test-key")), "cached-data");
	});
	test("should use computed key", async () => {
		let testClass = new TestClassComputedKey();
		let data = await testClass.getData("test-arg");
		expect(data).toBe("data");
		assert.equal(JSON.parse(sessionStorage.getItem("test-key-test-arg")), "data");
	});
	
	test("should getData and call method only once", async () => {
		const test = {
			getDataMethod: () => new Promise<string>((resolve) => {
				setTimeout(() => resolve("Test"), 500);
			})
		}

		const spy = jest.spyOn(test, "getDataMethod");
		let testClass = new TestQueueClass(test.getDataMethod);
		let [data1, data2, data3, data4] = await Promise.all([testClass.getData(), testClass.getData(), testClass.getData(), testClass.getData()]);

		assert.equal(data1, "Test");
		assert.equal(data2, "Test");
		assert.equal(data3, "Test");
		assert.equal(data4, "Test");

		expect(spy).toHaveBeenCalledTimes(1);
	});
	test("should getData and call method once across multiple instances", async () => {
		const test = {
			getDataMethod: () => new Promise<string>((resolve) => {
				setTimeout(() => resolve("Test"), 500);
			})
		}

		const spy = jest.spyOn(test, "getDataMethod");
		let testClass = new TestQueueClass(test.getDataMethod);
		let testClass1 = new TestQueueClass(test.getDataMethod);
		let [data1, data2, data11, data12] = await Promise.all([
			testClass.getData(),
			testClass.getData(),
			testClass.getData(),
			testClass.getData(),
			testClass1.getData(),
			testClass1.getData(),
			testClass1.getData(),
			testClass1.getData()]);

		assert.equal(data1, "Test");
		assert.equal(data2, "Test");
		assert.equal(data11, "Test");
		assert.equal(data12, "Test");

		expect(spy).toHaveBeenCalledTimes(1);
	});
	test("should getData and call method only twice with different args", async () => {
		const test = {
			getDataMethod: () => new Promise<string>((resolve) => {
				setTimeout(() => resolve("Test"), 500);
			})
		}

		const spy = jest.spyOn(test, "getDataMethod");
		let testClass = new TestQueueClass(test.getDataMethod);
		let [data1, data2, data3, data4] = await Promise.all([
			testClass.getDataWithArgs("1"),
			testClass.getDataWithArgs("1"),
			testClass.getDataWithArgs("2"),
			testClass.getDataWithArgs("2")]);

		assert.equal(data1, "Test-1");
		assert.equal(data2, "Test-1");
		assert.equal(data3, "Test-2");
		assert.equal(data4, "Test-2");

		expect(spy).toHaveBeenCalledTimes(2);
	});
});
				