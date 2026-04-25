'use client';

//Components
import ReportConfigPanel, { ExportFormat, ReportConfig } from './ReportConfigPanel';
import ReportLayout from './ReportLayout';
//Hooks
import { useEffect, useRef, useState } from 'react';
//API
import { getAvailableColumns, getDefaultSelectedKeys, ReportColumn } from './reportColumns';
import { buildReport, ReportData } from './reportUtils';
import { getAllDonations } from '@/api/firebase-donations';
import { getOrganizations } from '@/api/firebase-organizations';
import { addErrorEvent } from '@/api/firebase';

interface OrgData {
    id: string;
    name: string;
    county?: string;
    phoneNumber?: string;
    tags?: string[];
}

const OrganizationReport = () => {
    const availableColumns = getAvailableColumns('organization');
    const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>(getDefaultSelectedKeys('organization'));
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
    const [isLoading, setIsLoading] = useState(false);

    const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
    const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
    const orgDataRef = useRef<OrgData[]>([]);

    useEffect(() => {
        const fetchOrgs = async () => {
            try {
                const orgs = await getOrganizations();
                orgDataRef.current = orgs.map((o) => ({ id: o.id, name: o.name, county: o.county, phoneNumber: o.phoneNumber, tags: o.tags }));
                setOrganizations(orgs.map((o) => ({ id: o.id, name: o.name })));
            } catch (error) {
                addErrorEvent('Error fetching organizations for report filter', error);
            }
        };
        fetchOrgs();
    }, []);

    const handleGenerate = async (config: ReportConfig) => {
        setIsLoading(true);
        setExportFormat(config.exportFormat);
        try {
            const donations = await getAllDonations();
            let filtered = donations.filter((d) => config.selectedStatuses.includes(d.status));

            if (selectedOrgs.length > 0) {
                const orgNames = organizations.filter((o) => selectedOrgs.includes(o.id)).map((o) => o.name);
                filtered = filtered.filter((d) => d.distributor && orgNames.includes(d.distributor.organization));
            }

            const orgLookup = Object.fromEntries(
                orgDataRef.current.map((o) => [o.name, { county: o.county, phone: o.phoneNumber, tags: o.tags }])
            );

            const selectedColumns = selectedColumnKeys.map((key) => availableColumns.find((c) => c.key === key)).filter(Boolean) as ReportColumn[];
            setReportData(buildReport({ donations: filtered, selectedColumns, groupByKey: 'orgName', orgLookup }));
        } catch (error) {
            addErrorEvent('Error generating organization report', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ReportLayout reportData={reportData} exportFormat={exportFormat} reportName="Donations By Organization" isLoading={isLoading}>
            <ReportConfigPanel
                reportType="organization"
                availableColumns={availableColumns}
                selectedColumnKeys={selectedColumnKeys}
                onSelectedColumnsChange={setSelectedColumnKeys}
                onGenerate={handleGenerate}
                isLoading={isLoading}
                organizations={organizations}
                selectedOrgs={selectedOrgs}
                onSelectedOrgsChange={setSelectedOrgs}
            />
        </ReportLayout>
    );
};

export default OrganizationReport;
