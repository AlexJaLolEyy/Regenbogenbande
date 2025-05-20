export interface Video {
    title: string,
    description?: string,
    video: string,
    id: number,
    thumbnail: string // or change to Picture?
    participants: User[],
    uploadedBy: User,
    uploadedAt: Date,
    createdAt: Date,
    metadata: Metadata,
}

export interface Picture {
    title: string,
    description?: string,
    img: string,
    id: number,
    participants: User[],
    uploadedBy: User,
    uploadedAt: Date,
    createdAt: Date,
    metadata: Metadata,
}

// a quote got multiple singleQuote to represent the full chat history
export interface Quote {
    fullQuote: singleQuote[],
    id: number,
    participants: User[]
    uploadedBy: User,
    uploadedAt: Date,
    createdAt: Date,
    metadata: Metadata,
}

// a single Quote represents a single msg from a user
export interface singleQuote {
    msg: string,
    user: User,
}

export interface User {
    username: string,
    password: string, // just for now
    profilepicture: string, // img saved as string
    id: number,
}

export function Userlist(): User[] {
    return [{
        username: "Alex",
        password: "Alex12345",
        profilepicture: "tbc",
        id: 1
    },
    {
        username: "Michel",
        password: "Michel12345",
        profilepicture: "tbc",
        id: 2,
    }, {
        username: "Timo",
        password: "Timo12345",
        profilepicture: "tbc",
        id: 3,
    },]
}

export interface UploadPicture {
    title: string,
    description?: string,
    img: File,
    id: number,
    participants: User[],
    uploadedBy: User,
    uploadedAt: Date,
    createdAt: Date,
    metadata: Metadata
}

export interface UploadVideo {
    title: string,
    description?: string,
    video: File,
    id: number,
    thumbnail: File // or change to Picture?
    participants: User[],
    uploadedBy: User,
    uploadedAt: Date,
    createdAt: Date,
    metadata: Metadata
}

export interface Rating {
    user: number,
    value: number,
}

export interface Metadata {
    views: number,
    rating: Rating[]
}
