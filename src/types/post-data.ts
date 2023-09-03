export type NewUser = {
    user: string | undefined | null // The Firebase auth id of the new user.
    name: string | undefined | null
    email: string | undefined | null
    photo: string | undefined | null // The Images document id of the user's profile photo.
}
