'use client';

type TabPanelProps = {
    children?: React.ReactNode;
    index: number;
    value: number;
};

const styles = {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1em'
};

const CustomTabPanel = (props: TabPanelProps) => {
    const { children, index, value, ...other } = props;

    return (
        <div style={styles} role="tabpanel" hidden={value !== index} id={`tab-panel-${index}`} aria-labelledby={`tab-index-${index}`}>
            {value === index && <>{children}</>}
        </div>
    );
};

export default CustomTabPanel;
