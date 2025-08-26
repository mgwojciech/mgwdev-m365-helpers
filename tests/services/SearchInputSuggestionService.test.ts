///<reference types="jest" />
import { SearchInputSuggestionService } from "../../src/services/SearchInputSuggestionService";

describe("SearchInputSuggestionService", () => {
    test("should return managed properties suggestions for the first couple characters", async () => {
        const searchClient = {};
        const service = new SearchInputSuggestionService(searchClient as any, ["TestProperty1", "Title"]);

        const expectedSuggestions = ["TestProperty1"];

        const suggestions = await service.getSuggestions("tes");

        expect(suggestions.value).toStrictEqual(expectedSuggestions);
        expect(suggestions.areSuggestionsProps).toBe(true);
    })
    test("should return managed properties suggestions for second comparison", async () => {
        const searchClient = {};
        const service = new SearchInputSuggestionService(searchClient as any, ["TestProperty1", "Title"]);

        const expectedSuggestions = ["TestProperty1"];

        const suggestions = await service.getSuggestions("Title:Test+2 AND tes");

        expect(suggestions.value).toStrictEqual(expectedSuggestions);
        expect(suggestions.areSuggestionsProps).toBe(true);
    });
    test("should return values for initial search", async () => {
        const searchClient = {
            pageSize: 1,
            setRefiners: () => { },
            setQuery: jest.fn(),
            getData: jest.fn(),
            selectFields: []
        };

        searchClient.getData.mockResolvedValueOnce([{
            fields: {
                title: "Test 1"
            }
        }])
        const service = new SearchInputSuggestionService(searchClient as any, ["TestProperty1", "Title"]);

        const expectedSuggestions = ["Test 1"];

        const suggestions = await service.getSuggestions("Title:Tes");

        expect(suggestions.value).toStrictEqual(expectedSuggestions);
        expect(suggestions.areSuggestionsProps).toBe(false);
        expect(searchClient.setQuery).toBeCalledWith("Title:Tes*")
    });
    test("should return values for secondary search", async () => {
        const searchClient = {
            pageSize: 1,
            setRefiners: () => { },
            setQuery: jest.fn(),
            getData: jest.fn(),
            selectFields: []
        };

        searchClient.getData.mockResolvedValueOnce([{
            fields: {
                title: "Test 1"
            }
        }])
        const service = new SearchInputSuggestionService(searchClient as any, ["TestProperty1", "Title"]);

        const expectedSuggestions = ["Test 1"];

        const suggestions = await service.getSuggestions("TestProperty1=Test AND Title:Tes");

        expect(suggestions.value).toStrictEqual(expectedSuggestions);
        expect(suggestions.areSuggestionsProps).toBe(false);
        expect(searchClient.setQuery).toBeCalledWith("TestProperty1=Test AND Title:Tes*")
    })
})