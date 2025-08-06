var MyApp = MyApp || {};

/**
 * Central configuration for MyApp.
 * @namespace MyApp.Config
 */
MyApp.Config = {
  // All sheet names in one place
  SHEET_NAMES: {
    RAW_DATA: 'RAW_DATA',
    MIRROR:   'Second Experiment',
    DATA:     'Second Experiment',
    PIVOT:    'PivotSheet'
  },

  // Ranges & import cell
  RAW_DATA_RANGE:        'A:F',
  IMPORT_CELL:           'A2',

  // Column offsets (1-based). Sections are separated by COLUMN_BUFFER_SIZE.
  STAGING_START_COL:     8,    // H
  THIRD_RANGE_START_COL: 16,   // P
  PIVOT_START_COL:       24,   // X
  COLUMN_BUFFER_SIZE:    1,

  // Flagging
  FLAG_HEADER:           'FLAG',
  FLAG_MAP: {
    SHIP_STORE:      'SHIP',
    FTL_FUEL_STORE:  'FUEL',
    STL_FUEL_STORE:  'FUEL',
    STORE:           'BASE',
    WAREHOUSE_STORE: 'WAREHOUSE'
  },

  // Dynamic filters for staging (excludes any row whose FLAG is in this array)
  FILTER_FLAGS: [
    'FUEL'
  ],

  // Expected & staging headers
  EXPECTED_COLUMNS: [
    'Username',
    'NaturalId',
    'Name',
    'StorageType',
    'Ticker',
    'Amount'
  ],

  STAGING_HEADER: [
    'Username',
    'NaturalId',
    'Name',
    'StorageType',
    'Ticker',
    'Amount',
    'FLAG'
  ],

  // Mirror formula
  MIRROR_FORMULA:       '=QUERY(\'RAW_DATA\'!A:F, "select *", 0)',

  // Pivot settings — declare these *after* your FLAG constants
  PIVOT_GROUP_COL:      'FLAG',
  PIVOT_FUNCTION:       'COUNTA',
  PIVOT_HEADER: [
    'FLAG',
    'Count'
  ],
  PIVOT_FALLBACK_LABEL: 'Count',

  // Feature toggles
  ENABLE_CACHING:            true,
  INCLUDE_TIMESTAMP_METADATA: false
};

// Freeze top-level and nested config objects/arrays
Object.freeze(MyApp.Config);
Object.freeze(MyApp.Config.SHEET_NAMES);
Object.freeze(MyApp.Config.FLAG_MAP);
Object.freeze(MyApp.Config.FILTER_FLAGS);
Object.freeze(MyApp.Config.EXPECTED_COLUMNS);
Object.freeze(MyApp.Config.STAGING_HEADER);
Object.freeze(MyApp.Config.PIVOT_HEADER);
