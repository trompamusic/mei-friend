'use babel';

import $ from 'jquery';

export const xmlIdString = /(?:xml:id=)(?:['"])(\S+?)(?:['"])/;
export const numberLikeString = /(?:n=)(?:['"])(\d+?)(?:['"])/;

// returns the object named key of the JSON object obj
export function findKey(key, obj) {
  // console.info('findKey: ' + key + '. ', obj);
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.includes(key)) {
      return obj[key];
    } else {
      for (k of keys) {
        val = findKey(key, obj[k]);
        if (val) return val;
      }
    }
  }
}

// checks whether note noteId is inside a chord. Returns false or the chord id.
export function insideChord(noteId) {
  chord = $('g#' + noteId).parent('.chord');
  if (chord) {
    return chord.attr('id');
  } else {
    return false;
  }
}

// finds all chords/notes inside an element and return jquery objects
export function findNotes(elementId) {
  noteList = $('g#' + elementId).find('.note');
  let idArray = [];
  for (note of noteList) {
    noteId = $(note).attr('id');
    chordId = insideChord(noteId);
    if (chordId && !idArray.includes(chordId)) {
      idArray.push(chordId);
    } else if (!chordId) {
      idArray.push(noteId);
    }
  }
  return idArray;
}

// look for elementname (e.g., 'staff') upwards in the xml file and return
// attribute value (searchString defaults to the "@n" attribute).
export function getElementAttributeAbove(text, row, elementName = 'staff',
  searchString = /(?:n=)(?:['"])(\d+?)(?:['"])/) {
  while (line = text.lineForRow(--row)) {
    if (line.includes('<' + elementName)) {
      col = line.indexOf()
      return [line.match(searchString)[1], row];
    }
  }
  return [null, null];
}

// look for elementname (e.g., 'staff') downwards in the xml file and return
// attribute value (searchString defaults to the "@n" attribute).
export function getElementAttributeBelow(text, row, elementName = 'staff',
  searchString = /(?:n=)(?:['"])(\d+?)(?:['"])/) {
  while (line = text.lineForRow(++row)) {
    if (line.includes('<' + elementName)) {
      return [line.match(searchString)[1], row];
    }
  }
  return [null, null];
}

// move encoding cursor to end of current measure
export function moveCursorToEndOfMeasure(textEditor) {
  let cursorPosition = textEditor.getCursorBufferPosition();
  let text = textEditor.getBuffer();
  const measureEnd = '</measure';
  for (let row = cursorPosition.row; row < textEditor.getLastBufferRow(); row++) {
    line = text.lineForRow(row);
    if (line.includes(measureEnd)) {
      let column = line.indexOf(measureEnd);
      textEditor.setCursorBufferPosition([row, column]);
      return [row, column];
    }
  }
  return [null, null];
}

// find item by id in buffer
export function locateIdInBuffer(buffer, itemId, searchRegExp = '') {
  // const searchString = new RegExp(`(?:xml:id="${itemId}")`);
  // var searchSelfClosing = '<[\\w.-]+?\\s+?(?:xml:id="' + itemId + '")(.*?)(\/[\\w.-]*?>)';
  // var searchElement = '(?:<' + elementName + ')\\s+?(?:xml:id="' + itemId + '")(.*?)(?:</' + elementName + ')*?>';
  if (searchRegExp == '') searchRegExp = '(?:xml:id="' + itemId + '")';
  // searchRegExp = '<[\w.-]+?\s+?(?:xml:id="' + itemId + '")(.+?)(\/[\w.-]*?>)';
  const searchString = new RegExp(searchRegExp);
  let range;
  buffer.scan(searchString, (obj) => {
    range = obj.range;
    obj.stop();
  });
  return range;
}

// find attribute (@startid) of element with itemId in textEditor.getBuffer()
// returns value of attribute ('note-00123') or null, if nothing found
export function getAttributeById(buffer, itemId, attribute = 'startid') {
  var searchRegExp = '<[\\w.-]+?\\s+?(?:xml:id="' + itemId + '")[^>]*?>';
  let range = locateIdInBuffer(buffer, itemId, searchRegExp);
  var elementString = '';
  if (range) elementString = buffer.getTextInRange(range);
  // console.info('elementString: |' + elementString + '|');
  searchRegExp = `(?:` + attribute + `=)(?:['"])(\\S+?)(?:['"])`;
  let startid = elementString.match(new RegExp(searchRegExp));
  if (startid && startid.length > 0) startid = startid[1];
  // console.info('startid: |' + startid + '|')
  return startid;
}

// scans through text from cursorPosition to find next element elementName
// (e.g. 'note'), also matching staff and layer
export function getIdOfNextElement(text, rw, elementName = 'noteOrRest', direction = 'forwards') {
  let row = rw;
  let line;
  let startLayerN = parseInt(getElementAttributeAbove(text, row, 'layer', numberLikeString)[0]);
  let startStaffN = parseInt(getElementAttributeAbove(text, row, 'staff', numberLikeString)[0]);
  console.info('getIdOfNextElement("' + elementName + '", "' + direction + '").');

  if (elementName == 'noteOrRest') {
    if (direction == 'forwards') {
      while (line = text.lineForRow(++row)) {
        if ((line.includes('<note') || line.includes('<rest') || line.includes('<mRest')) &&
          (startStaffN == parseInt(getElementAttributeAbove(text, row, 'staff', numberLikeString)[0])) &&
          (startLayerN == parseInt(getElementAttributeAbove(text, row, 'layer', numberLikeString)[0]))) { // && (startLayerN == layerN)
          break;
        }
      }
    } else if (direction == 'backwards') {
      while (line = text.lineForRow(--row)) {
        if ((line.includes('<note') || line.includes('<rest') || line.includes('<mRest')) &&
          (startStaffN == parseInt(getElementAttributeAbove(text, row, 'staff', numberLikeString)[0])) &&
          (startLayerN == parseInt(getElementAttributeAbove(text, row, 'layer', numberLikeString)[0]))) { // && (startLayerN == layerN)
          break;
        }
      }
    }
  } else {
    if (direction == 'forwards') {
      while (line = text.lineForRow(++row)) {
        if (line.includes('<' + elementName) &&
          (startStaffN == parseInt(getElementAttributeAbove(text, row, 'staff', numberLikeString)[0])) &&
          (startLayerN == parseInt(getElementAttributeAbove(text, row, 'layer', numberLikeString)[0]))) { // && (startLayerN == layerN)
          break;
        }
      }
    } else if (direction == 'backwards') {
      while (line = text.lineForRow(--row)) {
        if (line.includes('<' + elementName) &&
          (startStaffN == parseInt(getElementAttributeAbove(text, row, 'staff', numberLikeString)[0])) &&
          (startLayerN == parseInt(getElementAttributeAbove(text, row, 'layer', numberLikeString)[0]))) { // && (startLayerN == layerN)
          break;
        }
      }
    }
  }
  if (typeof line === 'undefined') return ['', row.toString()];
  console.info('  line: ' + line);
  let uuid = line.match(xmlIdString);
  if (uuid) {
    //versionLabel.innerText =  uuid + ', OrigStaff=' + startStaffN + '; OrigLayer=' + startLayerN;
    return [uuid[1], row.toString()];
  } else {
    return ['', row.toString()];
  }
}

// returns xml:id of current element (at encoding cursor position). If empty,
// search for next higher staff or measure xml:id
export function getIdOfItemAtCursor(text, cursorPosition) {
  let result;
  let tag;
  let row = cursorPosition.row;
  let column = cursorPosition.column;
  const closingTagRe = /(?:<[/])(\S+?)(?:[>])/;

  // get line from current cursor position
  let line = text.lineForRow(row);

  // check if cursor is on a closing tag by stepping backwards through the characters
  for (let j = column; j > 0; j--) {
    if (line[j] === "/" && line[j - 1] === "<") {
      // if closing tag is found, find the name of the tag with regex
      tag = line.slice(j - 1).match(closingTagRe);
      if (tag && Array.isArray(tag)) {
        tag = tag[1];
        break;
      }
    }
  }

  // if closing tag identified, find opening tag and set row number accordingly
  if (tag) {
    for (let k = row - 1; k >= 0; k--) {
      if (text.lineForRow(k).includes(`<${tag}`)) {
        row = k;
        break;
      }
    }
  }

  // search for xml:id in row
  result = text.lineForRow(row).match(xmlIdString);

  // if one is found, return it
  if (result !== null) {
    return result[1];
  }

  // if no id is found, look in parent staff and measure to find one
  let outsideParentStaff = false;

  for (let m = row; m >= 0; m--) {
    line = text.lineForRow(m);

    if (line.includes('<music')) {
      break;
    }

    if (line.includes('</staff')) {
      outsideParentStaff = true;
      continue;
    }

    if (line.includes('<measure') || (line.includes('<staff') && !outsideParentStaff)) {

      result = line.match(xmlIdString);
      if (result !== null) {
        return result[1];
      }

      // if this line is parent <measure>, stop looking
      if (line.includes('<measure')) {
        break;
      }
    }
  }

  // if no xml:id is found, return null
  return null;
}

// creates a random ID value in Verovio style
export function generateUUID() {
  let tmp = Math.round((Math.random() * 32768) * (Math.random() * 32768)).toString();
  uuid = '';
  for (let i = 0; i < 16 - tmp.length; i++) {
    uuid += '0';
  }
  return uuid + tmp;
}

// add n tabs to current cursor position in textEditor
export function insertTabs(textEditor, n) {
  for (let i = 0; i < n; i++) {
    textEditor.insertText('\t');
  }
}
