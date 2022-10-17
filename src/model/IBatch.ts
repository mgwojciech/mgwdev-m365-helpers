export interface IBatch{
    id: string;
    url: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    headers: any;
    body?: any;
}