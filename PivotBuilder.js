var MyApp = MyApp || {};

MyApp.PivotBuilder = (function() {
  if (!MyApp.Config || !MyApp.Utils) {
    throw new Error('Config or Utils not initialized before PivotBuilder');
  }

  const cfg    = MyApp.Config;
  const Logger = MyApp.Logger;

  /**
   * Creates a pivot table from the filtered staging block.
   *
   * @param {Sheet}   dataSheet     sheet containing staged data
   * @param {Sheet}   pivotSheet    sheet where the pivot will be placed
   * @param {number}  startCol      1-based index where staging starts (cfg.PIVOT_START_COL)
   * @param {string[]} dataHeader   array of column names in the staging block (incl. FLAG)
   * @param {number}  numRows       number of data rows (excluding header)
   */
  function createPivotFromStaging(
    dataSheet,
    pivotSheet,
    startCol,
    dataHeader,
    numRows
  ) {
    const tag = 'PivotBuilder.createPivotFromStaging';
    Logger.logInfo(tag, 'START');

    // 1) Validate arguments
    if (!dataSheet || !pivotSheet) {
      throw new Error(`Sheets missing: dataSheet=${dataSheet}, pivotSheet=${pivotSheet}`);
    }
    if (typeof startCol !== 'number' || startCol < 1) {
      throw new Error(`Invalid startCol: ${startCol}`);
    }
    if (!Array.isArray(dataHeader) || dataHeader.length < 1) {
      throw new Error(`Invalid dataHeader: ${dataHeader}`);
    }
    if (typeof numRows !== 'number' || numRows < 0) {
      throw new Error(`Invalid numRows: ${numRows}`);
    }

    // 2) Clear old pivot block (only the columns we’re about to use)
    const pivotCols  = cfg.PIVOT_HEADER.length;
    const maxRows    = pivotSheet.getMaxRows();
    pivotSheet
      .getRange(1, startCol, maxRows, pivotCols)
      .clearContent();

    if (numRows === 0) {
      Logger.logInfo(tag, 'No data rows to pivot; exiting');
      return;
    }

    // 3) Write the pivot header row
    pivotSheet
      .getRange(1, startCol, 1, pivotCols)
      .setValues([cfg.PIVOT_HEADER]);

    // 4) Build the source range (includes header row + data rows)
    const sourceCols = dataHeader.length;
    const sourceRange = dataSheet.getRange(
      1,            // header row at top
      startCol,     // align with staging block
      numRows + 1,  // +1 to include header
      sourceCols
    );

    // 5) Create the pivot table anchored under the header row
    const anchorCell = pivotSheet.getRange(2, startCol);
    const pivotTable = anchorCell.createPivotTable(sourceRange);

    // 6) Configure pivot grouping & values using config
    const flagIndex  = dataHeader.indexOf(cfg.PIVOT_GROUP_COL);
    const valueIndex = 0;  // count any column; first column works for COUNTA

    pivotTable.addRowGroup(flagIndex);

    pivotTable
      .addPivotValue(
        valueIndex,
        SpreadsheetApp.PivotTableSummarizeFunction[cfg.PIVOT_FUNCTION]
      )
      .setDisplayName(cfg.PIVOT_HEADER[1] || 'Count');

    // 7) Finalize
    SpreadsheetApp.flush();
    Logger.logInfo(tag, 'Pivot created successfully');
  }

  return Object.freeze({
    createPivotFromStaging
  });
})();
