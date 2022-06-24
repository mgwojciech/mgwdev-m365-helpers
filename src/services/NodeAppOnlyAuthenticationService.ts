import { IAuthenticationService } from "./IAuthenticationService";
import * as msal from "@azure/msal-node";

export class NodeAppOnlyAuthenticationService implements IAuthenticationService{
    protected msalConfig;
    protected clientApp: msal.ConfidentialClientApplication;
    constructor(protected clientId, protected clientSecret, protected authority = "organizations") {
        this.msalConfig = {
            auth: {
                clientId,
                clientSecret,
                authority: `https://login.microsoftonline.com/${authority}`
            }
        }
        this.clientApp = new msal.ConfidentialClientApplication(this.msalConfig);
    }
    public async getAccessToken(resource: string): Promise<string> {
        let tokenRequest = {
            scopes: [`${resource}/.default`],
        };
        let tokenResponse = await this.clientApp.acquireTokenByClientCredential(tokenRequest);
        return tokenResponse.accessToken;
    }
}