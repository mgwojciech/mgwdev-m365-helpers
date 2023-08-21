///<reference types="jest" />
import { assert } from "chai";
import { BatchSPClient } from "../../../src/dal/http/BatchSPClient";
describe("BatchSPClient", () => {
	test("should batch two requests and parse the response", async () => {
		let baseClient = {
			post: (url, body) => Promise.resolve({
				ok: true,
				text: () => Promise.resolve(`
				--batchresponse_95f8c43b-f68c-4c3b-9bc5-eb3b93cb7f06
Content-Type: application/http
Content-Transfer-Encoding: binary

HTTP/1.1 200 OK
CONTENT-TYPE: application/json;odata=minimalmetadata;streaming=true;charset=utf-8

{"odata.metadata":"https://test.sharepoint.com/_api/$metadata#SP.ApiData.Webs/@Element","odata.type":"SP.Web","odata.id":"https://test.sharepoint.com/_api/Web","odata.editLink":"Web","AllowRssFeeds":true,"AlternateCssUrl":"","AppInstanceId":"00000000-0000-0000-0000-000000000000","ClassicWelcomePage":null,"Configuration":0,"Created":"2019-11-04T12:46:46.83","CurrentChangeToken":{"StringValue":"1;2;2aed6b48-2722-4689-9775-752e5bc087ed;638015922682900000;537262832"},"CustomMasterUrl":"/_catalogs/masterpage/seattle.master","Description":"","DesignPackageId":"00000000-0000-0000-0000-000000000000","DocumentLibraryCalloutOfficeWebAppPreviewersDisabled":false,"EnableMinimalDownload":false,"FooterEmphasis":0,"FooterEnabled":true,"FooterLayout":0,"HeaderEmphasis":0,"HeaderLayout":0,"HideTitleInHeader":false,"HorizontalQuickLaunch":false,"Id":"2aed6b48-2722-4689-9775-752e5bc087ed","IsEduClass":false,"IsEduClassProvisionChecked":false,"IsEduClassProvisionPending":false,"IsHomepageModernized":false,"IsMultilingual":true,"IsRevertHomepageLinkHidden":false,"Language":1033,"LastItemModifiedDate":"2022-10-11T13:36:40Z","LastItemUserModifiedDate":"2022-08-10T12:54:53Z","LogoAlignment":0,"MasterUrl":"/_catalogs/masterpage/seattle.master","MegaMenuEnabled":true,"NavAudienceTargetingEnabled":false,"NoCrawl":false,"ObjectCacheEnabled":false,"OverwriteTranslationsOnChange":false,"ResourcePath":{"DecodedUrl":"https://test.sharepoint.com"},"QuickLaunchEnabled":true,"RecycleBinEnabled":true,"SearchScope":0,"ServerRelativeUrl":"/","SiteLogoUrl":"/SiteAssets/__siteIcon__.png","SyndicationEnabled":true,"TenantAdminMembersCanShare":0,"Title":"Communication site","TreeViewEnabled":false,"UIVersion":15,"UIVersionConfigurationEnabled":false,"Url":"https://test.sharepoint.com","WebTemplate":"SITEPAGEPUBLISHING","WelcomePage":"SitePages/Home.aspx"}
--batchresponse_95f8c43b-f68c-4c3b-9bc5-eb3b93cb7f06
Content-Type: application/http
Content-Transfer-Encoding: binary

HTTP/1.1 200 OK
CONTENT-TYPE: application/json;odata=minimalmetadata;streaming=true;charset=utf-8

{"odata.metadata":"https://test.sharepoint.com/_api/$metadata#SP.ApiData.Sites/@Element","odata.type":"SP.Site","odata.id":"https://test.sharepoint.com/_api/site","odata.editLink":"site","AllowCreateDeclarativeWorkflow":true,"AllowDesigner":true,"AllowMasterPageEditing":false,"AllowRevertFromTemplate":false,"AllowSaveDeclarativeWorkflowAsTemplate":true,"AllowSavePublishDeclarativeWorkflow":true,"AllowSelfServiceUpgrade":true,"AllowSelfServiceUpgradeEvaluation":true,"AuditLogTrimmingRetention":90,"ChannelGroupId":"00000000-0000-0000-0000-000000000000","Classification":"","CompatibilityLevel":15,"CurrentChangeToken":{"StringValue":"1;1;9752c22c-7048-4936-b112-b4b8e4c830f1;638015922682900000;537262832"},"DisableAppViews":false,"DisableCompanyWideSharingLinks":false,"DisableFlows":false,"ExternalSharingTipsEnabled":false,"GeoLocation":"EUR","GroupId":"00000000-0000-0000-0000-000000000000","HubSiteId":"9752c22c-7048-4936-b112-b4b8e4c830f1","Id":"9752c22c-7048-4936-b112-b4b8e4c830f1","SensitivityLabelId":null,"SensitivityLabel":"00000000-0000-0000-0000-000000000000","IsHubSite":true,"LockIssue":null,"MaxItemsPerThrottledOperation":5000,"MediaTranscriptionDisabled":false,"NeedsB2BUpgrade":false,"ResourcePath":{"DecodedUrl":"https://test.sharepoint.com"},"PrimaryUri":"https://test.sharepoint.com","ReadOnly":false,"RequiredDesignerVersion":"15.0.0.0","SandboxedCodeActivationCapability":2,"ServerRelativeUrl":"/","ShareByEmailEnabled":false,"ShareByLinkEnabled":false,"ShowUrlStructure":false,"TrimAuditLog":true,"UIVersionConfigurationEnabled":false,"UpgradeReminderDate":"1899-12-30T00:00:00","UpgradeScheduled":false,"UpgradeScheduledDate":"1753-01-01T00:00:00","Upgrading":false,"Url":"https://test.sharepoint.com","WriteLocked":false}
--batchresponse_95f8c43b-f68c-4c3b-9bc5-eb3b93cb7f06
Content-Type: application/http
Content-Transfer-Encoding: binary
`),
				headers: {
					get: () => `multipart/mixed; boundary=batchresponse_95f8c43b-f68c-4c3b-9bc5-eb3b93cb7f06`
				}
			})
		}
		let batchClient = new BatchSPClient(baseClient as any, "https://test.sharepoint.com", 50);

		let [web, site] = await Promise.all([batchClient.get("/_api/web").then(r => r.json()), batchClient.get("/_api/site").then(r => r.json())]);

		assert.equal(web.Title, "Communication site");
		assert.equal(site.HubSiteId, "9752c22c-7048-4936-b112-b4b8e4c830f1");
	});
	test("should batch get with post", async () => {
		let baseClient = {
			post: (url: string, options: any) => Promise.resolve({
				ok: true,
				text: () => Promise.resolve(`
				--batchresponse_03f88790-978e-4a15-a3d2-14c69deaf306
Content-Type: application/http
Content-Transfer-Encoding: binary

HTTP/1.1 200 OK
CONTENT-TYPE: application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8

{"@odata.context":"https://mwdevsb.sharepoint.com/_api/$metadata#web","@odata.type":"#SP.Web","@odata.id":"https://mwdevsb.sharepoint.com/_api/Web","@odata.editLink":"Web","AllowRssFeeds":true,"AlternateCssUrl":"","AppInstanceId":"00000000-0000-0000-0000-000000000000","ClassicWelcomePage":null,"Configuration":0,"Created":"2023-08-14T09:47:06.867-07:00","CurrentChangeToken":{"StringValue":"1;2;21981dda-131a-4bfe-9e19-55ab749312da;638282173316430000;748198141"},"CustomMasterUrl":"/_catalogs/masterpage/seattle.master","Description":"","DesignPackageId":"00000000-0000-0000-0000-000000000000","DocumentLibraryCalloutOfficeWebAppPreviewersDisabled":false,"EnableMinimalDownload":false,"FooterEmphasis":0,"FooterEnabled":true,"FooterLayout":0,"HeaderEmphasis":0,"HeaderLayout":2,"HideTitleInHeader":false,"HorizontalQuickLaunch":true,"Id":"21981dda-131a-4bfe-9e19-55ab749312da","IsEduClass":false,"IsEduClassProvisionChecked":false,"IsEduClassProvisionPending":false,"IsHomepageModernized":false,"IsMultilingual":true,"IsRevertHomepageLinkHidden":false,"Language":1033,"LastItemModifiedDate":"2023-08-17T13:09:52Z","LastItemUserModifiedDate":"2023-08-17T07:48:44Z","LogoAlignment":0,"MasterUrl":"/_catalogs/masterpage/seattle.master","MegaMenuEnabled":true,"NavAudienceTargetingEnabled":false,"NoCrawl":false,"ObjectCacheEnabled":false,"OverwriteTranslationsOnChange":true,"ResourcePath":{"DecodedUrl":"https://mwdevsb.sharepoint.com"},"QuickLaunchEnabled":true,"RecycleBinEnabled":true,"SearchScope":0,"ServerRelativeUrl":"/","SiteLogoUrl":"https://mwdevsb.sharepoint.com/SiteAssets/__sitelogo____sitelogo__thelandings-v3@2x.png","SyndicationEnabled":true,"TenantAdminMembersCanShare":0,"Title":"Intranet","TreeViewEnabled":false,"UIVersion":15,"UIVersionConfigurationEnabled":false,"Url":"https://mwdevsb.sharepoint.com","WebTemplate":"SITEPAGEPUBLISHING","WelcomePage":"SitePages/Home.aspx"}
--batchresponse_03f88790-978e-4a15-a3d2-14c69deaf306
Content-Type: application/http
Content-Transfer-Encoding: binary

HTTP/1.1 200 OK
CONTENT-TYPE: application/json; charset=utf-8

{ "Row" : 
[{
"Title": "New benefits available",
"_ExtendedDescription": "New benefits are available. Visit benefits page to get more info.",
"StartDate": "",
"StartDate.": "",
"TaxKeyword": [{"Label":"Benefits","TermID":"00323b85-614a-48b7-b546-0846e6c35750"}],
"TaxKeyword.": "9;#Benefits",
"Priority": "(3) Low"
}
],"FirstRow" : 1,
"FolderPermissions" : "0x7ffffffffffbffff"
,"LastRow" : 1,
"RowLimit" : 25
,"FilterLink" : "?"
,"ForceNoHierarchy" : "1"
,"HierarchyHasIndention" : ""
,"CurrentFolderSpItemUrl" : ""

}
--batchresponse_03f88790-978e-4a15-a3d2-14c69deaf306
Content-Type: application/http
Content-Transfer-Encoding: binary

HTTP/1.1 200 OK
CONTENT-TYPE: application/json; charset=utf-8

{ "Row" : 
[{
"ID": "2"
}
],"FirstRow" : 1,
"FolderPermissions" : "0x7ffffffffffbffff"
,"LastRow" : 1,
"RowLimit" : 30
,"FilterLink" : "?"
,"ForceNoHierarchy" : "1"
,"HierarchyHasIndention" : ""
,"CurrentFolderSpItemUrl" : ""

}
--batchresponse_03f88790-978e-4a15-a3d2-14c69deaf306--
`),
				headers: {
					get: () => `multipart/mixed; boundary=batchresponse_03f88790-978e-4a15-a3d2-14c69deaf306`
				}
			}),
		}
		let batchClient = new BatchSPClient(baseClient as any, "https://test.sharepoint.com", 50);
		let [web, listItems, listItemsIds] = await Promise.all([
			batchClient.get("/_api/web").then(r => r.json()),
			batchClient.post("/_api/web/lists/getbytitle('Announcements')/RenderListDataAsStream", {
				body: JSON.stringify({
					"parameters": {
						"RenderOptions": 2,
						"AllowMultipleValueFilterForTaxonomyFields": true,
						"AddRequiredFields": true
					}
				})
			}).then(r => r.json()),
			batchClient.post("/_api/web/lists/getbytitle('Announcements')/RenderListDataAsStream", {
				body: JSON.stringify({
					"parameters": {
						"RenderOptions": 2,
						"AllowMultipleValueFilterForTaxonomyFields": true,
						"AddRequiredFields": true
					}
				})
			}).then(r => r.json())]);

		expect(web.Title).toBe("Intranet");
		expect(listItems.Row.length).toBe(1);
		expect(listItemsIds.Row.length).toBe(1);
	});
});
