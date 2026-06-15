import { Readable } from "stream";
import csvParser from "csv-parser";

export async function parseCSV(buffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const rows: any[] = [];
        const readable = Readable.from([buffer]);

        readable
            .pipe(csvParser())
            .on("data", (row) => {
                // Normalize tags field
                if (typeof row.tags === "string") {
                    try {
                        const parsed = JSON.parse(row.tags);
                        row.tags = Array.isArray(parsed) ? parsed : [parsed];
                    } catch {
                        row.tags = [row.tags];
                    }
                } else if (!Array.isArray(row.tags)) {
                    row.tags = [];
                }
                rows.push(row);
            })
            .on("end", () => {
                resolve(rows);
            })
            .on("error", (err) => {
                reject({
                    message: err.message,
                    line: null,
                });
            });
    });
}
