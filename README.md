# Fujifilm Film Simulation Comparator

A lightweight one-page web app to compare Fujifilm film simulations using high-resolution JPG images.

## Features

- Subject-based image set selection from a local manifest.
- `BASE (left)` and `COMPARISON (right)` simulation selectors.
- Before/After horizontal slider comparison.
- Side-by-side comparison mode.
- Synchronized magnifier lenses in Side-by-side mode.
- Lens zoom levels (`1.5x`, `2x`, `3x`) in Side-by-side mode.
- Optional `Full width` mode for Before/After view.
- Responsive layout for desktop and mobile.

## Project Structure

- `index.html`: UI markup and controls.
- `styles.css`: layout and visual styles.
- `app.js`: app logic, state, interactions.
- `assets/images-manifest.js`: image manifest loaded at runtime.
- `images/`: simulation JPG files.

## Run

Open `index.html` in your browser.

The app is designed to work directly from local files (`file://`) with the provided manifest script.

You can also visit [https://friimaind.github.io/film-simulations-comparator/](https://friimaind.github.io/film-simulations-comparator/)
