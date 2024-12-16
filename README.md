# VoxLogicA UI

A modern web interface for [VoxLogicA](https://github.com/vincenzoml/VoxLogicA), the Voxel-based Logical Analyser. VoxLogicA is an interpreter of a declarative language, inspired by spatial logics, to analyze images in a simple way.

This UI provides an intuitive way to work with neuroimaging data, currently supporting the BraTS (Brain Tumor Segmentation) dataset format. For more information about VoxLogicA itself, please visit the [main project repository](https://github.com/vincenzoml/VoxLogicA).

## Requirements

### Using Docker (Recommended)

- Docker

### Manual Installation

- Node.js (v20 or later)
- Yarn package manager (v1.22.22 or later)
- curl (for downloading VoxLogicA binaries)
- unzip or tar (depending on your OS)

## Production Deployment

### Using Docker

The easiest way to deploy VoxLogicA UI in production is using Docker:

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

## Development Environment

If you have Docker installed, the easiest way to get started is using the provided Dev Container configuration:

1. Install [Visual Studio Code](https://code.visualstudio.com/) and the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Clone the repository and open it in VS Code
3. When prompted, click "Reopen in Container"
4. The container will automatically:
   - Set up the correct Node.js environment
   - Install dependencies
   - Download the appropriate VoxLogicA binary
   - Configure VS Code with recommended extensions
5. Run the development server with `yarn dev`

### Manual Installation

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

## Development

### Tech Stack

- [SvelteKit](https://svelte.dev/) (v5) - Web framework
- [Skeleton UI](https://www.skeleton.dev/) (v2) - UI components
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [NiiVue](https://niivue.github.io/niivue/) - Neuroimaging visualization
- [VoxLogicA](https://github.com/vincenzoml/VoxLogicA) (v1.3.3-experimental) - Image analysis engine

### Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn preview` - Preview production build
- `yarn check` - Type-check the codebase
- `yarn format` - Format code with Prettier
- `yarn test` - Run tests
- `yarn test:coverage` - Run tests with coverage report

## Credits

This software has been developed by Antonio Strippoli as part of his Master Thesis project, under the joint supervision of [dr. Vincenzo Ciancia](https://dblp.org/pid/50/1930.html), [Prof. Fabio Gadducci](https://dblp.org/pid/g/FabioGadducci.html), [dr. Mieke Massink](https://dblp.org/pid/79/1724.html), and the guidance of [dr. Giovanna Broccia](https://dblp.org/pid/207/2093.html) for user testing and design.

A big thanks as well to all the people who contributed to this project through suggestions, feedback, testing, and code contributions. Every bit of help, no matter how small, has been invaluable in making VoxLogicA UI better.

## License

VoxLogica UI is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

For more information about VoxLogicA itself, please visit the [main project repository](https://github.com/vincenzoml/VoxLogicA).
