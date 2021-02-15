'use babel';

/* Verovio on Diet mode: just feed the current excerpt of the MEI encoding
*  to Verovio, so minimize loading times.
*  Currently only for --breaks = line, encoded
*/

nameSpace = 'http://www.music-encoding.org/ns/mei';

// returns complete MEI code of given page (one-based), defined by sb and pb
export function getVodPage(xmlDoc, systemNo = 1) {
  elements = xmlDoc.querySelectorAll("measure, sb, pb");
  console.info('loadXml: breaks: ', elements);

  scoreDefs = xmlDoc.getElementsByTagName("scoreDef");
  // console.info('scoreDef: ', scoreDefs);

  console.info('getVodPage: ' + systemNo);

  // construct new MEI node
  vodNode = minimalMEIFile(xmlDoc);
  vodNode.querySelector('score').appendChild(scoreDefs.item(0).cloneNode(true));
  vodNode.querySelector('score').appendChild(document.createElementNS(nameSpace, 'section'));
  vodNode.querySelector('section').appendChild(document.createElementNS(nameSpace, 'pb'));
  if (systemNo > 1) {
    vodNode.querySelector('section').appendChild(dummyMeasure(xmlDoc));
    vodNode.querySelector('section').appendChild(document.createElement('sb'));
  }

  // find systemNo
  sb = 0;
  pb = 0;
  for (let i = 0; i < elements.length; i++) {
    if (elements.item(i).nodeName == 'sb' && i > 0) {
      sb++;
      continue;
    }
    if (elements.item(i).nodeName == 'pb' && i > 0) {
      pb++;
      continue;
    }
    if (sb + pb >= systemNo - 1 && sb + pb < systemNo) {
      vodNode.querySelector('section').appendChild(elements.item(i).cloneNode(true));
    }
    if (sb + pb >= systemNo) break;
  }
  console.info('vodNode\n:', vodNode);
  const serializer = new XMLSerializer();
  return xmlDefs + serializer.serializeToString(vodNode);
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

export function minimalMEIFile(xmlNode) {
  var mei = xmlNode.createElementNS(nameSpace, 'mei');
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
  mei.appendChild(meiHead);
  //
  music = xmlNode.createElement('music');
  body = xmlNode.createElement('body');
  mdiv = xmlNode.createElement('mdiv');
  score = xmlNode.createElement('score');
  mdiv.appendChild(score);
  body.appendChild(mdiv);
  music.appendChild(body);
  mei.appendChild(music);
  return mei;
}
// `
// <mei xmlns="http://www.music-encoding.org/ns/mei" meiversion="4.0.0">
// <meiHead>
//    <fileDesc>
//       <titleStmt>
//          <title>Verovio on Diet</title>
//       </titleStmt>
//       <pubStmt>
//          <respStmt>
//               <persName role="encoder" auth.uri="http://d-nb.info/gnd" auth="GND" codedval="1138881465">WG</persName>
//          </respStmt>
//       </pubStmt>
//    </fileDesc>
// </meiHead>
// <music><body><mdiv><score></score></mdiv></body></music>
// </mei>
//  `;

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
