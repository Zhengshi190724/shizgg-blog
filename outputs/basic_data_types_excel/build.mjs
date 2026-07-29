import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = process.env.TASK_OUTPUT_DIR || "D:/26012/document/Claude_Code/outputs/basic_data_types_excel";
const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Basic Data Types");

sheet.showGridLines = false;

// Title and column headings.
sheet.getRange("A1:F1").merge();
sheet.getRange("A1").values = [["Basic Data Types"]];
sheet.getRange("A2:F2").values = [[
  "type\n(wire or var)",
  "data type\n(2-state or 4-state)",
  "key word",
  "bit width",
  "default sign type",
  "function",
]];

// Body values are kept as ordinary cells so the workbook remains fully editable.
sheet.getRange("C3:E15").values = [
  ["wire", "user define", "unsigned"],
  ["tri0/tri1", "user define", "unsigned"],
  ["wand/wor", "user define", "unsigned"],
  ["integer", 32, "signed"],
  ["logic", "user define", "unsigned"],
  ["reg", "user define", "unsigned"],
  ["logic", "user define", "unsigned"],
  ["integer", 32, "signed"],
  ["time", 64, "unsigned"],
  ["bit", "user define", "unsigned"],
  ["byte/shortint/int", "8/16/32", "signed"],
  ["longint", 64, "signed"],
  ["real", "64 float", "signed"],
];

// Group labels and descriptions.
sheet.getRange("A3:A7").merge();
sheet.getRange("B3:B7").merge();
sheet.getRange("F3:F7").merge();
sheet.getRange("A3").values = [["wire"]];
sheet.getRange("B3").values = [["4-state"]];
sheet.getRange("F3").values = [["assign变量赋值；连接模块\n的IO；"]];

sheet.getRange("A8:A15").merge();
sheet.getRange("A8").values = [["var"]];
sheet.getRange("B8").values = [["4-state"]];
sheet.getRange("B9").values = [["4-state"]];
sheet.getRange("B10").values = [["4-state"]];
sheet.getRange("B11:B15").merge();
sheet.getRange("B11").values = [["2-state"]];
sheet.getRange("F8:F15").merge();
sheet.getRange("F8").values = [["always/initial块内变量赋值；\nfunction/task内变量赋值；"]];

const mint = "#E8F5F1";
const white = "#FFFFFF";
const body = sheet.getRange("A1:F15");
body.format = {
  fill: mint,
  font: { name: "Microsoft YaHei", size: 14, color: "#101010" },
  verticalAlignment: "center",
  wrapText: true,
  borders: { preset: "all", style: "thin", color: white },
};

sheet.getRange("A1:F1").format = {
  fill: mint,
  font: { name: "Microsoft YaHei", size: 19, color: "#101010" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  borders: { preset: "all", style: "thin", color: white },
};
sheet.getRange("A2:F2").format = {
  fill: mint,
  font: { name: "Microsoft YaHei", size: 14, color: "#101010" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
  borders: { preset: "all", style: "thin", color: white },
};
sheet.getRange("A3:E15").format.horizontalAlignment = "center";
sheet.getRange("F3:F15").format.horizontalAlignment = "left";
sheet.getRange("F3:F15").format.wrapText = true;

// Column proportions and row heights mirror the supplied image.
sheet.getRange("A1:A15").format.columnWidthPx = 185;
sheet.getRange("B1:B15").format.columnWidthPx = 250;
sheet.getRange("C1:C15").format.columnWidthPx = 165;
sheet.getRange("D1:D15").format.columnWidthPx = 155;
sheet.getRange("E1:E15").format.columnWidthPx = 165;
sheet.getRange("F1:F15").format.columnWidthPx = 330;
sheet.getRange("1:1").format.rowHeightPx = 42;
sheet.getRange("2:2").format.rowHeightPx = 82;
sheet.getRange("3:15").format.rowHeightPx = 34;

sheet.freezePanes.freezeRows(2);

await fs.mkdir(outputDir, { recursive: true });
const preview = await workbook.render({
  sheetName: "Basic Data Types",
  range: "A1:F15",
  scale: 1.2,
  format: "png",
});
await fs.writeFile(`${outputDir}/preview.png`, new Uint8Array(await preview.arrayBuffer()));

const inspect = await workbook.inspect({
  kind: "table",
  range: "Basic Data Types!A1:F15",
  include: "values,formulas",
  tableMaxRows: 20,
  tableMaxCols: 8,
});
console.log(inspect.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${outputDir}/Basic_Data_Types.xlsx`);
console.log(`Saved ${outputDir}/Basic_Data_Types.xlsx`);
