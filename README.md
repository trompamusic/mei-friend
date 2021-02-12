# mei-friend package for Atom

This package for the Atom editor will grow into a friendly companion that helps you
edit and improve digital score encodings in [MEI format](https://music-encoding.org/).
It makes extensive use of the fantastic engraving engine
[Verovio](https://www.verovio.org/).
This package started on the code of the [mei-tools-atom package](https://atom.io/packages/mei-tools-atom)
by Sienna M. Wood and the [nCoda](https://ncodamusic.org/) team.

__This package is currently under development__.  


## Current Features
### Display
- As-you-type rendering of MEI into music notation with _[Verovio](http://www.verovio.org/)_.
- Scale notation (zoom in or out) for ease of viewing.
- Update notation to current cursor position in MEI encoding.
- Breaks options (automatic system breaks, encoded system breaks, encoded system and page breaks, none).
- Element under cursor in MEI code is highlighted in notation window
    - this feature works by matching `xml:id`s, so if you have no `xml:id`s on your elements you will have no highlighting in your notation.
    - if the current element has no `xml:id`, the parent `<staff>` and then `<measure>` will be checked for an `xml:id` and will be highlighted if one is found.
- Click on a note or other rendered notation element to take the cursor to the associated place in the MEI code
    - also relies on `xml:id`s, so elements without `xml:id`s do not provide this feature.
- Refactor the MEI encoding by running it through Verovio, adding `xml:id`s to elements without `id`s.

### Editing functionality
- Navigation within the notation window by arrow keys (combined with CMD and CTRL for measure-wise and page-wise stepping).
- Select one or more elements in the Verovio panel (CTRL + click for multiple notes, Mac OSX: CMD + click).
- Select chord instead of note with ALT + click.
- Insert slur, tie (with placement above by default or below with CTRL).
- Insert crescendo hairpin or diminuendo hairpin to two selected notes.
- Insert glissando, arpeggio elements at selected notes.
- Insert fermata to selected note (above by default or below and inverted with CTRL).
- Insert directives, dynamics, tempo indications to selected notes (above by default or below with CTRL).
- Insert pedal up/down.
- Insert turn, mordent (non-default forms with SHIFT).
- Insert trill (with extender, if two notes selected).
- Invert placement (for accid, artic, dir, dynam, etc.) and curvature (for slur, tie, etc.).
- Invert stem.dir for selected notes/chords or elements containing those (X).

## Installation
This package is [published to the official Atom registry](https://atom.io/packages/mei-friend)
and can be installed by following their [general instructions](https://flight-manual.atom.io/using-atom/sections/atom-packages/).
If prompted to install dependencies, click 'yes' and allow installation to complete.

Once installed, use the package by following these steps:
1. Launch Atom and open an MEI file (menu item File > Open...).
    - [Example encodings Beethoven WoO57 Andante favori](https://github.com/trompamusic-encodings/Beethoven_WoO57_BreitkopfHaertel/raw/master/Beethoven_WoO57-Breitkopf.mei) – save with the `.mei` extension
    - [TROMPA Music Encodings in MEI 4.0.1](https://github.com/trompamusic-encodings)
1. To display the notation, use the menu item Packages > MEI Friend > Show/Hide Notation, or  press `Alt Cmd M` (Mac), or `Alt Win M` (Windows, Linux).

## Validating your MEI encoding
Only valid MEI can be rendered into notation with _[Verovio](http://www.verovio.org/)_.
To ensure your MEI is valid, an XML validation package is recommended.  
[linter-autocomplete-jing](https://github.com/aerhard/linter-autocomplete-jing)
was designed for use with TEI and MEI, so I recommend starting there.  
Please note that [linter-autocomplete-jing](https://github.com/aerhard/linter-autocomplete-jing)
requires Java Runtime Environment (JRE) v1.6 or above.
[Visit the package repository](https://github.com/aerhard/linter-autocomplete-jing) for details.

## Acknowlegements
This package started on the code of the mei-tools-atom package by Sienna M. Wood and the [nCoda](https://ncodamusic.org/) team. Thanks to Laurent Pugin and the MEI community for [all their work on _Verovio_](https://github.com/rism-ch/verovio). Thanks also to Laurent for making _Verovio_ available as a Node package and for constant basic support on Verovio.
