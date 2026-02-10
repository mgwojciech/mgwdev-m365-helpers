import { IHttpClient } from "../../dal";
import { ICopilotConversationResponse, ICopilotMessageBody, ICopilotResponseMessage } from "../../model/graph/Copilot";

export class CopilotChatService {
    protected converstationId: string | undefined = undefined;
    public locationHint: { timeZone: string } = { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    constructor(protected graphClient: IHttpClient) {

    }

    public async initConversation() {
        const response = await this.graphClient.post("/copilot/conversations", {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({}),
        });
        const data = await response.json();
        if (!data.id) {
            throw new Error(data.error || "Failed to initialize conversation");
        }
        this.converstationId = data.id;
    }

    public async sendTextMessage(text: string,
        onMessageReceived: (message: ICopilotResponseMessage) => void,
        onCompleted: (lastMessage: ICopilotConversationResponse) => void,
        onError: (error: any) => void) {
        return await this.sendMessageBody({ message: { text } }, onMessageReceived, onCompleted, onError);
    }

    public async sendMessageBody(message: ICopilotMessageBody,
        onMessageReceived: (message: ICopilotResponseMessage) => void,
        onCompleted: (lastMessage: ICopilotConversationResponse) => void,
        onError: (error: any) => void) {
        const response = await this.graphClient.post(
            `https://graph.microsoft.com/beta/copilot/conversations/${this.converstationId}/chatOverStream`,
            {
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    locationHint: this.locationHint,
                    ...message,
                }),
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            onError(errorData.error || "Failed to send message");
            return;
        }
        const reader = response.body?.getReader();
        if (!reader) {
            onError("Failed to get reader from response body");
            return;
        }
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let latestParsedResponse: ICopilotConversationResponse | null = null;

        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                if (latestParsedResponse) {
                    onCompleted?.(latestParsedResponse);
                }
                break;
            }
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n");
            buffer = parts.pop() || "";
            for (const event of parts) {
                const trimmedEvent = event.trim();
                if (trimmedEvent.startsWith("data:")) {
                    const json = trimmedEvent.replace("data:", "").trim();
                    try {
                        const parsed: ICopilotConversationResponse = JSON.parse(json);
                        latestParsedResponse = parsed;
                        const newMessages = parsed.messages ?? [];
                        const newMessage = newMessages[newMessages.length - 1];
                        if (newMessage) {
                            onMessageReceived({ ...newMessage });
                        }
                    } catch (err) {
                        console.error("Failed to parse SSE JSON", err);
                    }
                }
            }
        }
        // Process any remaining data in buffer after stream ends
        if (buffer.trim().startsWith("data:")) {
            const json = buffer.trim().replace("data:", "").trim();
            try {
                const parsed: ICopilotConversationResponse = JSON.parse(json);
                const newMessages = parsed.messages ?? [];
                if (newMessages.length > 0) {
                    const lastMessage = newMessages[newMessages.length - 1];
                    onMessageReceived?.({ ...lastMessage });
                }
            } catch (err) {
                console.error("Failed to parse final SSE JSON", err);
            }
        }
    }
}