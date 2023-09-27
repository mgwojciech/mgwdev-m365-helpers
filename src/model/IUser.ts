export interface IUser {
    displayName: string;
    jobTitle?: string;
    id: string;
    userPrincipalName?: string;
    presence?: IPresence;
    photo?: any;
}
export interface IPresence {
    availability: "Available" | "AvailableIdle" | "Away" | "BeRightBack" | "Busy" | "BusyIdle" | "DoNotDisturb" | "Offline" | "PresenceUnknown";
    activity: "Available" | "Away" | "BeRightBack" | "Busy" | "DoNotDisturb" | "InACall" | "InAConferenceCall" | "Inactive" | "InAMeeting" | "Offline" | "OffWork" | "OutOfOffice" | "PresenceUnknown" | "Presenting" | "UrgentInterruptionsOnly";
    outOfOfficeSettings?:{
        message?: string;
        isOutOfOffice?: boolean;
    }
}