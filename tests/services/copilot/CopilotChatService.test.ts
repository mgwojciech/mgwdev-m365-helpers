///<reference types="jest" />
import { CopilotChatService } from "../../../src/services/copilot/CopilotChatService";
import { IHttpClient, IHttpClientResponse } from "../../../src/dal/http/IHttpClient";
import { ICopilotConversationResponse, ICopilotResponseMessage } from "../../../src/model/graph/Copilot";
import { assert } from "chai";

describe("CopilotChatService", () => {
    const createMockHttpClient = (overrides: Partial<IHttpClient> = {}): IHttpClient => ({
        get: jest.fn(),
        post: jest.fn(),
        patch: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        ...overrides,
    });

    const createMockResponse = (overrides: Partial<IHttpClientResponse> = {}): IHttpClientResponse => ({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(""),
        blob: () => Promise.resolve(new Blob()),
        ...overrides,
    });

    const createMockReadableStream = (data: string[]): ReadableStream<Uint8Array> => {
        const encoder = new TextEncoder();
        let index = 0;
        return new ReadableStream<Uint8Array>({
            pull(controller) {
                if (index < data.length) {
                    controller.enqueue(encoder.encode(data[index]));
                    index++;
                } else {
                    controller.close();
                }
            },
        });
    };

    describe("constructor", () => {
        test("should initialize with default timezone", () => {
            const mockClient = createMockHttpClient();
            const service = new CopilotChatService(mockClient);

            assert.isDefined(service.locationHint);
            assert.equal(service.locationHint.timeZone, Intl.DateTimeFormat().resolvedOptions().timeZone);
        });
    });

    describe("initConversation", () => {
        test("should initialize conversation and set conversation id", async () => {
            const mockConversationId = "test-conversation-123";
            const mockClient = createMockHttpClient({
                post: jest.fn().mockResolvedValue(
                    createMockResponse({
                        json: () => Promise.resolve({ id: mockConversationId }),
                    })
                ),
            });

            const service = new CopilotChatService(mockClient);
            await service.initConversation();

            expect(mockClient.post).toHaveBeenCalledWith("/copilot/conversations", {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({}),
            });
        });

        test("should throw error when conversation id is not returned", async () => {
            const mockClient = createMockHttpClient({
                post: jest.fn().mockResolvedValue(
                    createMockResponse({
                        json: () => Promise.resolve({ error: "Some error occurred" }),
                    })
                ),
            });

            const service = new CopilotChatService(mockClient);

            await expect(service.initConversation()).rejects.toThrow("Some error occurred");
        });

        test("should throw default error when no id and no error message", async () => {
            const mockClient = createMockHttpClient({
                post: jest.fn().mockResolvedValue(
                    createMockResponse({
                        json: () => Promise.resolve({}),
                    })
                ),
            });

            const service = new CopilotChatService(mockClient);

            await expect(service.initConversation()).rejects.toThrow("Failed to initialize conversation");
        });
    });

    describe("sendTextMessage", () => {
        test("should send text message with correct format", async () => {
            const mockConversationId = "conv-123";
            const mockMessage: ICopilotResponseMessage = {
                id: "msg-1",
                text: "Hello response",
                createdDateTime: new Date().toISOString(),
            };
            const mockResponse: ICopilotConversationResponse = {
                id: "resp-1",
                messages: [mockMessage],
                agentId: "agent-1",
                createdDateTime: new Date().toISOString(),
            };

            const postMock = jest.fn()
                .mockResolvedValueOnce(
                    createMockResponse({
                        json: () => Promise.resolve({ id: mockConversationId }),
                    })
                )
                .mockResolvedValueOnce(
                    createMockResponse({
                        body: createMockReadableStream([`data:${JSON.stringify(mockResponse)}\n`]),
                    })
                );

            const mockClient = createMockHttpClient({ post: postMock });
            const service = new CopilotChatService(mockClient);
            await service.initConversation();

            const onMessageReceived = jest.fn();
            const onCompleted = jest.fn();
            const onError = jest.fn();

            await service.sendTextMessage("Hello", onMessageReceived, onCompleted, onError);

            expect(postMock).toHaveBeenCalledTimes(2);
            expect(postMock).toHaveBeenLastCalledWith(
                `https://graph.microsoft.com/beta/copilot/conversations/${mockConversationId}/chatOverStream`,
                expect.objectContaining({
                    headers: { "Content-Type": "application/json" },
                    body: expect.stringContaining('"message":{"text":"Hello"}'),
                })
            );
            expect(onError).not.toHaveBeenCalled();
        });
    });

    describe("sendMessageBody", () => {
        test("should handle successful streaming response", async () => {
            const mockConversationId = "conv-456";
            const mockMessage: ICopilotResponseMessage = {
                id: "msg-1",
                text: "Response text",
                createdDateTime: new Date().toISOString(),
            };
            const mockResponse: ICopilotConversationResponse = {
                id: "resp-1",
                messages: [mockMessage],
                agentId: "agent-1",
                createdDateTime: new Date().toISOString(),
            };

            const postMock = jest.fn()
                .mockResolvedValueOnce(
                    createMockResponse({
                        json: () => Promise.resolve({ id: mockConversationId }),
                    })
                )
                .mockResolvedValueOnce(
                    createMockResponse({
                        body: createMockReadableStream([`data:${JSON.stringify(mockResponse)}\n`]),
                    })
                );

            const mockClient = createMockHttpClient({ post: postMock });
            const service = new CopilotChatService(mockClient);
            await service.initConversation();

            const onMessageReceived = jest.fn();
            const onCompleted = jest.fn();
            const onError = jest.fn();

            await service.sendMessageBody(
                { message: { text: "Test" } },
                onMessageReceived,
                onCompleted,
                onError
            );

            expect(onMessageReceived).toHaveBeenCalledWith(expect.objectContaining({ text: "Response text" }));
            expect(onCompleted).toHaveBeenCalledWith(mockResponse);
            expect(onError).not.toHaveBeenCalled();
        });

        test("should handle multiple streamed messages", async () => {
            const mockConversationId = "conv-789";
            const mockMessage1: ICopilotResponseMessage = {
                id: "msg-1",
                text: "First part",
                createdDateTime: new Date().toISOString(),
            };
            const mockMessage2: ICopilotResponseMessage = {
                id: "msg-2",
                text: "Second part",
                createdDateTime: new Date().toISOString(),
            };
            const mockResponse1: ICopilotConversationResponse = {
                id: "resp-1",
                messages: [mockMessage1],
                agentId: "agent-1",
                createdDateTime: new Date().toISOString(),
            };
            const mockResponse2: ICopilotConversationResponse = {
                id: "resp-1",
                messages: [mockMessage1, mockMessage2],
                agentId: "agent-1",
                createdDateTime: new Date().toISOString(),
            };

            const postMock = jest.fn()
                .mockResolvedValueOnce(
                    createMockResponse({
                        json: () => Promise.resolve({ id: mockConversationId }),
                    })
                )
                .mockResolvedValueOnce(
                    createMockResponse({
                        body: createMockReadableStream([
                            `data:${JSON.stringify(mockResponse1)}\n`,
                            `data:${JSON.stringify(mockResponse2)}\n`,
                        ]),
                    })
                );

            const mockClient = createMockHttpClient({ post: postMock });
            const service = new CopilotChatService(mockClient);
            await service.initConversation();

            const onMessageReceived = jest.fn();
            const onCompleted = jest.fn();
            const onError = jest.fn();

            await service.sendMessageBody(
                { message: { text: "Test" } },
                onMessageReceived,
                onCompleted,
                onError
            );

            expect(onMessageReceived).toHaveBeenCalledTimes(2);
            expect(onCompleted).toHaveBeenCalledWith(mockResponse2);
        });

        test("should handle error response from server", async () => {
            const mockConversationId = "conv-error";
            const postMock = jest.fn()
                .mockResolvedValueOnce(
                    createMockResponse({
                        json: () => Promise.resolve({ id: mockConversationId }),
                    })
                )
                .mockResolvedValueOnce(
                    createMockResponse({
                        ok: false,
                        status: 500,
                        json: () => Promise.resolve({ error: "Server error" }),
                    })
                );

            const mockClient = createMockHttpClient({ post: postMock });
            const service = new CopilotChatService(mockClient);
            await service.initConversation();

            const onMessageReceived = jest.fn();
            const onCompleted = jest.fn();
            const onError = jest.fn();

            await service.sendMessageBody(
                { message: { text: "Test" } },
                onMessageReceived,
                onCompleted,
                onError
            );

            expect(onError).toHaveBeenCalledWith("Server error");
            expect(onMessageReceived).not.toHaveBeenCalled();
            expect(onCompleted).not.toHaveBeenCalled();
        });

        test("should handle missing reader from response body", async () => {
            const mockConversationId = "conv-no-reader";
            const postMock = jest.fn()
                .mockResolvedValueOnce(
                    createMockResponse({
                        json: () => Promise.resolve({ id: mockConversationId }),
                    })
                )
                .mockResolvedValueOnce(
                    createMockResponse({
                        body: undefined,
                    })
                );

            const mockClient = createMockHttpClient({ post: postMock });
            const service = new CopilotChatService(mockClient);
            await service.initConversation();

            const onMessageReceived = jest.fn();
            const onCompleted = jest.fn();
            const onError = jest.fn();

            await service.sendMessageBody(
                { message: { text: "Test" } },
                onMessageReceived,
                onCompleted,
                onError
            );

            expect(onError).toHaveBeenCalledWith("Failed to get reader from response body");
        });

        test("should include locationHint and contextual resources in request", async () => {
            const mockConversationId = "conv-context";
            const postMock = jest.fn()
                .mockResolvedValueOnce(
                    createMockResponse({
                        json: () => Promise.resolve({ id: mockConversationId }),
                    })
                )
                .mockResolvedValueOnce(
                    createMockResponse({
                        body: createMockReadableStream([]),
                    })
                );

            const mockClient = createMockHttpClient({ post: postMock });
            const service = new CopilotChatService(mockClient);
            service.locationHint = { timeZone: "America/New_York" };
            await service.initConversation();

            const onMessageReceived = jest.fn();
            const onCompleted = jest.fn();
            const onError = jest.fn();

            await service.sendMessageBody(
                {
                    message: { text: "Test" },
                    contextualResources: {
                        files: [{ uri: "https://example.com/file.docx" }],
                    },
                },
                onMessageReceived,
                onCompleted,
                onError
            );

            const requestBody = JSON.parse(postMock.mock.calls[1][1].body);
            expect(requestBody.locationHint).toEqual({ timeZone: "America/New_York" });
            expect(requestBody.contextualResources.files).toEqual([{ uri: "https://example.com/file.docx" }]);
        });

        test("should handle empty messages array in response", async () => {
            const mockConversationId = "conv-empty";
            const mockResponse: ICopilotConversationResponse = {
                id: "resp-1",
                messages: [],
                agentId: "agent-1",
                createdDateTime: new Date().toISOString(),
            };

            const postMock = jest.fn()
                .mockResolvedValueOnce(
                    createMockResponse({
                        json: () => Promise.resolve({ id: mockConversationId }),
                    })
                )
                .mockResolvedValueOnce(
                    createMockResponse({
                        body: createMockReadableStream([`data:${JSON.stringify(mockResponse)}\n`]),
                    })
                );

            const mockClient = createMockHttpClient({ post: postMock });
            const service = new CopilotChatService(mockClient);
            await service.initConversation();

            const onMessageReceived = jest.fn();
            const onCompleted = jest.fn();
            const onError = jest.fn();

            await service.sendMessageBody(
                { message: { text: "Test" } },
                onMessageReceived,
                onCompleted,
                onError
            );

            expect(onMessageReceived).not.toHaveBeenCalled();
            expect(onCompleted).toHaveBeenCalledWith(mockResponse);
        });

        test("should handle chunked SSE data split across reads", async () => {
            const mockConversationId = "conv-chunked";
            const mockMessage: ICopilotResponseMessage = {
                id: "msg-1",
                text: "Chunked response",
                createdDateTime: new Date().toISOString(),
            };
            const mockResponse: ICopilotConversationResponse = {
                id: "resp-1",
                messages: [mockMessage],
                agentId: "agent-1",
                createdDateTime: new Date().toISOString(),
            };
            const fullData = `data:${JSON.stringify(mockResponse)}\n`;
            // Split the data in the middle
            const firstChunk = fullData.substring(0, Math.floor(fullData.length / 2));
            const secondChunk = fullData.substring(Math.floor(fullData.length / 2));

            const postMock = jest.fn()
                .mockResolvedValueOnce(
                    createMockResponse({
                        json: () => Promise.resolve({ id: mockConversationId }),
                    })
                )
                .mockResolvedValueOnce(
                    createMockResponse({
                        body: createMockReadableStream([firstChunk, secondChunk]),
                    })
                );

            const mockClient = createMockHttpClient({ post: postMock });
            const service = new CopilotChatService(mockClient);
            await service.initConversation();

            const onMessageReceived = jest.fn();
            const onCompleted = jest.fn();
            const onError = jest.fn();

            await service.sendMessageBody(
                { message: { text: "Test" } },
                onMessageReceived,
                onCompleted,
                onError
            );

            expect(onMessageReceived).toHaveBeenCalledWith(expect.objectContaining({ text: "Chunked response" }));
            expect(onCompleted).toHaveBeenCalled();
        });

        test("should handle remaining buffer data after stream ends", async () => {
            const mockConversationId = "conv-buffer";
            const mockMessage: ICopilotResponseMessage = {
                id: "msg-1",
                text: "Buffer response",
                createdDateTime: new Date().toISOString(),
            };
            const mockResponse: ICopilotConversationResponse = {
                id: "resp-1",
                messages: [mockMessage],
                agentId: "agent-1",
                createdDateTime: new Date().toISOString(),
            };
            // Data without trailing newline to trigger buffer processing
            const dataWithoutNewline = `data:${JSON.stringify(mockResponse)}`;

            const postMock = jest.fn()
                .mockResolvedValueOnce(
                    createMockResponse({
                        json: () => Promise.resolve({ id: mockConversationId }),
                    })
                )
                .mockResolvedValueOnce(
                    createMockResponse({
                        body: createMockReadableStream([dataWithoutNewline]),
                    })
                );

            const mockClient = createMockHttpClient({ post: postMock });
            const service = new CopilotChatService(mockClient);
            await service.initConversation();

            const onMessageReceived = jest.fn();
            const onCompleted = jest.fn();
            const onError = jest.fn();

            await service.sendMessageBody(
                { message: { text: "Test" } },
                onMessageReceived,
                onCompleted,
                onError
            );

            // The message should be processed from the remaining buffer
            expect(onMessageReceived).toHaveBeenCalledWith(expect.objectContaining({ text: "Buffer response" }));
        });

        test("should handle default error when no error message provided", async () => {
            const mockConversationId = "conv-default-error";
            const postMock = jest.fn()
                .mockResolvedValueOnce(
                    createMockResponse({
                        json: () => Promise.resolve({ id: mockConversationId }),
                    })
                )
                .mockResolvedValueOnce(
                    createMockResponse({
                        ok: false,
                        status: 400,
                        json: () => Promise.resolve({}),
                    })
                );

            const mockClient = createMockHttpClient({ post: postMock });
            const service = new CopilotChatService(mockClient);
            await service.initConversation();

            const onMessageReceived = jest.fn();
            const onCompleted = jest.fn();
            const onError = jest.fn();

            await service.sendMessageBody(
                { message: { text: "Test" } },
                onMessageReceived,
                onCompleted,
                onError
            );

            expect(onError).toHaveBeenCalledWith("Failed to send message");
        });
    });
});
