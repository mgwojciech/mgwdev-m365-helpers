import { GraphSearchPagedDataProvider, IHttpClient } from "../dal";
import { IRefinableDataProvider } from "../dal/dataProviders/IRefinableDataProvider";

export class SearchInputSuggestionService {
    private readonly comparers = [":", "=", "<", ">", "<=", ">="];
    public queryTemplate: string = "";
    constructor(protected searchClient: GraphSearchPagedDataProvider<any>, protected managedProperties: string[]) {

    }

    public async getSuggestions(inputString: string): Promise<{ value: string[], areSuggestionsProps: boolean }> {
        const inputFragments = inputString.split(" ");
        let lastFragment = inputFragments[inputFragments.length - 1];
        let lastUsedComparer = this.comparers.find(c => lastFragment.indexOf(c) > 0);
        let suggestProps = true;
        if (lastUsedComparer) {
            const fragmets = lastFragment.split(lastUsedComparer);
            lastFragment = fragmets[fragmets.length - 1];
            suggestProps = false;
        }

        if (suggestProps) {
            const suggestedProps = this.managedProperties.filter(prop => prop.toLocaleLowerCase().indexOf(lastFragment.toLowerCase()) >= 0)
            return {
                value: suggestedProps,
                areSuggestionsProps: true
            }
        }
        else {
            lastFragment = inputFragments[inputFragments.length - 1];
            this.searchClient.pageSize = 10;
            const fragmets = lastFragment.split(lastUsedComparer);
            const currentProperty = fragmets[0];
            this.searchClient.selectFields = [currentProperty]
            this.searchClient.setRefiners([{
                field: "ManagedProperties",
                size: 1,
                bucketDefinition: {
                    sortBy: "count",
                    isDescending: true,
                    minimumCount: 1000
                }
            }]);
            this.searchClient.setQuery(inputString + "*");
            const data = await this.searchClient.getData();
            const firstResult = data[0]?.fields;
            if (firstResult) {
                let field = currentProperty;
                for (var fld in firstResult) {
                    if (fld.toLocaleLowerCase() === currentProperty.toLocaleLowerCase()) {
                        field = fld;
                    }
                }
                const values = data.map(r => r.fields[field]);
                return {
                    value: values.filter((val, index) => values.indexOf(val) === index),
                    areSuggestionsProps: false
                }
            }
            return {
                value: [],
                areSuggestionsProps: false
            }
        }
    }
}

export class GraphSearchInputSuggestionServiceBuilder {
    protected searchClient?: GraphSearchPagedDataProvider<any>;
    protected query?: string;
    constructor(protected graphClient: IHttpClient) {

    }
    public withClient(graphClient: IHttpClient) {
        this.graphClient = graphClient;
        return this;
    }
    public withManagedPropertiesRelatedQuery(query: string) {
        this.query = query;
        return this;
    }

    public async build(): Promise<SearchInputSuggestionService> {
        if (!this.searchClient) {
            this.searchClient = new GraphSearchPagedDataProvider(this.graphClient, ["listItem"], ["ID"]);
        }
        this.searchClient.setRefiners([{
            field: "ManagedProperties",
            size: 1000,
            bucketDefinition: {
                sortBy: "count",
                isDescending: true,
                minimumCount: 1
            }
        }]);
        this.searchClient.setQuery(this.query || "*");
        this.searchClient.pageSize = 1;
        await this.searchClient.getData();
        const propertiesAggregations = this.searchClient.currentAggregations.find(aggr => aggr.field === "ManagedProperties");
        const managedProperties = propertiesAggregations.buckets.map(buck => buck.key);

        const service = new SearchInputSuggestionService(this.searchClient, managedProperties);
        if (this.query) {
            service.queryTemplate = `{searchTerms} AND ${this.query}`
        }
        return service;
    }
}