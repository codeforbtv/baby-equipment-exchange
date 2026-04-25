'use client';

//Components
import ReportConfigPanel, { ExportFormat, ReportConfig } from './ReportConfigPanel';
import ReportLayout from './ReportLayout';
//Hooks
import { useEffect, useState } from 'react';
//Types
import { getAvailableColumns, getDefaultSelectedKeys, ReportColumn } from './reportColumns';
import { buildReport, extractUniqueRequestors, ReportData } from './reportUtils';
import { getAllDonations } from '@/api/firebase-donations';
import { addErrorEvent } from '@/api/firebase';

const RequestorReport = () => {
    const availableColumns = getAvailableColumns('requestor');
    const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>(getDefaultSelectedKeys('requestor'));
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
    const [isLoading, setIsLoading] = useState(false);

    const [requestors, setRequestors] = useState<{ id: string; name: string; email: string }[]>([]);
    const [selectedRequestors, setSelectedRequestors] = useState<string[]>([]);

    useEffect(() => {
        const fetchRequestors = async () => {
            try {
                const donations = await getAllDonations();
                setRequestors(extractUniqueRequestors(donations));
            } catch (error) {
                addErrorEvent('Error fetching requestors for report filter', error);
            }
        };
        fetchRequestors();
    }, []);

    const handleGenerate = async (config: ReportConfig) => {
        setIsLoading(true);
        setExportFormat(config.exportFormat);
        try {
            const donations = await getAllDonations();
            setRequestors(extractUniqueRequestors(donations));

            let filtered = donations.filter((d) => config.selectedStatuses.includes(d.status));

            if (selectedRequestors.length > 0) {
                filtered = filtered.filter((d) => d.requestor && selectedRequestors.includes(d.requestor.id));
            } else {
                filtered = filtered.filter((d) => d.requestor !== null);
            }

            const selectedColumns = selectedColumnKeys.map((key) => availableColumns.find((c) => c.key === key)).filter(Boolean) as ReportColumn[];
            setReportData(buildReport({ donations: filtered, selectedColumns, groupByKey: 'requestorName' }));
        } catch (error) {
            addErrorEvent('Error generating requestor report', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ReportLayout reportData={reportData} exportFormat={exportFormat} reportName="Donations By Requestor" isLoading={isLoading}>
            <ReportConfigPanel
                reportType="requestor"
                availableColumns={availableColumns}
                selectedColumnKeys={selectedColumnKeys}
                onSelectedColumnsChange={setSelectedColumnKeys}
                onGenerate={handleGenerate}
                isLoading={isLoading}
                requestors={requestors}
                selectedRequestors={selectedRequestors}
                onSelectedRequestorsChange={setSelectedRequestors}
            />
        </ReportLayout>
    );
};

export default RequestorReport;
