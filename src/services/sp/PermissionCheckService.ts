import { IHttpClient } from "../../dal/http/IHttpClient";
import { IPermissionMask } from "../../model/sharepoint/IPermissionMask";

export const permissionKind = {
  "emptyMask": 0,
  "viewListItems": 1,
  "addListItems": 2,
  "editListItems": 3,
  "deleteListItems": 4,
  "approveItems": 5,
  "openItems": 6,
  "viewVersions": 7,
  "deleteVersions": 8,
  "cancelCheckout": 9,
  "managePersonalViews": 10,
  "manageLists": 12,
  "viewFormPages": 13,
  "anonymousSearchAccessList": 14,
  "open": 17,
  "viewPages": 18,
  "addAndCustomizePages": 19,
  "applyThemeAndBorder": 20,
  "applyStyleSheets": 21,
  "viewUsageData": 22,
  "createSSCSite": 23,
  "manageSubwebs": 24,
  "createGroups": 25,
  "managePermissions": 26,
  "browseDirectories": 27,
  "browseUserInfo": 28,
  "addDelPrivateWebParts": 29,
  "updatePersonalWebParts": 30,
  "manageWeb": 31,
  "anonymousSearchAccessWebLists": 32,
  "useClientIntegration": 37,
  "useRemoteAPIs": 38,
  "manageAlerts": 39,
  "createAlerts": 40,
  "editMyUserInfo": 41,
  "enumeratePermissions": 63,
  "fullMask": 65
}

export class PermissionCheckService {
  constructor(protected spHttpClient: IHttpClient, protected siteUrl: string) {

  }

  public static hasPermission(permMask: IPermissionMask, permLevel: number) {
    if (permLevel === 65) {
      return (permMask.High & 32767) === 32767 && permMask.Low === 65535;
    }
    var numericVal = permLevel - 1;
    var indexer = 1;
    if (numericVal > 0 && numericVal < 32) {
      indexer = indexer << numericVal;
      return 0 !== (permMask.Low & indexer);
    }
    else if (numericVal >= 32 && numericVal < 64) {
      indexer = indexer << numericVal - 32
      return 0 !== (permMask.High & indexer)
    }
    return false;
  }

  public async checkUserPermissions(userEmail: string, resourceApi?: string) {
    var url = `${this.siteUrl}/_api/web${resourceApi || ""}/getUserEffectivePermissions('${encodeURIComponent("i:0#.f|membership|" + userEmail)}')`
    var effectivePermMaskResp = await this.spHttpClient.get(url, {
      headers: {
        accept: "application/json"
      }
    });
    var effectivePermMask = await effectivePermMaskResp.json();
    var permissions = [];
    for (var permLevelName in permissionKind) {
      var hasPermissionLevel = PermissionCheckService.hasPermission(effectivePermMask, permissionKind[permLevelName]);
      if (hasPermissionLevel) {
        permissions.push(permLevelName)
      }
    }
    return permissions;
  }
  public async checkCurrentUserPermissions(resourceApi?: string) {
    var url = `${this.siteUrl}/_api/web/${resourceApi}/EffectiveBasePermission`
    var effectivePermMaskResp = await this.spHttpClient.get(url, {
      headers: {
        accept: "application/json"
      }
    });
    var effectivePermMask = await effectivePermMaskResp.json();
    var permissions = [];
    for (var permLevelName in permissionKind) {
      var hasPermissionLevel = PermissionCheckService.hasPermission(effectivePermMask, permissionKind[permLevelName]);
      if (hasPermissionLevel) {
        permissions.push(permLevelName)
      }
    }
    return permissions;

  }
}