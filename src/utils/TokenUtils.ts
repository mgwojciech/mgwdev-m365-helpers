import { IAzureADToken } from "../model/IAzureADToken";

export class TokenUtils{
    public static getTokenInfo(accessToken: string): IAzureADToken{
        var tokenInfo = atob(accessToken.split(".")[1]);
        return JSON.parse(tokenInfo);
    }
    public static isTokenValid(accessToken: string): boolean{
        let jwtToken = TokenUtils.getTokenInfo(accessToken);
        if (jwtToken.exp < new Date().getTime() / 1000) {
            return false;
        }
        return true;
    }
}