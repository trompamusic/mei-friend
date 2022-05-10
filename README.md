# mei-friend package for Atom

This package is an Atom version of the [mei-friend web application](https://mei-friend.mdw.ac.at/). 

This package for the Atom editor is a friendly companion that helps you
edit and improve digital score encodings in [MEI format](https://music-encoding.org/).
It makes extensive use of the fantastic engraving engine
[Verovio](https://www.verovio.org/).
This package started on the code of the [mei-tools-atom package](https://atom.io/packages/mei-tools-atom)
by Sienna M. Wood and the [nCoda](https://ncodamusic.org/) team.

![Animated screenshot of mei-friend](https://github.com/trompamusic/mei-friend/blob/master/screenshots/MEI-Friend.gif)

## Current Features
### Display
- As-you-type rendering of MEI into music notation with _[Verovio](http://www.verovio.org/)_.
- Scale notation (zoom in or out) for ease of viewing (CMD/CTRL +/– or with CMD/CTRL mouse wheel).
- Update notation to current cursor position in MEI encoding.
- Breaks options (automatic system breaks, encoded system breaks, encoded system and page breaks, none).
- Music font drop down selector.
- Element under cursor in MEI code is highlighted in notation window
    - This feature works by matching `xml:id`s, so if you have no `xml:id`s on your elements you will have no highlighting in your notation.
    - If the current element has no `xml:id`, the parent `<staff>` and then `<measure>` will be checked for an `xml:id` and will be highlighted if one is found.
- Click on a note or other rendered notation element to take the cursor to the associated place in the MEI code
    - Relies on `xml:id`s, so elements without `xml:id`s do not provide this feature.
    - Select one or more elements in the Verovio panel (`CTRL + click` for multiple notes, Mac OSX: `CMD + click`).
    - Select chord instead of note with `ALT` + click.
- Refactor the MEI encoding by running it through Verovio, adding `xml:id`s to elements without `id`s (or optionally removing all unused `id`s with `ALT` ).
- **Speed mode** checkbox: only the visible page is sent to Verovio to improve GUI responsiveness and reduce rendering duration. Works currently only with the `breaks` option set to `System` (`line`) and `Page and System` (`encoded`). (Known issues are: time spanning elements with `@tstamp`s reaching into or out from current page and all time spanning elements starting before and ending after the current page are not shown.)
- Show/hide help panel with all keyboard shortcuts (`?`)
- Navigation within the notation window by arrow keys (combined with CMD and CTRL for measure-wise and page-wise stepping).
- Page navigation with keyboard shortcuts (`SPACE`, `PAGEDOWN`: next page; `SHIFT-SPACE`, `PAGEUP`: previous page; `HOME`, `CMD/CTRL + UP`: first page; `END`, `CMD/CTRL + DOWN`: last page)

### Editing functionality
- Insert **slur** (`S`), **tie** (`T`) with placement above by default or below with `CTRL`.
- Insert **hairpin** spanning two selected notes (`H` crescendo, `SHIFT H` decrescendo).
- Insert **glissando** (`G`), **arpeggio** (`A`) at selected notes.
- Insert **fermata** to selected note (`F` above by default, below and inverted with `CTRL`).
- Insert **directives** (`I`), **dynamics** (`D`), **tempo indications** (`T`) to selected notes (above by default, below with `CTRL`).
- Insert **pedal** down (`P`) or up (`CTRL P`).
- Insert **turn**, **mordent** (non-default forms with `SHIFT`, above by default, below with `CTRL`).
- Insert **trill** (with `@extender="true"`, if two notes selected, above by default, below with `CTRL`).
- Insert **beam** on selected notes with identical parent (two selected notes sufficient)
- Insert **octave** element from first selected note to last selected note within same staff (`O` 8 tones above, `CTRL O` 8 tones below, `ALT O` 15 tones above, `ALT CTRL O` 15 tones below)
- Invert placement (above/below) (`@place` for accid, artic, dir, dynam, etc.) and curvature (for slur, tie, etc.) (`X`).
- Invert `@stem.dir` (up/down) for selected notes/chords or elements containing those, e.g., beams (`X`).
- Invert `@num.place` (above/below) for selected **tuplet numbers** (`X`)
- Delete **control elements** with `BACKSPACE` or `DELETE` key (and `accid`, `artic`, `clef`).
- Delete selected **beam** (`BACKSPACE` or `DELETE`)
- Delete **octave** element (`BACKSPACE` `DELETE`), resets notes between `@startid` and `@endid`
- Toggle (add/remove) **articulation** on notes, chords, beams:
    - staccato `SHIFT S`
    - tenuto `SHIFT T`
    - marcato `SHIFT O`
    - accent `SHIFT V`
    - staccatissimo `SHIFT I`
- Move rests (`rest`, `mRest`, `multiRest`) and notes up/downwards (`SHIFT + up/down`, `CMD/CTRL + SHIFT + up/down`)
- Move notes, chords, rests to next staff above/below (`ALT + CMD/CTRL + UP/DOWN`)

### Code manipulation utilities
- Remove `@accid.ges` when `@accid` is present (`SHIFT + C`)
- Renumber measures (counts successive measures with `@metcon="false"` as one, counts multiple endings with same numbering, does not increment at measures with invisible right bar line)
  * Test renumbering `SHIFT + R`, output to console, no manipulation done.
  * Execute renumbering `CTRL-SHIFT + R`

## Installation
This package is [published to the official Atom registry](https://atom.io/packages/mei-friend)
and can be installed by following their [general instructions](https://flight-manual.atom.io/using-atom/sections/atom-packages/).
If prompted to install dependencies, click 'yes' and allow installation to complete.

Once installed, use the package by following these steps:
1. Launch Atom and open an MEI file (menu item File > Open...).
    - [Example encodings Beethoven WoO57 Andante favori](https://github.com/trompamusic-encodings/Beethoven_WoO57_BreitkopfHaertel/raw/master/Beethoven_WoO57-Breitkopf.mei)
    - [TROMPA Music Encodings in MEI 4.0.1](https://github.com/trompamusic-encodings)
1. To display the notation, use the menu item Packages > MEI Friend > Show/Hide Notation, or  press `Alt Cmd M` (Mac), or `Alt Win M` (Windows, Linux).

## Validating your MEI encoding
Only valid MEI can be rendered into notation with _[Verovio](http://www.verovio.org/)_.
To ensure your MEI is valid, an XML validation package is recommended.  

## Acknowlegements
This package started on the code of the `mei-tools-atom` package by Sienna M. Wood and the [nCoda](https://ncodamusic.org/) team. Thanks to Laurent Pugin and the MEI community for [all their work on _Verovio_](https://github.com/rism-digital/verovio). Thanks also to Laurent for making _Verovio_ available as a Node package and for constant basic support on Verovio.
