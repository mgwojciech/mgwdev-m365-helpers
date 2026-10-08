import { CopilotChatService } from "./CopilotChatService";

export class WorkIQChatService extends CopilotChatService {
    public override conversationApi = "/conversations";
}