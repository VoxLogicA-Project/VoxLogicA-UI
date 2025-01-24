# VoxLogicA UI

VoxLogicA UI is a modern web-based interface for visualizing and analyzing neuroimaging data, where analysis are performed through spatial model checking leveraging VoxLogicA.

VoxLogicA is an interpreter of a declarative language, inspired by spatial logics, to analyze images in a simple declarative way. For more information about VoxLogicA itself, please visit the [main project repository](https://github.com/vincenzoml/VoxLogicA).

## How to run

Currently, VoxLogicA UI runs as a web application. A desktop app using electron is in progress and will be uploaded soon.

The most straightforward way to test the web application is using Docker (see https://www.docker.com/). Clone the repository first (actually, just the static directory is all that you need) and then run the official docker image of VoxLogicA UI on linux and mac is as follows:

```bash
docker run -p 3000:3000   -v "$(pwd)/static/datasets:/data/datasets"   -v "$(pwd)/static/scripts:/data/scripts"   docker.io/vincenzoml/voxlogica-ui:latest
```

On windows, use powershell:

```psh
docker run -p 3000:3000 -v "${PWD}/static/datasets:/data/datasets" -v "${PWD}/static/scripts:/data/scripts" docker.io/vincenzoml/voxlogica-ui:latest
```

The test can be interrupted using CTRL+C. Note that this opens a port at localhost:3000. Open localhost:3000 in your web browser and start testing.

To use the tool on your own data, just replace "$(pwd)/static/datasets" (only the part before the semicolon!) with the full path to the directory where your datasets are hosted (see below for more details on the format). The path **must** be absolute.

To use a different port, change the first occurrence of `3000`. To be able to close the terminal while the application run, the `-d`switch can be added to the command line (e.g., just before `-p`). See below for details on how to manage the running application and stop it, in that case.

## Tech Stack

- [SvelteKit](https://svelte.dev/) (v5) - Web framework
- [Skeleton UI](https://www.skeleton.dev/) (v2) - UI components
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [NiiVue](https://niivue.github.io/niivue/) - Neuroimaging visualization
- [VoxLogicA](https://github.com/vincenzoml/VoxLogicA) (v1.3.3-experimental) - Spatial model checking

## Requirements

### Using Docker (Recommended)

- Docker

### Manual Installation

- Node.js (v20 or later)
- Yarn package manager (v1.22.22 or later)
- curl (for downloading VoxLogicA binaries)
- unzip or tar (depending on your OS)

## Configuration

### Data Directories

VoxLogicA UI uses three main data directories that you can configure:

1. **Datasets Directory:** contains your neuroimaging data organized by dataset
2. **Scripts Directory:** contains example VoxLogicA scripts
3. **Workspaces Directory:** contains saved user workspaces

#### Default Locations

```bash
DATASET_PATH=static/datasets         # Neuroimaging datasets
SCRIPTS_PATH=static/scripts          # Example VoxLogicA scripts
WORKSPACES_PATH={temp_dir}/voxlogica-ui/workspaces  # User workspaces
```

#### Directory Structure

##### Datasets Directory

```
datasets/
├── dataset1/
│   ├── case1/
│   │   ├── case1_t1.nii.gz
│   │   └── case1_t2.nii.gz
│   └── case2/
│       ├── case2_t1.nii.gz
│       └── case2_t2.nii.gz
└── dataset2/
    └── ...
```

- Each dataset is a directory containing case directories
- Case directories contain NIFTI files (`.nii.gz`)
- Layer files should follow the naming convention: `layername.nii.gz` or possibly `casename_layername.nii.gz`

##### Scripts Directory

```
scripts/
├── example1.imgql
├── example2.imgql
└── ...
```

- Contains `.imgql` files with VoxLogicA scripts
- These scripts will be available as examples in the UI

##### Workspaces Directory

```
workspaces/
├── workspace1/
│   ├── workspace.json
│   └── cases/
│       └── ...
└── workspace2/
    └── ...
```

- Each workspace has its own directory containing configuration and analysis results
- The application automatically manages this directory structure

#### Custom Configuration

You can customize these paths by:

1. Passing the wanted paths to the docker run command (see [Installation & Deployment](#installation--deployment))

2. If not using Docker, creating a `.env` file in the project root:

```bash
DATASET_PATH=/path/to/your/datasets
SCRIPTS_PATH=/path/to/your/scripts
WORKSPACES_PATH=/path/to/workspaces
```

## Installation & Deployment

### Production Deployment with Docker (Recommended)

1. Build the Docker image:

```bash
docker build -t voxlogica-ui .
```

2. Run the container:

```bash
docker run -d \
  --name voxlogica-ui \
  -p 3000:3000 \
  -v "$(pwd)/static/datasets:/data/datasets" \
  -v "$(pwd)/static/scripts:/data/scripts" \
  voxlogica-ui
```

This will:

- Start the container in detached mode (`-d`)
- Map port 3000 to your host machine
- Mount your local datasets and scripts directories into the container (please change the paths in the command above to fit your needs)

### Managing the Docker Container

Monitor the application logs:

```bash
docker logs -f voxlogica-ui
```

Stop the container:

```bash
docker stop voxlogica-ui
```

Remove the container:

```bash
docker rm voxlogica-ui
```

### Development Setup

#### Using Dev Container (Recommended)

1. Install [Visual Studio Code](https://code.visualstudio.com/) and the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Clone the repository and open it in VS Code
3. When prompted, click "Reopen in Container"
4. The container will automatically:
   - Set up the correct Node.js environment
   - Install dependencies
   - Download the appropriate VoxLogicA binary
   - Configure VS Code with recommended extensions
5. Run the development server with `yarn dev`

#### Manual Installation

1. Clone the repository:

```bash
git clone https://github.com/CoffeeStraw/VoxLogica-UI/
cd voxlogica-ui
```

2. Configure environment variables (optional):

```bash
# Create a .env file
touch .env
```

Then set the following paths in the `.env` file:

```bash
# Data paths
DATASET_PATH=/path/to/your/datasets     # Default: static/datasets
SCRIPTS_PATH=/path/to/your/scripts      # Default: static/scripts
WORKSPACES_PATH=/path/to/workspaces     # Default: {temp_dir}/voxlogica-ui/workspaces
# VoxLogicA binary path
VOXLOGICA_BINARY_PATH=/path/to/voxlogica # Default: /opt/voxlogica
```

3. Download and install dependencies:

```bash
yarn install
```

4. Set up VoxLogicA binary:

Download the appropriate VoxLogicA binary from the [VoxLogicA releases page](https://github.com/vincenzoml/VoxLogicA/releases) and extract the content of the folder in `${VOXLOGICA_BINARY_PATH}`.

5. Start the development server:

```bash
yarn dev
```

6. Open your browser and navigate to the development server address displayed in the terminal.

### Development Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn preview` - Preview production build
- `yarn check` - Type-check the codebase
- `yarn format` - Format code with Prettier
- `yarn test` - Run tests
- `yarn test:coverage` - Run tests with coverage report

## Credits

This software has been developed by [Antonio Strippoli](https://github.com/CoffeeStraw) as part of his Master Thesis project, under the joint supervision of [Vincenzo Ciancia](https://dblp.org/pid/50/1930.html), [Fabio Gadducci](https://dblp.org/pid/g/FabioGadducci.html), [Mieke Massink](https://dblp.org/pid/79/1724.html), and the guidance of [Giovanna Broccia](https://dblp.org/pid/207/2093.html) for user testing and design.

A big thanks as well to all the people who contributed to this project through suggestions, feedback, testing, and code contributions. Every bit of help, no matter how small, has been invaluable in making VoxLogicA UI better.

## License

VoxLogica UI is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

For more information about VoxLogicA itself, please visit the [main project repository](https://github.com/vincenzoml/VoxLogicA).
