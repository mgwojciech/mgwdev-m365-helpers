import { IUser } from "../../model";
import { IHttpClient } from "../http";
import { GraphODataPagedDataProvider } from "./GraphODataPagedDataProvider";

export class PeopleProvider extends GraphODataPagedDataProvider<IUser>{
    public personTypeClass?: "Person" | "Group" = "Person";
    constructor(graphClient: IHttpClient, public loadPresence: boolean = true, public loadPhoto: boolean = true){
        super(graphClient,"https://graph.microsoft.com/v1.0/me/people",true);
        //I think 7 as default is optimal as we will create consecutive request for photo and presence
        //batch size limit is 15 so 7*2=14 which means we will have only one consequent request.
        this.pageSize = 7;
    }

    protected override async callGraphAPI(url: string): Promise<IUser[]> {
        let peopleList: IUser[] = await super.callGraphAPI(url);
        let additionalQueries = [];
        if (this.loadPresence) {
            additionalQueries.push(...peopleList.map(this.appendPresence.bind(this)));
        }
        if (this.loadPhoto) {
            additionalQueries.push(...peopleList.map(this.appendPhoto.bind(this)));
        }
        if (additionalQueries.length > 0)
            await Promise.all(additionalQueries);

        return peopleList;
    }
    protected async appendPresence(person: IUser): Promise<void> {
        let presence = await this.graphClient.get(`v1.0/users/${person.id}/presence`);
        if (presence.ok) {
            person.presence = await presence.json();
        }
    }
    protected async appendPhoto(person: IUser): Promise<void> {
        let photo = await this.graphClient.get(`/v1.0/users/${person.id}/photo/$value`);
        if (photo.ok) {
            person.photo = await photo.text();
        }
    }
    protected override buildInitialQuery() {
        let query = this.getQuery();
        let apiUri = `${this.resourceQuery}?$top=${this.pageSize}`;
        if(this.orderQuery){
            apiUri += `&$orderBy=${this.orderQuery}`;
        }
        if (query) {
            apiUri += `&$search=${query}`;
        }

        if (this.personTypeClass) {
            apiUri += `&$filter=personType/class eq '${this.personTypeClass}'`;
        }
        return apiUri;
    }
}