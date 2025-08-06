var MyApp = MyApp || {};

MyApp.Logger = (function() {
  // Defensive guard: Utils must be available
  if (!MyApp.Utils) {
    throw new Error('MyApp.Utils not initialized before Logger');
  }

  /**
   * Logs an informational message with a tag.
   * @param {string} tag
   * @param {*}      msg
   */
  function logInfo(tag, msg) {
    var text = typeof msg === 'string'
      ? msg
      : JSON.stringify(msg, null, 2);
    Logger.log(`[INFO] ${new Date().toISOString()} – ${tag}: ${text}`);
  }

  /**
   * Logs a warning message with a tag.
   * @param {string} tag
   * @param {*}      warning
   */
  function logWarn(tag, warning) {
    var text = typeof warning === 'string'
      ? warning
      : JSON.stringify(warning, null, 2);
    Logger.log(`[WARN] ${new Date().toISOString()} – ${tag}: ${text}`);
  }

  /**
   * Logs an error message with a tag.
   * @param {string} tag
   * @param {*}      err
   */
  function logError(tag, err) {
    var text = err instanceof Error
      ? err.stack || err.message
      : (typeof err === 'string'
         ? err
         : JSON.stringify(err, null, 2));
    Logger.log(`[ERROR] ${new Date().toISOString()} – ${tag}: ${text}`);
  }

  /**
   * Appends a runtime‐statistics row to the "Runtime Logs" sheet.
   * Ensures the sheet exists on each invocation.
   * @param {string} status
   * @param {string} message
   * @param {number} rowCount
   * @param {number} startTime
   */
  function logRunTime(status, message, rowCount, startTime) {
    const SHEET_NAME       = 'Runtime Logs';
    const HEADER_ROW       = ['Timestamp', 'Status', 'Message', 'RowCount', 'Duration (ms)', 'Flag'];
    const MAX_ENTRIES      = 25;
    const SLOW_THRESHOLD   = 3000; // ms
    const LOW_ROW_THRESHOLD= 10;

    // Ensure or create the sheet on each use
    const sheet = MyApp.Utils.ensureSheetExists(SHEET_NAME, HEADER_ROW);

    const duration = startTime ? (Date.now() - startTime) : '';
    let   flag     = '';

    if (status === 'Error') {
      flag = 'Error';
    } else {
      if (rowCount < LOW_ROW_THRESHOLD)   flag += 'Low Row Count; ';
      if (duration > SLOW_THRESHOLD)      flag += 'Slow Execution; ';
      flag = flag.trim();
    }

    sheet.appendRow([
      new Date(),
      status,
      message || '',
      rowCount || '',
      duration,
      flag
    ]);

    // Trim old entries beyond MAX_ENTRIES
    const numRows     = sheet.getLastRow();
    const excessRows  = numRows - MAX_ENTRIES - 1;
    if (excessRows > 0) {
      sheet.deleteRows(2, excessRows);
    }
  }

  var exports = {
    logInfo,
    logWarn,
    logError,
    logRunTime
  };

  Object.freeze(exports);
  return exports;
})();
