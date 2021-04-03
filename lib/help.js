'use babel';

let cmdKey = "&#8963;"; // CTRL
let cmd2Key = "&#8997;"; // ALT

if (navigator.appVersion.indexOf("Mac") != -1) {
  cmdKey = "&#8984;"; // CMD
  cmd2Key = "&#8963;"; // CTRL
}

let altKey = "&#8997;"; // ALT


export const helpText = `
  <div class='text-info block'>
    <table>
    <h3 class='text-highlight'>Navigating through notation</h3>
    <tr>
      <td><span class="keyIcon">&rarr;</span></td>
      <td>Select next note, rest, or mRest</td>
    </tr>
    <tr>
      <td><span class="keyIcon">&larr;</span></td>
      <td>Select previous note, rest, or mRest</td>
    </tr>
    <tr>
      <td><span class="keyIcon">${cmdKey}</span><span class="keyIcon">&rarr;</span></td>
      <td>Select note, rest, mRest in next measure</td>
    </tr>
    <tr>
      <td><span class="keyIcon">${cmdKey}</span><span class="keyIcon">&larr;</span></td>
      <td>Selected note, rest, mRest in previous measure </td>
    </tr>
    <tr>
      <td><span class="keyIcon">${cmdKey}</span><span class="keyIcon">${cmd2Key}</span><span class="keyIcon">&rarr;</span></td>
      <td>Select note, rest, mRest in next page</td>
    </tr>
    <tr>
      <td><span class="keyIcon">${cmdKey}</span><span class="keyIcon">${cmd2Key}</span><span class="keyIcon">&larr;</span></td>
      <td>Selected note, rest, mRest in previous page</td>
    </tr>
    <tr>
      <td><span class="keyIcon">&uarr;</span></td>
      <td>Select note, rest, or mRest one layer up</td>
    </tr>
    <tr>
      <td><span class="keyIcon">&darr;</span></td>
      <td>Select note, rest, or mRest one layer down</td>
    </tr>
    </table>
    <table>
      <h3 class='text-highlight'>Selecting elements</h3>
      <tr>
        <td><span class="keyIcon">${cmdKey}</span><span class="keyIcon">click</span></td>
        <td>Select multiple notes by mouse click</td>
      </tr>
      <tr>
        <td><span class="keyIcon">${altKey}</span><span class="keyIcon">click</span></td>
        <td>Select the chord when clicking onto a note</td>
      </tr>
    </table>
  <!--
  </div>
  <div class='text-info block'>
  -->
    <table>
    <h3 class='text-highlight'>Manipulating elements</h3>
    <tr>
      <td><span class="keyIcon">X</span></td>
      <td>Invert att.placement (dir, dynam, trill, ...), att.curvature (slur, tie, ...), att.stems (note, chord)
      from above to below or below to above for selected element</td>
    </tr>
    <!--
    <tr>
      <td><span class="keyIcon">&#8663;</span><span class="keyIcon">X</span></td>
      <td>Set att.placement (dir, dynam, trill, ...) to @place="between" and select staff below or above automatically</td>
    </tr>
    -->
    </table>
  </div>
  <div class='text-info block'>
    <h3 class="text-highlight">Inserting elements</h3>
      <p>Key bindings insert elements above selected note by default and below when pressing
        the <span class="keyIcon">CTRL&nbsp;&#8963;</span> key additionally.
        The elements are inserted using @startid and @endid attributes.
        <!--To insert elements with @tstamp and @tstamp2 attributes,
        use the <span class="keyIcon">ALT &#8997;</span> key additionally.-->
      </p>
    <table>
      <tr>
        <td><span class="keyIcon">&#8679;</span><span class="keyIcon">T</span></td>
        <td>Insert tempo above selected note(s)</td>
      </tr>
      <tr>
        <td><span class="keyIcon">F</span></td>
        <td>Insert fermata above selected note</td>
      </tr>
      <tr>
        <td><span class="keyIcon">I</span></td>
        <td>Insert directive above selected note(s)</td>
      </tr>
      <tr>
        <td><span class="keyIcon">D</span></td>
        <td>Insert dynamics above selected note, with extender if two notes selected</td>
      </tr>
    </table>
  <!--
  </div>
  <div class='text-info block'>
  -->
    <table>
      <tr>
        <td><span class="keyIcon">S</span></td>
        <td>Insert <strong>slur</strong> starting/ending on selected notes</td>
      </tr>
      <tr>
        <td><span class="keyIcon">T</span></td>
        <td>Insert tie starting/ending on selected notes</td>
      </tr>
      <tr>
        <td><span class="keyIcon">H</span></td>
        <td>Insert crescendo hairpin starting/ending above selected notes</td>
      </tr>
      <tr>
        <td><span class="keyIcon">&#8679;</span><span class="keyIcon">H</span></td>
        <td>Insert diminuendo hairpin starting/ending above selected notes</td>
      </tr>
    </table>
  <!--
  </div>
  <div class='text-info block'>
  -->
    <table>
      <tr>
        <td><span class="keyIcon">A</span></td>
        <td>Insert arpeggio for selected note(s)</td>
      </tr>
      <tr>
        <td><span class="keyIcon">G</span></td>
        <td>Insert glissando starting at first, ending at last selected note</td>
      </tr>
      <tr>
        <td><span class="keyIcon">P</span></td>
        <td>Insert pedal down for selected note(s)</td>
      </tr>
      <tr>
        <td><span class="keyIcon">&#8963;</span><span class="keyIcon">P</span></td>
        <td>Insert pedal up for selected note(s)</td>
      </tr>
      <tr>
        <td><span class="keyIcon">N</span></td>
        <td>Insert turn to selected note(s) (with SHIFT: lower form)</td>
      </tr>
      <tr>
        <td><span class="keyIcon">M</span></td>
        <td>Insert mordent to selected note(s) (with SHIFT: upper form)</td>
      </tr>
      <tr>
        <td><span class="keyIcon">L</span></td>
        <td>Insert trill to selected note(s)</td>
      </tr>
    </table>
  </div>
  <div class='text-info block'>
  <h3 class="text-highlight">Deleting elements</h3>
    <table>
    <tr>
      <td><span class="keyIcon">BACKSPACE</span> or <span class="keyIcon">DELETE</span></td>
      <td>Delete control elements, clef change, accid, artic</td>
    </tr>
    </table>
  </div>
  <div class='text-info block'>
    <table>
    <h3 class='text-highlight'>Moving elements</h3>
    <tr>
      <td><span class="keyIcon">${cmdKey}</span><span class="keyIcon">&darr;</span></td>
      <td>Move rest, mRest, multiRest one tone downwards</td>
    </tr>
    <tr>
      <td><span class="keyIcon">${cmdKey}</span><span class="keyIcon">&uarr;</span></td>
      <td>Move rest, mRest, multiRest one tone upwards </td>
    </tr>
    <tr>
      <td><span class="keyIcon">${cmdKey}</span><span class="keyIcon">&#8679;</span><span class="keyIcon">&darr;</span></td>
      <td>Move rest, mRest, multiRest one octave downwards</td>
    </tr>
    <tr>
      <td><span class="keyIcon">${cmdKey}</span><span class="keyIcon">&#8679;</span><span class="keyIcon">&uarr;</span></td>
      <td>Move rest, mRest, multiRest one octave upwards </td>
    </tr>
    </table>
  </div>
  <div class='text-info block'>
  <h3 class="text-highlight">Toggle articulation</h3>
    <table>
    <tr>
      <td><span class="keyIcon">&#8679;</span><span class="keyIcon">S</span></td>
      <td>Toggle staccato on note/chord</td>
    </tr>
    <tr>
      <td><span class="keyIcon">&#8679;</span><span class="keyIcon">V</span></td>
      <td>Toggle accent on note/chord</td>
    </tr>
    <tr>
      <td><span class="keyIcon">&#8679;</span><span class="keyIcon">N</span></td>
      <td>Toggle tenuto on note/chord</td>
    </tr>
    <tr>
      <td><span class="keyIcon">&#8679;</span><span class="keyIcon">O</span></td>
      <td>Toggle marcato on note/chord</td>
    </tr>
    <tr>
      <td><span class="keyIcon">&#8679;</span><span class="keyIcon">I</span></td>
      <td>Toggle staccatissimo on note/chord</td>
    </tr>
    </table>
  </div>
  <div class='text-info block'>
  <h3 class="text-highlight">MEI encoding manipulation</h3>
    <table>
    <tr>Renumber measures (counts successive measures with @metcon="false" as one, counts multiple endings with same numbering)
      <td><span class="keyIcon">&#8679;</span><span class="keyIcon">R</span></td>
      <td>Test renumbering (output to console)</td>
    </tr>
    <tr>
      <td><span class="keyIcon">&#8963;</span><span class="keyIcon">&#8679;</span><span class="keyIcon">R</span></td>
      <td>Execute renumbering</td>
    </tr>
    <tr>
      <td><span class="keyIcon">&#8679;</span><span class="keyIcon">C</span></td>
      <td>Remove @accid.ges when @accid is present </td>
    </tr>
    </table>
  </div>
`;
