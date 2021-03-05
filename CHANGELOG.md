## 0.1.0 - First Release
* Initial commit to test Verovio import.
## 0.1.3 - Patch
* Verovio import for version 3.0.2 fixed with runtime loader.
## 0.2.0 - First version of MEI friend uploaded
* Score display using current Verovio
* Arrow key bindings for navigating within notation display (verovio panel)
* Note-, measure, and page-wise backwards and forwards scrolling
* Up- and down-scrolling through layers
* Selector for breaks options added (auto, line, encoded, none)
* addSlur/addTie to insert MEI code rather than to act on vrvToolkit
## 0.2.3 - Patch
* Simple insert commands added (slur, tie, hairpin)
## 0.2.4 - Patch new functionality
* Night mode (inverted colors of notation) added
* Help panel added and reachable through `?``
## 0.2.5 - Patch, new functionality
* Insert several control elements (slur, tie, cres/dim hairpin, fermata)
* Insert directives, dynamics, tempo indications
* Insert arpeggio, glissando, pedal up/down
* Validate selected elements before inserting MEI code
## 0.2.6 - Patch, new functionality
* Insert turn, mordent (non-default forms with SHIFT)
* Insert trill (with extender, if two notes selected)
* Notation colors independent of theme
## 0.2.7 - Patch, OS support
* Different key maps depending on OS
## 0.2.8 - Patch
* Menu tooltips fixed, update toggle with refresh, icon changed
* Deserializer error worked-around
## 0.2.9 - Patch
* Fix jquery import
## 0.2.10 - Patch
* Repo moved to github/trompamusic
* Breaks options retrieved automatically from vrvToolkit
## 0.2.11 - Patch
* Invert att.placement (dir, dynam, trill, ...), att.curvature (slur, tie, ...)
* Click select multiple with CTRL (Windows, Linux, ...) or CMD (Mac)
* ALT + click select chord instead of note
* Invert `att.stems` (note, chord, ambNote) on selected notes, chords, or
elements containing those
## 0.2.12 - Patch
* Use current edit functionality of Verovio (experimental)
* Implement CTRL + X to set @place="between" (not correctly implemented)
## 0.2.13 - Patch
* Deactivate CTRl + X
## 0.2.14 - Patch
* fix updating issues
## 0.2.15 - Patch
* MEI code is identified by presence of <mei tag rather than file extension
* With a selected control element, navigation will continue at @startid element
* Known limitation: control elements with @tstamp/@staff are not covered
## 0.3.0 - Minor update speed improvements
* Introduce speed mode to speed up reaction time for page change and after
editing operations (only for `breaks=line,encoded`)
* Addresses #5 to include repetitions symbols in navigation
## 0.3.1 - Patch
* Support for time spanning elements with `@start/endid` in speed mode
* Issue with page disappearing in speed mode and `breaks=line` fixed
