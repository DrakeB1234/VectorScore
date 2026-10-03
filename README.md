<div align="center" style="background-color: white;">
  <img src="https://raw.githubusercontent.com/DrakeB1234/VectorScore/master/public/vector-score-icon.svg" alt="Vector Score Logo" />
</div> 

## Vector Score
![NPM Version](https://img.shields.io/npm/v/vector-score)
[![Bundlephobia](https://img.shields.io/bundlephobia/minzip/vector-score)](https://bundlephobia.com/package/vector-score)
![NPM Downloads](https://img.shields.io/npm/d18m/vector-score)
[![Github Repo](https://img.shields.io/badge/github-repo-blue?logo=github)](https://github.com/DrakeB1234/VectorScore)

A lightweight, SVG-based TypeScript library for rendering simple musical notation, rhythms, and guitar chords. This projects aims to provide a simple to use renderer for web-based musical apps.

## Table of Contents

* [Features](#features)
* [Usage](#usage)
* [Core Classes Examples](#core-classes-examples)
  * [Standard Staff](#standard-staff)
  * [Scrolling Staff](#scrolling-staff)
  * [Rhythm Staff](#rhythm-staff)
  * [Guitar Chords](#guitar-chords)
* [Styling / Theme Guide](#css-classes--theming)
* [Input String Syntax](#input-string-syntax)
  * [Note String Syntax](#note-string-syntax)
  * [Chord String Syntax](#chord-string-syntax)
  * [Guitar String Syntax](#guitar-string-syntax)
* [Using Note Config Functions (used in drawNote methods)](#)
* [API Reference](#api-reference)
  * [Standard Staff Class](#standardstaff-class)
  * [Scrolling Staff Class](#scrollingstaff-class)
  * [Rhythm Staff Class](#rhythmstaff-class)
  * [Guitar Chords Class](#guitarchord-class)
* [Configuration Options](#configuration-options)
  * [Standard Staff](#standardstaffoptions)
  * [Scrolling Staff](#scrollingstaffoptions)
  * [Rhythm Staff](#rhythmstaffoptions)
  * [Guitar Chords](#guitarchordoptions)
* [Resources](#resources)

## Features

**Rendering Standard Musical Notation**
* Supports grand, treble, bass, and alto clefs.
* Easy to add notes and provides justifying alignment functions.
* Simple single line staff for display chords, notes, or scales.

**Render and Display Guitar Chords**
* Write explicitly which string, fret, and optionally finger to display on the diagram.
* Supports barre chords.
* Label each string below diagram, useful for showing tuning of chord.

**Extra Classes**
* Dedicated staff for rhythm exercises with customizable time signatures and bar handling.
* Staff made to allow for 'endless' style of notes.

## Usage

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

## Core Classes Examples

### Standard Staff
```ts
const staff = new StandardStaff(containerRoot, options);

staff.drawNote("C4", options);

staff.drawChord(["G3", "C4", "E4"], "q", options);
staff.drawRest("q", options);

staff.drawBeam([
  noteConfig("C4e"),
  noteConfig("E4e"),
  noteConfig("G4e"),
], options);
```
<img src="https://raw.githubusercontent.com/DrakeB1234/VectorScore/master/public/StandardStaff.webp" width="400" alt="StandardStaff">

### Scrolling Staff
```ts
function handleNotesOut() {
  console.log("All Done!");
}

const staff = new ScrollingStaff(containerRoot, {
  ...options,
  onNotesOut: handleNotesOut()
});

staff.queueNotes([
  noteConfig("C4q."),
  chordConfig(["D4", "F#4", "A4"], "q"),
  restConfig("s"),
  beamConfig([
    noteConfig("C4e"),
    noteConfig("E4e"),
    noteConfig("F4e"),
  ]);
]);

staff.advanceNotes();
```

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
<img src="https://raw.githubusercontent.com/DrakeB1234/VectorScore/master/public/RhythmStaff.webp" width="400" alt="RhythmStaff">

### Guitar Chords
```ts
const chordsSection = new GuitarChords(containerRoot, options);

chordsSection.addChord("xx0232", "000132", {
  label: "D",
});

// Bbmaj7 Barre Chord (Automatically calculates the starting fret and barre positioning)
const frets = "687766";
const fingers = "142311";
const barres = chordsSection.determineBarreOptions(frets, fingers, [6]);

chordsSection.addChord(frets, fingers, {
  label: "Bbmaj7",
  barres: barres,
});
```
<img src="https://raw.githubusercontent.com/DrakeB1234/VectorScore/master/public/GuitarChords.webp" width="400" alt="GuitarChords">

## CSS Classes & Theming
All core classes uses CSS classes for styling. All elements that can be targeted for theming are prefixed with `vs`.

VectorScore as of the latest release ***does not*** contain pre-made stylesheets, all styling must be done in a custom-made stylesheet using the class selectors below...

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

## Input String Syntax

### Note String Syntax
Typical note string to draw (i.e. MusicStaff.drawNote). For example `C4q` would be a 'C' note on the fourth octave '4' and of quarter duration 'q'.

Variations could be `C#4q.`, where the '#' is a sharpened note and the 'q.' reprsents a dotted quarter duration.

### Chord String Syntax
Similar to note string syntax, however durations are not defined in the string and instead defined as a separate parameter.

Examples for a eighth beat C major chord would be `C4, E4, G4` and `e`

### Guitar String Syntax

Chords are defined using two strings: one for **frets** and one for **fingers**. The length of both strings must match the configured string count of the diagram (default is 6). Notes are written in ***string order***, with the first character representing the lowest string (e.g. low E in standard tuning).

Frets are defined in a few ways: either `x` for a muted string, `0` for open string, `1-9...a-z` for exact fret number. As a note, frets numbers are in Base-36 alphanumeric encoding, meaning numbers past '9' use letters, e.g. `a == 10, b == 11, ...`.

Fingers only support numbers `1-9`, with `0` being used to define no finger.

Barres require more specific defintion. Barres are defined in the `barres` property in GuitarChordDrawOptions in the `addChord` method. The `barres` property is typed as BarreDef[]. The recommended way to define barres is to use GuitarChord member method `determineBarreOptions` to automatically create this option.

Code example for making a **F Major barre chord**
```ts
const guitarInstance = new GuitarChords(element, options);

const frets = "133211";
const fingers = "134211";

// the '1' value in the array means that there is one barre on the first fret.
const barreDef: GuitarBarreDef[] = guitarInstance.determineBarreOptions(frets, fingers, [1]);

addChord(frets, fingers, {
  label: "F Major",
  barres: barreOptions
});
```
Code example for making a **D Major chord**
```ts
const frets = "xx0232";
const fingers = "000132";

// No barre options needed
addChord(frets, fingers, {
  label: "D Major"
});
```

## API Reference

### StandardStaff Class

* `drawNote(note: string, options?: DrawOptions)`
  * Draws a single note `(ex. "C4q")` and advances the layout cursor.
  * @Returns: The index of the entry.
* `drawChord(notes: string[], duration: string, options?: DrawOptions)`
  * Draws a chord of provided notes and duration.
  * @Returns: The index of the entry.
* `drawBeam(entries: BeamableConfig[], options?: DrawOptions)`
  * Draws a grouped beam of notes.
  * @Returns: The index of the entry.
* `drawBarline(options?: DrawOptions)`
  * Draws a barline across the staff on the next staff position.
  * @Returns: The index of the entry.
* `drawBatchElements(items: { config: StandardStaffDrawConfig; options?: DrawOptions }[])`
  * Draws multiple elements in one method.
* `replaceByIndex(index: number, config: ReplaceConfig, options?: DrawOptions)`
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
  * @Returns: `{ x: number, y: number, isTopStaff: boolean }`
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

## Configuration Options

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

## Resources

VectorScore utilizes a modified, svg-ified, version of the [**Leland Font**](https://github.com/MuseScoreFonts/Leland/tree/main), A SMuFL-compliant OpenType music font used by Musescore. Previous versions of VectorScore utilized the [Bravura Font](https://github.com/steinbergmedia/bravura).

VectorScore is heavily insipired by [**VexFlow**](https://github.com/0xfe/vexflow), a full musical notation web renderer. 

[**Musescore**](https://musescore.org/en)'s studio application was used heavily as a reference, mainly for matching musical notation.