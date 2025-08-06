// DataLoader.gs
var MyApp = MyApp || {};

MyApp.Data = (function() {
  if (!MyApp.Utils) {
    throw new Error('MyApp.Utils not initialized before DataLoader');
  }

  const cfg       = MyApp.Config;
  const Utils     = MyApp.Utils;
  const Logger    = MyApp.Logger;
  let rawDataCache = null;

  /**
   * Ensures targetSheet has:
   *  • the RAW_DATA header in row 1
   *  • an ARRAYFORMULA in IMPORT_CELL mirroring RAW_DATA!A:F
   * @param {Spreadsheet} ss
   * @param {Sheet}       targetSheet
   * @returns {void}
   */
  function ensureMirror(ss, targetSheet) {
    const tag = 'Data.ensureMirror';
    Logger.logInfo(tag, 'START');

    // 1) Grab RAW_DATA sheet
    const rawSheet = ss.getSheetByName(cfg.RAW_DATA_SHEET_NAME);
    if (!rawSheet) {
      throw new Error(`Sheet "${cfg.RAW_DATA_SHEET_NAME}" not found`);
    }

    // 2) Compute columns from A:F (or your range)
    const [startA, endA] = cfg.RAW_DATA_RANGE.split(':');
    const startCol       = Utils.columnLetterToIndex(startA);
    const endCol         = Utils.columnLetterToIndex(endA);
    const colCount       = endCol - startCol + 1;

    // 3) Pull header row from RAW_DATA!A1:F1
    const header = rawSheet
      .getRange(1, startCol, 1, colCount)
      .getValues()[0] || [];

    // 4) Validate header length + names
    if (header.length !== cfg.EXPECTED_COLUMNS.length) {
      throw new Error(
        `Header length mismatch. Expected ${cfg.EXPECTED_COLUMNS.length} but got ${header.length}`
      );
    }
    const diffs = cfg.EXPECTED_COLUMNS
      .map((exp, i) => header[i] !== exp
        ? `Col ${i+1}: expected "${exp}", got "${header[i]||''}"`
        : null
      )
      .filter(Boolean);
    if (diffs.length) {
      throw new Error('Header mismatch:\n' + diffs.join('\n'));
    }

    // 5) Clear target sheet entirely, write header into row 1
    targetSheet.clearContents();
    targetSheet
      .getRange(1, 1, 1, header.length)
      .setValues([header]);
    Logger.logInfo(tag, `Header written: [${header.join(', ')}]`);

    // 6) Insert ARRAYFORMULA in A2 (cfg.IMPORT_CELL) to mirror RAW_DATA!A:F
    //    Make sure cfg.IMPORT_CELL = "A2"
    const formula = `=ARRAYFORMULA('${cfg.RAW_DATA_SHEET_NAME}'!${cfg.RAW_DATA_RANGE})`;
    targetSheet
      .getRange(cfg.IMPORT_CELL)
      .setFormula(formula);
    SpreadsheetApp.flush();
    Logger.logInfo(tag, `Mirror formula set at ${cfg.IMPORT_CELL}: ${formula}`);
    Logger.logInfo(tag, `Mirror setup complete`);
    return header;
  }

  /**
   * Loads raw-data directly (no ARRAYFORMULA), with caching.
   * @param {Spreadsheet} ss
   * @returns {any[][]}
   */
  function loadRawData(ss) {
    if (rawDataCache) {
      return rawDataCache;
    }
    const tag = 'Data.loadRawData';
    try {
      const sheet = ss.getSheetByName(cfg.RAW_DATA_SHEET_NAME);
      if (!sheet) {
        throw new Error(`Sheet "${cfg.RAW_DATA_SHEET_NAME}" not found`);
      }

      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      if (lastRow < 2) {
        throw new Error('No data rows found in RAW_DATA');
      }

      // optional header re-check
      if (Array.isArray(cfg.EXPECTED_COLUMNS)) {
        const header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        if (
          header.length !== cfg.EXPECTED_COLUMNS.length ||
          !header.every((h, i) => h === cfg.EXPECTED_COLUMNS[i])
        ) {
          throw new Error(`Header mismatch. Found [${header.join(', ')}]`);
        }
      }

      const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
      rawDataCache = data.filter(row => row.some(cell => cell !== ''));
      return rawDataCache;
    } catch (e) {
      Logger.logError(tag, e.message);
      throw new Error(`Data load failed: ${e.message}`);
    }
  }

  // expose our API
  const api = {
    ensureMirror,
    loadRawData
  };
  Object.freeze(api);
  return api;
})();
