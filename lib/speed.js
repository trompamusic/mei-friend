'use babel';

/* Speed mode: just feed the current page excerpt of the MEI encoding
 *  to Verovio, so minimize loading times.
 *  Currently only for --breaks = line, encoded
 */

import * as utils from './utils';

export var meiNameSpace = 'http://www.music-encoding.org/ns/mei';
export var xmlNameSpace = 'http://www.w3.org/XML/1998/namespace';

// returns complete MEI code of given page (one-based), defined by sb and pb
export function getPageFromDom(xmlDoc, pageNo = 1, whichBreaks = ['sb', 'pb']) {
  let meiHeader = xmlDoc.getElementsByTagName('meiHead');
  if (!meiHeader) {
    console.info('getPageFromDom(): no meiHeader');
    return;
  }
  // console.info('getPageFromDom(' + pageNo + ') meiHead: ', meiHeader);
  var xmlScore = xmlDoc.querySelector("mdiv > score");
  if (!xmlScore) {
    console.info('getPageFromDom(): no xmlScore element');
    return;
  }
  // console.info('xmlScore: ', xmlScore);
  let scoreDefs = xmlScore.getElementsByTagName("scoreDef");
  if (!scoreDefs) {
    console.info('getPageFromDom(): no scoreDefs element');
    return;
  }
  // console.info('scoreDef: ', scoreDefs);

  // construct new MEI node for Verovio engraving
  var spdNode = minimalMEIFile(xmlDoc);
  spdNode.appendChild(meiHeader.item(0).cloneNode(true));
  spdNode.appendChild(minimalMEIMusicTree(xmlDoc));
  var scoreDef = scoreDefs.item(0).cloneNode(true);
  // console.info('scoreDef: ', scoreDef);
  var baseSection = document.createElementNS(meiNameSpace, 'section');
  baseSection.setAttributeNS(xmlNameSpace, 'xml:id', 'baseSection');
  // console.info('section: ', baseSection);
  baseSection.appendChild(document.createElementNS(meiNameSpace, 'pb'));

  if (pageNo > 1) {
    var measure = dummyMeasure(countStaves(scoreDef));
    measure.setAttributeNS(xmlNameSpace, 'xml:id', 'startingMeasure');
    baseSection.appendChild(measure);
    baseSection.appendChild(document.createElementNS(meiNameSpace, 'pb'));
  }
  var spdScore = spdNode.querySelector('mdiv > score');
  // console.info('spdScore: ', spdScore);

  spdScore.appendChild(scoreDef); // is updated within readSection()
  spdScore.appendChild(baseSection);
  var digger = readSection(xmlScore, pageNo, spdScore, whichBreaks);
  var sections = xmlScore.childNodes;
  sections.forEach((item) => {
    if (item.nodeName == 'section') { // diggs into section hierachy
      spdScore = digger(item);
    }
  });

  const serializer = new XMLSerializer();
  return xmlDefs + serializer.serializeToString(spdNode);
}

// recursive closure to dig through hierarchically stacked sections and append
// only those elements within the requested pageNo
function readSection(xmlScore, pageNo, spdScore, whichBreaks = ['sb', 'pb']) {
  var p = 1,
    countBreaks = false,
    startingElements = [],
    endingElements = [];
  var whichBreaksSelector = whichBreaks.join(', ');
  return function digDeeper(section) {
    var children = section.childNodes;
    let lgt = children.length;
    for (let i = 0; i < lgt; i++) {
      // console.info('digDeeper(' + pageNo + '): p: ' + p +
      //   ', i: ' + i + ', ', children[i]);
      if (p > pageNo) break; // only until requested pageNo is processed
      if (children[i].nodeType === Node.TEXT_NODE) continue;
      var currentNodeName = children[i].nodeName;
      if (['expansion'].includes(currentNodeName)) continue; // ignore expansion list
      // console.info('digDeeper currentNodeName: ', currentNodeName);
      if (currentNodeName == 'section') {
        spdScore = digDeeper(children[i]);
        // console.info('digDeeper returned spdScore: ', spdScore);
        continue;
      }
      if (currentNodeName == 'measure') {
        countBreaks = true;
      }
      if (countBreaks && whichBreaks.includes(currentNodeName)) {
        p++; // skip breaks before content (that is, a measure)
        continue;
      }
      // update scoreDef @key.sig attribute
      if (currentNodeName == 'scoreDef' && p < pageNo) {
        // console.info('scoreDef: ', children[i]);
        if (children[i].hasAttribute('key.sig')) {
          var keysigValue = children[i].getAttribute('key.sig');
          // console.info('Page: ' + p + ', keySig: ', keysigValue);
          var keySigElement = document.createElementNS(meiNameSpace, 'keySig');
          keySigElement.setAttribute('sig', keysigValue);
          var staffDefs = spdScore.querySelectorAll('staffDef');
          for (var staff of staffDefs) {
            var k = staff.querySelector('keySig');
            if (k) {
              k.setAttribute('sig', keysigValue);
            } else {
              staff.appendChild(keySigElement.cloneNode(true));
            }
          }
        }
      }
      // scoreDef with staffDef@key.sig or keySig@sig
      var staffDefList = children[i].querySelectorAll('staffDef');
      if (staffDefList && staffDefList.length > 0 && p < pageNo) {
        // console.info('staffDef: ', staffDefList);
        var staffDefs = spdScore.querySelectorAll('staffDef');
        for (let st of staffDefList) {
          var keysigValue = '';
          if (st.hasAttribute('key.sig')) {
            keysigValue = st.getAttribute('key.sig');
          }
          var keySigElement = st.querySelector('keySig');
          if (keySigElement && keySigElement.hasAttribute('sig')) {
            keysigValue = keySigElement.getAttribute('sig');
          }
          if (keysigValue == '') {
            console.info('No key.sig information in ', st);
          } else {
            // console.info('staffDef update: keysig: ' + keysigValue);
            for (var staff of staffDefs) {
              if (st.getAttribute('n') == staff.getAttribute('n')) {
                var el = document.createElementNS(meiNameSpace, 'keySig');
                el.setAttribute('sig', keysigValue);
                // console.info('Updating scoreDef(' + st.getAttribute('n') + '): ', el);
                var k = staff.querySelector('keySig');
                if (k) {
                  k.setAttribute('sig', keysigValue);
                } else {
                  staff.appendChild(el);
                }
              }
            }
          }
        }
      }
      // update scoreDef with clef elements inside layers
      var clefList = children[i].querySelectorAll('clef');
      if (clefList && clefList.length > 0 && p < pageNo) {
        // console.info('clefList: ', clefList);
        var clef = clefList.item(clefList.length - 1); // last clef in child (measure)
        let sameasId; // if last clef has a @sameas reference
        if (sameasId = clef.getAttribute('sameas')) {
          sameasId = removeHashFromString(sameasId);
          let lgt = clefList.length;
          for (let i = 0; i < lgt; i++) {
            if (clefList[i].getAttribute('xml:id') == sameasId) {
              clef = clefList[i];
            }
          }
        }
        var staffNumber = getParentNode(clef).getAttribute('n');
        // console.info('clefList staffNumber: ' + staffNumber);
        var staffDef = findByAttributeValue(spdScore, 'n', staffNumber, 'staffDef');
        // console.info('staffDef: ', staffDef);
        if (clef.hasAttribute('line'))
          staffDef.setAttribute('clef.line', clef.getAttribute('line'));
        if (clef.hasAttribute('shape'))
          staffDef.setAttribute('clef.shape', clef.getAttribute('shape'));
        if (clef.hasAttribute('dis'))
          staffDef.setAttribute('clef.dis', clef.getAttribute('dis'));
        if (clef.hasAttribute('dis.place'))
          staffDef.setAttribute('clef.dis.place', clef.getAttribute('dis.place'));
        // console.info('scoreDef: ', spdScore.querySelector('scoreDef'));
      }
      // TODO: list all notes/chords/rests/mRest/multRest to check whether they are
      // pointed to from outside the requested pageNo
      if (p == pageNo) {
        var listOfTargets = children[i].querySelectorAll('note, chord');
        for (target of listOfTargets) {
          let id = '#' + target.getAttribute('xml:id');
          var ends = section.querySelectorAll("[endid='" + id + "'][startid]");
          endingElements = [...endingElements, ...ends];
          var starts = section.querySelectorAll("[startid='" + id + "'][endid]");
          startingElements = [...startingElements, ...starts];
        }
      }
      // special treatment for endings that may contain breaks
      if (['ending'].includes(currentNodeName) &&
        (children[i].querySelector(whichBreaksSelector))) {
        var endingNode = children[i].cloneNode(true); // copy elements containing breaks
        var breakNode = endingNode.querySelector(whichBreaksSelector);
        if (breakNode.nextSibling &&
          breakNode.nextSibling.nodeType != Node.TEXT_NODE || p == pageNo) {
          breakNode.parentNode.removeChild(breakNode); // remove first break (!!)
          spdScore.getElementsByTagName('section').item(0).appendChild(endingNode);
        }
        p++;
        continue;
      }
      // append children
      if (p == pageNo) {
        spdScore.getElementsByTagName('section').item(0).appendChild(children[i].cloneNode(true));
        // console.info('digDeeper adds child to spdScore: ', spdScore);
      }
    }
    // compare starting/ending elements & remove matches (both on current page)
    var startIndex = [...Array(startingElements.length).keys()];
    var endIndex = [...Array(endingElements.length).keys()];
    let e, s;
    for (e = 0; e < endIndex.length; e++) {
      for (s = 0; s < startIndex.length; s++) {
        if (endingElements[endIndex[e]].getAttribute('xml:id') ==
          startingElements[startIndex[s]].getAttribute('xml:id')) {
          endIndex.splice(e--, 1);
          startIndex.splice(s--, 1);
          break;
        }
      }
    }
    // console.info('endingElements: ', endingElements);
    // console.info('startingElements: ', startingElements);
    // console.info('startIndex: ', startIndex);
    // console.info('endIndex: ', endIndex);
    // 1) go through endingElements and add to first measure
    if (endIndex.length > 0 && pageNo > 1) {
      // console.info('add to beginning: ');
      var m = spdScore.querySelector('[*|id="startingMeasure"]');
      uuids = getIdsForDummyMeasure(m);
      for (e of endIndex) {
        // console.info('endingsElements[' + e + ']: ', endingElements[e]);
        // console.info(endingElements[e].getAttribute('xml:id'));
        let startid = removeHashFromString(endingElements[e].getAttribute('startid'));
        // console.info('startid: ', startid);
        let staffNo = xmlScore.querySelector('[*|id="' + startid + '"]')
          .closest('staff').getAttribute('n');
        let el = endingElements[e].cloneNode(true);
        el.setAttribute('startid', '#' + uuids[staffNo - 1]);
        m.appendChild(el);
      }
    }
    // 2) go through startingElements and append to a third-page measure
    if (startIndex.length > 0) {
      // console.info('add to end: ');
      var m = spdScore.querySelector('[*|id="endingMeasure"]');
      if (!m) {
        let endingMeasure = dummyMeasure(countStaves(spdScore.querySelector('scoreDef')));
        endingMeasure.setAttributeNS(xmlNameSpace, 'xml:id', 'endingMeasure');
        // console.info('endingMeasure: ', endingMeasure);
        // console.info('speedScore: ', spdScore);
        let sec = spdScore.querySelector('section'); //[*|id="basesec"]');
        sec.appendChild(document.createElementNS(meiNameSpace, 'pb'));
        sec.appendChild(endingMeasure);
      }
      m = spdScore.querySelector('[*|id="endingMeasure"]');
      uuids = getIdsForDummyMeasure(m);
      // console.info('uuids: ', uuids);
      for (s of startIndex) {
        let endid = removeHashFromString(startingElements[s].getAttribute('endid'));
        // console.info('endid: ', endid);
        let staffNo = xmlScore.querySelector('[*|id="' + endid + '"]')
          .closest('staff').getAttribute('n');
        spdScore.querySelector(
            '[*|id="' + startingElements[s].getAttribute('xml:id') + '"]')
          .setAttribute('endid', '#' + uuids[staffNo - 1]);
        // console.info('startingElement staff: ' + staffNo +
        //   ', ', startingElements[s]);
      }
    }
    endingElements = [];
    startingElements = [];

    return spdScore;
  }
}

// returns parent node of
export function getParentNode(startNode, parentNodeName = 'staff') {
  var parentNode = startNode.parentNode;
  while (parentNode && parentNode.nodeName != parentNodeName) {
    parentNode = parentNode.parentNode;
  };
  return parentNode;
}

// returns an xml node with a given attribute-value pair,
// optionally combined with an elementName string
export function findByAttributeValue(xmlNode, attribute, value, elementName = "*") {
  var list = xmlNode.getElementsByTagName(elementName);
  for (var i = 0; i < list.length; i++) {
    if (list[i].getAttribute(attribute) == value) {
      return list[i];
    }
  }
}

// EXPERIMENTAL SKETCH: go through pages from Verovio to remember page breaks
export function getBreaksFromToolkit(tk, text) {
  tk.setOptions(this.vrvOptions);
  tk.loadData(text);
  tk.redoLayout();
  var pageCount = tk.getPageCount();
  // start from page 2 and go through document
  for (let p = 2; p <= pageCount; p++) {
    var svg = tk.renderToSVG(p);
    // console.log('SVG page: ' + p + '.');
    // console.info(svg);
    // find first occurrence of <g id="measure-0000001450096684" class="measure">
    var m = svg.match(/(?:<g\s)(?:id=)(?:['"])(\S+?)(?:['"])\s+?(?:class="measure">)/);
    // console.info('Match: ', m);
    if (m && m.length > 1)
      console.info('Page ' + p + ', breaks before ' + m[1]);
  }
}

// find xmlNode in textBuffer and replace it with new serialized content
export function replaceInBuffer(textBuffer, xmlNode) {
  let newMEI = xmlToString(xmlNode);
  // search in buffer
  let itemId = xmlNode.getAttribute('xml:id');
  let searchSelfClosing = '(?:<' + xmlNode.nodeName + ')\\s+?(?:xml:id="' +
    itemId + '")(.*?)(?:/>)';
  let noReplaced = textBuffer.replace(searchSelfClosing, newMEI);
  if (noReplaced < 1) {
    let searchFullElement = '(?:<' + xmlNode.nodeName + `)\\s+?(?:xml:id=["']` +
      itemId + `["'])([\\s\\S]*?)(?:</` + xmlNode.nodeName + '[ ]*?>)';
    noReplaced = textBuffer.replace(searchFullElement, newMEI);
  }
  if (noReplaced < 1)
    console.info('replaceInBuffer(): nothing replaced for ' + itemId + '.');
  else
    console.info('replaceInBuffer(): ' + noReplaced +
      ' successfully replaced for ' + itemId + '.');
}

// convert xmlNode to string and remove meiNameSpace declaration from return string
export function xmlToString(xmlNode) {
  let str = new XMLSerializer().serializeToString(xmlNode);
  return str.replace('xmlns="' + meiNameSpace + '" ', '');
}

export function getPageNumberAtCursor(textEditor, whichBreaks = ['pb', 'sb']) {
  let cursorRow = textEditor.getCursorBufferPosition().row;
  let text = textEditor.getBuffer();
  let maxLines = text.getLineCount();
  let pageNo = 1; // page number is one-based
  let row = 0;
  let countPages = false,
    hasBreak = false;
  while (row <= cursorRow && row <= maxLines) {
    let line = text.lineForRow(row++);
    if (line.includes('measure')) countPages = true; // skip trailing breaks
    if (countPages) {
      for (let i = 0; i < whichBreaks.length; i++) { // check breaks list
        if (line.includes('<' + whichBreaks[i])) hasBreak = true;
      }
      if (hasBreak) {
        pageNo++;
        hasBreak = false;
      }
    }
  }
  return pageNo;
}

// EXPERIMENTAL SKETCH
export function getPageNumberForElement(xmlDoc, xmlNode) {
  nodeList = xmlDoc.querySelectorAll('pb, sb, *|id="' + xmlNode.getAttribute('xml:id') + '"');
  console.info('nodeLIST: ', nodeList);
}

// returns an xmlNode with a <mei> element
function minimalMEIFile(xmlNode) {
  var mei = xmlNode.createElementNS(meiNameSpace, 'mei');
  return mei;
}

// returns the music xmlNode with body, mdiv, and score in it
function minimalMEIMusicTree(xmlNode) {
  let music = xmlNode.createElementNS(meiNameSpace, 'music');
  let body = xmlNode.createElementNS(meiNameSpace, 'body');
  let mdiv = xmlNode.createElementNS(meiNameSpace, 'mdiv');
  let score = xmlNode.createElementNS(meiNameSpace, 'score');
  mdiv.appendChild(score);
  body.appendChild(mdiv);
  music.appendChild(body);
  return music;
}

// returns a minimal MEI header as xmlNode with MEI meiNameSpace
function minimalMEIHeader(xmlNode) {
  meiHead = xmlNode.createElementNS(meiNameSpace, 'meiHead');
  fileDesc = xmlNode.createElementNS(meiNameSpace, 'fileDesc');
  titleStmt = xmlNode.createElementNS(meiNameSpace, 'titleStmt');
  title = xmlNode.createElementNS(meiNameSpace, 'title');
  titleText = xmlNode.createTextNode('Speed Mode Header');
  pubStmt = xmlNode.createElementNS(meiNameSpace, 'pubStmt');
  respStmt = xmlNode.createElementNS(meiNameSpace, 'respStmt');
  persName = xmlNode.createElementNS(meiNameSpace, 'persName');
  // persName.setAttribute ...
  persName.appendChild(xmlNode.createTextNode('WG'));
  title.appendChild(titleText);
  titleStmt.appendChild(title);
  pubStmt.appendChild(respStmt);
  fileDesc.appendChild(titleStmt);
  fileDesc.appendChild(pubStmt);
  meiHead.appendChild(fileDesc);
  return meiHead;
}


export const xmlDefs = `
 <?xml version="1.0" encoding="UTF-8"?>
 <?xml-model href="https://music-encoding.org/schema/4.0.0/mei-all.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>
 <?xml-model href="https://music-encoding.org/schema/4.0.0/mei-all.rng" type="application/xml" schematypens="http://purl.oclc.org/dsdl/schematron"?>
`;


// creates a dummy measure with n staves
export function dummyMeasure(staves = 2) {
  var m = document.createElementNS(meiNameSpace, 'measure');
  let i;
  for (i = 1; i <= staves; i++) {
    note = document.createElementNS(meiNameSpace, 'note');
    note.setAttribute('pname', 'a');
    note.setAttribute('oct', '3');
    note.setAttribute('dur', '1');
    let uuid = 'note-' + utils.generateUUID();
    note.setAttributeNS(xmlNameSpace, 'xml:id', uuid);
    layer = document.createElementNS(meiNameSpace, 'layer')
    layer.setAttribute('n', '1');
    layer.appendChild(note);
    staff = document.createElementNS(meiNameSpace, 'staff');
    staff.setAttribute('n', i);
    staff.appendChild(layer);
    m.appendChild(staff);
  }
  return m;
}

// generate and return array of xml:ids for dummyMeasure notes (one note per staff)
export function getIdsForDummyMeasure(dummyMeasure) {
  let notes = dummyMeasure.querySelectorAll('note');
  let uuids = [];
  let i;
  for (i = 0; i < notes.length; i++) {
    uuids[i] = notes[i].getAttribute('xml:id');
  }
  return uuids;
}

// returns number of staff elements within scoreDef
export function countStaves(scoreDef) {
  return scoreDef.querySelectorAll('staffDef').length;
}

export function removeHashFromString(hashedString) {
  if (hashedString.startsWith('#'))
    hashedString = hashedString.split('#')[1];
  return hashedString;
}