<div align="center" style="background-color: white;">
  <img src="https://raw.githubusercontent.com/DrakeB1234/VectorScore/master/public/vector-score-icon.svg" alt="Vector Score Logo" />
</div> 

## Vector Score
![NPM Version](https://img.shields.io/npm/v/vector-score)
[![Bundlephobia](https://img.shields.io/bundlephobia/minzip/vector-score)](https://bundlephobia.com/package/vector-score)
![NPM Downloads](https://img.shields.io/npm/d18m/vector-score)
[![Github Repo](https://img.shields.io/badge/github-repo-blue?logo=github)](https://github.com/DrakeB1234/VectorScore)

A lightweight, SVG-based TypeScript library for rendering simple musical notation, rhythms, and guitar chords. This project aims to provide a simple to use renderer for web-based musical apps.

## Table of Contents

* [Features](#features)
* [Install](#install)
* [Usage](#usage)
* [Core Classes Examples](#core-classes-examples)
  * [Standard Staff](#standard-staff)
  * [Scrolling Staff](#scrolling-staff)
  * [Rhythm Staff](#rhythm-staff)
  * [Guitar Chords](#guitar-chords)
* [Styling / Theme Guide](#css-classes--theming)
* [Drawing Elements](#drawing-elements)
  * [Individual Elements](#drawing-individual-elements)
  * [Batch of Elements](#drawing-batch-of-elements)
* [Input String Syntax](#input-string-syntax)
  * [Note String Syntax](#note-string-syntax)
  * [Chord String Syntax](#chord-string-syntax)
  * [Guitar String Syntax](#guitar-string-syntax)
* [Using Note Config Functions (used in drawNote methods)](#using-note-config-functions)
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
* [Migration from 1.3.1 to 2.0](#migrating-from-131)
* [Resources](#resources)

## Features

**Rendering Standard Musical Notation**
* Supports grand, treble, bass, and alto clefs.
* Easy to add notes and provides justifying alignment functions.
* Notes can be drawn with accidentals, dotted durations, and articultations.
* Beamed notes are supported, with option for notes or chords.

**Render and Display Guitar Chords**
* Write explicitly which string, fret, and optionally finger to display on the diagram.
* Supports barre chords.
* Label each string below diagram, useful for showing tuning of chord.

**Extra Classes**
* Dedicated staff for rhythm exercises with customizable time signatures and bar handling.
* Staff made to allow for 'endless' style of notes.

## Install

```bash
npm install vector-score
```

## Usage

### 1. Setup HTML
Create a container element in your HTML where the staff will be rendered.

```html
<div id="staff-container"></div>
```

### 2. Import and Initialize
Import desired class (StandardStaff, GuitarChord, etc.). Declare variable with reference to container element. Pass in options for specific class (options are typed).

```ts
import { StandardStaff } from 'vector-score';

const containerRoot = document.getElementById('staff-container') as HTMLElement;

const staff = new StandardStaff(containerRoot, {
  staffType: 'grand',
  width: 400,
  scale: 1.2,
  keySignature: "Bb",
});
```

## Core Classes Examples

### Standard Staff
```ts
import { StandardStaff, noteConfig, chordConfig } from "vector-score";

const staff = new StandardStaff(containerRoot, options);

staff.drawNote("C4w", options);
staff.drawNote("C4q", {
  articulation: "staccato"
});

staff.drawChord(["G3", "C4", "E4"], "q", options);
staff.drawRest("q", options);

staff.drawBeam([
  noteConfig("C4e", "staccato"),
  chordConfig(["E4", "G4"], "e", "staccato"),
], options);
```
<img src="https://raw.githubusercontent.com/DrakeB1234/VectorScore/master/public/StandardStaff.webp" width="500" alt="StandardStaff">

### Scrolling Staff
```ts
import { ScrollingStaff, noteConfig, chordConfig, restConfig, beamConfig } from "vector-score";

function handleNotesOut() {
  console.log("All Done!");
}

const staff = new ScrollingStaff(containerRoot, {
  ...options,
  onNotesOut: handleNotesOut
});

staff.queueNotes([
  noteConfig("C4q."),
  chordConfig(["D4", "F#4", "A4"], "q"),
  restConfig("s"),
  beamConfig([
    noteConfig("C4e"),
    noteConfig("E4e"),
    noteConfig("F4e"),
  ])
]);

staff.advanceNotes();
```

### Rhythm Staff
```ts
import { RhythmStaff } from "vector-score";

const staff = new RhythmStaff(containerRoot, options);

staff.drawMeasure([
  { type: "beam", durations: "eeee" },
  { type: "rest", duration: "h" },
]);

staff.drawMeasure([
  { type: "note", duration: "q" },
  { type: "rest", duration: "e" },
  { type: "beam", durations: "ee" },
  { type: "rest", duration: "q." },
]);
```
<img src="https://raw.githubusercontent.com/DrakeB1234/VectorScore/master/public/RhythmStaff.webp" width="500" alt="RhythmStaff">

### Guitar Chords
```ts
import { determineBarreOptions, GuitarChord } from "vector-score";

const chordsSection = new GuitarChord(containerRoot, options);

chordsSection.addChord("xx0232", "000132", {
  label: "D",
});

// Bbmaj7 Barre Chord (Automatically calculates the starting fret and barre positioning)
const frets = "687766";
const fingers = "142311";
const barres = determineBarreOptions(frets, fingers, [6]);

chordsSection.addChord(frets, fingers, {
  label: "Bbmaj7",
  barres: barres,
});
```
<img src="https://raw.githubusercontent.com/DrakeB1234/VectorScore/master/public/GuitarChords.webp" width="500" alt="GuitarChords">

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
  .vs-brace {}

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

  .vs-guitar-group-guitar-group-barre {}
  .vs-guitar-group-guitar-barre {}
  
```

## Drawing Elements

### Drawing individual elements
Notes, chords, rests, beams and barlines can each be described two ways. Draw methods accept either, and the result is identical.

| Element | String | Config object |
|---|---|---|
| Note | `"C4q"`, `"F#5e.(staccato)"` | `noteConfig({ letter: "C", octave: 4, duration: "q" })` |
| Chord | `"[C4,E4,G4]q"` | `chordConfig({ notes: [{ letter: "C", octave: 4 }, ...], duration: "q" })` |
| Rest | `"q"`, `"Rq."` | `restConfig({ duration: "q" })` |
| Beam | `"C4e-D4e-[E4,G4]e"` | `beamConfig({ entries: [noteConfig(...), ...] })` |
| Barline | `staff.drawBarline()` | `{ type: "barline" }` |

```ts
import { StandardStaff, noteConfig, chordConfig } from "vector-score";

const staff = new StandardStaff(container, { staffType: "grand", width: 500 });

// Strings; quick and easy to work with
staff.drawNote("C4q");
staff.drawChord("[G3,C4,E4]h.(accent)");
staff.drawBeam("C4e-D4e-E4e-F4e");

// Config objects; good for generated or dynamic data
staff.drawNote(noteConfig({ letter: pitch.letter, octave: pitch.octave, duration: "q" }));
```

### Drawing batch of elements
With the `drawBatchElements()` method, using similar syntax above, multiple elements can be draw in a single string argument. However, config objects are the only way to define per element options (staff direction, classes)

```ts
import { StandardStaff, noteConfig, chordConfig } from "vector-score";

const staff = new StandardStaff(container, { staffType: "grand", width: 500 });

staff.drawBatchElements("C4w B#4q.(staccato) | [B4,D5,F5]q(fermata) | rt rq. rh | C4e(staccato)-[E4,G4,A5]e(tenuto)-G4s(staccato)");

staff.drawBatchElements([
  { config: drawNote({ letter: "C", octave: 4 }), options: { staff: "bottom", classes: ["wrong-note"] } },
  { config: drawNote({ letter: "B", accidental: "#", octave: 4 }), options: { classes: ["correct-note"] } },
  { type: "barline" },
  { config: drawChord(...) },
])
```

## Input String Syntax

### Note String Syntax
Typical note string to draw (i.e. StandardStaff.drawNote). For example `C4q` would be a 'C' note on the fourth octave '4' and of quarter duration 'q'.

* Letters: A-G (any case)
* Accidental: #, b, n, ##, bb
* Octave: 0-9
* Durations: w, h, q, e, s, t 
* Dotted: . *optional*
* Articulation: (staccacto) *optional*

Variations could be `C#4q.`, where the '#' is a sharpened note and the 'q.' reprsents a dotted quarter duration.

Example with all parameters `C#4q.(fermata)`

### Chord String Syntax
Similar to note string syntax, however durations are not defined in the string and instead defined as a separate parameter.

Examples for a eighth beat C major chord would be `["C4", "E4", "G4"]` and `"e"`

### Guitar String Syntax

Chords are defined using two strings: one for **frets** and one for **fingers**. The length of both strings must match the configured string count of the diagram (default is 6). Notes are written in ***string order***, with the first character representing the lowest string (e.g. low E in standard tuning).

Frets are defined in a few ways: either `x` for a muted string, `0` for open string, `1-9...a-z` for exact fret number. As a note, frets numbers are in Base-36 alphanumeric encoding, meaning numbers past '9' use letters, e.g. `a == 10, b == 11, ...`.

Fingers only support numbers `1-9`, with `0` being used to define no finger.

Barres require more specific defintion. Barres are defined in the `barres` property in GuitarChordDrawOptions in the `addChord` method. The `barres` property is typed as GuitarBarreDef[]. The recommended way to define barres is to use helper `determineBarreOptions` to automatically create this option.

Code example for making a **F Major barre chord**
```ts
import { determineBarreOptions, GuitarChord } from "vector-score";

const guitarInstance = new GuitarChord(element, options);

const frets = "133211";
const fingers = "134211";

// The array holds the fret numbers to barre.
const barreDef: GuitarBarreDef[] = determineBarreOptions(frets, fingers, [1]);

guitarInstance.addChord(frets, fingers, {
  label: "F Major",
  barres: barreDef
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

## Using Note Config Functions

Some drawing methods (such as drawBatchElements in StandardStaff) take in config objects to define which to draw. VectorScore uses helpers to create these configs in a much more convient manner.

###### *Note: Valid articulation values are 'staccato', 'tenuto', 'accent', 'marcato', and 'fermata'.

###### **Note: Please follow the section in this read me titled 'Input String Syntax' for proper string values.

Config Helpers

* `noteConfig(note: string, articulation?: string)`
* `chordConfig(notes: string[], duration: string, articulation?: string)`
* `restConfig(duration: string)`
* `beamConfig(entries: BeamableConfig[])`
  * Note: `BeamableConfig[]` is just a array of configs, which can be created with the above functions.

Example using config functions to draw notes to StandardStaff
```ts
import {noteConfig, chordConfig, restConfig, beamConfig, StandardStaff } from "vector-score";

const staff = new StandardStaff(rootEle, options);

const note = noteConfig("A3q", "tenuto");
const note2 = noteConfig("C4q.");
const chord = chordConfig(["C4", "E4"], "q", "accent");
const rest = restConfig("h");

const beamNote = noteConfig("A3e", "staccato");
// Uses const 'beamNote' for easy reusing of config objects.
const beam = beamConfig([
    beamNote,
    chordConfig(["C4", "E4"], "e"),
    beamNote
]);

staff.drawBatchElements([
  { config: note, options: { staff: "bottom", classes: ["my-note"] } },
  { config: chord },
  { config: rest },
  { config: beam }
]);
```

## API Reference

### StandardStaff Class

* `drawNote(note: string, options?: StandardStaffDrawOptions)`
  * Draws a single note `(ex. "C4q")` and advances the layout cursor.
  * @Returns: The index of the entry.
* `drawChord(notes: string[], duration: string, options?: StandardStaffDrawOptions)`
  * Draws a chord of provided notes and duration.
  * @Returns: The index of the entry.
* `drawBeam(entries: BeamableConfig[], options?: StandardStaffDrawOptions)`
  * Draws a grouped beam of notes.
  * @Returns: The index of the entry.
* `drawBarline(options?: StandardStaffDrawOptions)`
  * Draws a barline across the staff on the next staff position.
  * @Returns: The index of the entry.
* `drawBatchElements(items: { config: StandardStaffDrawConfig; options?: StandardStaffDrawOptions }[])`
  * Draws multiple elements in one method.
* `replaceByIndex(index: number, config: StandardStaffDrawConfig, options?: StandardStaffDrawOptions)`
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
* `removeChordByIndex(chordIndex: number)`
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
* `timeSignature: { topNumber, bottomNumber }`: Time signature to display on the staff.

### ScrollingStaffOptions
* All options in StandardStaffOptions **AND**
* `onNotesOut`: Callback function for when there are no more notes on the staff to advance.

### RhythmStaffOptions
* `width`: Total width of the SVG in pixels.
* `scale`: Zoom factor (default: 1).
* `padding`: Padding for both sides of staff (in pixels).
* `svgAutoFill`: Sets inline styles on root SVG element to allow for screen scaling (default: true).
* `maxMeasures`: Allowed amount of measures on staff (default: 2).
* `topNumber`: Top number on time signature (default: 4).
* `bottomNumber`: Bottom number on time signature (default: 4).

### GuitarChordOptions
* `stringCount`: Amount of strings to show in diagram, default is 6.
* `fretCount`: Amount of frets to show in diagram, default is 5.
* `stringLabels`: Labels to show under each string in each chord diagram. Provided string values will display in order of strings in this array value.
* `inlineChordsAmount`: Max amount of chords to display on a single line (default: 2).
* `centerChords`: Boolean to center the chord diagrams on their respective rows (default: true).
* `scale`: Zoom factor (default: 1).
* `width`: Total width of the SVG in pixels, overrides inlineChordAmount auto width calculation (default: undefined).
* `svgAutoFill`: Sets inline styles on root SVG element to allow for screen scaling (default: true).

## Migrating from 1.3.1

| 1.x | 2.0 |
|---|---|
| `import { MusicStaff }` | `import { StandardStaff }` |
| `drawNote(['C4q', 'D4q'])` (string or array) | `drawNote("C4q")`, one note per call, returns the entry index. Use `drawBatchElements` for many. |
| `drawChord(['C4w','E4w','G4w'])` (durations inside the strings) | `drawChord(["C4","E4","G4"], "w")` (duration is a separate argument) |
| `changeNoteByIndex(note, index)` / `changeChordByIndex(notes, index)` | `replaceByIndex(index, config)` with `noteConfig(...)` / `chordConfig(...)` (index comes first) |
| `spaceAbove` / `spaceBelow` (staff-line spaces) | `paddingTop` / `paddingBottom` (pixels; one staff space is 10px) |
| `staffColor` / `staffBackgroundColor` | Removed. Drawing uses `currentColor`, so set CSS `color` / `background`, or target the `.vs-*` classes |
| RhythmStaff `barsCount` | `maxMeasures` (new: `bottomNumber`, `padding`; removed: `currentBeatUIColor`) |
| RhythmStaff `drawNote(['q','q'])`, `drawRest(['h'])`, `drawBeamedNotes('e', 4)` | `drawMeasure([{ type: "note", duration: "q" }, { type: "rest", duration: "h" }, { type: "beam", durations: "eeee" }])` |
| `incrementCurrentBeatUI()` / `resetCurrentBeatUI()` | Removed. Position your own element with `getBeatCoordinateX()` in `uiLayer` |
| RhythmStaff `clearAllNotes()` | `clear()` |
| ScrollingStaff `queueNotes(["C4w", ["C4w","E4w","G4w"]])` | `queueNotes([noteConfig("C4w"), chordConfig(["C4","E4","G4"], "w")])` |
| ScrollingStaff `clearAllNote()` | `clearAllNotes()` |
| CSS `.vs-scrolling-notes-layer > g.vs-note-wrapper` | `.vs-scrolling-notes-layer > g` (groups are now `vs-note`, `vs-chord`, `vs-rest`, `vs-beam`) |

New in 2.0: Leland font glyphs, more accurate notation, rests, beams, barlines, dotted notes, 32nd notes, articulations, time signatures, key signatures, grand-staff brace.

## Resources

VectorScore utilizes a modified, svg-ified, version of the [**Leland Font**](https://github.com/MuseScoreFonts/Leland/tree/main), A SMuFL-compliant OpenType music font used by Musescore. Previous versions of VectorScore utilized the [Bravura Font](https://github.com/steinbergmedia/bravura).

VectorScore is heavily insipired by [**VexFlow**](https://github.com/0xfe/vexflow), a full musical notation web renderer. 

[**Musescore**](https://musescore.org/en)'s studio application was used heavily as a reference, mainly for matching musical notation.