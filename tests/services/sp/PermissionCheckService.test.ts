///<reference types="jest" />
import { PermissionCheckService, permissionKind } from "../../../src/services/sp/PermissionCheckService";

const readerMask = {
    High: 176,
    Low: 138612833
}
describe("PermissionCheckService", () => {
    test("should calculate admin", () => {
        expect(PermissionCheckService.hasPermission({
            High: 32767,
            Low: 65535
        }, permissionKind.fullMask)).toBe(true);
    });
    test("should calculate for reader", () => {
        expect(PermissionCheckService.hasPermission(readerMask, permissionKind.fullMask)).toBe(false);
        expect(PermissionCheckService.hasPermission(readerMask, permissionKind.addAndCustomizePages)).toBe(false);
        expect(PermissionCheckService.hasPermission(readerMask, permissionKind.addListItems)).toBe(false);
        expect(PermissionCheckService.hasPermission(readerMask, permissionKind.viewFormPages)).toBe(true);
        expect(PermissionCheckService.hasPermission(readerMask, permissionKind.openItems)).toBe(true);
    });
    test("should get user mask", async () => {
        const userEmail = "marcin@test.onmicrosoft.com";
        const expected = ["openItems",
               "viewVersions",
               "viewFormPages",
               "open",
               "viewPages",
               "createSSCSite",
               "browseUserInfo",
               "useClientIntegration",
               "useRemoteAPIs",
               "createAlerts"];
        const spClient = {
            get: () => Promise.resolve({
                ok: true,
                json: () => Promise.resolve(readerMask)
            })
        }
        const getSpy = jest.spyOn(spClient,"get");
        const service = new PermissionCheckService(spClient as any, "https://test.sharepoint.com/sites/test");
        const actual = await service.checkUserPermissions(userEmail);

        expect(actual).toStrictEqual(expected);
        expect(getSpy).toHaveBeenCalledWith("https://test.sharepoint.com/sites/test/_api/web/getUserEffectivePermissions('i%3A0%23.f%7Cmembership%7Cmarcin%40test.onmicrosoft.com')",{
                 "headers": {
                   "accept": "application/json",
                 },
               })
    });
})