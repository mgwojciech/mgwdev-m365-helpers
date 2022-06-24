// import { IAuthenticationService } from "./IAuthenticationService";
// import * as msal from "@azure/msal-node";
// import { ChildProcess } from "child_process";
// import * as readLine from "readline";

// export class NodeAuthenticationService implements IAuthenticationService {
//     protected msalConfig;
//     protected clientApp: msal.PublicClientApplication;
//     constructor(protected clientId, protected clientSecret, protected redirectUrl, protected authority = "organizations") {
//         this.msalConfig = {
//             auth: {
//                 clientId,
//                 clientSecret,
//                 authority: `https://login.microsoftonline.com/${authority}`
//             }
//         }
//         this.clientApp = new msal.PublicClientApplication(this.msalConfig);
//     }
//     public async getAccessToken(resource: string): Promise<string> {
//         let tokenRequest = {
//             scopes: [`${resource}/.default`],
//             redirectUri: this.redirectUrl,
//             code: ""
//         };
//         let codeUrl = await this.clientApp.getAuthCodeUrl(tokenRequest);
//         let browserProcess = await open(codeUrl);
//         tokenRequest.code = await this.waitForLogIn(browserProcess);
//         let tokenResponse = await this.clientApp.acquireTokenByCode(tokenRequest);
//         return tokenResponse.accessToken;
//     }
//     waitForLogIn(browserProcess: ChildProcess): Promise<string> {
//         return new Promise((resolve, error) => {
//             let line = readLine.createInterface({
//                 input: process.stdin,
//                 output: process.stdout
//             });
//             line.question("Please paste url after authentication process ends", (url)=>{
//                 let loginUrl = new URL(url);
//                 resolve(loginUrl.searchParams.get("code"));
//             })
//         })
//     }
// }