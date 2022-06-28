export interface IAzureADToken {
    amr: string[];
    aud: string;
    appid: string;
    exp: number;
    family_name: string;
    given_name: string;
    iat: number;
    idtyp: string;
    iss: string;
    name: string;
    oid: string;
    scp: string;
    tid: string;
    unique_name: string;
}
