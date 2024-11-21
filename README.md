# VoxLogicA UI

A modern web interface for [VoxLogicA](https://github.com/vincenzoml/VoxLogicA), the Voxel-based Logical Analyser. VoxLogicA is an interpreter of a declarative language, inspired by spatial logics, to analyze images in a simple way.

This UI provides an intuitive way to work with neuroimaging data, currently supporting the BraTS (Brain Tumor Segmentation) dataset format. For more information about VoxLogicA itself, please visit the [main project repository](https://github.com/vincenzoml/VoxLogicA).

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Yarn package manager
- curl (for downloading VoxLogicA binaries)
- tar or unzip (depending on your OS)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd voxlogica-ui
```

2. Configure environment variables (optional):

```bash
# Create a .env file
touch .env
```

2.1. Set the paths to your datasets, scripts and temporary outputs:

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

**Windows:**

```powershell
# Create directories
mkdir -p static/bin/windows

# Download and extract
curl https://github.com/vincenzoml/VoxLogicA/releases/download/v1.3.3-experimental/VoxLogicA_1.3.3-experimental_win-x64.zip -o voxlogica.zip
tar -xf voxlogica.zip
mv VoxLogicA_1.3.3-experimental_win-x64/* static/bin/windows/
rm -r VoxLogicA_1.3.3-experimental_win-x64
rm voxlogica.zip
```

**Linux:**

```bash
# Create directories
mkdir -p static/bin/linux

# Download and extract
curl https://github.com/vincenzoml/VoxLogicA/releases/download/v1.3.3-experimental/VoxLogicA_1.3.3-experimental_linux-x64.zip -o voxlogica.zip
unzip voxlogica.zip
mv VoxLogicA_1.3.3-experimental_linux-x64/* static/bin/linux/
rm -r VoxLogicA_1.3.3-experimental_linux-x64
chmod +x static/bin/linux/voxlogica
rm voxlogica.zip
```

**macOS:**

```bash
# Create directories
mkdir -p static/bin/macos

# Download and extract
curl https://github.com/vincenzoml/VoxLogicA/releases/download/v1.3.3-experimental/VoxLogicA_1.3.3-experimental_osx-x64.zip -o voxlogica.zip
unzip voxlogica.zip
mv VoxLogicA_1.3.3-experimental_osx-x64/* static/bin/macos/
rm -r VoxLogicA_1.3.3-experimental_osx-x64
chmod +x static/bin/macos/voxlogica
rm voxlogica.zip
```

5. Start the development server:

```bash
yarn dev
```

6. Open your browser and navigate to the development server address displayed in the terminal.

## Development

### Tech Stack

- [SvelteKit](https://svelte.dev/) - Web framework
- [Skeleton UI](https://www.skeleton.dev/) - UI components
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [NiiVue](https://niivue.github.io/niivue/) - Neuroimaging visualization
- [VoxLogicA](https://github.com/vincenzoml/VoxLogicA) - Image analysis engine

### Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn preview` - Preview production build
- `yarn check` - Type-check the codebase
- `yarn format` - Format code with Prettier

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
