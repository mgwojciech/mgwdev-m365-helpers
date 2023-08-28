///<reference types="jest" />
import { CamlQueryBuilder } from "../../src/utils/queryBuilders/CamlQueryBuilder";
describe("CamlQueryBuilder", () => {
	test("should build a query with a two queries", () => {
		let query = `<And><Eq><FieldRef Name="Status" /><Value Type="Choice">Ordered</Value></Eq><Eq><FieldRef Name="_ModerationStatus" /><Value Type="ModStat">Pending</Value></Eq></And>`;
		let additionalQuery = `<Eq><FieldRef Name="Test" /><Value Type="Choice">Test 1</Value></Eq>`;

		const expectedQuery = `<And>${query}${additionalQuery}</And>`;

		let camlQueryBuilder = new CamlQueryBuilder();
		camlQueryBuilder.withQuery(query).withQuery(additionalQuery);

		expect(camlQueryBuilder.build()).toBe(expectedQuery);
	});
	test("should build a query with query and a field query", () => {
		let query = `<Eq><FieldRef Name="Test" /><Value Type="Choice">Test 1</Value></Eq>`;

		let expectedQuery = `<And>${query}<Eq><FieldRef Name='Test1' /><Value Type='Text'>Test 2</Value></Eq></And>`
		let camlQueryBuilder = new CamlQueryBuilder();
		let actualQuery = camlQueryBuilder.withQuery(query).withFieldQuery({
			name: "Test1",
			value: "Test 2",
			type: "Text",
			comparer: "Eq"
		}).build();

		expect(actualQuery).toBe(expectedQuery);
	});
	test("should build a query with a single query", () => {
		let query = `<Eq><FieldRef Name="Test" /><Value Type="Choice">Test 1</Value></Eq>`;

		let queryBuilder = new CamlQueryBuilder();
		let actualQuery = queryBuilder.withQuery(query).build();

		expect(actualQuery).toBe(query);
	});
	test("should build a query with a single field query", () => {
		let expectedQuery = `<Eq><FieldRef Name='Test1' /><Value Type='Text'>Test 2</Value></Eq>`;
		let camlQueryBuilder = new CamlQueryBuilder();
		let actualQuery = camlQueryBuilder.withFieldQuery({
			name: "Test1",
			value: "Test 2",
			type: "Text",
			comparer: "Eq"
		}).build();

		expect(actualQuery).toBe(expectedQuery);
	});
	test("should throw and exception for not ok field name", () => {
		let camlQueryBuilder = new CamlQueryBuilder();

		expect(()=>{
			camlQueryBuilder.withFieldQuery({
				name: "",
				value: "Test 2",
				type: "Text",
				comparer: "Eq"
			});
		}).toThrowError("Field name is required");
	})
	test("should throw and exception for not ok field type", () => {
		let camlQueryBuilder = new CamlQueryBuilder();

		expect(()=>{
			camlQueryBuilder.withFieldQuery({
				name: "Test",
				value: "Test 2",
				type: "",
				comparer: "Eq"
			});
		}).toThrowError("Field type is required");
	})
	test("should default to Eq for not ok field comparer", () => {
		let camlQueryBuilder = new CamlQueryBuilder();
		let query = camlQueryBuilder.withFieldQuery({
			name: "Test",
			value: "Test 2",
			type: "Text",
			//@ts-ignore
			comparer: ""
		}).build();
		expect(query).toBe("<Eq><FieldRef Name='Test' /><Value Type='Text'>Test 2</Value></Eq>")
	});
	test("should build query with Membership Comparer", ()=>{
		let camlQueryBuilder = new CamlQueryBuilder();
		let query = camlQueryBuilder.withFieldQuery({
			name: "CustomAudience",
			value: "",
			type: "Membership",
			comparer: "CurrentUserGroups"
		}).build();

		expect(query.replace(/\s+/g, ' ').trim()).toBe(`<Or>
        <Membership Type="CurrentUserGroups">
          <FieldRef Name="CustomAudience"/>
        </Membership>
        <Eq>
          <FieldRef Name="CustomAudience"></FieldRef>
          <Value Type="Integer">
            <UserID/>
          </Value>
        </Eq>
        </Or>`.replace(/\s+/g, ' ').trim());
	});
	test("should build query with IDEq Comparer", ()=>{
		const camlQueryBuilder = new CamlQueryBuilder();
		const query = camlQueryBuilder.withFieldQuery({
			name: "CustomAudience",
			value: "1",
			type: "Lookup",
			comparer: "IDEq"
		}).build();

		expect(query.replace(/\s+/g, ' ').trim()).toBe(`<Eq><FieldRef Name='CustomAudience' LookupId='True' /><Value Type='Lookup'>1</Value></Eq>`.replace(/\s+/g, ' ').trim());
	});
});
