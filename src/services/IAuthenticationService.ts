export interface IAuthenticationService {
    getAccessToken(resource: string): Promise<string>;
    logout(): Promise<void>;
}