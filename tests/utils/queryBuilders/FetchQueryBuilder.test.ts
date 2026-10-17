///<reference types="jest" />
import { FetchQueryBuilder } from "../../../src/utils/queryBuilders/FetchQueryBuilder";

describe("FetchQueryBuilder", () => {
    let queryBuilder: FetchQueryBuilder;

    beforeEach(() => {
        queryBuilder = new FetchQueryBuilder();
    });

    test("should build a basic query", () => {
        const query = queryBuilder.build();
        expect(query).toBeDefined();
    });

    test("should build a single field query (eq)", () => {
        queryBuilder.withFieldQuery({
            name: "Title",
            value: "Test",
            type: "Text",
            comparer: "Eq"
        });
        const query = queryBuilder.build();
        expect(query).toContain(`<filter type="and"><condition attribute="Title" operator="eq" value="Test"/></filter>`);
    });
    test("should build a single field query (contains)", () => {
        queryBuilder.withFieldQuery({
            name: "Title",
            value: "Test",
            type: "Text",
            comparer: "Contains"
        });
        const query = queryBuilder.build();
        expect(query).toContain(`<filter type="and"><condition attribute="Title" operator="like" value="%Test%"/></filter>`);
    });
    test("should build a single field query (begins with)", () => {
        queryBuilder.withFieldQuery({
            name: "Title",
            value: "Test",
            type: "Text",
            comparer: "BeginsWith"
        });
        const query = queryBuilder.build();
        expect(query).toContain(`<filter type="and"><condition attribute="Title" operator="like" value="Test%"/></filter>`);
    });
    test("should build a single field query (lt)", () => {
        queryBuilder.withFieldQuery({
            name: "Title",
            value: "30",
            type: "Number",
            comparer: "Lt"
        });
        const query = queryBuilder.build();
        expect(query).toContain(`<filter type="and"><condition attribute="Title" operator="lt" value="30"/></filter>`);
    });
    test("should build a single field query (le)", () => {
        queryBuilder.withFieldQuery({
            name: "Title",
            value: "30",
            type: "Number",
            comparer: "Leq"
        });
        const query = queryBuilder.build();
        expect(query).toContain(`<filter type="and"><condition attribute="Title" operator="le" value="30"/></filter>`);
    });
    test("should build a single field query (ge)", () => {
        queryBuilder.withFieldQuery({
            name: "Title",
            value: "30",
            type: "Number",
            comparer: "Geq"
        });
        const query = queryBuilder.build();
        expect(query).toContain(`<filter type="and"><condition attribute="Title" operator="ge" value="30"/></filter>`);
    });
    test("should build a single field query (gt)", () => {
        queryBuilder.withFieldQuery({
            name: "Title",
            value: "30",
            type: "Number",
            comparer: "Gt"
        });
        const query = queryBuilder.build();
        expect(query).toContain(`<filter type="and"><condition attribute="Title" operator="gt" value="30"/></filter>`);
    });
    test("should build a combination query (and)", () => {
        queryBuilder.withFieldQuery({
            name: "BaseValue",
            value: "30",
            type: "Number",
            comparer: "Gt"
        }).withFieldQuery({
            name: "Title",
            value: "Test",
            type: "Text",
            comparer: "Eq"
        });

        const query = queryBuilder.build();
        const expected = `<filter type="and"><filter type="and"><condition attribute="BaseValue" operator="gt" value="30"/></filter><filter type="and"><condition attribute="Title" operator="eq" value="Test"/></filter></filter>`;
        expect(query).toBe(expected);
    });

    test("should build a combination query (or)", () => {
        queryBuilder.withFieldQuery({
            name: "BaseValue",
            value: "30",
            comparer: "Gt"
        }).withFieldQuery({
            name: "Title",
            value: "Test",
            comparer: "Eq"
        }, "Or");

        expect(queryBuilder.build()).toBe(`<filter type="or"><filter type="and"><condition attribute="BaseValue" operator="gt" value="30"/></filter><filter type="or"><condition attribute="Title" operator="eq" value="Test"/></filter></filter>`);
    });

    test("should prefer the field joinWith over the joinBy argument", () => {
        queryBuilder.withFieldQuery({
            name: "BaseValue",
            value: "30",
            comparer: "Gt"
        }).withFieldQuery({
            name: "Title",
            value: "Test",
            comparer: "Eq",
            joinWith: "Or"
        }, "And");

        expect(queryBuilder.build()).toBe(`<filter type="or"><filter type="and"><condition attribute="BaseValue" operator="gt" value="30"/></filter><filter type="or"><condition attribute="Title" operator="eq" value="Test"/></filter></filter>`);
    });

    test.each(["And", "Or"] as const)("should combine raw query fragments using %s", (joinBy) => {
        const first = `<condition attribute="BaseValue" operator="gt" value="30"/>`;
        const second = `<condition attribute="Title" operator="eq" value="Test"/>`;
        queryBuilder.withQuery(first).withQuery(second, joinBy);

        const joinType = joinBy.toLowerCase();
        expect(queryBuilder.build()).toBe(`<filter type="${joinType}"><filter type="and">${first}</filter><filter type="${joinType}">${second}</filter></filter>`);
    });

    test("should preserve the existing group when mixing joins and query entry points", () => {
        const first = `<condition attribute="BaseValue" operator="gt" value="30"/>`;
        const third = `<condition attribute="Status" operator="eq" value="Active"/>`;
        queryBuilder.withQuery(first).withFieldQuery({
            name: "Title",
            value: "Test",
            comparer: "Eq"
        }, "Or").withQuery(third);

        const expected = `<filter type="and"><filter type="or"><filter type="and">${first}</filter><filter type="or"><condition attribute="Title" operator="eq" value="Test"/></filter></filter><filter type="and">${third}</filter></filter>`;
        expect(queryBuilder.build()).toBe(expected);
        expect(queryBuilder.build()).toBe(expected);
    });
    test("should handle lookup query", ()=>{
        queryBuilder.withFieldQuery({
            name: "LookupField",
            type: "Lookup",
            value: "12345",
            comparer: "Eq"
        });

        const expected = `<filter type="and"><condition attribute="LookupField" operator="eq" value="{12345}"/></filter>`;
        expect(queryBuilder.build()).toBe(expected);
    })
});