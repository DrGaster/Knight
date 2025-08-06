var MyApp = MyApp || {};

MyApp.Utils = (function() {
  if (!MyApp.Config) {
    throw new Error('MyApp.Config not initialized before Utils');
  }

  const CONFIG = MyApp.Config;

  /**
   * Clears a sheet’s contents and optionally writes a header row.
   * @param {Sheet} sheet
   * @param {any[]} [headerRow]
   */
  function clearSheet(sheet, headerRow) {
    sheet.clearContents();
    if (Array.isArray(headerRow) && headerRow.length) {
      writeRange(sheet, 1, 1, [headerRow]);
    }
  }

  /**
   * Reads values from a rectangular range.
   * @param {Sheet} sheet
   * @param {number} startRow
   * @param {number} startCol
   * @param {number} numRows
   * @param {number} numCols
   * @returns {any[][]}
   */
  function readRange(sheet, startRow, startCol, numRows, numCols) {
    if (numRows < 1 || numCols < 1) {
      throw new Error('readRange: numRows and numCols must be >= 1');
    }
    return sheet
      .getRange(startRow, startCol, numRows, numCols)
      .getValues();
  }

  /**
   * Writes a 2D array of values to the sheet.
   * @param {Sheet} sheet
   * @param {number} startRow
   * @param {number} startCol
   * @param {any[][]} values
   */
  function writeRange(sheet, startRow, startCol, values) {
    if (!Array.isArray(values) ||
        !values.length ||
        !Array.isArray(values[0])) {
      throw new Error('writeRange: values must be a non-empty 2D array');
    }
    const numRows = values.length;
    const numCols = values[0].length;
    sheet
      .getRange(startRow, startCol, numRows, numCols)
      .setValues(values);
  }

  /**
   * Appends a single row to the bottom of the sheet.
   * @param {Sheet} sheet
   * @param {any[]} row
   */
  function appendRow(sheet, row) {
    if (!Array.isArray(row)) {
      throw new Error('appendRow: row must be an array');
    }
    const last = Math.max(sheet.getLastRow(), 1) + 1;
    writeRange(sheet, last, 1, [row]);
  }

  /**
   * Ensures the sheet exists, and optionally appends a config-defined header.
   * @param {string} sheetName
   * @param {string[]} [headers]
   * @returns {Sheet}
   */
  function ensureSheetExists(sheetName, headers) {
    const ss = SpreadsheetApp.getActive();
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      if (Array.isArray(headers) && headers.length) {
        sheet.appendRow(headers);
      }
    }
    return sheet;
  }

  /**
   * Clears sheet and applies config-defined headers if available.
   * @param {Sheet} sheet
   * @param {string[]} [headers]
   */
  function resetSheet(sheet, headers) {
    sheet.clearContents();
    if (Array.isArray(headers) && headers.length) {
      sheet.appendRow(headers);
    }
  }

  /**
   * Converts a column letter (e.g. "A", "Z", "AA") to its 1-based index.
   * Valid input: uppercase letters only.
   * @param {string} letter
   * @returns {number}
   */
  function columnLetterToIndex(letter) {
    if (typeof letter !== 'string' || !/^[A-Z]+$/.test(letter)) {
      throw new Error(`Invalid column letter: "${letter}". Must be uppercase A-Z only.`);
    }

    let index = 0;
    for (let i = 0; i < letter.length; i++) {
      index = index * 26 + (letter.charCodeAt(i) - 64);
    }
    return index;
  }

  /**
   * Converts a 1-based column index to its A1-style letter (e.g. 1 → "A", 27 → "AA").
   * Valid input: integer from 1 to 702.
   * @param {number} index
   * @returns {string}
   */
  function indexToColumnLetter(index) {
    if (typeof index !== 'number' ||
        index < 1 ||
        index > 702 ||
        Math.floor(index) !== index) {
      throw new Error(`Invalid index: "${index}". Must be an integer between 1 and 702.`);
    }

    let column = '';
    while (index > 0) {
      const remainder = (index - 1) % 26;
      column = String.fromCharCode(65 + remainder) + column;
      index = Math.floor((index - 1) / 26);
    }
    return column;
  }

  /**
   * Ensures the mirror sheet has the correct formula in IMPORT_CELL.
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
   */
  function setMirrorFormula(sheet) {
    const cell = cfg.IMPORT_CELL;
    sheet.getRange(cell).setFormula(cfg.MIRROR_FORMULA);
  }

  var exports = {
    clearSheet,
    readRange,
    writeRange,
    appendRow,
    resetSheet,
    ensureSheetExists,
    columnLetterToIndex,
    indexToColumnLetter,
    setMirrorFormula
  };

  Object.freeze(exports);
  return exports;
})();
