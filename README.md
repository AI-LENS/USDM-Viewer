# USDM JSON Subset Viewer

A modern, interactive Vue.js application for viewing and exploring USDM (Unified Study Data Model) JSON files. This tool provides both tree and mind-map visualizations to help users navigate complex study data structures.

## Features

- 🌳 **Interactive Tree View**: Expandable/collapsible tree structure for detailed data exploration
- 🗺️ **Hierarchical Mind-map**: User-friendly left-to-right tree structure showing 3 levels at a time with drill-down navigation
- 🔍 **Smart Filtering**: Filter data by specific keys or common study elements
- 📂 **Drag & Drop Support**: Easy file loading via drag and drop or file picker
- 🎨 **Modern UI**: Built with Tailwind CSS and DaisyUI for a beautiful, responsive interface
- ⚡ **Fast Performance**: Powered by Vue 3 and Vite for optimal performance

## Quick Start

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone or download the project**
   ```bash
   cd "usdm viewer"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   The application will automatically open at `http://localhost:3000`

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory, which you can serve with any static file server.

## Usage

### Loading Data

1. **File Upload**: Click the "📂 Open JSON" button to select a JSON file
2. **Drag & Drop**: Simply drag a JSON file anywhere on the page
3. **Sample Data**: The app loads with sample USDM data for immediate exploration

### Tree View

- Click the `+`/`−` buttons to expand/collapse nodes
- Click on any node to select it
- Use the tree to explore the hierarchical structure of your data

### Hierarchical Mind-map View

- Switch to the "Mind-map" tab to see a structured left-to-right visualization
- **Navigation System**:
  - **3-Level Display**: Shows only 3 levels at a time for clarity
  - **Drill-down Navigation**: Click deeper level nodes to navigate into them
  - **Breadcrumb Navigation**: Use breadcrumbs to navigate back to parent levels
  - **Home Button**: Quickly return to the root level
  - **Back Button**: Step back one level at a time
- **Level Interactions**:
  - **Level 1 (Root)**: Click + buttons to expand/collapse child nodes
  - **Level 2 (Children)**: Click + to show grandchildren, click node to drill down
  - **Level 3 (Grandchildren)**: Click nodes to navigate deeper into the structure
- **Display Modes**:
  - **📝 Key Fields Only**: Shows only important descriptive fields (name, description, text)
  - **🔍 Complete Structure**: Displays the full data structure with all fields
- **Visual Elements**:
  - Blue rectangles: Object structures
  - Light blue rectangles: Array collections  
  - Yellow rectangles: Primitive values (strings, numbers, booleans)
  - Purple rectangles: Null values
  - Green/Red indicators: Expandable nodes (+ to expand, - to collapse)
  - Curved arrows: Parent-child relationships

### Filtering Data

1. **Key Search**: Enter a specific key name (e.g., "arms", "endpoints") and click "Apply"
2. **Quick Filters**: Click on common study elements like:
   - arms
   - studyDesigns
   - epochs
   - encounters
   - activities
   - elements
   - endpoints
   - biomedicalConcepts
   - eligibilityCriteria
   - objectives

3. **Reset**: Click "Reset to full" to return to the complete dataset

## Project Structure

```
usdm viewer/
├── src/
│   ├── components/
│   │   ├── TreeView.vue      # Tree visualization component
│   │   ├── TreeNode.vue      # Individual tree node component
│   │   └── MindMapView.vue   # Mind-map visualization component
│   ├── App.vue               # Main application component
│   ├── main.js              # Application entry point
│   └── style.css            # Global styles and Tailwind imports
├── public/                   # Static assets
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md               # This file
```

## Technology Stack

- **Vue 3**: Progressive JavaScript framework with Composition API
- **D3.js**: Powerful data visualization library for interactive mindmaps
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **DaisyUI**: Component library for Tailwind CSS
- **JavaScript ES6+**: Modern JavaScript features

## Customization

### Styling

The application uses a custom DaisyUI theme called "usdm" with colors optimized for data visualization:

- Primary: `#6ea8ff` (Blue)
- Secondary: `#9ec1ff` (Light Blue)
- Accent: `#ffd166` (Yellow)
- Base: `#0b1020` (Dark Blue)

You can modify these colors in `tailwind.config.js`.

### Adding New Features

The modular Vue component structure makes it easy to add new features:

1. Create new components in `src/components/`
2. Import and use them in `App.vue`
3. Add new filtering or visualization options as needed

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your own needs.

## Support

For issues or questions:
1. Check the browser console for error messages
2. Ensure your JSON file is valid
3. Try with the sample data first to isolate issues

## Changelog

### v1.0.0
- Initial release
- Tree and mind-map views
- Key-based filtering
- Drag & drop file support
- Responsive design
- Modern Vue 3 architecture
