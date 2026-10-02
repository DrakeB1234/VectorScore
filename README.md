<div align="center" style="background-color: white;">
  <img src="https://raw.githubusercontent.com/DrakeB1234/VectorScore/master/public/vector-score-icon.svg" alt="Vector Score Logo" />
</div> 

### Vector Score
![NPM Version](https://img.shields.io/npm/v/vector-score)
[![Bundlephobia](https://img.shields.io/bundlephobia/minzip/vector-score)](https://bundlephobia.com/package/vector-score)
![NPM Downloads](https://img.shields.io/npm/d18m/vector-score)
[![Github Repo](https://img.shields.io/badge/github-repo-blue?logo=github)](https://github.com/DrakeB1234/VectorScore)

A lightweight, SVG-based TypeScript library for rendering simple musical notation, rhythms, and guitar chords. This projects aims to provide a simple to use renderer for web-based musical apps.

# Table of Contents

* [Features](#features)
* [Usage](#usage)
* [Core Classes Examples](#core-classes-examples)
  * [Standard Staff](#standard-staff)
  * [Scrolling Staff](#scrolling-staff)
  * [Rhythm Staff](#rhythm-staff)
  * [Guitar Chords](#guitar-chords)
* [Styling / Theme Guide](#css-classes--theming)
* [Input String Syntax](#input-string-syntax)
* [API Reference](#api-reference)
  * [Standard Staff Class](#musicstaff-class)
  * [Scrolling Staff Class](#scrollingstaff-class)
  * [Rhythm Staff Class](#rhythmstaff-class)
  * [Guitar Chords Class](#guitarchord-class)
* [Configuration Options](#configuration-options)
  * [Standard Staff](#musicstaffoptions)
  * [Scrolling Staff](#scrollingstaffoptions)
  * [Rhythm Staff](#rhythmstaffoptions)
  * [Guitar Chords](#guitarchordoptions)
* [Resources](#resources)

# Features

**Rendering Standard Musical Notation**
* Supports grand, treble, bass, and alto clefs.
* Easy to add notes and provides justifying alignment functions.
* Simple single line staff for display chords, notes, or scales.

**Render and Display Guitar Chords**
* Write explicitly which string, fret, and optionally finger to display on the diagram.
* Supports explicity barre chords.
* Label each string below diagram, useful for showing tuning of chord.

**Extra Classes**
* Dedicated staff for rhythm exercises with customizable time signatures and bar handling.
* Staff made to allow for 'endless' style of notes.

# Usage

### 1. Setup HTML
Create a container element in your HTML where the staff will be rendered.

```html
<div id="staff-container"></div>
```

### 2. Import and Initialize
Import desired class (StandardStaff, GuitarChord, etc.). Declare variable with reference to container element. Pass in options for specific class (options are typed).

```typescript
import { StandardStaff } from 'vector-score';

const containerRoot = document.getElementById('staff-container');

const staff = new StandardStaff(containerRoot, {
  staffType: 'grand',
  width: 400,
  scale: 1.2,
  spaceBelow: 1,
  keySignature: "Bb",
});
```

# Core Classes Examples

### Standard Staff
```ts
const staff = new StandardStaff(containerRoot, options);

staff.drawNote("C4", options);

staff.drawChord(["G3w", "C4w", "E4w"], options);
staff.drawRest("q", options);

staff.drawBeam([
  noteConfig("C4e"),
  noteConfig("E4e"),
  noteConfig("G4e"),
], options);
```
![Alt Text](https://raw.githubusercontent.com/DrakeB1234/VectorScore/master/public/MusicStaffGrandResult.svg)

### Scrolling Staff
```ts
function handleNotesOut() {
  console.log("All Done!");
}

const staff = new ScrollingStaff(containerRoot, options);

staff.queueNotes([
  noteConfig("C4q."),
  chordConfig(["D4", "F#4", "A4"], "q");
  restConfig("s"),
  beamConfig([
    noteConfig("C4e"),
    noteConfig("E4e"),
    noteConfig("F4e"),
  ]);
]);

staff.advanceNotes();
```
![Alt Text](https://raw.githubusercontent.com/DrakeB1234/VectorScore/master/public/ScrollingStaffResult.webp)

### Rhythm Staff
```ts
const staff = new RhythmStaff(containerRoot, options);

staff.drawMeasure([
  { type: "beam", durations: "eeee" },
  { type: "rest", duration: "h" },
]);

staff.drawMeasure([
  { type: "note", duration: "q" },
  { type: "rest", duration: "e" },
  { type: "beam", duration: "ee" },
  { type: "rest", duration: "q." },
]);
```
![Alt Text](https://raw.githubusercontent.com/DrakeB1234/VectorScore/master/public/RhythmStaffResult.svg)

### Guitar Chords
```ts
const chordsSection = new GuitarChords(containerRoot, options);

chordsSection.addChord("xx0232", "000132", {
  label: "D",
});

// Bbmaj7 Barre Chord (Automatically calculates the starting fret and barre positioning)
const frets = "687766";
const fingers = "142311";
const barres = guitarInstance.determineBarreOptions(frets, fingers, [6]);

guitarInstance.addChord(frets, fingers, {
  label: "Bbmaj7",
  barres: barres,
});
```
![Alt Text](https://raw.githubusercontent.com/DrakeB1234/VectorScore/master/public/GuitarChordsResult.svg)

# CSS Classes & Theming
All core classes uses CSS classes for styling. All elements that can be targeted for theming are prefixed with `.vs-`.

```css
  /* === Root SVG element === */
  svg.vs-svg-renderer-root {}

  /* === Staff Theming === */
  .vs-staff-layer {}
  .vs-staff {} /* Staff lines */
  .vs-clef {}
  .vs-key-sig {}
  .vs-time-sig {}

  /* === Note Theming === */
  .vs-notes-layer {} 
  .vs-note {}
  .vs-chord {}
  .vs-rest {}
  .vs-beam {}
  .vs-barline {}

  /* === Guitar Chords Theming === */
  .vs-guitar-chords-layer {}
  .vs-guitar-chord {}
  .vs-guitar-text {}

  /* === Guitar Chords Diagram Theming */
  .vs-guitar-diagram-label {}
  .vs-guitar-group-fret-lines {}
  .vs-guitar-group-string-lines {}
  
  .vs-guitar-group-fret-dots {}
  .vs-guitar-fret-muted {}
  .vs-guitar-fret-open {}
  .vs-guitar-fret-dot {}
  .vs-guitar-fret-circle {}

  .vs-guitar-group-string-labels {}

  .vs-guitar-group-guitar-group-barre
  .vs-guitar-group-guitar-barre
  
```

# Input String Syntax

### Note String Syntax
Used by draw methods in StandardStaff.

* `[Name][Accidental?][Octave][Duration][.]`
* **Name**: `A` - `G` (Case insensitive)
* **Accidental**: `#` (Sharp) or `b` (Flat). Optional.
* **Octave**: `0` - `9`
* **Duration**:
    * `w`: Whole
    * `h`: Half
    * `q`: Quarter
    * `e`: Eighth
    * `.`: Dotted; added after duration value 

**Examples:**
* `C4w`: C, Octave 4, Whole note
* `F#5q.`: F Sharp, Octave 5, Dotted Quarter note
* `Bbb3e`: B Double Flat, Octave 3, Eighth note


### Guitar String Syntax

Chords are defined using two continuous strings: one for **frets** and one for **fingers**. The length of both strings must match the configured string count of the diagram (default is 6). Notes are written in ***string order***, with the first character representing the lowest string (e.g., low E in standard tuning).

* Frets String format: `[xX\da-zA-Z]+`
* `x` or `X`: Muted string.
* `0`: Open string.
* `1-9`: Fretted at the specified fret.
* `a-z` / `A-Z`: Base-36 alphanumeric encoding for double-digit frets (e.g., `a` = 10, `b` = 11, `c` = 12).

* Fingers String format: `[\d]+`
* `0`: No finger labeled.
* `1-9`: Finger number to display on the dot.

# API Reference

### StandardStaff Class

* `drawNote(note: string, options?: DrawOptions)`
  * Draws a single note `(ex. "C4q")` and advances the layout cursor.
* `drawChord(notes: string[], duration: string, options?: DrawOptions)`
  * Draws a chord of provided notes and duration.
* `drawBeam(entries: BeamableConfig[], options?: DrawOptions)`
  * Draws a grouped beam of notes.
* `drawBarline(options?: DrawOptions)`
  * Draws a barline across the staff on the next staff position.
* `drawBatchElements(items: { config: StandardStaffDrawConfig; options?: DrawOptions }[])`
  * Draws multiple elements in one method.
* `replaceByIndex(index: number, config: ReplaceConfig, options?: StandardStaffDrawConfig)`
  * Replaces an element at a specific index with a new configuration and recalculates layout spacing.
* `removeElementByIndex(index: number)`
  * Removes element at index.
* `justifyNotes()`
  * Evenly spaces all elements on staff.
* `applySpacing(overrideSpacing?: number)`
  * Method used to apply spacing, provided param will space at that value.
* `getElementByIndex(index: number)`
  * Returns the group SVG element of the element on staff at index.
* `getDataFromEntryIndex(index: number)`
  * Helper that returns coords and staff type from note entry on staff. Useful for custom UI features.
* `clearAllNotes()`
* `destroy()`

### ScrollingStaff Class

* `queueNotes(notes: DrawConfig[])`
  * Prepares note on staff, will clear any previous entries.
* `advanceNotes()`
  * Advances to the next note on staff.
* `clearAllNotes()`

###### Note
Scrolling animation can only be applied via CSS.

### RhythmStaff Class

* `drawMeasure(items: RhythmItem[])`
  * Draws a measure with provided elements.
* `setMaxMeasures(count: number)`
  * Sets staff to a set amount of measures, clears all elements on staff. Throws error if too many measures are provided for set staff width.
* `getBeatCoordinateX(index: number, dividend: number)`
  * Returns X coord by beat dividend (4ths, 8ths, 16ths...) for aligning UI elements.
* `clear()`

### GuitarChord Class

* `addChord(frets: string, fingers: string, options?: GuitarChordDrawOptions)`
  * Draws notes on the diagram using string configurations.
* `modifyChordByIndex(frets: string, fingers: string, chordIndex: number, options?: GuitarChordDrawOptions)`
  * Modifies the chord at the specified index with new definitions and options.
* `determineBarreOptions(frets: string, fingers: string, barreFrets: number[])`
  * Automatically calculates barre line dimensions based on the fingering string and returns an array of *GuitarBarreDef* to be passed into chord options.
* `removeChordByIndex()`
* `clearAllChords()`
* `destroy()`

# Configuration Options

### StandardStaffOptions
* `width`: Total width of the SVG in pixels.
* `scale`: Zoom factor (default: 1).
* `noteStartX`: Position where notes start to draw.
* `paddingTop`: Padding above the staff (in pixels).
* `paddingBottom`: Padding below the staff (in pixels).
* `staffType`: `'treble' | 'bass' | 'alto' | 'grand'`.
* `svgAutoFill`: Sets inline styles on root SVG element to allow for screen scaling (default: true).
* `keySignature`: Key signature to display on the staff.
* `timeSignatures`: Time signature to display on the staff.

### ScrollingStaffOptions
* All options in StandardStaffOptions **AND**
* `onNotesOut`: Callback function for when there are no more notes on the staff to advance.

### RhythmStaffOptions
* `width`: Total width of the SVG in pixels.
* `scale`: Zoom factor (default: 1).
* `padding`: Padding for both sides of staff (in pixels).
* `svgAutoFill`: Sets inline styles on root SVG element to allow for screen scaling (default: true).
* `maxMeasures`: Allowed amount of measures on staff (default: 2).
* `topNumber`: Top number on key signature (default: 4).
* `bottomNumber`: Bottom number on key signature (default: 4).

### GuitarChordOptions
* `stringCount`: Amount of strings to show in diagram, default is 6.
* `fretCount`: Amount of frets to show in diagram, default is 5.
* `stringLabels`: Labels to show under each string in each chord diagram. Provided string values will display in order of strings in this array value.
* `inlineChordsAmount`: Max amount of chords to display on a single line (default: 2).
* `centerChords`: Boolean to center the chord diagrams on their respective rows (default: true).
* `scale`: Zoom factor (default: 1).
* `width`: Total width of the SVG in pixels, overrides inlineChordAmount auto width calculation (default: undefined).
* `svgAutoFill`: Sets inline styles on root SVG element to allow for screen scaling (default: true).

# Resources

VectorScore utilizes a modified, svg-ified, version of the [**Leland Font**](https://github.com/MuseScoreFonts/Leland/tree/main), A SMuFL-compliant OpenType music font used by Musescore. Previous versions of VectorScore utilized the [Bravura Font](https://github.com/steinbergmedia/bravura).

VectorScore is heavily insipired by [**VexFlow**](https://github.com/0xfe/vexflow), a full musical notation web renderer. 

[**Musescore**](https://musescore.org/en)'s studio application was used heavily as a reference, mainly for matching musical notation.