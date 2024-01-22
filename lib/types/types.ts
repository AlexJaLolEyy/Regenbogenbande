export interface Video {
    title: string,
    description?: string,
    video: File,
    id: number,
    thumbnail: File // or change to Picture?
    participants: User[],
    uploadedBy: User,
    uploadedAt: Date,
    createdAt: Date,
}

export interface Picture {
    title: string,
    description?: string,
    img: File, // or save as string?
    id: number,
    participants: User[],
    uploadedBy: User,
    uploadedAt: Date,
    createdAt: Date,
}

// a quote got multiple singleQuote to represent the full chat history
export interface Quote {
    fullQuote: singleQuote[],
    id: number,
    participants: User[]
    uploadedBy: User,
    uploadedAt: Date,
    createdAt: Date,
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