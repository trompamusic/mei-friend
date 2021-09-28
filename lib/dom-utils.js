'use babel';

export const navigationElementsSelector =
  '.note, .rest, .mRest, .beatRpt, .halfmRpt, .mRpt';

// scans through SVG starting from element to find next element elementName
// (e.g. 'note'), within same staff and layer
export function getIdOfNextSvgElement(currentElement, direction = 'forwards',
  elNames = navigationElementsSelector, incr = 'all') {
  let startChord = currentElement.closest('.chord');
  startChordId = '';
  if (startChord) startChordId = startChord.getAttribute('id');
  let startMeasureId = currentElement.closest('.measure').getAttribute('id');
  let layerNo = currentElement.closest('.layer').getAttribute('data-n');
  let staffNo = currentElement.closest('.staff').getAttribute('data-n');
  let elementList = Array.from(document.querySelectorAll(elNames));
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
        let currMeas = i.closest('.measure');
        if (direction == 'backwards') { // to find first element of measure
          let e = this.getFirstInMeasure(currMeas, elNames, staffNo, layerNo);
          console.info('backwards in measure: ', e);
          return e;
        }
        if (currMeas &&
          currMeas.getAttribute('id') == startMeasureId)
          continue;
      }
      console.info('id found: ', i.getAttribute('id'));
      return i.getAttribute("id"); // remember id of next element
    }
    if (i.getAttribute('id') === currentElement.getAttribute('id'))
      // TODO: make x comparison here: || if i.getX() >= currentElement.getX()
      found = true;
  }
  console.info('getIdOfNextSvgElement: return empty string for ' +
    currentElement.getAttribute('id') + ', ' + direction);
  return '';
}

export function getFirstInMeasure(element, list, staffNo, layerNo) {
  let foundElementId = '';
  let staff = element.querySelector('.staff[data-n="' + staffNo + '"]');
  // console.info('getFirstInMeasure: staff ', staff);
  if (staff) {
    let el;
    let layer = staff.querySelector('.layer[data-n="' + layerNo + '"]');
    // console.info('getFirstInMeasure: layer ', layer);
    if (layer) {
      el = layer.querySelector(list);
    } else {
      el = staff.querySelector(list);
    }
    // console.info('getFirstInMeasure: el ', el);
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

// returns true when elementId is the first in SVG page in same staff & layer
export function isFirstElement(elementId) {
  if (elementId == '') return true;
  let el = document.querySelector('g#' + elementId);
  let thisM = el.closest('.measure');
  let staffNo = el.closest('.staff').getAttribute('data-n');
  let layerNo = el.closest('.layer').getAttribute('data-n');
  console.info('isFirstElement thisM: ', thisM);
  console.info('isFirstElement st/ly: ' + staffNo + '/' + layerNo);
  let thisId = getFirstInMeasure(thisM,
    navigationElementsSelector, staffNo, layerNo)
  let m = document.querySelector('.measure');
  let firstId = getFirstInMeasure(m,
    navigationElementsSelector, staffNo, layerNo)
  console.info('isFirstElement: firstId: ' + firstId + ', thisId: ' + thisId +
    ', BOOL: ' + (thisId == firstId));
  return (thisId == firstId);
}

export function getX(element) {
  let x = [];
  if (element.getAttribute('class').includes("chord")) {
    let els = element.querySelectorAll('g.note');
    els.forEach((item, i) => {
      x.push(getX(item));
    });
  } else if (element.getAttribute('class').includes("note")) {
    // (navigationElementsSelector.some(el =>
    // element.getAttribute('class').includes(el)) {
    let els = element.querySelectorAll('use[x]');
    els.forEach((item, i) => {
      x.push(parseInt(item.getAttribute('x')));
    });
  }
  return median(x);
}

export function median(numbers) {
  const sorted = numbers.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[middle - 1] + sorted[middle]) / 2;
  return sorted[middle];
}
