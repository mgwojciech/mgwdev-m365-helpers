export class ArrayUtilities {
    /**
     * Creates a array of arrays of length no bigger then provided number.
     * @param arr Original array that needs to be splitted.
     * @param length Max length of sub arrays to be returned.
     * @returns 
     */
    public static splitToMaxLength<T>(arr: T[], length: number): T[][] {
        let result = [];
        let startIndex = 0;
        while (startIndex < arr.length) {
            result.push(arr.slice(startIndex, startIndex + length));
            startIndex += length;
        }
        return result;
    }
    /**
     * Returns a new Map which represents a subset of Map elements with provided keys.
     * @param map Original Map that needs to be filtered.
     * @param keys Keys to filter by.
     * @returns 
     */
    public static getSubMap<T, U>(map: Map<T, U>, keys: T[]): Map<T, U> {
        let result = new Map<T, U>();
        keys.forEach(key => result.set(key, map.get(key)));
        return result;
    }
}