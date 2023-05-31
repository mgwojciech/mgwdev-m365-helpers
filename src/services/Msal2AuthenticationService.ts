import { AuthenticationResult, PublicClientApplication } from '@azure/msal-browser';
import { TokenUtils } from '../utils/TokenUtils';
import { IAuthenticationService } from './IAuthenticationService';
import { queueRequest } from '../utils/FunctionUtils';

export interface IMsalAuthenticationConfig {
    /**
     * The client id of the Azure AD application.
     */
    clientId: string;
    /**
     * The tenant id of the Azure AD tenant. If not specified, the common endpoint will be used.
     */
    tenantId?: string;
    /**
     * The redirect uri to use for the authentication request. If not specified, the current window origin will be used.
     */
    redirectUri?: string;
    /**
     * The scopes to use for the authentication request. If not specified, the ./default scope will be used.
     */
    scopes?: string[];   
}

/**
 * This class is used to authenticate the user using MSAL
 */
export class Msal2AuthenticationService implements IAuthenticationService {
    protected msalObj;
    private token?: string;
    constructor(public config: IMsalAuthenticationConfig) {
        this.config.tenantId = config.tenantId || 'common';
        this.config.redirectUri = config.redirectUri || window.location.origin;
        this.msalObj = new PublicClientApplication({
            auth: {
                clientId: config.clientId,
                authority: `https://login.microsoftonline.com/${config.tenantId}`,
                redirectUri: config.redirectUri
            },
            cache: {
                cacheLocation: "sessionStorage"
            }
        });
    }

    protected handleResponse = (resp: AuthenticationResult | null) => {
        if (resp) {
            console.log('Authenticated', resp);
        }
    }

    @queueRequest("msalLogin")
    protected login(resource){
        return this.msalObj.loginPopup({
            scopes: [`${resource}/.default`]
        });
    }
    public async getAccessToken(resource: string): Promise<string> {
        this.token = sessionStorage.getItem(`msal.${this.config.clientId}.${resource}.idtoken`) || "";
        if (this.token && TokenUtils.isTokenValid(this.token)) {
            return this.token;
        }
        let authResult;
        try {
            authResult = await this.msalObj.ssoSilent({
                scopes: [`${resource}/.default`]
            });
        }
        catch (err) {
            authResult = await this.login(resource);
        }
        this.token = authResult?.accessToken || "";
        sessionStorage.setItem(`msal.${this.config.clientId}.${resource}.idtoken`, this.token);
        return this.token
    }

}