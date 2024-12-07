# Model: API Repository

**General Description:**
A data access layer that handles all API interactions for the application, providing a clean interface for fetching datasets, cases, layers, and scripts.

_Error Handling:_

- `RepositoryError` class - Custom error with status code and original error tracking

_Interface Definition:_

- `IDataRepository` interface defines core data access methods:
  - `getDatasets()` → Promise<Dataset[]>
  - `getCases(dataset)` → Promise<Case[]>
  - `getLayers(dataset, case)` → Promise<Layer[]>
  - `getPresetScripts()` → Promise<PresetScript[]>
  - `getPresetScriptCode(script)` → Promise<string>

_Implementation:_

- `createApiRepository()` creates repository instance with:
  - `fetchWithError()` - Helper for standardized fetch error handling
  - Implementation of all IDataRepository methods using REST endpoints

_Export:_

- `apiRepository` - Singleton instance for application-wide use

The repository acts as a single source of truth for all external data access, with consistent error handling and type safety.

# Dataset ViewModel

**General Description:**
A viewmodel managing dataset selection and state. It handles loading and selecting datasets, coordinating with case and layer viewmodels.

_State Properties:_

- `available`: Dataset[] - List of available datasets
- `selected`: Dataset | null - Currently selected dataset

_State Access:_

- `getState()` → DatasetState - Returns complete state
- `datasets` → Dataset[] - Gets available datasets
- `selectedDataset` → Dataset | null - Gets selected dataset

_Core Methods:_

- `loadDatasets()` → Promise<void> - Loads available datasets from API
- `selectDataset(dataset)` → void - Sets selected dataset and triggers related updates
- `reset()` → void - Clears state and cascades reset to related viewmodels

The viewmodel is exported as singleton `datasetViewModel`.

# Case ViewModel

**General Description:**
A viewmodel managing case data selection and state. It handles loading, selecting, and managing multiple cases with a maximum limit of 16 cases.

**Properties & Methods:**

_State Properties:_

- `available`: Case[] - List of available cases
- `selected`: Case[] - Currently selected cases
- `maxCases`: number - Maximum selectable cases (16)

_State Access:_

- `getState()` → CaseState - Returns complete state
- `cases` → Case[] - Gets available cases
- `selectedCases` → Case[] - Gets selected cases
- `maxCases` → number - Gets max cases limit

_Core Methods:_

- `loadCases()` → Promise<void> - Loads cases for selected dataset
- `selectCase(case)` → Promise<void> - Adds case to selection
- `deselectCase(case)` → void - Removes case from selection
- `toggleCase(case)` → Promise<void> - Toggles case selection state
- `reset()` → void - Clears all state

_Derived Properties:_

- `canSelectMore` → boolean - Whether more cases can be selected
- `isSelected(case)` → boolean - Whether case is selected
- `getSelectionIndex(case)` → number - Gets case's position in selection

The viewmodel is exported as singleton `caseViewModel`.

# Layer ViewModel

**General Description:**
A viewmodel managing layer data, selection, and styling. It handles layers per case, their selection states, and appearance settings.

_State Properties:_

- `availableByCase`: Record<string, Layer[]> - Available layers for each case
- `selected`: Record<string, Layer[]> - Selected layers per case
- `styles`: Record<string, LayerStyle> - Styling settings for each layer

_State Access & Lookup:_

- `getState()` → LayerState - Returns complete state
- `styles` → Record<string, LayerStyle> - Gets layer styles
- `getAvailableLayersForCase(caseId)` → Layer[] - Gets available layers for case
- `getAvailableLayerFromId(caseId, layerId)` → Layer? - Finds specific available layer
- `getSelectedLayerFromIds(caseId, layerId)` → Layer? - Finds specific selected layer

_Derived Properties:_

- `uniqueLayersIds` → string[] - All unique layer IDs across cases
- `selectedLayersForCase(caseId)` → Layer[] - Selected layers for case
- `selectedLayersWithLayerStylesForCase(caseId)` → {layer, style}[] - Layers with styles
- `isLayerSelectedForAllCases(layerId)` → boolean - Layer selection status across cases

_Core Methods:_

- `loadLayersFromDataset(case)` → Promise<void> - Loads layers for case
- `loadLayersFromRun(case, layers)` → Promise<void> - Loads run output layers
- `selectLayer/unselectLayer/toggleLayer` - Layer selection management
- `selectLayerForAllSelectedCases/unselectLayerForAllSelectedCases` - Bulk layer selection
- `setLayerStyleColor/setLayerStyleAlpha` - Style management
- `removeCaseLayers(caseId)` - Removes case layers
- `reset()` - Clears all state

The viewmodel is exported as singleton `layerViewModel`.

# Run ViewModel

**General Description:**
A viewmodel managing script execution, run history, and associated layer states. It handles script content, presets, execution of runs across multiple cases, and maintains execution history with corresponding layer states.

_State Properties:_

- `availablePresets`: PresetScript[] - Available preset scripts
- `editorContent`: string - Current script content
- `history`: Run[][] - History of executed runs
- `layersStates`: LayerViewModel[] - Layer states for each run

_State Access:_

- `getState()` → RunState - Returns complete state
- `history` → Run[][] - Gets run history
- `layerStates` → LayerViewModel[] - Gets layer states
- `availablePresets` → PresetScript[] - Gets available presets
- `editorContent` → string - Gets current script content

_Script Management:_

- `headerContent` → string - Derived script header content
- `fullScriptContent` → string - Complete script content
- `saveEditorContent(content)` - Updates editor content
- `loadPresets()` → Promise<void> - Loads preset scripts
- `loadPresetScript(preset)` → Promise<void> - Loads specific preset

_Run Execution:_

- `singleRun(case)` → Promise<Run> - Executes single case
- `runAll(cases)` → Promise<Run[]> - Executes multiple cases

_Layer Selection Properties:_

- `selectedLayersForCase(caseId)` → Layer[] - Selected layers for case
- `selectedLayersWithLayerStylesForCase(caseId)` → {runIndex, layer, style}[] - Layers with styles
- `uniqueLayerIdsByRun(runIndex)` → string[] - Unique layer IDs for run

_State Management:_

- `reset()` - Clears all state

The viewmodel is exported as singleton `runViewModel`.

# UI ViewModel

**General Description:**
A viewmodel managing UI state and preferences. It handles sidebar states, panel visibility, fullscreen mode, and theme settings.

_State Properties:_

- `datasetSidebarCollapsed`: boolean - Dataset sidebar collapse state
- `layerSidebarCollapsed`: boolean - Layer sidebar collapse state
- `scriptSidebarCollapsed`: boolean - Script sidebar collapse state
- `fullscreenCaseId`: string | null - Currently fullscreened case
- `bottomPanelTab`: string - Active bottom panel tab
- `bottomPanelBlinkingTab`: string | null - Blinking tab indicator
- `isDarkMode`: boolean - Dark mode state

_State Access:_

- `getState()` → UIState - Returns complete state

_Sidebar Management:_

- `datasetSidebarCollapsed` - Get/set dataset sidebar state
- `layerSidebarCollapsed` - Get/set layer sidebar state
- `scriptSidebarCollapsed` - Get/set script sidebar state

_Panel Management:_

- `fullscreenCaseId` - Get/set fullscreen case
- `bottomPanelTab` - Get/set active bottom tab
- `bottomPanelRunIndex` → number - Gets run index from tab
- `bottomPanelBlinkingTab` - Get/set blinking tab

_Theme Management:_

- `isDarkMode` - Get/set dark mode state
- `toggleDarkMode()` - Toggles dark mode

_State Management:_

- `reset()` - Resets UI state to defaults

The viewmodel is exported as singleton `uiViewModel`.

# StateManager ViewModel

**General Description:**
A viewmodel managing the entire application state. It handles saving, loading, and synchronizing state across all other viewmodels, with support for persistence to localStorage.

_State Properties:_

- `hasUnsavedChanges`: boolean - Tracks unsaved changes

_State Management:_

- `markAsUnsaved()` - Marks state as modified
- `markAsSaved()` - Marks state as saved
- `hasChanges()` → boolean - Checks for unsaved changes
- `getState()` → SerializedApplicationState - Gets serialized app state

_State Operations:_

- `loadState(state)` → Promise<void> - Restores application state
  - Resets all viewmodels
  - Loads datasets
  - Restores case selections
  - Validates and restores layer states
  - Reconstructs run history
  - Restores UI preferences

_Persistence:_

- `saveToLocalStorage(key?)` - Saves state to localStorage
- `loadFromLocalStorage(key?)` - Loads state from localStorage

_SerializedApplicationState Structure:_

- `dataset`: Selected dataset info
- `case`: Selected case IDs
- `layer`: Layer selections and styles
- `run`: Run history, layer states, editor content
- `ui`: UI preferences and state

The viewmodel is exported as singleton `stateManager`.
