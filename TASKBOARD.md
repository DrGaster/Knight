# Taskboard

## Completed

- Utils                     Harmonize local aliases to lowerCamelCase  
- Logger                    Harmonize local aliases  
- Logger                    Refactor export to `const api`  
- DataLoader                Harmonize local aliases  
- Staging                   Harmonize local aliases  
- PivotBuilder              Harmonize local aliases  
- Main & Orchestrator       Harmonize local aliases  
- UiHandler                 Reconcile naming  
- Cross-Module              Escape sheet names safely in formulas  

---

## Critical

- Cross-Module              Slice raw-data header to first six columns  
- Cross-Module              Fix header mismatch error on dataset load  

---

## High

- Cross-Module              Rename tabs to use `Config.SHEET_NAMES`  
- Cross-Module              Update formulas to `Config.SHEET_NAMES.*`  
- Cross-Module              Externalize sheet names into a centralized `Config` object  

---

## Low

- Cross-Module              Add linting and type-checking to build pipeline  

---

## New

- Repository                Refine folder structure for modular imports  
- Repository                Document module boundaries and public interfaces  
- Performance               Prototype a DRAM-like in-memory cache sheet for ephemeral data  

---

## CLASP & GitHub

- Integrate CLASP deploy into GitHub Actions workflow  
- DevOps                    Set up CI/CD pipeline for automatic `clasp push` on merge  

---

## Testing Area (testing.gs)

- Refactor testing.gs into discrete modules (e.g., TestRunner, Assertions, MockData)  
- Harmonize local aliases and naming conventions within testing.gs  
- Wire up existing modules (Utils, Logger, DataLoader, PivotBuilder) for test harness  
- Externalize sheet names in tests to use `Config.SHEET_NAMES`  
- Abstract raw-data header slicing logic into a shared helper and reuse in tests  
- Implement assertion functions (`assertEquals`, `assertThrows`, etc.)  
- Configure a mock spreadsheet environment for isolated test runs  
- Add onEdit / time-driven trigger simulation in testing.gs  
- Document test cases and expected outcomes within the test suite  
- Setup automated invocation of testing.gs via GitHub Actions or clasp command  
