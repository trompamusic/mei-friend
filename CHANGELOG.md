# 0.1.0 - First Release
* Initial commit to test Verovio import.
## 0.1.3 - Patch
* Verovio import for version 3.0.2 fixed with runtime loader.
# 0.2.0 - First version of MEI friend uploaded
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
* Help panel added and reachable through `?`
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
* MEI code is identified by presence of `<mei` tag rather than file extension
* With a selected control element, navigation will continue at `@startid` element
* Known limitation: control elements with @tstamp/@staff are not covered
# 0.3.0 - Minor update speed improvements
* Introducing speed mode to reduce reaction time for page change and after
editing operations (currently only for `breaks=line,encoded`)
* Addresses #5 to include repetition symbols in navigation
## 0.3.1 - Patch
* Support for time spanning elements with `@start/endid` in speed mode
* Issue with page disappearing in speed mode and `breaks=line` fixed
* scoreDef updated for meter@count/@unit in speed mode (`tstamp/2` now correctly rendered)
## 0.3.2 - Patch
* Support for meter@count/@unit within scoreDef per staff in speed mode
* MusicXML conversion key binding
* Auto update always enabled in speed mode
* Sort selected elements by score times
## 0.3.3 – Patch
* Font dropdown selector added
* Filter selected elements to keep highest in DOM hierarchy
## 0.3.4 - Patch
* Clean `@accid.ges` when `@accid` is present (`SHIFT + C`)
* Support for deleting control elements (`BACKSPACE` or `DELETE`)
## 0.3.5 - Patch
* Check measure renumbering with `SHIFT + R` (results to console, no action)
* Execute measure renumbering with `CTRL-SHIFT + R`
* Support for inverting `@artic` placement within chords
* Support for toggling articulation on notes/chords through key bindings (staccato, staccatissimo, tenuto, accent, marcato)
* Support for pitch shifting of rest, mRest, multiRest, note
* Support for moving notes, chords, rests across staves
## 0.3.6 - Patch
* Fix issue on undefined editor
## 0.3.7 - Patch
* Address invert placement in speed mode (`issue #9`)
## 0.3.8 - Patch
* Address issue on editor tablength function.
## 0.3.9 - Patch
* Remove tablength() calls
* Occasional ghost slurs in speed mode fixed
# 0.4.0 - Minor update
* Support for inserting and deleting beams on selected notes/chords sharing
identical parent (`B`, `DELETE`)
## 0.4.1 - Patch
* Select tuplet via tuplet number
* Invert tuplet number placement (`@num.place`) with `X` when selected
* Support for inserting octave element from first selected note to last (8 or 15 tones, above or below)
* Support for deleting octave element (resets note `@oct` and `@oct.ges` in between)
## 0.4.2 - Patch
* range in speed.js line 440 secured
## 0.4.3 - Patch
* Editor positioning errors fixed
## 0.4.4 - Patch
* Several editing bugs addressed
## 0.4.5 - Patch
* Fix error in addressing nodeLists at inserting and deleting beams
# 0.5.0 - Minor updated
* Animated GIF added to readme show-casing main functionality
## 0.5.1 - Patch
* Fix for #11 to update current page counter with zooming
## 0.5.2 - Patch
* Keyboard shortcuts and wheel interaction for zooming in and out (similar to
  typical browser behavior)
* Keyboard shortcuts for page turning (next, previous, first, last), similar to browser conventions
## 0.5.3 - Patch
* Fix zoom button bug
## 0.6.0 - Minor
* Navigation through notes/rests in SVG (addresses #4)
* Support for Verovio 3.7 (using SVG data-* tags)
