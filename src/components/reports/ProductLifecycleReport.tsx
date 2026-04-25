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
import { addErrorEvent } from '@/api/firebase';

const ProductLifecycleReport = () => {
    const availableColumns = getAvailableColumns('lifecycle');
    const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>(getDefaultSelectedKeys('lifecycle'));
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async (config: ReportConfig) => {
        setIsLoading(true);
        setExportFormat(config.exportFormat);
        try {
            const donations = await getAllDonations();
            const filtered = donations.filter((d) => config.selectedStatuses.includes(d.status));

            const selectedColumns = selectedColumnKeys.map((key) => availableColumns.find((c) => c.key === key)).filter(Boolean) as ReportColumn[];
            setReportData(buildReport({ donations: filtered, selectedColumns, groupByKey: 'status' }));
        } catch (error) {
            addErrorEvent('Error generating product lifecycle report', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ReportLayout reportData={reportData} exportFormat={exportFormat} reportName="Product Lifecycle" isLoading={isLoading}>
            <ReportConfigPanel
                reportType="lifecycle"
                availableColumns={availableColumns}
                selectedColumnKeys={selectedColumnKeys}
                onSelectedColumnsChange={setSelectedColumnKeys}
                onGenerate={handleGenerate}
                isLoading={isLoading}
            />
        </ReportLayout>
    );
};

export default ProductLifecycleReport;
