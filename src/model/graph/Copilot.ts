export interface ICopilotWebContext {
    isWebEnabled: boolean;
}
export interface ICopilotFile {
    uri: string;
}

export interface ICopilotMessage {
    text: string;
}

export interface ICopilotContextualResource {
    files?: ICopilotFile[];
    webContext?: ICopilotWebContext;
}

export interface ICopilotAdditionalContext {
    text: string;
    description: string;
}

export interface ICopilotConversationLocation {
    latitude?: number,
    longitude?: number,
    timeZone?: string,
    countryOrRegion?: string,
    countryOrRegionConfidence?: number
}

export interface ICopilotMessageBody {
    message: ICopilotMessage;
    contextualResources?: ICopilotContextualResource;
    additionalContext?: ICopilotAdditionalContext;
    locationHint?: ICopilotConversationLocation;
}

export interface ICopilotAttribution{
    attributionType: string;
    providerDisplayName: string;
    attributionSource: string;
    seeMoreWebUrl?: string;
    imageWebUrl?: string;
    imageFavIcon?: string;
    imageWidth?: number;
    imageHeight?: number;
}

export interface ICopilotSensitivityLabel {
    sensitivityLabelId?: string;
    displayName?: string;
    tooltip?: string;
    priority?: string;
    color?: string;
    isEncrypted?: boolean;
}

export interface ICopilotResponseMessage{
    text: string;
    id: string;
    createdDateTime: string;
    adaptiveCards?: any[];
    attributions?: ICopilotAttribution[];
    sensitivityLabel?: ICopilotSensitivityLabel;
}

export interface ICopilotConversationResponse {
    id: string;
    messages: ICopilotResponseMessage[];
    agentId: string;
    createdDateTime: string;
    displayName?: string;
    state?: string;
    turnCount?: number;
}

