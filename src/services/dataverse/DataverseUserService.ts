import { IHttpClient, IHttpClientResponse } from "../../dal/http/IHttpClient";
import { IEntityWithIdAndDisplayName } from "../../model/IEntityWithIdAndDisplayName";


export interface DataverseUserTeam { teamid: string; name: string; }
export interface DataverseUserRole { roleid: string; name: string; }
export interface DataverseUserBusinessUnit { businessunitid: string; name: string; }
export type UserAssignmentKind = "teams" | "roles" | "businessunits";

const headers = {
    "Content-Type": "application/json",
    "OData-MaxVersion": "4.0",
    "OData-Version": "4.0",
    Accept: "application/json",
};

export class DataverseUserService {
    private readonly api: string;

    constructor(private dataverseClient: IHttpClient, dataverseResource: string) {
        this.api = `${dataverseResource.replace(/\/$/, "")}/api/data/v9.1`;
    }

    private async checkResponse(response: IHttpClientResponse, action: string) {
        if (!response.ok) {
            const detail = await response.text();
            throw new Error(`${action} failed (${response.status}). ${detail}`);
        }
    }

    private async getAll<T>(url: string): Promise<T[]> {
        const records: T[] = [];
        while (url) {
            const response = await this.dataverseClient.get(url, { headers });
            await this.checkResponse(response, "Loading assignments");
            const page: { value: T[]; "@odata.nextLink"?: string } = await response.json();
            records.push(...page.value);
            url = page["@odata.nextLink"];
        }
        return records;
    }

    public getUserTeamMembership(userId: string, filter?: string): Promise<DataverseUserTeam[]> {
        return this.getAll(`${this.api}/teams?$select=teamid,name&$filter=teammembership_association/any(a: a/systemuserid eq ${userId})${filter ? ` and (${filter})` : ""}`);
    }

    public getUserRoles(userId: string, filter?: string): Promise<DataverseUserRole[]> {
        return this.getAll(`${this.api}/roles?$select=roleid,name&$filter=systemuserroles_association/any(a: a/systemuserid eq ${userId})${filter ? ` and (${filter})` : ""}`);
    }

    public getUserBusinessUnits(userId: string, filter?: string): Promise<DataverseUserBusinessUnit[]> {
        return this.getAll(`${this.api}/businessunits?$select=businessunitid,name&$filter=business_unit_system_users/any(a: a/systemuserid eq ${userId})${filter ? ` and (${filter})` : ""}`);
    }

    public async searchAssignments(kind: UserAssignmentKind, search: string, filter?: string): Promise<IEntityWithIdAndDisplayName[]> {
        const idColumn = { teams: "teamid", roles: "roleid", businessunits: "businessunitid" }[kind];
        const conditions = [filter, search ? `contains(name,'${search.replace(/'/g, "''")}')` : undefined]
            .filter(Boolean).map(condition => `(${condition})`);
        const url = `${this.api}/${kind}?$select=${idColumn},name&$orderby=name&$top=50${conditions.length ? `&$filter=${encodeURIComponent(conditions.join(" and "))}` : ""}`;
        const response = await this.dataverseClient.get(url, { headers });
        await this.checkResponse(response, "Searching assignments");
        const result: { value: Record<string, string>[] } = await response.json();
        return result.value.map(record => ({ id: record[idColumn], displayName: record.name }));
    }

    public async setAssignment(userId: string, kind: "teams" | "roles", id: string, assigned: boolean) {
        const relationship = kind === "teams" ? "teammembership_association" : "systemuserroles_association";
        const url = `${this.api}/systemusers(${userId})/${relationship}`;
        const response = assigned
            ? await this.dataverseClient.post(`${url}/$ref`, {
                headers, body: JSON.stringify({ "@odata.id": `${this.api}/${kind}(${id})` }),
            })
            : await this.dataverseClient.delete(`${url}(${id})/$ref`, { headers });
        await this.checkResponse(response, assigned ? "Adding assignment" : "Removing assignment");
    }

    public async updateUserTeamMembership(userId: string, teams: DataverseUserTeam[]) {
        const current = await this.getUserTeamMembership(userId);
        for (const team of current.filter(item => !teams.some(next => next.teamid === item.teamid))) {
            await this.setAssignment(userId, "teams", team.teamid, false);
        }
        for (const team of teams.filter(item => !current.some(previous => previous.teamid === item.teamid))) {
            await this.setAssignment(userId, "teams", team.teamid, true);
        }
    }

    public async updateUserRoles(userId: string, roles: DataverseUserRole[]) {
        const current = await this.getUserRoles(userId);
        for (const role of current.filter(item => !roles.some(next => next.roleid === item.roleid))) {
            await this.setAssignment(userId, "roles", role.roleid, false);
        }
        for (const role of roles.filter(item => !current.some(previous => previous.roleid === item.roleid))) {
            await this.setAssignment(userId, "roles", role.roleid, true);
        }
    }

    public async updateUserBusinessUnits(userId: string, businessUnits: DataverseUserBusinessUnit[]) {
        if (businessUnits.length !== 1) {
            throw new Error("A user must have exactly one primary business unit.");
        }
        const response = await this.dataverseClient.patch(`${this.api}/systemusers(${userId})`, {
            headers,
            body: JSON.stringify({ "businessunitid@odata.bind": `/businessunits(${businessUnits[0].businessunitid})` }),
        });
        await this.checkResponse(response, "Changing business unit");
    }
}
