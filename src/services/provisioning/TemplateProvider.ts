import { IHttpClient } from "../../dal";
import { IListProvisioningData } from "../../model/provisioning/IList";

export class TemplateProvider{
    public onProgress?: (message: string, percentage: number) => void;
    constructor(protected spClient: IHttpClient, protected siteUrl: string){
    }
    public async getSiteTemplate(){
        let result = {};
        let lists = await this.getLists();
        result["lists"] = lists;
        return result;
    }

    public async getLists(): Promise<IListProvisioningData[]>{
        this.onProgress("Getting lists", 0);
        let response = await this.spClient.get(`${this.siteUrl}/_api/web/lists?$select=Title,BaseTemplate,BaseType,Description,Hidden,EnableAttachments,EnableFolderCreation,EnableMinorVersions,EnableModeration,EnableVersioning,EnableRequestSignOff,ForceCheckout,ContentTypesEnabled,AllowContentTypes,DisableCommenting,DisableGridEditing,DraftVersionVisibility,NoCrawl,CrawlNonDefaultViews,Fields/AutoIndexed,Fields/DefaultValue,Fields/Description,Fields/FieldTypeKind,Fields/Filterable,Fields/FromBaseType,Fields/Group,Fields/Hidden,Fields/Id,Fields/Indexed,Fields/PinnedToFiltersPane,Fields/ReadOnlyField,Fields/Required,Fields/ShowInFiltersPane,Fields/Title,Fields/TypeAsString,Fields/TypeDisplayName,Fields/ValidationFormula,Fields/ValidationMessage&$expand=fields`,{
            headers: {
                "accept": "application/json"
            }
        });
        let data = await response.json();
        this.onProgress("Getting lists", 100);
        return data.value;
    }
}