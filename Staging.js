var MyApp = MyApp || {};

MyApp.Staging = (function() {
  if (!MyApp.Utils) {
    throw new Error('MyApp.Utils not initialized before Staging');
  }
  
  const CONFIG = MyApp.Config;
  const Utils  = MyApp.Utils;
  const Logger = MyApp.Logger;

  /**
   * Writes staging table in the second section with a FLAG column.
   * @param {Sheet}      sheet
   * @param {string[]}   header   raw-data header (EXPECTED_COLUMNS)
   * @param {any[][]}    rawData
   * @returns {any[][]}  staged rows with FLAG appended
   */
  function stageRangeTwo(sheet, header, rawData) {
    const tag = 'Staging.stageRangeTwo';
    Logger.logInfo(tag, 'Starting stageRangeTwo');

    if (!Array.isArray(header) || !Array.isArray(rawData)) {
      throw new Error('Invalid header or rawData');
    }

    const startCol      = CONFIG.STAGING_START_COL;
    const outputHeader  = CONFIG.STAGING_HEADER;  
    // (this should be header.concat([CONFIG.FLAG_HEADER]))

    // clear entire sheet before writing this block
    sheet.clearContents();

    // write header row
    Utils.writeRange(sheet, 1, startCol, [outputHeader]);

    // map each raw row → [ ...originalCols, flag ]
    const staged = rawData.map(row => {
      const key  = row[CONFIG.STAGING_FLAG_SOURCE_IDX];
      const flag = CONFIG.FLAG_MAP[key] || '';
      return row.concat([flag]);
    });

    // write all data rows
    if (staged.length) {
      Utils.writeRange(sheet, 2, startCol, staged);
    }

    Logger.logInfo(tag, `Wrote ${staged.length} rows to staging two`);
    return staged;
  }

  /**
   * Writes filtered table in the third section, dropping any rows
   * whose flag is in Config.FILTER_FLAGS. Strips off the FLAG column.
   * @param {Sheet}      sheet
   * @param {string[]}   header       same raw-data header
   * @param {any[][]}    stagedData   output from stageRangeTwo
   * @returns {any[][]}  filtered rows (original columns only)
   */
  function stageRangeThree(sheet, header, stagedData) {
    const tag = 'Staging.stageRangeThree';
    Logger.logInfo(tag, 'Starting stageRangeThree');

    if (!Array.isArray(header) || !Array.isArray(stagedData)) {
      throw new Error('Invalid header or stagedData');
    }

    const startCol    = CONFIG.THIRD_RANGE_START_COL;
    const flagColIdx  = header.length;  // FLAG is always appended at index = rawHeader.length

    // drop any row whose flag is in the FILTER_FLAGS list
    const filtered = stagedData
      .filter(row => !CONFIG.FILTER_FLAGS.includes(row[flagColIdx]))
      // strip off the FLAG column
      .map(row => row.slice(0, flagColIdx));

    // header row is just the original raw-data columns
    const outputHeader = header;

    // clear entire sheet before writing this block
    sheet.clearContents();

    Utils.writeRange(sheet, 1, startCol, [outputHeader]);
    
    if (filtered.length) {
      Utils.writeRange(sheet, 2, startCol, filtered);
    }

    Logger.logInfo(tag, `Wrote ${filtered.length} rows to staging three`);
    return filtered;
  }

  return Object.freeze({
    stageRangeTwo,
    stageRangeThree
  });
})();
