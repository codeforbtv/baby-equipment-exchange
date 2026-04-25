'use client';

//Components
import ReportConfigPanel, { ExportFormat, ReportConfig } from './ReportConfigPanel';
import ReportLayout from './ReportLayout';
//Hooks
import { useState } from 'react';
//Types
import { getAvailableColumns, getDefaultSelectedKeys, ReportColumn } from './reportColumns';
import { buildReport, ReportData } from './reportUtils';
//API
import { getAllDonations } from '@/api/firebase-donations';
import { getOrganizations } from '@/api/firebase-organizations';
import { addErrorEvent } from '@/api/firebase';

const RawExport = () => {
    const availableColumns = getAvailableColumns('raw');
    const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>(getDefaultSelectedKeys('raw'));
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async (config: ReportConfig) => {
        setIsLoading(true);
        setExportFormat(config.exportFormat);
        try {
            const donations = await getAllDonations();
            const filtered = donations.filter((d) => config.selectedStatuses.includes(d.status));

            let orgLookup: Record<string, { county?: string; phone?: string; tags?: string[] }> = {};
            const hasOrgColumns = selectedColumnKeys.some((k) => k.startsWith('org'));
            if (hasOrgColumns) {
                try {
                    const orgs = await getOrganizations();
                    orgLookup = Object.fromEntries(orgs.map((o) => [o.name, { county: o.county, phone: o.phoneNumber, tags: o.tags }]));
                } catch {}
            }

            const selectedColumns = selectedColumnKeys.map((key) => availableColumns.find((c) => c.key === key)).filter(Boolean) as ReportColumn[];
            setReportData(buildReport({ donations: filtered, selectedColumns, orgLookup }));
        } catch (error) {
            addErrorEvent('Error generating raw export', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ReportLayout reportData={reportData} exportFormat={exportFormat} reportName="Raw Export" isLoading={isLoading}>
            <ReportConfigPanel
                reportType="raw"
                availableColumns={availableColumns}
                selectedColumnKeys={selectedColumnKeys}
                onSelectedColumnsChange={setSelectedColumnKeys}
                onGenerate={handleGenerate}
                isLoading={isLoading}
            />
        </ReportLayout>
    );
};

export default RawExport;
