import { AuthenticationResult, InteractionRequiredAuthError, PublicClientApplication } from '@azure/msal-browser';
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
    protected resourceTokenMap: Map<string, string> = new Map<string, string>();
    public resourceScopeMap: Map<string, string[]> = new Map<string, string[]>();
    constructor(public config: IMsalAuthenticationConfig, protected usePopup: boolean = true) {
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
        if (!this.usePopup) {
            this.msalObj.handleRedirectPromise().then(this.handleResponse);
        }
    }

    protected handleResponse = (resp: AuthenticationResult | null) => {
        if (resp) {
            const scopes = resp.scopes || [];
            const resource = new URL(scopes[0]).origin;
            sessionStorage.setItem(`msal.${this.config.clientId}.${resource}.idtoken`, resp.accessToken);
            this.resourceTokenMap.set(resource, resp.accessToken);
            // Remove the code from the URL
            if (window.history && window.history.replaceState) {
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }
    @queueRequest("msalLogin")
    protected login(resource: string) {
        let scopes: string[] = [`${resource}/.default`];
        if (this.resourceScopeMap.has(resource)) {
            scopes = this.resourceScopeMap.get(resource)?.map(s => `${resource}/${s}`) || scopes;
        }
        if (this.usePopup) {
            return this.msalObj.loginPopup({
                scopes: scopes
            });
        }
        this.msalObj.loginRedirect({
            scopes: [`${resource}/.default`]
        });
    }
    @queueRequest("access-token-{0}")
    public async getAccessToken(resource: string): Promise<string> {
        let token: string | null | undefined = this.resourceTokenMap.get(resource);
        if (!token) {
            token = sessionStorage.getItem(`msal.${this.config.clientId}.${resource}.idtoken`);
        }
        if (token && TokenUtils.isTokenValid(token)) {
            return token;
        }
        let authResult;
        try {
            authResult = await this.msalObj.ssoSilent({
                scopes: [`${resource}/.default`]
            });
        }
        catch (err) {
            if (err instanceof InteractionRequiredAuthError) {
                authResult = await this.login(resource);
            }
        }
        token = authResult?.accessToken || "";
        sessionStorage.setItem(`msal.${this.config.clientId}.${resource}.idtoken`, token);
        this.resourceTokenMap.set(resource, token);
        return token;
    }
}