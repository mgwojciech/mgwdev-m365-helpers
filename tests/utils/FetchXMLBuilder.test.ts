///<reference types="jest" />
import { FetchXMLBuilder } from "../../src/utils/FetchXMLBuilder";

describe("FetchXMLBuilder", () => {
    test("should create a basic FetchXML query", () => {
        const builder = new FetchXMLBuilder("account", [
            "address1_city",
            "aging30",
            "name",
            "primarycontactid",
            "telephone1"
        ]);
        builder.withFieldQuery({
            name: "aging30",
            value: "20",
            comparer: "Gt"
        }).withFieldQuery({
            name: "name",
            value: "John",
            comparer: "Eq"
        });
        builder.withOrder("name", "ASC");
        builder.withPageSize(100);
        const query = builder.build();
        const normalizedQuery = query.replace(/>\s+</g, "><").replace(/"\s+\/>/g, '"/>');
        expect(normalizedQuery).toBe(`<fetch mapping="logical" returntotalrecordcount="true" page="1" count="100" no-lock="false"><entity name="account"><attribute name="address1_city"/><attribute name="aging30"/><attribute name="name"/><attribute name="primarycontactid"/><attribute name="telephone1"/><filter type="and"><filter type="and"><condition attribute="aging30" operator="gt" value="20"/></filter><filter type="and"><condition attribute="name" operator="eq" value="John"/></filter></filter><order attribute="name" descending="false"/></entity></fetch>`);
    });
});