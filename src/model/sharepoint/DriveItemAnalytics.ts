export type DriveItemAnalytics = {
    "@odata.etag"?: string;
    analytics?: {
        allTime?: IDriveItemActivity[]
    },
    insights?: {
        id?: string;
        keyPoints: [];
        readTime: string;
    }
}

export type IDriveItemActivity = {
    access?: {
        count?: number;
        actionCount: number;
        actorCount: number;
        timeSpentInSeconds?: number;
    },
    activities?: {
        access?: {
            count?: number;
            actionCount: number;
        },
        activityDateTime?: string;
        actor?: {
            user?: {
                displayName?: string;
                id?: string;
                email?: string;
            }
        }
    }
}