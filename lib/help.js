'use babel';

let cmdKey = "&#8963;"; // CTRL
let altKey = "&#8997;"; // ALT

if (navigator.appVersion.indexOf("Mac") != -1) {
  cmdKey = "&#8984;"; // CMD
  altKey = "&#8963;"; // CTRL
}

export const helpText =  `
  <div class='text-info block'>
    <table>
    <h3 class='text-highlight'>Navigation</h3>
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
      <td><span class="keyIcon">${cmdKey}</span><span class="keyIcon">${altKey}</span><span class="keyIcon">&rarr;</span></td>
      <td>Select note, rest, mRest in next page</td>
    </tr>
    <tr>
      <td><span class="keyIcon">${cmdKey}</span><span class="keyIcon">${altKey}</span><span class="keyIcon">&larr;</span></td>
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
    <h3 class='text-highlight'>Selection</h3>
    <tr>
      <td><span class="keyIcon">&#8679</span><span class="keyIcon">click</span></td>
      <td>Select multiple notes by mouse click</td>
    </tr>
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
      <tr>
        <td><span class="keyIcon">S</span></td>
        <td>Insert <strong>slur</strong> starting/ending on selected notes</td>
      </tr>
      <tr>
        <td><span class="keyIcon">T</span></td>
        <td>Insert tie starting/ending on selected notes</td>
      </tr>
    </table>
  </div>
  <div class='text-info block'>
    <table>
      <tr>
        <td><span class="keyIcon">H</span></td>
        <td>Insert crescendo hairpin starting/ending above selected notes</td>
      </tr>
      <tr>
        <td><span class="keyIcon">&#8679;</span><span class="keyIcon">H</span></td>
        <td>Insert diminuendo hairpin starting/ending above selected notes</td>
      </tr>
    </table>
  </div>
  <div class='text-info block'>
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
`;
