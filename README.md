# VoxLogicA UI

A modern web interface for [VoxLogicA](https://github.com/vincenzoml/VoxLogicA), the Voxel-based Logical Analyser. VoxLogicA is an interpreter of a declarative language, inspired by spatial logics, to analyze images in a simple way.

This UI provides an intuitive way to work with neuroimaging data, currently supporting the BraTS (Brain Tumor Segmentation) dataset format. For more information about VoxLogicA itself, please visit the [main project repository](https://github.com/vincenzoml/VoxLogicA).

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Yarn package manager

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd voxlogica-ui
```

2. Install dependencies and start the development server:

```bash
yarn install
yarn dev
```

3. Open your browser and navigate to the development server address displayed in the terminal.

## Development

### Tech Stack

- [SvelteKit](https://kit.svelte.dev/) - Web framework
- [Skeleton UI](https://www.skeleton.dev/) - UI components
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [NiiVue](https://niivue.github.io/) - Neuroimaging visualization

### Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn preview` - Preview production build
- `yarn check` - Type-check the codebase
- `yarn format` - Format code with Prettier

## License

This project is licensed under the same terms as VoxLogicA. See the [VoxLogicA repository](https://github.com/vincenzoml/VoxLogicA) for more information.
