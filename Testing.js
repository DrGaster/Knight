/**
 * Centralized config for input/output settings.
 */
const CONFIG = {
  input: {
    sheetName: 'JSON_Input',
    headerRow: 1,
    startRow:  2,    // JSON strings start on row 2
    col:       3,    // column C
    maxRows:   50
  },
  output: {
    sheetName: 'testing',
    clearOnStart: true,
    gapBetween:   2
  }
};

/**
 * Sets the same note on every cell in a given range.
 *
 * @param {GoogleAppsScript.Spreadsheet.Range} range
 * @param {string} noteText
 */
function setNoteForRange(range, noteText) {
  const numRows = range.getNumRows();
  const numCols = range.getNumColumns();
  const notes = [];

  for (let r = 0; r < numRows; r++) {
    const rowNotes = [];
    for (let c = 0; c < numCols; c++) {
      rowNotes.push(noteText);
    }
    notes.push(rowNotes);
  }

  range.setNotes(notes);
}


/**
 * Creates or clears the JSON_Input and testing sheets,
 * and adds markers/instructions to guide data entry.
 */
function setupEnvironment() {
  const ss = SpreadsheetApp.getActive();
  
  // 1. Configure JSON_Input sheet
  let inSh = ss.getSheetByName(CONFIG.input.sheetName);
  if (!inSh) {
    inSh = ss.insertSheet(CONFIG.input.sheetName);
  }
  
  // Clear only contents so formatting persists
  inSh.clearContents();
  
  // Header cell
  inSh
    .getRange(CONFIG.input.headerRow, CONFIG.input.col)
    .setValue('Paste JSON payloads here:')
    .setFontWeight('bold')
    .setBackground('#d9ead3')
    .setNote('Each row below: paste one JSON string starting with “{”')
    .setBorder(true, true, true, true, null, null);
  
  // Input range formatting + note
  const inputRange = inSh.getRange(
    CONFIG.input.startRow,
    CONFIG.input.col,
    CONFIG.input.maxRows,
    1
  );
  inputRange
    .setBackground('#fff2cc')
    .setWrap(true)
    .setNote('Paste or edit JSON here; must start with “{”')
    .setBorder(true, true, true, true, null, null);
  
  inSh.setFrozenRows(CONFIG.input.headerRow);
  inSh.autoResizeColumns(CONFIG.input.col, 1);
  
  // 2. Configure testing sheet
  let outSh = ss.getSheetByName(CONFIG.output.sheetName);
  if (!outSh) {
    outSh = ss.insertSheet(CONFIG.output.sheetName);
  }
  
  // Clear contents only; keep formatting
  outSh.clearContents();
  
  // Header row formatting
  outSh
    .getRange(1, 1)
    .setValue('Parsed JSON blocks appear below; pivot table at bottom.')
    .setFontWeight('bold')
    .setBackground('#d9ead3')
    .setBorder(true, true, true, true, null, null);
  
  outSh.setFrozenRows(1);
  outSh.autoResizeColumns(1, 6); // adjust as needed
}


/**
 * Ensures the sheet has at least `minCols` columns.
 */
function ensureColumns(sheet, minCols) {
  try {
    Logger.log(`ensureColumns: current=${sheet.getMaxColumns()}, minNeeded=${minCols}`);
    const current = sheet.getMaxColumns();
    if (current < minCols) {
      sheet.insertColumnsAfter(current, minCols - current);
      Logger.log(`ensureColumns: inserted ${minCols-current} columns`);
    }
  } catch (e) {
    Logger.log(`ensureColumns: ERROR - ${e.message}`);
    throw e;
  }
}


/**
 * Stub parser: replace with your real monolith‐alignment logic.
 * @param {string} rawJson
 * @returns {{name:string,quantity:number}[]}
 */
function parseAndAlignXitMonolith(rawJson) {
  try {
    Logger.log('parseAndAlignXitMonolith: parsing JSON');
    const data = JSON.parse(rawJson);
    // Example mapping; adjust to actual JSON structure
    const arr = data.items.map(item => ({
      name:     String(item.material).trim(),
      quantity: Number(item.qty) || 0
    }));
    Logger.log(`parseAndAlignXitMonolith: parsed ${arr.length} items`);
    return arr;
  } catch (e) {
    Logger.log(`parseAndAlignXitMonolith: ERROR - ${e.message}`);
    throw e;
  }
}


/**
 * Reads JSON from JSON_Input, displays each parsed block,
 * then builds a pivot table with Material rows and columns per payload.
 */
function processJsonsWithPivot() {
  Logger.log('processJsonsWithPivot: start');
  const ss   = SpreadsheetApp.getActive();

  // Input sheet
  const inSh = (function() {
    try {
      return ss.getSheetByName(CONFIG.input.sheetName) || ss.getActiveSheet();
    } catch (e) {
      Logger.log(`processJsonsWithPivot: ERROR finding input sheet - ${e.message}`);
      throw e;
    }
  })();

  // Output sheet
  const outSh = (function() {
    let sh = ss.getSheetByName(CONFIG.output.sheetName);
    if (!sh) {
      sh = ss.insertSheet(CONFIG.output.sheetName);
      Logger.log('processJsonsWithPivot: created output sheet');
    } else if (CONFIG.output.clearOnStart) {
      sh.clearContents();
      Logger.log('processJsonsWithPivot: cleared output sheet');
    }
    return sh;
  })();

  // 1) Read raw JSON strings
  let raws;
  try {
    raws = inSh
      .getRange(CONFIG.input.startRow, CONFIG.input.col, CONFIG.input.maxRows, 1)
      .getValues()
      .flat()
      .map(String)
      .map(s => s.trim())
      .filter(s => s.startsWith('{'));
    Logger.log(`processJsonsWithPivot: found ${raws.length} JSON strings`);
  } catch (e) {
    Logger.log(`processJsonsWithPivot: ERROR reading JSON cells - ${e.message}`);
    throw e;
  }

  // 2) Parse payloads
  const parsedArrays = raws.map((raw, idx) => {
    if (!raw) return [];
    Logger.log(`processJsonsWithPivot: parsing payload #${idx+1}`);
    try {
      return parseAndAlignXitMonolith(raw);
    } catch (e) {
      Logger.log(`processJsonsWithPivot: parse error at payload #${idx+1} - ${e.message}`);
      return [];
    }
  });

  // 3) Ensure output columns
  try {
    const blockWidth = 2;
    const neededCols = parsedArrays.length * (blockWidth + CONFIG.output.gapBetween);
    ensureColumns(outSh, neededCols);
  } catch (e) {
    Logger.log(`processJsonsWithPivot: ERROR ensuring columns - ${e.message}`);
    throw e;
  }

  // 4) Write each block
  parsedArrays.forEach((arr, idx) => {
    const startCol = idx * (2 + CONFIG.output.gapBetween) + 1;
    Logger.log(`processJsonsWithPivot: writing block #${idx+1} at col ${startCol}`);
    try {
      outSh
        .getRange(1, startCol, 2, 2)
        .setValues([[`Payload ${idx+1}`, ''], ['Name','Qty']]);
      if (arr.length) {
        const vals = arr.map(o => [o.name, o.quantity]);
        outSh
          .getRange(3, startCol, vals.length, 2)
          .setValues(vals);
        Logger.log(`processJsonsWithPivot: wrote ${vals.length} rows for block #${idx+1}`);
      }
    } catch (e) {
      Logger.log(`processJsonsWithPivot: ERROR writing block #${idx+1} - ${e.message}`);
      throw e;
    }
  });

  // 5) Build pivot table
  Logger.log('processJsonsWithPivot: building pivot');
  try {
    const allNames = Array.from(
      new Set(parsedArrays.flat().map(o => o.name))
    ).sort();
    Logger.log(`processJsonsWithPivot: pivot will include ${allNames.length} unique materials`);

    const header = ['Material']
      .concat(parsedArrays.map((_,i) => `P${i+1}`))
      .concat(['Total']);

    const pivotRows = allNames.map(name => {
      let total = 0;
      const row = parsedArrays.map(arr => {
        const e = arr.find(o => o.name === name);
        const q = e ? e.quantity : 0;
        total += q;
        return q;
      });
      return [name].concat(row).concat([total]);
    });

    const maxHeight = Math.max(...parsedArrays.map(a => a.length)) + 3;
    const pivotRow  = maxHeight + 2;

    outSh.getRange(pivotRow, 1, 1, header.length)
         .setValues([header]);
    if (pivotRows.length) {
      outSh
        .getRange(pivotRow + 1, 1, pivotRows.length, header.length)
        .setValues(pivotRows);
      Logger.log(`processJsonsWithPivot: wrote ${pivotRows.length} pivot rows`);
    }
  } catch (e) {
    Logger.log(`processJsonsWithPivot: ERROR building pivot - ${e.message}`);
    throw e;
  }

  Logger.log('processJsonsWithPivot: end');
  ss.toast('JSON & Pivot complete','Done',5);
}


/**
 * Entry point for running the workflow.
 */
function main() {
  Logger.log('main: start');
  try {
    processJsonsWithPivot();
  } catch (e) {
    Logger.log('main: ERROR - ' + e.message);
    throw e;
  }
  Logger.log('main: end');
}


/**
 * Adds menu items on open.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Xit Tools')
    .addItem('Setup Sheets', 'setupEnvironment')
    .addItem('Show JSON & Pivot', 'main')
    .addToUi();
}
