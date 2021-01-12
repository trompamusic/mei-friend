# mei-friend package for Atom

This package for the Atom editor will grow into a friendly companion that helps you
edit and improve digital score encodings in [MEI format](https://music-encoding.org/).
It makes extensive use of the fantastic engraving engine
[Verovio](https://www.verovio.org/).
This package started on the code of the [mei-tools-atom package](https://atom.io/packages/mei-tools-atom)
by Sienna M. Wood and the [nCoda](https://ncodamusic.org/) team.

__This package is currently under development__.  
Contributions are welcome.


## Current Features
- As-you-type rendering of MEI into music notation with _[Verovio](http://www.verovio.org/)_
- Scale notation (zoom in or out) for ease of viewing
- Pagination options (no line breaks, by encoded line breaks, by encoded line and page breaks, auto)
- Element under cursor in MEI code is highlighted in notation window
    - this feature works by matching `xml:id`s, so if you have no `xml:id`s on your elements you will have no highlighting in your notation
    - if the current element has no `xml:id`, the parent `<staff>` and then `<measure>` will be checked for an `xml:id` and will be highlighted if one is found
- Click on a note or other rendered notation element to take the cursor to the associated place in the MEI code
    - also relies on `xml:id`s, so elements without `xml:id`s do not provide this feature
- Navigation within the notation window by arrow keys (combined with CMD and CTRL for measure-wise and page-wise stepping)
- ...more to come...

## Installation
This package is [published to the official Atom registry](https://atom.io/packages/mei-friend)
and can be installed by following their [general instructions](https://flight-manual.atom.io/using-atom/sections/atom-packages/).
If prompted to install dependencies, click 'yes' and allow installation to complete.

Once installed, use the package by following these steps:
1. Launch Atom and open an MEI file (menu item File > Open...).
    - [this is a nice example encoding](https://raw.githubusercontent.com/music-encoding/sample-encodings/master/MEI_3.0/Music/Complete_examples/Chopin_Etude_op.10_no.9.mei) - save with the `.mei` extension (delete anything after `.mei`)
    - [more examples of MEI 3.0 encodings can be found here](https://github.com/music-encoding/sample-encodings/tree/master/MEI_3.0/Music/Complete_examples)
1. To display the notation, use the menu item Packages > MEI Tools > Show/Hide Notation, or simply press `Ctrl Option M` on a Mac, or `Ctrl Alt M` for Windows.

## Validating your MEI encoding
Only valid MEI can be rendered into notation with _[Verovio](http://www.verovio.org/)_.
To ensure your MEI is valid, an XML validation package is recommended.  
[linter-autocomplete-jing](https://github.com/aerhard/linter-autocomplete-jing)
was designed for use with TEI and MEI, so I recommend starting there.  
Please note that [linter-autocomplete-jing](https://github.com/aerhard/linter-autocomplete-jing)
requires Java Runtime Environment (JRE) v1.6 or above.
[Visit the package repository](https://github.com/aerhard/linter-autocomplete-jing) for details.

## Acknowlegements
This package started on the code of the mei-tools-atom package by Sienna M. Wood and the [nCoda](https://ncodamusic.org/) team.   
Thanks to Laurent Pugin and the MEI community for [all their work on _Verovio_](https://github.com/rism-ch/verovio).  
Thanks also to Laurent for making _Verovio_ available as a Node package and for constant basic support on Verovio.
