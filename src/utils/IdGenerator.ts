export class IdGenerator {
    private lastUsedId = 0;
    public getNextId() {
        this.lastUsedId++;
        return this.lastUsedId.toString();
    }
    public reset() {
        this.lastUsedId = 0;
    }
}