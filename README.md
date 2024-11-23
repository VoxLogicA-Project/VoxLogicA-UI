# VoxLogicA UI

A modern web interface for [VoxLogicA](https://github.com/vincenzoml/VoxLogicA), the Voxel-based Logical Analyser. VoxLogicA is an interpreter of a declarative language, inspired by spatial logics, to analyze images in a simple way.

This UI provides an intuitive way to work with neuroimaging data, currently supporting the BraTS (Brain Tumor Segmentation) dataset format. For more information about VoxLogicA itself, please visit the [main project repository](https://github.com/vincenzoml/VoxLogicA).

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- Yarn package manager (v1.22.22 or later)
- curl (for downloading VoxLogicA binaries)
- unzip or tar (depending on your OS)

### Development Environment

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

Then set the paths to your datasets, scripts and temporary outputs in the `.env` file:

```bash
DATASET_PATH=/path/to/your/datasets
SCRIPTS_PATH=/path/to/your/scripts
RUN_OUTPUT_PATH=/path/to/temporary/outputs
```

3. Download and install dependencies:

```bash
yarn install
```

4. Set up VoxLogicA binary:

Download the appropriate VoxLogicA binary from the [VoxLogicA releases page](https://github.com/vincenzoml/VoxLogicA/releases) and extract the content of the folder inside the archive into `static/bin/VoxLogicA` directory.

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

### Troubleshooting

If you encounter permission issues with VoxLogicA binary:

- **Linux/macOS**: Ensure the binary has execution permissions:
  ```bash
  chmod +x static/bin/linux/voxlogica  # For Linux
  chmod +x static/bin/macos/voxlogica  # For macOS
  ```
- **Windows**: Make sure Windows Defender or your antivirus isn't blocking the executable.

## License

This project is licensed under the same terms as VoxLogicA. See the [VoxLogicA repository](https://github.com/vincenzoml/VoxLogicA) for more information.
