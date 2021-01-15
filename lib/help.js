  const getHelp =
    `
    <div class='text-info block'>
        <h1 class='text-highlight'>MEI Friend Help</h1>

        <h2 class='text-highlight'>Key bindings</h2>

        <h3 class='text-highlight'>Navigation</h3>

        <span class="keyIcon">&rarr;</span>&nbsp;Select next note, rest, or mRest<br />
        <span class="keyIcon">&larr;</span>&nbsp;Select previous note, rest, or mRest<br />
        <span class="keyIcon">&#8984; &rarr;</span>&nbsp;Select note, rest, mRest in next measure <br />
        <span class="keyIcon">&#8984; &larr;</span>&nbsp;Selected note, rest, mRest in previous measure />
        <span class="keyIcon">&#8963; &#8984; &rarr;</span>&nbsp;Select note, rest, mRest in next page <br />
        <span class="keyIcon">&#8963; &#8984; &larr;</span>&nbsp;Selected note, rest, mRest in previous page/>
        <span class="keyIcon">&uarr;</span>&nbsp;Select note, rest, or mRest one layer up<br />
        <span class="keyIcon">&darr;</span>&nbsp;Select note, rest, or mRest one layer down<br />

        <h3 class="text-highlight">Editing functions</h3>

        <p>Key bindings insert elements above selected note by default and below when pressing the &#8963; key additionally.
            The elements are inserted using @startid and @endid attributes. To insert elements with @tstamp and @tstamp2 attributes,
            use the &#8997; key additionally.</p>

        <span class="keyIcon">s</span>&nbsp;Insert slur starting/ending on selected notes<br />
        <span class="keyIcon">t</span>&nbsp;Insert tie starting/ending on selected notes<br />
        <span class="keyIcon">h</span>&nbsp;Insert crescendo hairpin starting/ending above selected notes<br />
        <span class="keyIcon">&#8984; h</span>&nbsp;Insert diminuendo hairpin starting/ending above selected notes<br />

        Select exactly one note:
        <span class="keyIcon">&#8679; t</span>&nbsp;Insert tempo above selected note(s)<br />

        <span class="keyIcon">f</span>&nbsp;Insert fermata above selected note<br />
        <span class="keyIcon">&#8963; f</span>&nbsp;Insert fermata below selected note<br />

        (<span class="keyIcon">r</span>&nbsp;Insert rehearsal mark above selected note)<br />
        (<span class="keyIcon">&#8963; r</span>&nbsp;Insert rehearsal mark below selected note)<br />

        Select one or two notes:
        <span class="keyIcon">i</span>&nbsp;Insert directive above selected note(s)<br />
        <span class="keyIcon">&#8963; i</span>&nbsp;Insert directive below selected note(s)<br />

        <span class="keyIcon">d</span>&nbsp;Insert dynamics above selected note, with extender if two notes selected<br />
        <span class="keyIcon">&#8963; d</span>&nbsp;Insert dynamics below selected note, with extender if two notes selected<br />


        <span class="keyIcon">a</span>&nbsp;Insert arpeggio for selected note(s)<br />
        (<span class="keyIcon">o</span>&nbsp;Insert octave shift for selected note(s))<br />
        <span class="keyIcon">g</span>&nbsp;Insert glissando starting at first, ending at last selected note<br />

        <span class="keyIcon">p</span>&nbsp;Insert pedal down for selected note(s)<br />
        <span class="keyIcon">&#8963; p</span>&nbsp;Insert pedal up for selected note(s)<br />

        Ornaments: N turn, M mordents, L trill
    </div>
    `;
  exports.getHelp = getHelp;
