## Background Knowledge

### Neuroimaging data - .nii Files

**NIfTI** files (extension **.nii**) store volumetric neuroimaging data, which can include:

- 3D structural images (e.g., MRI scans)
- 4D functional images (e.g., fMRI time series)

The image data can represent various types of brain scans, including:

- T1-weighted MRI
- T2-weighted MRI
- Diffusion tensor imaging (DTI)
- Functional MRI (fMRI)
- PET scans

### BraTS

**BraTS (Brain Tumor Segmentation)** is an annual challenge that benchmarks state-of-the-art machine learning algorithms for automated segmentation of brain tumours, specifically gliomas, using multi-parametric MRI scans. It provides **expert-annotated MRI datasets** for training and evaluation of segmentation algorithms (e.g.: the 2024 BraTS challenge focuses on post-treatment glioma segmentation, introducing a new dataset of post-treatment MRI scans).

## Concepts for Frontend

### Dataset

A dataset is a collection of neurological patient cases.

Each dataset has its own directory, and must contain:

- `dataset.json`: a .json containing two fields: **name** and **layout**. The layout is used on the front-end to understand the patient's cases structure;
- **Item (patient's case)**: a directory containing the neuroimaging data (**.nii.gz files**) of a patient.

An example of a dataset directory structure is:

```
datasets/
  brats/
    dataset.json
    BraTS20_Training_001/
      BraTS20_Training_001_flair.nii.gz
      BraTS20_Training_001_seg.nii.gz
      BraTS20_Training_001_t1.nii.gz
      ...
    BraTS20_Training_002/
      ...
```

## Requirements for the Frontend

Our front-end is a visualizer for neuroimaging data, and it must allow to:

- **Browse through the items (patient's cases) of the dataset**: it is possible to scroll them and search them with a search bar. Then, it is possible to click an item to "open" it. It is possible to open up to 16 cases, but let's start with just a single one.
- **Visualize with the opened case(s)**: one of the layers must be selected to be the base image, while the others are viewed in a list and can be:
  - Selected/unselected in order to load them on top of the base image;
  - Changed the base color
  - The visualization result is visualized using Niivue;
- **A way to load a script in a new programming language and execute it on the given patient's cases**: the script together with the opened item(s) will be sent to the server, which will compute new layer(s) to visualize on top of the new image. The important aspect is that the new layers must be separated somehow from the layer present in the dataset, and we must retain an history of runs.

It must make use of the MVVM (model, view, viewmodel) paradigma.

Here's a detailed specification of the requirements based on our discussion:

# Requirements Specification

## Overview

It's a front-end application for visualizing neuroimaging data, implemented using the MVVM (Model-View-ViewModel) pattern in Svelte. The application provides tools for dataset exploration, case visualization, and script execution capabilities.

## Dataset Management

### Dataset Structure

- Datasets are stored in the `static/datasets/` directory for now
- Each dataset contains:
  - A `dataset.json` file specifying:
    - `name`: The dataset's display name
    - `layout`: The dataset's structure type (e.g., "brats")
  - Multiple subdirectories, each representing a patient case
- The application must support different dataset layouts, with "brats" being the initial implementation

### Dataset Browser

- Users can browse available datasets from the specified directory
- Only one dataset can be opened at a time
- Future enhancement: Support for loading local datasets

## Case Management

### Case Structure

- Each case is represented by a subdirectory within the dataset
- Cases contain multiple NIfTI files (`.nii.gz` format)
- File naming convention (for "brats" layout): `{patient_id}_{layer_name}.nii.gz`
- Non-NIfTI files should be ignored

### Case Browsing

- Display a scrollable list of available cases
- Show case names (directory names) in the list
- Provide a search bar to filter cases by name
- Allow opening up to 16 cases simultaneously (initial implementation: single case)
- Clicking a case "opens" it for visualization

## Layer Visualization

### Layer Management

- Automatically scan case directory to identify available layers
- Layer names are extracted from file names (part after the last underscore, before `.nii.gz`)
- First detected layer automatically becomes the base image
- Additional layers can be:
  - Selected/unselected for overlay on the base image
  - Customized with user-selected colors (free color selection)

### Visualization

- Implement visualization using Niivue library
- Display base image with optional overlay layers
- Support layer opacity/visibility controls

## Script Execution

### Script Interface

- Allow loading and execution of scripts to generate new layers
- Initial implementation: Mock functionality
  - Take an existing layer as input
  - Generate a new visualization layer with different coloring
  - Store generated layers in a separate `generated_layers/` directory
  - Maintain same naming convention as source files
  - Associate generated layers with original patient cases
  - The generated layers should be retrievable in subsequent sessions

### Execution History

- Persist between sessions with cleanup capability
- Store for each run:
  ```typescript
  interface ScriptRun {
  	id: string;
  	timestamp: Date;
  	scriptName: string;
  	inputLayers: string[];
  	outputLayers: string[];
  	status: 'success' | 'error';
  	error?: string;
  }
  ```

## UI Layout

### Main Structure

1. Sidebar:

   - Dataset selector (top)
   - Case list with search functionality
   - Script execution panel (bottom)

2. Main Content Area:
   - Niivue viewer
   - Layer controls panel (collapsible)
   - Run history panel (collapsible)

### Component Structure

```
src/
  lib/
    models/
      dataset.ts       # Dataset and Case interfaces
      layer.ts         # Layer management
      scriptRun.ts     # Script execution history
    viewmodels/
      datasetStore.ts  # Dataset loading and management
      layerStore.ts    # Layer state management
      scriptStore.ts   # Script execution and history
    components/
      DatasetBrowser.svelte
      CaseList.svelte
      LayerViewer.svelte
      LayerControls.svelte
      ScriptPanel.svelte
```

## Implementation Phases

1. Basic layout and dataset browsing
2. Case list implementation with search functionality
3. Niivue viewer integration with basic layer visualization
4. Layer control implementation
5. Mock script execution and history management

## Technical Considerations

- Use MVVM pattern for clean separation of concerns
- Implement persistent storage for script execution history
- Ensure proper error handling for file operations
- Maintain clear separation between original and generated data
- Support extensibility for future dataset layouts
