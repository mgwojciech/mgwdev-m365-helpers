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
    /**
     * The cache location to use for storing tokens. Defaults to "sessionStorage".
     */
    cacheLocation?: "sessionStorage" | "localStorage";
}

/**
 * This class is used to authenticate the user using MSAL
 */
export class Msal2AuthenticationService implements IAuthenticationService {
    protected msalObj;
    protected resourceTokenMap: Map<string, string> = new Map<string, string>();
    public resourceScopeMap: Map<string, string[]> = new Map<string, string[]>();
    protected get storage(): Storage {
        return this.config.cacheLocation === "localStorage" ? localStorage : sessionStorage;
    }
    constructor(public config: IMsalAuthenticationConfig, protected usePopup: boolean = true) {
        this.config.tenantId = config.tenantId || 'common';
        this.config.redirectUri = config.redirectUri || window.location.origin;
        this.config.cacheLocation = config.cacheLocation || "sessionStorage";
        this.msalObj = new PublicClientApplication({
            auth: {
                clientId: config.clientId,
                authority: `https://login.microsoftonline.com/${config.tenantId}`,
                redirectUri: config.redirectUri
            },
            cache: {
                cacheLocation: this.config.cacheLocation
            }
        });
    }

    protected handleResponse = (resp: AuthenticationResult | null) => {
        if (resp) {
            const scopes = resp.scopes || [];
            scopes.forEach(s => {
                try {
                    const resource = new URL(s).origin;
                    this.storage.setItem(`msal.${this.config.clientId}.${resource}.idtoken`, resp.accessToken);
                    this.resourceTokenMap.set(resource, resp.accessToken);
                    // Remove the code from the URL
                    if (window.history && window.history.replaceState) {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                }
                catch (err) {
                    console.log("Error parsing scopes", err);
                }
            });
        }
    }
    @queueRequest("msalLogin-{0}")
    protected login(resource: string) {
        let scopes: string[] = this.config.scopes || [`${resource}/.default`];
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
    public async logout(): Promise<void> {
        await this.msalObj.initialize();
        await this.msalObj.logoutPopup();
        this.resourceTokenMap.clear();
        const keys = Object.keys(this.storage);
        for (const key of keys) {
            if (key.startsWith(`msal.${this.config.clientId}.`)) {
                this.storage.removeItem(key);
            }
        }
    }

    @queueRequest("access-token-{0}")
    public async getAccessToken(resource: string): Promise<string> {

        try {
            await this.msalObj.initialize().then(() => {
                if (!this.usePopup) {
                    this.msalObj.handleRedirectPromise().then(this.handleResponse);
                }
            });
        }
        catch (err) {
            console.log("Unable to initialize msal object", err);
        }
        let token: string | null | undefined = this.resourceTokenMap.get(resource);
        if (!token) {
            token = this.storage.getItem(`msal.${this.config.clientId}.${resource}.idtoken`);
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
        this.storage.setItem(`msal.${this.config.clientId}.${resource}.idtoken`, token);
        this.resourceTokenMap.set(resource, token);
        return token;
    }
}