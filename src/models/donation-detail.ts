import { Address } from './address'
import { Contact } from './contact'
import { Image } from './image'

interface IDonationDetail {
    donation: string
    availability: string
    donor: string
    tagNumber: string | null | undefined
    tagNumberForItemDelivered: string | null | undefined
    sku: string | null | undefined
    recipientOrganization: string | null | undefined
    images: Array<Image>
    daysInStorage: number
    recipientContact: Contact | null | undefined
    recipientAddress: Address | null | undefined
    requestor: Contact | null | undefined
    storage: Array<string> | null | undefined
    dateRecieved: Date | null | undefined
    dateDistributed: Date | null | undefined
    scheduledPickupDate: Date | null | undefined
    dateOrderFulfilled: Date | null | undefined
    createdAt: Date
    modifiedAt: Date
}

export class DonationDetail implements IDonationDetail {
    donation: string
    availability: string
    donor: string
    tagNumber: string | null | undefined
    tagNumberForItemDelivered: string | null | undefined
    sku: string | null | undefined
    recipientOrganization: string | null | undefined
    images: Image[]
    daysInStorage: number
    recipientContact: Contact | null | undefined
    recipientAddress: Address | null | undefined
    requestor: Contact | null | undefined
    storage: string[] | null | undefined
    dateRecieved: Date | null | undefined
    dateDistributed: Date | null | undefined
    scheduledPickupDate: Date | null | undefined
    dateOrderFulfilled: Date | null | undefined
    createdAt: Date
    modifiedAt: Date

    constructor(
        donation: string,
        availability: string,
        donor: string,
        tagNumber: string | null | undefined,
        tagNumberForItemDelivered: string | null | undefined,
        sku: string | null | undefined,
        recipientOrganization: string | null | undefined,
        images: Image[],
        daysInStorage: number,
        recipientContact: Contact | null | undefined,
        recipientAddress: Address | null | undefined,
        requestor: Contact | null | undefined,
        storage: string[] | null | undefined,
        dateRecieved: Date | null | undefined,
        dateDistributed: Date | null | undefined,
        scheduledPickupDate: Date | null | undefined,
        dateOrderFulfilled: Date | null | undefined,
        createdAt: Date,
        modifiedAt: Date
    ) {
        this.donation = donation
        this.availability = availability
        this.donor = donor
        this.tagNumber = tagNumber
        this.tagNumberForItemDelivered = tagNumberForItemDelivered
        this.sku = sku
        this.recipientOrganization = recipientOrganization
        this.images = images
        this.daysInStorage = daysInStorage
        this.recipientContact = recipientContact
        this.recipientAddress = recipientAddress
        this.requestor = requestor
        this.storage = storage
        this.dateRecieved = dateRecieved
        this.dateDistributed = dateDistributed
        this.scheduledPickupDate = scheduledPickupDate
        this.dateOrderFulfilled = dateOrderFulfilled
        this.createdAt = createdAt
        this.modifiedAt = modifiedAt
    }

    getDonation(): string {
        return this.donation
    }

    getAvailability(): string {
        return this.availability
    }

    getDonor(): string {
        return this.donor
    }

    getTagNumber(): string | null | undefined {
        return this.tagNumber
    }

    getTagNumberForItemDelivered(): string | null | undefined {
        return this.tagNumberForItemDelivered
    }

    getSku(): string | null | undefined {
        return this.sku
    }

    getRecipientOrganization(): string | null | undefined {
        return this.recipientOrganization
    }

    getImages(): Array<Image> {
        return this.images
    }

    getDaysInStorage(): number {
        return this.daysInStorage
    }

    getRecipientContact(): Contact | null | undefined {
        return this.recipientContact
    }

    getRecipientAddress(): Address | null | undefined {
        return this.recipientAddress
    }

    getRequestor(): Contact | null | undefined {
        return this.requestor
    }

    getStorage(): Array<string> | null | undefined {
        return this.storage
    }

    getDateRecieved(): Date | null | undefined {
        return this.dateRecieved
    }

    getDateDistributed(): Date | null | undefined {
        return this.dateDistributed
    }

    getScheduledPickupDate(): Date | null | undefined {
        return this.scheduledPickupDate
    }

    getDateOrderFulfilled(): Date | null | undefined {
        return this.dateOrderFulfilled
    }

    getCreatedAt(): Date {
        return this.createdAt
    }

    getModifiedAt(): Date {
        return this.modifiedAt
    }
}
