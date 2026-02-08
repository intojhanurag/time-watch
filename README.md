# Time Watch

A Chrome extension that displays a visual time-progress tracker on every page — watch your year, month, week, and day slip by in real time.

![Chrome Extension](https://img.shields.io/badge/Platform-Chrome-blue) ![Manifest V3](https://img.shields.io/badge/Manifest-V3-green) ![Version](https://img.shields.io/badge/Version-1.0.0-orange)

## Features

- **Year progress circle** — always-visible floating widget showing how much of the year has passed
- **Detailed breakdown** — click the circle to see progress bars for year, month, week, and day
- **Draggable** — move the widget anywhere on the page; position is saved across sessions
- **Lightweight** — pure HTML/CSS/JS, no dependencies, runs as a content script on every page
- **Non-intrusive** — small, dark-themed widget that stays out of your way

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/anurag2004-cpu/time-watch.git
   ```
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the `time-watch` folder
5. The widget will now appear on every page you visit

## Usage

- **Hover** over the circle to see the current day of the year
- **Click** the circle to expand a panel with year / month / week / day progress bars
- **Drag** the circle to reposition it — your position is remembered automatically
- **Click outside** the panel to close it

## Project Structure

```
time-watch/
├── manifest.json   # Chrome extension manifest (V3)
├── content.js      # Widget logic — progress calculations, drag, UI
├── content.css     # Widget styling — circle, panel, animations
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## License

MIT
