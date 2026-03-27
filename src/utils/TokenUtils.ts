import { IAzureADToken } from "../model/IAzureADToken";

export class TokenUtils{
    public static getTokenInfo(accessToken: string): IAzureADToken{
        var tokenInfo = atob(accessToken.split(".")[1]);
        return JSON.parse(tokenInfo);
    }
    public static isExpValid(exp: number | undefined): boolean {
        return !!exp && exp > new Date().getTime() / 1000;
    }
    public static isTokenValid(accessToken: string): boolean{
        let jwtToken = TokenUtils.getTokenInfo(accessToken);
        return TokenUtils.isExpValid(jwtToken.exp);
    }
}