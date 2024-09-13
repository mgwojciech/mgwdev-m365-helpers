export interface IListProvisioningData {
    AllowContentTypes: boolean;
    BaseTemplate: number;
    BaseType: number;
    ContentTypesEnabled: boolean;
    CrawlNonDefaultViews: boolean;
    Description: string;
    DisableCommenting: boolean;
    DisableGridEditing: boolean;
    DraftVersionVisibility: number;
    EnableAttachments: boolean;
    EnableFolderCreation: boolean;
    EnableMinorVersions: boolean;
    EnableModeration: boolean;
    EnableVersioning: boolean;
    EnableRequestSignOff: boolean;
    ForceCheckout: boolean;
    Hidden: boolean;
    NoCrawl: boolean;
    Title: string;
    Fields: IFieldProvisioningData[];
}

export interface IFieldProvisioningData {
    AutoIndexed: boolean;
    DefaultValue: any;
    Description: string;
    Filterable: boolean;
    FromBaseType: boolean;
    Group: string;
    Hidden: boolean;
    Id: string;
    Indexed: boolean;
    PinnedToFiltersPane: boolean;
    ReadOnlyField: boolean;
    Required: boolean;
    ShowInFiltersPane: number;
    Title: string;
    FieldTypeKind: number;
    TypeAsString: string;
    TypeDisplayName: string;
    ValidationFormula: any;
    ValidationMessage: any;
}