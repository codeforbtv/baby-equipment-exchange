//Libs
import { json2csv } from 'json-2-csv';

//Constants
import { DONATIONS_COLLECTION } from './firebase-donations';

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
