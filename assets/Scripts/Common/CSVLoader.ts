
export class CSVLoader {
    public static fromCSV<T>(csvString: string, fieldSeparator: string = ',', lineBreak: string = '\n'): T[] {
        // Split the CSV string into rows
        const rows = csvString.split(lineBreak);

        // Extract header row
        const headers = rows[0].split(fieldSeparator);

        // Remove the header row from the rows array
        rows.shift();

        // Process rows
        const data: T[] = rows.filter(row => row != null && row != "").map(row => {
            const values = row.split(fieldSeparator);
            const obj: any = {};
            headers.forEach((header, index) => {
                let value: any = values[index].trim();
                if (value != "") {
                    // Parse numeric values
                    if (!isNaN(Number(value))) {
                        value = Number(value);
                    }
                    // Parse boolean values
                    else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
                        value = value.toLowerCase() === 'true';
                    }
                }
                obj[header.trim()] = value;
            });
            return obj as T;
        });

        return data;
    }

    public static toCSV<T>(dataArray: T[], fieldSeparator: string = ',', lineBreak: string = '\n'): string {
        if (dataArray.length === 0) {
            return '';
        }

        // Extract headers from the first object
        const headers = Object.keys(dataArray[0]);

        // Generate CSV header row
        const headerRow = headers.join(fieldSeparator);

        // Generate CSV data rows
        const dataRows = dataArray.map(data => {
            return headers.map(header => {
                return data[header];
            }).join(fieldSeparator);
        });
 
        // Combine header row and data rows
        const csvString = [headerRow, ...dataRows].join(lineBreak);

        return csvString;
    }
}


