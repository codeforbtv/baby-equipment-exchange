export type NewUser = {
    user: string // The Firebase auth id of the new user.
    name: string
    email: string
    gender: string
    dob: number
    photo: string // The Images document id of the user's profile photo.
}
