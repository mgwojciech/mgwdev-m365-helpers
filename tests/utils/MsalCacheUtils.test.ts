/**
 * @jest-environment jsdom
 */
///<reference types="jest" />
import { MsalCacheUtils } from "../../src/utils/MsalCacheUtils";

describe("MsalCacheUtils", () => {
    const clientId = "11111111-1111-1111-1111-111111111111";
    const otherClientId = "22222222-2222-2222-2222-222222222222";

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    test("removes msal.<clientId>.* keys from localStorage", () => {
        localStorage.setItem(`msal.${clientId}.https://graph.microsoft.com.idtoken`, "tok");
        localStorage.setItem(`msal.${clientId}.account.keys`, "v");

        MsalCacheUtils.clearStorageKeys(clientId);

        expect(localStorage.getItem(`msal.${clientId}.https://graph.microsoft.com.idtoken`)).toBeNull();
        expect(localStorage.getItem(`msal.${clientId}.account.keys`)).toBeNull();
    });

    test("removes msal.<clientId>.* keys from sessionStorage", () => {
        sessionStorage.setItem(`msal.${clientId}.https://graph.microsoft.com.idtoken`, "tok");

        MsalCacheUtils.clearStorageKeys(clientId);

        expect(sessionStorage.getItem(`msal.${clientId}.https://graph.microsoft.com.idtoken`)).toBeNull();
    });

    test("removes keys that contain the clientId without the msal. prefix", () => {
        const msalV3Key = `${clientId}-login.windows.net-accesstoken-${clientId}-organizations--`;
        localStorage.setItem(msalV3Key, "tok");

        MsalCacheUtils.clearStorageKeys(clientId);

        expect(localStorage.getItem(msalV3Key)).toBeNull();
    });

    test("leaves keys for a different clientId untouched", () => {
        localStorage.setItem(`msal.${otherClientId}.https://graph.microsoft.com.idtoken`, "tok");
        sessionStorage.setItem(`msal.${otherClientId}.account.keys`, "v");

        MsalCacheUtils.clearStorageKeys(clientId);

        expect(localStorage.getItem(`msal.${otherClientId}.https://graph.microsoft.com.idtoken`)).toBe("tok");
        expect(sessionStorage.getItem(`msal.${otherClientId}.account.keys`)).toBe("v");
    });

    test("leaves unrelated keys untouched", () => {
        localStorage.setItem("theme", "dark");
        sessionStorage.setItem("user-pref", "{}");

        MsalCacheUtils.clearStorageKeys(clientId);

        expect(localStorage.getItem("theme")).toBe("dark");
        expect(sessionStorage.getItem("user-pref")).toBe("{}");
    });
});
