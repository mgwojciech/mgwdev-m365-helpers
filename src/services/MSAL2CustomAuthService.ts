import { queueRequest } from "../utils/FunctionUtils";
import { generateGuid, generateRandomString } from "../utils/IdGenerator";
import { TokenUtils } from "../utils/TokenUtils";
import { IAuthenticationService } from "./IAuthenticationService";
import { IMsalAuthenticationConfig } from "./Msal2AuthenticationService";
import { ICacheService } from "./cache/ICacheService";
import { LocalStorageCacheService } from "./cache/LocalStorageCacheService";

export interface ICustomAuthResult {
    access_token: string;
    client_info?: string;
    expires_in: number;
    ext_expires_in: number;
    id_token: string;
    refresh_token: string;
    scope: string;
    token_type: string;
}


export class MSAL2CustomAuthService implements IAuthenticationService {
    protected resourceTokenMap: Map<string, string> = new Map<string, string>();
    public resourceScopeMap: Map<string, string[]> = new Map<string, string[]>();
    protected cacheService: ICacheService = new LocalStorageCacheService();
    private codeVerifier: string;
    private state: string;
    constructor(public config: IMsalAuthenticationConfig, protected usePopup: boolean = true) {
        this.config.tenantId = config.tenantId || 'common';
        this.config.redirectUri = config.redirectUri || window.location.origin;
        this.getCodeVerifier();
        this.state = generateRandomString(108);
    }

    private getCodeVerifier() {
        if (this.cacheService.get("msal.codeVerifier")) {
            this.codeVerifier = this.cacheService.get("msal.codeVerifier");
        }
        else {
            this.codeVerifier = generateRandomString(43)
        }
    }

    protected buildLoginUrl(resource: string) {
        var url = new URL(`https://login.microsoftonline.com/${this.config.tenantId || "common"}/oauth2/v2.0/authorize`);
        url.searchParams.append("client_id", this.config.clientId);
        url.searchParams.append("scope", `${resource}/.default openid profile offline_access`);
        url.searchParams.append("redirect_uri", this.config.redirectUri);
        url.searchParams.append("client-request-id", generateGuid());
        url.searchParams.append("response_mode", "query");
        url.searchParams.append("response_type", "code");
        url.searchParams.append("code_challenge", this.codeVerifier);
        url.searchParams.append("code_challenge_method", "plain");
        url.searchParams.append("prompt", "select_account");
        url.searchParams.append("client_info", "1");
        url.searchParams.append("nonce", "8a9afd0b-47f6-4678-9289-1b1bf5bfa20f");
        url.searchParams.append("state", this.state);

        return url.toString();
    }
    protected getCodeFromLoginWindow = (
        loginWindow: any,
        callback: (result: string) => void
    ) => {
        try {
            let searchParams = new URLSearchParams(loginWindow?.location.search);
            let code = searchParams.get('code');
            if (code) {
                callback(code);
                loginWindow.close();
            } else {
                if (loginWindow)
                    setTimeout(() => this.getCodeFromLoginWindow(loginWindow, callback));
            }
        } catch {
            if (loginWindow)
                setTimeout(() => this.getCodeFromLoginWindow(loginWindow, callback), 1000);
        }
    };
    /**
     * This method is used to login the user
     * @param resource The resource to login to
     * @returns The authentication code
     **/
    protected async loginUser(resource: string): Promise<string> {
        let loginUrl = this.buildLoginUrl(resource);
        let authCode = "";
        if (this.usePopup) {
            let popup = window.open(loginUrl, "login", "width=600,height=600");
            if (popup) {
                await new Promise<void>((resolve, error) => this.getCodeFromLoginWindow(popup, (code) => {
                    authCode = code;
                    resolve();
                }));
            }
        }
        else {
            let searchParams = new URLSearchParams(window.location.search);
            let code = searchParams.get('code');
            let error = searchParams.get('error');
            if (code) {
                this.cacheService.remove("msal.codeVerifier");
                authCode = code;
                var url = new URL(window.location.href);
                url.searchParams.delete("code");
                url.searchParams.delete("state");
                url.searchParams.delete("error");
                url.searchParams.delete("client_info");
                url.searchParams.delete("expires_in");
                url.searchParams.delete("ext_expires_in");
                url.searchParams.delete("session_state");
                window.history.replaceState({}, "", url.toString());
                return authCode;
            }
            else if (error) {
                url.searchParams.delete("error");
                throw new Error(error);
            }
            else {
                this.cacheService.set("msal.codeVerifier", this.codeVerifier);
                window.location.href = loginUrl;
            }
        }
        return authCode;
    }

    public async getAccessTokenFromCode(resource: string, code: string): Promise<ICustomAuthResult> {
        var tokenResponse = await fetch(`https://login.microsoftonline.com/${this.config.tenantId || "common"}/oauth2/v2.0/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                accept: "application/json"
            },
            body: new URLSearchParams({
                client_id: this.config.clientId,
                scope: `${resource}/.default openid profile offline_access`,
                redirect_uri: this.config.redirectUri,
                grant_type: "authorization_code",
                code: code,
                code_verifier: this.codeVerifier
            })
        });
        if (tokenResponse.ok) {
            var token = await tokenResponse.json();
            return token;
        }
        console.log("Unable to get access token from code", tokenResponse.status, tokenResponse.statusText, await tokenResponse.text());
        throw new Error("Unable to get access token from code");
    }

    public async getAccessTokenFromRefreshToken(resource: string, refreshToken: string): Promise<ICustomAuthResult> {
        var tokenResponse = await fetch(`https://login.microsoftonline.com/${this.config.tenantId || "common"}/oauth2/v2.0/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                accept: "application/json"
            },
            body: new URLSearchParams({
                client_id: this.config.clientId,
                scope: `${resource}/.default openid profile offline_access`,
                //redirect_uri: this.config.redirectUri,
                grant_type: "refresh_token",
                refresh_token: refreshToken,
                //code_verifier: "tX3g82dJpfRBi9l0JobgwriatwlGZgkx5lSq1x0Irhw"
            })
        });
        if (tokenResponse.ok) {
            var token = await tokenResponse.json();
            return token;
        }
        else {
            try {
                var error = await tokenResponse.json();
                //handle expired refresh token
                if(error.error_codes && error.error_codes.length > 0 && error.error_codes[0] === 700084){
                    this.cacheService.remove(`msal.${this.config.clientId}.${resource}.authResult`);
                    if(this.resourceTokenMap.has(resource)){
                        this.resourceTokenMap.delete(resource);
                    }
                }
                return this.getAuthResult(resource);
            }
            catch (ex) {
                var err = await tokenResponse.text();
                throw new Error(err);
            }
        }
    }

    public async getAuthResult(resource: string): Promise<ICustomAuthResult> {
        let authResult: ICustomAuthResult = this.cacheService.get<ICustomAuthResult>(`msal.${this.config.clientId}.${resource}.authResult`);
        if (authResult) {
            try {
                if (TokenUtils.isTokenValid(authResult.access_token)) {
                    return authResult;
                }
            }
            catch {
                console.log("Unable to verify token validity")
            }
            if (authResult.refresh_token) {
                authResult = await this.getAccessTokenFromRefreshToken(resource, authResult.refresh_token);
                this.resourceTokenMap.set(resource, authResult.access_token);
                this.cacheService.set(`msal.${this.config.clientId}.${resource}.authResult`, authResult);
                return authResult;
            }
        }
        const code = await this.loginUser(resource);
        authResult = await this.getAccessTokenFromCode(resource, code);
        this.cacheService.set(`msal.${this.config.clientId}.${resource}.authResult`, authResult);
        this.resourceTokenMap.set(resource, authResult.access_token);
        return authResult;
    }

    @queueRequest("msal-access-token-{0}")
    public async getAccessToken(resource: string): Promise<string> {
        let token = this.resourceTokenMap.get(resource);
        if (token && TokenUtils.isTokenValid(token)) {
            return token;
        }

        const authResult = await this.getAuthResult(resource);
        return authResult.access_token;
    }
}