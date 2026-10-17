///<reference types="jest" />
import { DataverseUserService } from "../../../src/services/dataverse/DataverseUserService";
import type { IHttpClient, IHttpClientResponse } from "../../../src/dal/http/IHttpClient";

const response = (data: unknown = {}, ok = true): IHttpClientResponse => ({
    ok, status: ok ? 200 : 403,
    json: async () => data, text: async () => "Permission denied", blob: async () => new Blob(),
});

describe("DataverseUserService", () => {
    const client: IHttpClient = { get: jest.fn(), post: jest.fn(), patch: jest.fn(), put: jest.fn(), delete: jest.fn() };
    const api = "https://contoso.crm.dynamics.com/api/data/v9.1";
    const service = new DataverseUserService(client, "https://contoso.crm.dynamics.com/");

    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(client.post).mockResolvedValue(response());
        jest.mocked(client.delete).mockResolvedValue(response());
        jest.mocked(client.patch).mockResolvedValue(response());
    });

    test("loads all membership pages", async () => {
        jest.mocked(client.get).mockResolvedValueOnce(response({
            value: [{ teamid: "one", name: "One" }], "@odata.nextLink": `${api}/teams?$skiptoken=next`,
        })).mockResolvedValueOnce(response({ value: [{ teamid: "two", name: "Two" }] }));
        expect(await service.getUserTeamMembership("user")).toHaveLength(2);
        expect(client.get).toHaveBeenLastCalledWith(`${api}/teams?$skiptoken=next`, expect.anything());
    });

    test("filters roles without expanding inherited team roles", async () => {
        jest.mocked(client.get).mockResolvedValue(response({ value: [] }));
        await service.getUserRoles("user", "name eq 'Reader'");
        expect(client.get).toHaveBeenCalledWith(
            `${api}/roles?$select=roleid,name&$filter=systemuserroles_association/any(a: a/systemuserid eq user) and (name eq 'Reader')`,
            expect.anything(),
        );
    });

    test("escapes search input and applies the configured addition filter", async () => {
        jest.mocked(client.get).mockResolvedValue(response({ value: [{ roleid: "role", name: "O'Brien" }] }));
        expect(await service.searchAssignments("roles", "O'Brien", "ismanaged eq false")).toEqual([{ id: "role", displayName: "O'Brien" }]);
        const url = decodeURIComponent(jest.mocked(client.get).mock.calls[0][0]);
        expect(url).toContain("$filter=(ismanaged eq false) and (contains(name,'O''Brien'))");
        expect(url).toContain("$top=50");
    });

    test.each(["teams", "roles"] as const)("adds and removes %s using relationship references, not records", async kind => {
        await service.setAssignment("user", kind, "assignment", true);
        await service.setAssignment("user", kind, "assignment", false);
        const relationship = kind === "teams" ? "teammembership_association" : "systemuserroles_association";
        expect(client.post).toHaveBeenCalledWith(`${api}/systemusers(user)/${relationship}/$ref`, expect.objectContaining({
            body: JSON.stringify({ "@odata.id": `${api}/${kind}(assignment)` }),
        }));
        expect(client.delete).toHaveBeenCalledWith(`${api}/systemusers(user)/${relationship}(assignment)/$ref`, expect.anything());
    });

    test("role replacement removes old roles and retains unchanged roles", async () => {
        jest.mocked(client.get).mockResolvedValue(response({ value: [{ roleid: "old", name: "Old" }, { roleid: "keep", name: "Keep" }] }));
        await service.updateUserRoles("user", [{ roleid: "new", name: "New" }, { roleid: "keep", name: "Keep" }]);
        expect(client.delete).toHaveBeenCalledTimes(1);
        expect(client.delete).toHaveBeenCalledWith(expect.stringContaining("(old)/$ref"), expect.anything());
        expect(client.post).toHaveBeenCalledTimes(1);
        expect(client.post).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ body: JSON.stringify({ "@odata.id": `${api}/roles(new)` }) }));
    });

    test("changes the single primary business unit", async () => {
        await service.updateUserBusinessUnits("user", [{ businessunitid: "unit", name: "Unit" }]);
        expect(client.patch).toHaveBeenCalledWith(`${api}/systemusers(user)`, expect.objectContaining({
            body: JSON.stringify({ "businessunitid@odata.bind": "/businessunits(unit)" }),
        }));
        await expect(service.updateUserBusinessUnits("user", [])).rejects.toThrow("exactly one");
        expect(client.patch).toHaveBeenCalledTimes(1);
    });

    test("surfaces rejected reads and writes", async () => {
        jest.mocked(client.get).mockResolvedValue(response({}, false));
        jest.mocked(client.delete).mockResolvedValue(response({}, false));
        await expect(service.getUserRoles("user")).rejects.toThrow("Permission denied");
        await expect(service.setAssignment("user", "teams", "team", false)).rejects.toThrow("Permission denied");
    });
});
