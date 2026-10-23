import { readFileSync, writeFileSync } from "node:fs";
import * as XLSX from "xlsx";

const [csvPath, xlsxPath] = process.argv.slice(2);
const book = XLSX.read(readFileSync(csvPath, "utf8"), { type: "string" });
const sheet = book.Sheets[book.SheetNames[0]];
book.SheetNames = ["Meetings"];
book.Sheets = { Meetings: sheet };
writeFileSync(xlsxPath, XLSX.write(book, { bookType: "xlsx", type: "buffer" }));
