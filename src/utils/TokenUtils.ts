import { IAzureADToken } from "../model/IAzureADToken";

export class TokenUtils{
    public static getTokenInfo(accessToken: string): IAzureADToken{
        var tokenInfo = atob(accessToken.split(".")[1]);
        return JSON.parse(tokenInfo);
    }
}