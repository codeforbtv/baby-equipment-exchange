declare module 'react-spread-sheet-excel' {
    import { ForwardRefExoticComponent, RefAttributes } from 'react';

    export interface Data {
        value: string | number;
        styles?: Record<string, string>;
        type?: string;
        colSpan?: number;
        rowSpan?: number;
        skip?: boolean;
    }

    export interface SheetRef {
        getData: () => Data[][];
        setData: (data: Data[][]) => void;
        exportCsv: (filename: string, includeHeaders?: boolean) => void;
        updateOneCell: (row: number, col: number, value: any) => void;
        getOneCell: (row: number, col: number) => Data;
    }

    export interface SheetProps {
        data?: Data[][];
        onChange?: (row?: number, col?: number, value?: string) => void;
        resize?: boolean;
        hideXAxisHeader?: boolean;
        hideYAxisHeader?: boolean;
        headerValues?: string[];
        readonly?: boolean;
        hideTools?: boolean;
        autoAddAdditionalRows?: boolean;
    }

    export function getCalculatedVal(value: string, data: Data[][]): string | number;
    export function printToLetter(col: number): string;

    const Sheet: ForwardRefExoticComponent<SheetProps & RefAttributes<SheetRef>>;
    export default Sheet;
}
