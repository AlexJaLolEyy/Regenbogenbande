export interface Video {
    title: string,
    description?: string,
    id: number,
    participants: User[],
    uploadedBy: User,
    uploadedAt: Date,
    createdAt: Date,
}

export interface Picture {
    img: string, // img saved as string
    id: number,
    participants: User[],
    uploadedBy: User,
    uploadedAt: Date,
    createdAt: Date,
}

export interface Quote {
    quote: string,
    id: number,
    participants: User[]
    uploadedBy: User,
    uploadedAt: Date,
    createdAt: Date,
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