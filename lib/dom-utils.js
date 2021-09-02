'use babel';

// scans through SVG starting from element to find next element elementName
// (e.g. 'note'), within same staff and layer
export function getIdOfNextSvgElement(currentElement, direction = 'forwards',
  elementNames = '.note, .rest, .mRest, .beatRpt, .halfmRpt, .mRpt',
  incr = 'all') {
  let startChord = currentElement.closest('.chord');
  startChordId = '';
  if (startChord) startChordId = startChord.getAttribute('id');
  let startMeasureId = currentElement.closest('.measure').getAttribute('id');
  let layerNo = currentElement.closest('.layer').getAttribute('data-n');
  let staffNo = currentElement.closest('.staff').getAttribute('data-n');
  let elementList = Array.from(document.querySelectorAll(elementNames));
  // console.info("getIdOfNextSvgElement: elementList ", elementList);
  if (direction == 'backwards') elementList.reverse();
  let found = false;
  for (i of elementList) {
    if (found &&
      i.closest('.layer').getAttribute('data-n') == layerNo &&
      i.closest('.staff').getAttribute('data-n') == staffNo) {
      let currentChord = i.closest('.chord');
      if (currentChord && currentChord.getAttribute('id') == startChordId)
        continue;
      if (incr == 'measure') {
        let currentMeasure = i.closest('.measure');
        if (direction == 'backwards') { // to find first element of measure
          return this.getFirstInMeasure(currentMeasure, elementNames, staffNo, layerNo);
        }
        if (currentMeasure &&
          currentMeasure.getAttribute('id') == startMeasureId)
          continue;
      }
      return i.getAttribute("id"); // remember id of next element
    }
    if (i.getAttribute('id') === currentElement.getAttribute('id'))
      found = true;
  }
  // console.info('getIdOfNextSvgElement: return empty string for ' +
  //   currentElement.getAttribute('id') + ', ' + direction);
  return '';
}

export function getFirstInMeasure(element, list, staffNo, layerNo) {
  let foundElementId = '';
  let staff = element.querySelector('.staff[data-n="' + staffNo + '"]');
  if (staff) {
    let el;
    let layer = staff.querySelector('.layer[data-n="' + layerNo + '"]');
    if (layer) {
      el = layer.querySelector(list);
    } else {
      el = staff.querySelector(list);
    }
    if (el) foundElementId = el.getAttribute('id');
  }
  return foundElementId;
}

export function getLastInMeasure(element, list, staffNo, layerNo) {
  let foundElementId = '';
  let staff = element.querySelector('.staff[data-n="' + staffNo + '"]');
  console.info('staff: ', staff);
  if (staff) {
    let els;
    let layer = staff.querySelector('.layer[data-n="' + layerNo + '"]');
    console.info('layer: ', layer);
    if (layer) {
      els = layer.querySelectorAll(list);
    } else {
      els = staff.querySelectorAll(list);
    }
    if (els) foundElementId = els[els.length - 1].getAttribute('id');
    console.info('els: ', els);
  }
  return foundElementId;
}
