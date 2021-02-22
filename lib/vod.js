'use babel';

/* Verovio on Diet mode: just feed the current excerpt of the MEI encoding
 *  to Verovio, so minimize loading times.
 *  Currently only for --breaks = line, encoded
 */

var nameSpace = 'http://www.music-encoding.org/ns/mei';

// returns complete MEI code of given page (one-based), defined by sb and pb
export function getVodPageFromDom(xmlDoc, pageNo = 1) {
  let meiHeader = xmlDoc.getElementsByTagName('meiHead');
  console.info('getVodPageFromDom(' + pageNo + ') meiHead: ', meiHeader);
  var xmlScore = xmlDoc.querySelector("mdiv > score");
  console.info('xmlScore: ', xmlScore);
  let scoreDefs = xmlScore.getElementsByTagName("scoreDef");
  console.info('scoreDef: ', scoreDefs);

  // construct new MEI node for Verovio engraving
  var vodNode = minimalMEIFile(xmlDoc);
  vodNode.appendChild(meiHeader.item(0).cloneNode(true));
  vodNode.appendChild(minimalMEIMusicTree(xmlDoc));
  var scoreDef = scoreDefs.item(0).cloneNode(true);
  console.info('scoreDef: ', scoreDef);
  var baseSection = document.createElementNS(nameSpace, 'section');
  console.info('section: ', baseSection);
  baseSection.appendChild(document.createElementNS(nameSpace, 'pb'));
  if (pageNo > 1) {
    baseSection.appendChild(dummyMeasure(xmlDoc));
    baseSection.appendChild(document.createElement('sb'));
  }
  var vodScore = vodNode.querySelector('mdiv > score');
  console.info('vodScore: ', vodScore);

  vodScore.appendChild(scoreDef); // TODO: move inside readSection for update
  var sections = xmlScore.childNodes;
  console.info('Sections of xmlScore: ', sections);
  var digger = readSection(pageNo, baseSection);
  console.info('digger: ', digger);
  sections.forEach((item) => {
    console.info('section.forEach: ', item);
    console.info('nodeType: ' + item.nodeType + ', NodeName: ' + item.nodeName);
    if (item.nodeName == 'section') {
      baseSection = digger(item);
      console.info('digger: returned: ', baseSection);
    }
  });
  vodScore.appendChild(baseSection);

  // var elementList = xmlScore.querySelectorAll("measure, sb, pb");
  // // find pageNo
  // let sb = 0,
  //   pb = 0,
  //   lgt = elementList.length;
  // console.info('elementList: ', elementList + ', lgt: ' + lgt);
  // for (let i = 0; i < lgt; i++) {
  //   if (elementList.item(i).nodeName == 'sb') {
  //     if (i > 0) sb++;
  //     continue;
  //   }
  //   if (elementList.item(i).nodeName == 'pb') {
  //     if (i > 0) pb++;
  //     continue;
  //   }
  //   if (sb + pb >= pageNo - 1 && sb + pb < pageNo) {
  //     baseSection.appendChild(elementList.item(i).cloneNode(true));
  //   }
  //   if (sb + pb >= pageNo) break;
  // }
  // vodScore.appendChild(scoreDef);
  // vodScore.appendChild(baseSection);
  console.info('vodNode\n:', vodNode);
  const serializer = new XMLSerializer();
  return xmlDefs + serializer.serializeToString(vodNode);
}

function readSection(pageNo, vodScore) {
  let p = 0,
    countBreaks = false;
  return function digDeeper(section) {
    var children = section.childNodes;
    let lgt = children.length;
    for (let i = 0; i < lgt; i++) {
      console.info('digDeeper(): i' + i + ', ', children[i]);
      if (children[i].nodeType === Node.TEXT_NODE) continue;
      var currentNodeName = children[i].nodeName;
      if (['expansion'].includes(currentNodeName)) continue;
      console.info('digDeeper currentNodeName: ', currentNodeName);
      if (currentNodeName == 'section') {
        vodScore = digDeeper(children[i]);
        console.info('digDeeper returned vodScore: ', vodScore);
        continue;
      }
      if (currentNodeName == 'measure') {
        countBreaks = true;
      }
      if (countBreaks && ['sb', 'pb'].includes(currentNodeName)) {
        p++;
        continue;
      }
      if (currentNodeName == 'ending' && (children[i].querySelector('sb, pb'))) {
        p++; // find breaks within ending and add it then to vodScore
      }
      if (p >= pageNo - 1 && p < pageNo) {
        vodScore.appendChild(children[i].cloneNode(true));
        console.info('digDeeper adds child to vodScore: ', vodScore);
      }
      if (p >= pageNo) break;
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
