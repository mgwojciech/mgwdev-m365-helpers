export class StringUtilities{
    public static findMostSimilar(collection: string[], value: string){
        let mostSimilar = '';
        let mostSimilarSimilarity = Number.MAX_VALUE;
        for(let i = 0; i < collection.length; i++){
            const similarity = this.calculateSimilarity(value, collection[i]);
            if(similarity < mostSimilarSimilarity){
                mostSimilarSimilarity = similarity;
                mostSimilar = collection[i];
            }
        }
        return mostSimilar;
    }
    /**
     * Calculates the similarity between two strings based on the Levenshtein distance
     * https://en.wikipedia.org/wiki/Levenshtein_distance
     */
    public static calculateSimilarity(value1: string, value2: string){
        const value1Length = value1.length;
        const value2Length = value2.length;
        const matrix = new Array(value1Length + 1);
        for(let i = 0; i <= value1Length; i++){
            matrix[i] = new Array(value2Length + 1);
            matrix[i][0] = i;
        }
        for(let j = 0; j <= value2Length; j++){
            matrix[0][j] = j;
        }
        for(let i = 1; i <= value1Length; i++){
            for(let j = 1; j <= value2Length; j++){
                const cost = value1[i - 1] === value2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }
        return matrix[value1Length][value2Length];
    }
}