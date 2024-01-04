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

export const generateGuid = () => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

export const generateRandomString = (length: number) => {
    let result = '';

    for (let i = 0; i < length; i++) {
      const randomCharCode = Math.floor(Math.random() * 26) + (Math.random() < 0.5 ? 65 : 97);
      result += String.fromCharCode(randomCharCode);
    }
  
    return result;
}