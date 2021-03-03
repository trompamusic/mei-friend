'use babel';

/* Verovio on Diet mode: just feed the current excerpt of the MEI encoding
 *  to Verovio, so minimize loading times.
 *  Currently only for --breaks = line, encoded
 */

export var nameSpace = 'http://www.music-encoding.org/ns/mei';

// returns complete MEI code of given page (one-based), defined by sb and pb
export function getVodPageFromDom(xmlDoc, pageNo = 1, whichBreaks = ['sb', 'pb']) {
  let meiHeader = xmlDoc.getElementsByTagName('meiHead');
  if (!meiHeader) {
    console.info('getVodPageFromDom(): no meiHeader');
    return;
  }
  // console.info('getVodPageFromDom(' + pageNo + ') meiHead: ', meiHeader);
  var xmlScore = xmlDoc.querySelector("mdiv > score");
  if (!xmlScore) {
    console.info('getVodPageFromDom(): no xmlScore element');
    return;
  }
  // console.info('xmlScore: ', xmlScore);
  let scoreDefs = xmlScore.getElementsByTagName("scoreDef");
  if (!scoreDefs) {
    console.info('getVodPageFromDom(): no scoreDefs element');
    return;
  }
  // console.info('scoreDef: ', scoreDefs);

  // construct new MEI node for Verovio engraving
  var vodNode = minimalMEIFile(xmlDoc);
  vodNode.appendChild(meiHeader.item(0).cloneNode(true));
  vodNode.appendChild(minimalMEIMusicTree(xmlDoc));
  var scoreDef = scoreDefs.item(0).cloneNode(true);
  // console.info('scoreDef: ', scoreDef);
  var baseSection = document.createElementNS(nameSpace, 'section');
  baseSection.setAttribute('xml:id', 'baseSection');
  // console.info('section: ', baseSection);
  baseSection.appendChild(document.createElementNS(nameSpace, 'pb'));
  if (pageNo > 1) {
    baseSection.appendChild(dummyMeasure(xmlDoc));
    baseSection.appendChild(document.createElementNS(nameSpace, 'pb'));
  }
  var vodScore = vodNode.querySelector('mdiv > score');
  // console.info('vodScore: ', vodScore);

  vodScore.appendChild(scoreDef); // TODO: update inside readSection
  vodScore.appendChild(baseSection);
  var sections = xmlScore.childNodes;
  var digger = readSection(pageNo, vodScore, whichBreaks);
  sections.forEach((item) => {
    if (item.nodeName == 'section') { // diggs into section hierachy
      vodScore = digger(item);
    }
  });

  const serializer = new XMLSerializer();
  return xmlDefs + serializer.serializeToString(vodNode);
}

// recursive closure to dig through hierarchically stacked sections and append
// only those elements within the requested pageNo
function readSection(pageNo, vodScore, whichBreaks = ['sb', 'pb']) {
  var p = 1,
    countBreaks = false;
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
        vodScore = digDeeper(children[i]);
        // console.info('digDeeper returned vodScore: ', vodScore);
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
          var keySigElement = document.createElementNS(nameSpace, 'keySig');
          keySigElement.setAttribute('sig', keysigValue);
          var staffDefs = vodScore.querySelectorAll('staffDef');
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
        var staffDefs = vodScore.querySelectorAll('staffDef');
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
                var el = document.createElementNS(nameSpace, 'keySig');
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
          if (sameasId.startsWith('#')) sameasId = sameasId.split('#')[1];
          let lgt = clefList.length;
          for (let i = 0; i < lgt; i++) {
            if (clefList[i].getAttribute('xml:id') == sameasId) {
              clef = clefList[i];
            }
          }
        }
        var staffNumber = getParentNode(clef).getAttribute('n');
        // console.info('clefList staffNumber: ' + staffNumber);
        var staffDef = findByAttributeValue(vodScore, 'n', staffNumber, 'staffDef');
        // console.info('staffDef: ', staffDef);
        if (clef.hasAttribute('line'))
          staffDef.setAttribute('clef.line', clef.getAttribute('line'));
        if (clef.hasAttribute('shape'))
          staffDef.setAttribute('clef.shape', clef.getAttribute('shape'));
        if (clef.hasAttribute('dis'))
          staffDef.setAttribute('clef.dis', clef.getAttribute('dis'));
        if (clef.hasAttribute('dis.place'))
          staffDef.setAttribute('clef.dis.place', clef.getAttribute('dis.place'));
        // console.info('scoreDef: ', vodScore.querySelector('scoreDef'));
      }
      // TODO: list all notes/chords/rests/mRest/multRest to check whether they are
      // pointed to from outside the requested pageNo
      if (p == pageNo && false) {
        var listOfTargets = children[i].querySelectorAll('note, chord, rest');
        console.info('listOfTargets length: ' + listOfTargets.length);
        for (target of listOfTargets) {
          // console.info('target: ', target)
          let id = '#' + target.getAttribute('xml:id');
          // console.info('id: ' + id);
          var pointingElements = section.querySelectorAll("[startid='" + id + "']");
          console.info('pointingElements length: ' + pointingElements.length);
          for (pe of pointingElements) {
            console.info('pointingElement: ', pe);
            getPageNumberForElement(section, pe);
          }
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
          vodScore.getElementsByTagName('section').item(0).appendChild(endingNode);
        }
        p++;
        continue;
      }
      // append children
      if (p == pageNo) {
        vodScore.getElementsByTagName('section').item(0).appendChild(children[i].cloneNode(true));
        // console.info('digDeeper adds child to vodScore: ', vodScore);
      }
    }
    return vodScore;
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

// returns an xml node with a given attribute-value pair, combined optionally with an elementName
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

// convert xmlNode to string and remove namespace declaration from return string
export function xmlToString(xmlNode) {
  let str = new XMLSerializer().serializeToString(xmlNode);
  return str.replace('xmlns="' + nameSpace + '" ', '');
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

export function getPageNumberForElement(xmlDoc, xmlNode) {
  nodeList = xmlDoc.querySelectorAll('pb, sb, *|id="'+ xmlNode.getAttribute('xml:id') + '"');
  console.info('nodeLIST: ', nodeList);
}

function minimalMEIFile(xmlNode) {
  var mei = xmlNode.createElementNS(nameSpace, 'mei');
  return mei;
}

function minimalMEIMusicTree(xmlNode) {
  let music = xmlNode.createElementNS(nameSpace, 'music');
  let body = xmlNode.createElementNS(nameSpace, 'body');
  let mdiv = xmlNode.createElementNS(nameSpace, 'mdiv');
  let score = xmlNode.createElementNS(nameSpace, 'score');
  mdiv.appendChild(score);
  body.appendChild(mdiv);
  music.appendChild(body);
  return music;
}

function minimalMEIHeader(xmlNode) {
  meiHead = xmlNode.createElementNS(nameSpace, 'meiHead');
  fileDesc = xmlNode.createElementNS(nameSpace, 'fileDesc');
  titleStmt = xmlNode.createElementNS(nameSpace, 'titleStmt');
  title = xmlNode.createElementNS(nameSpace, 'title');
  titleText = xmlNode.createTextNode('Verovio on Diet');
  pubStmt = xmlNode.createElementNS(nameSpace, 'pubStmt');
  respStmt = xmlNode.createElementNS(nameSpace, 'respStmt');
  persName = xmlNode.createElementNS(nameSpace, 'persName');
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


// TODO: number of staves automatically
export function dummyMeasure(xmlNode, staves = 2) {
  var m = xmlNode.createElementNS(nameSpace, 'measure');
  for (i = 1; i <= staves; i++) {
    note = xmlNode.createElementNS(nameSpace, 'note');
    note.setAttribute('pname', 'a');
    note.setAttribute('oct', '3');
    note.setAttribute('dur', '1');
    layer = xmlNode.createElementNS(nameSpace, 'layer')
    layer.setAttribute('n', '1');
    layer.appendChild(note);
    staff = xmlNode.createElementNS(nameSpace, 'staff');
    staff.setAttribute('n', i);
    staff.appendChild(layer);
    m.appendChild(staff);
  }
  return m;
}
