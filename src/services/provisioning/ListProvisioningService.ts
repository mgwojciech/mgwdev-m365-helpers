import { IHttpClient } from "../../dal";
import { IListProvisioningData } from "../../model/provisioning/IList";
import { IProvisioningService } from "./IProvisioningService";

export class ListProvisioningService implements IProvisioningService<IListProvisioningData> {
    constructor(protected spHttpClient: IHttpClient, protected siteUrl: string) {
    }
    public async provision(resource: IListProvisioningData): Promise<IListProvisioningData> {
        const response = await this.spHttpClient.post(`${this.siteUrl}/_api/web/lists`, {
            body: JSON.stringify({
                "__metadata": {
                    "type": "SP.Field"
                },
                AllowContentTypes: resource.AllowContentTypes,
                BaseTemplate: resource.BaseTemplate,
                BaseType: resource.BaseType,
                ContentTypesEnabled: resource.ContentTypesEnabled,
                CrawlNonDefaultViews: resource.CrawlNonDefaultViews,
                Description: resource.Description,
                DisableCommenting: resource.DisableCommenting,
                DisableGridEditing: resource.DisableGridEditing,
                DraftVersionVisibility: resource.DraftVersionVisibility,
                EnableAttachments: resource.EnableAttachments,
                EnableFolderCreation: resource.EnableFolderCreation,
                EnableMinorVersions: resource.EnableMinorVersions,
                EnableModeration: resource.EnableModeration,
                EnableVersioning: resource.EnableVersioning,
                EnableRequestSignOff: resource.EnableRequestSignOff,
                ForceCheckout: resource.ForceCheckout,
                Hidden: resource.Hidden,
                NoCrawl: resource.NoCrawl,
                Title: resource.Title
            }),
            headers: {
                "Content-Type": "application/json;odata=verbose",
                "accept": "application/json"
            }
        });
        const data = await response.json();
        return data;
    }
}