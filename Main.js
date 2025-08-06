var MyApp = MyApp || {};

/**
 * Entry point for orchestrating the workflow from the Apps Script UI
 */
function runMain() {
  MyApp.Orchestrator.run();
}

/**
 * Public entry to reset all managed sheets
 */
function resetSheets() {
  MyApp.Utils.resetAll();
}

/**
 * Public entry to rebuild pivot from staged data
 */
function buildPivotSheet() {
  const ss          = SpreadsheetApp.getActive();
  const cfg         = MyApp.Config;
  const Utils       = MyApp.Utils;
  const Data        = MyApp.Data;
  const Staging     = MyApp.Staging;
  const Pivot       = MyApp.PivotBuilder;

  const dataSheet   = ss.getSheetByName(cfg.DATA_SHEET_NAME);
  const pivotSheet  = Utils.ensureSheetExists(cfg.PIVOT_SHEET_NAME);

  const header      = Data.copyRawHeader(ss, dataSheet);
  const rawData     = Data.importRawData(ss, dataSheet);

  const stagedTwo   = Staging.stageRangeTwo(dataSheet, header, rawData);
  const stagedThree = Staging.stageRangeThree(dataSheet, header, stagedTwo);

  // Pivot off the filtered, FLAG-appended staging block
  Pivot.createPivotFromStaging(
    dataSheet,
    pivotSheet,
    cfg.PIVOT_START_COL,
    cfg.STAGING_HEADER,
    stagedThree.length
  );
}

MyApp.Orchestrator = (function() {
  if (!MyApp.Utils || !MyApp.Data || !MyApp.Staging || !MyApp.PivotBuilder || !MyApp.Logger) {
    throw new Error('One or more dependencies not initialized before Orchestrator');
  }

  const cfg     = MyApp.Config;
  const Logger  = MyApp.Logger;
  const Data    = MyApp.Data;
  const Staging = MyApp.Staging;
  const Pivot   = MyApp.PivotBuilder;
  const Utils   = MyApp.Utils;

  function run() {
    const tag       = 'Orchestrator.run';
    const startTime = Date.now();
    Logger.logInfo(tag, 'START');

    try {
      const ss         = SpreadsheetApp.getActive();
      const dataSheet  = ss.getSheetByName(cfg.DATA_SHEET_NAME);
      const pivotSheet = Utils.ensureSheetExists(cfg.PIVOT_SHEET_NAME);

      if (!dataSheet) {
        throw new Error(`Data sheet "${cfg.DATA_SHEET_NAME}" not found`);
      }

      // 1) Validate header & reapply mirror formula
      const header  = Data.ensureMirror(ss, dataSheet);

      // 2) Load raw rows from RAW_DATA (with caching)
      const rawData = Data.loadRawData(ss);
      if (!rawData.length) {
        Logger.logInfo(tag, 'No data imported; exiting');
        return;
      }

      // 3) Two-stage staging
      const stagedTwo   = Staging.stageRangeTwo(dataSheet, header, rawData);
      const stagedThree = Staging.stageRangeThree(dataSheet, header, stagedTwo);

      // 4) Pivot off the filtered block
      Pivot.createPivotFromStaging(
        dataSheet,
        pivotSheet,
        cfg.PIVOT_START_COL,
        cfg.STAGING_HEADER,
        stagedThree.length
      );

      Logger.logRunTime(
        'Success',
        `Pivot built from ${stagedThree.length} rows.`,
        stagedThree.length,
        startTime
      );
      Logger.logInfo(tag, 'Workflow completed successfully');

    } catch (err) {
      Logger.logError(tag, err.message);
      Logger.logRunTime('Error', err.message, 0, startTime);
      throw err;
    }
  }

  return { run };
})();