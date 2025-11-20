//Apis
import { json2csv } from 'json-2-csv';
import { addErrorEvent } from './firebase';
import { stripNullUndefined } from '@/utils/utils';
//Constants
import { DONATIONS_COLLECTION } from './firebase-donations';
import { Donation } from '@/models/donation';

export function downloadCsv(data: object[], fileName: string) {
    const csv = json2csv(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function productLifeCycleReport(donation: Donation) {
    const reportObject = {
        'Tag Number': donation.tagNumber,
        'Current Status': donation.status,
        'Donor Email': donation.donorEmail,
        'Donor Name': donation.donorName,
        Category: donation.category,
        Brand: donation.brand,
        Model: donation.model,
        Description: donation.description,
        Images: donation.images,
        'Date Accepted': donation.dateAccepted && donation.dateAccepted.toDate().toDateString(),
        'Date Received': donation.dateReceived && donation.dateReceived.toDate().toDateString(),
        'Date Requested': donation.dateRequested && donation.dateRequested.toDate().toDateString(),
        'Requester Name': donation.requestor?.name,
        'Requester Email': donation.requestor?.email,
        'Date Distributed': donation.dateDistributed && donation.dateDistributed.toDate().toDateString(),
        'Days In Storage': donation.getDaysInStorage(),
        'Date Created': donation.createdAt && donation.createdAt.toDate().toDateString(),
        'Last Modified': donation.modifiedAt && donation.modifiedAt.toDate().toDateString()
    };
    const data = [stripNullUndefined(reportObject)];
    let fileName = donation.tagNumber ? donation.tagNumber : donation.model;
    fileName += '_lifecycle';
    downloadCsv(data, fileName);
}
