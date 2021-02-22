'use babel';

/* Verovio on Diet mode: just feed the current excerpt of the MEI encoding
 *  to Verovio, so minimize loading times.
 *  Currently only for --breaks = line, encoded
 */

var nameSpace = 'http://www.music-encoding.org/ns/mei';

// returns complete MEI code of given page (one-based), defined by sb and pb
export function getVodPageFromDom(xmlDoc, pageNo = 1) {
  let meiHeader = xmlDoc.getElementsByTagName('meiHead');
  // console.info('getVodPageFromDom(' + pageNo + ') meiHead: ', meiHeader);
  var xmlScore = xmlDoc.querySelector("mdiv > score");
  // console.info('xmlScore: ', xmlScore);
  let scoreDefs = xmlScore.getElementsByTagName("scoreDef");
  // console.info('scoreDef: ', scoreDefs);

  // construct new MEI node for Verovio engraving
  var vodNode = minimalMEIFile(xmlDoc);
  vodNode.appendChild(meiHeader.item(0).cloneNode(true));
  vodNode.appendChild(minimalMEIMusicTree(xmlDoc));
  var scoreDef = scoreDefs.item(0).cloneNode(true);
  // console.info('scoreDef: ', scoreDef);
  var baseSection = document.createElementNS(nameSpace, 'section');
  baseSection.setAttribute('id', 'baseSection');
  // console.info('section: ', baseSection);
  baseSection.appendChild(document.createElementNS(nameSpace, 'pb'));
  if (pageNo > 1) {
    baseSection.appendChild(dummyMeasure(xmlDoc));
    baseSection.appendChild(document.createElement('sb'));
  }
  var vodScore = vodNode.querySelector('mdiv > score');
  // console.info('vodScore: ', vodScore);

  vodScore.appendChild(scoreDef); // TODO: update inside readSection
  vodScore.appendChild(baseSection);
  var sections = xmlScore.childNodes;
  var digger = readSection(pageNo, vodScore);
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
function readSection(pageNo, vodScore, breaksList = ['sb', 'pb']) {
  var p = 1,
    countBreaks = false;
  var breaksListSelector = breaksList.join(', ');
  return function digDeeper(section) {
    var children = section.childNodes;
    let lgt = children.length;
    for (let i = 0; i < lgt; i++) {
      // console.info('digDeeper(' + pageNo + '): p: ' + p + ', i: ' + i + ', ', children[i]);
      if (p > pageNo) break;
      if (children[i].nodeType === Node.TEXT_NODE) continue;
      var currentNodeName = children[i].nodeName;
      if (['expansion'].includes(currentNodeName)) continue; // ignore list
      // console.info('digDeeper currentNodeName: ', currentNodeName);
      if (currentNodeName == 'section') {
        vodScore = digDeeper(children[i]);
        // console.info('digDeeper returned vodScore: ', vodScore);
        continue;
      }
      if (currentNodeName == 'measure') {
        countBreaks = true;
      }
      if (countBreaks && breaksList.includes(currentNodeName)) {
        p++;
        continue;
      }
      if (['ending'].includes(currentNodeName) && ((children[i].querySelector(breaksListSelector))) !== null) {
        var endingNode = children[i].cloneNode(true); // copy elements containing breaks
        var breakNode = endingNode.querySelector(breaksListSelector);
        if (breakNode.nextSibling && breakNode.nextSibling.nodeType != Node.TEXT_NODE || p == pageNo) {
          breakNode.parentNode.removeChild(breakNode); // remove first break (!!)
          vodScore.getElementsByTagName('section').item(0).appendChild(endingNode);
          // console.info('digDeeper adds ending: ', vodScore);
        }
        p++;
        continue;
      }
      if (p > (pageNo - 1) && p <= pageNo) {
        vodScore.getElementsByTagName('section').item(0).appendChild(children[i].cloneNode(true));
        // console.info('digDeeper adds child to vodScore: ', vodScore);
      }
    }
    return vodScore;
  }
}

// sketch
export function getVodPageFromText(textEditor, meiFriendView, page, recalc = false) {
  meiCode = xmlDefs;


  if (scoreDefList.length > 0 || recalc) {
    generatePageList();
  }


  meiCode += meiHead;
  return meiCode;
}

// sketch
export function generatePageList(textEditor, meiFriendView) {
  var textBuffer = textEditor.getBuffer();
  let mxRows = textEditor.getLastBufferRow();

  meiFriendView.meiHeadRange = utils.findElementBelow(textEditor, 'meiHead');
  let scoreDefRange = utils.findElementBelow(textEditor, 'scoreDef');
  let sb = 0,
    pb = 0,
    row1 = scoreDefRange[0],
    col1 = 0,
    row2 = 0,
    col2 = 0;
  let beginning = true,
    ending = false,
    found = false;
  while ((line = textBuffer.lineForRow(row1++)) != '' && row1 < mxRows) {
    if (line.indexOf('<pb') > 0) {
      if (!beginning) {
        pb++
      };
      found = true;
    }
    if (line.indexOf('<sb') > 0) {
      if (!beginning) {
        sb++
      };
      found = true;
    }
    if (found) {
      let result = line.match(/(?:<)([a-zA-Z]+\b)/);
      if (result != null) {
        col1 = result.index; // beginning of a section
        found = false;
        continue;
      }
    }

    if (line.indexOf('<measure') > 0) beginning = false; // dont count trailing pbs
    if (line.indexOf('<ending') > 0) ending = true; // open ending element

  }

}

export function getPageNumberAtCursor(textEditor) {
  let cursorPosition = textEditor.getCursorBufferPosition();
  let text = textEditor.getBuffer();
  let row = cursorPosition.row;
  let pageNo = 1; // page number is one-based
  while (line = text.lineForRow(--row)) {
    if (line.includes('<sb') || line.includes('<pb'))
      pageNo++;
  }
  return pageNo;
}

function minimalMEIFile(xmlNode) {
  var mei = xmlNode.createElementNS(nameSpace, 'mei');
  return mei;
}

function minimalMEIMusicTree(xmlNode) {
  let music = xmlNode.createElement('music');
  let body = xmlNode.createElement('body');
  let mdiv = xmlNode.createElement('mdiv');
  let score = xmlNode.createElement('score');
  mdiv.appendChild(score);
  body.appendChild(mdiv);
  music.appendChild(body);
  return music;
}

function minimalMEIHeader(xmlNode) {
  meiHead = xmlNode.createElementNS(nameSpace, 'meiHead');
  fileDesc = xmlNode.createElementNS(nameSpace, 'fileDesc');
  titleStmt = xmlNode.createElementNS(nameSpace, 'titleStmt');
  title = xmlNode.createElement('title');
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
    note = xmlNode.createElement('note');
    note.setAttribute('pname', 'a');
    note.setAttribute('oct', '3');
    note.setAttribute('dur', '1');
    layer = xmlNode.createElement('layer')
    layer.setAttribute('n', '1');
    layer.appendChild(note);
    staff = xmlNode.createElement('staff');
    staff.setAttribute('n', i);
    staff.appendChild(layer);
    m.appendChild(staff);
  }
  return m;
}