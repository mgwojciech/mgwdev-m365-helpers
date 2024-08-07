import * as Msal from "msal";
import { TokenUtils } from "../utils";
import { queueRequest } from "../utils/FunctionUtils";
import { IAuthenticationService } from "./IAuthenticationService";

export class MsalAuthenticationService implements IAuthenticationService {
    protected msalInstance: Msal.UserAgentApplication;
    protected resourceTokenMap: Map<string, string> = new Map<string, string>();
    /**
     * Initializes new instance of AuthenticationService
     * @param clientId AppId of an AAD app You configured in AAD.
     */
    constructor(protected clientId, protected scopes: string[] = [".default"], protected tenantId = "organizations") {
        const msalConfig = {
            auth: {
                clientId: clientId,
                authority: `https://login.microsoftonline.com/${tenantId}/`,
            }
        };

        this.msalInstance = new Msal.UserAgentApplication(msalConfig);

        this.msalInstance.handleRedirectCallback(this.redirectCallback);
        this.redirectCallback = this.redirectCallback.bind(this);
    }
    public redirectCallback(error, response) {
        if (console)
            console.log(response);
    }
    @queueRequest("msalLogin")
    public logIn(resource: string = "https://graph.microsoft.com") {
        var loginRequest = {
        };

        return this.msalInstance.loginPopup(loginRequest)
            .then(response => {
                let token = response.accessToken;
                this.resourceTokenMap.set(resource, token);
                return token;
            })
    }
    public async getAccessToken(resource: string = "https://graph.microsoft.com"): Promise<string> {
        let token = this.resourceTokenMap.get(resource);
        if (token && TokenUtils.isTokenValid(token)) {
            return token;
        }
        if (this.msalInstance.getAccount()) {
            return this.getTokenSilent(resource);
        } else {
            return this.logIn(resource).then(() => this.getTokenSilent(resource));
        }

    }

    private getTokenSilent(resource: string) {
        var tokenRequest = {
            scopes: this.scopes.map(scope=>`${resource}/${scope}`)
        };
        return this.msalInstance.acquireTokenSilent(tokenRequest)
            .then(response => {
                let token = response.accessToken;
                this.resourceTokenMap.set(resource, token);
                return token;
            })
            .catch(err => {
                // could also check if err instance of InteractionRequiredAuthError if you can import the class.
                if (err.name === "InteractionRequiredAuthError") {
                    return this.msalInstance.acquireTokenPopup(tokenRequest)
                        .then(response => {
                            let token = response.accessToken;
                            this.resourceTokenMap.set(resource, token);
                            return token;
                        })
                        .catch(deepErr => {
                            throw deepErr;
                        });
                }
            });
    }
}