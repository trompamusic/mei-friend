'use babel';

export const navElsSelector =
  '.note, .rest, .mRest, .beatRpt, .halfmRpt, .mRpt';
export const navElsArray = [
  'note', 'rest', 'mRest', 'beatRpt', 'halfmRpt', 'mRpt'
];

// scans through SVG starting from element to find next element elementName
// (e.g. 'note'), within same staff and layer
export function getIdOfNextSvgElement(currEl, dir = 'forwards',
  sel = navElsSelector, incr = 'all') {
  let measure = currEl.closest('.measure');
  let stN = currEl.closest('.staff').getAttribute('data-n');
  let lyN = currEl.closest('.layer').getAttribute('data-n');
  let currChord = currEl.closest('.chord');
  let currChordId = '';
  if (currChord) currChordId = currChord.getAttribute('id');
  if (incr == 'measure' && dir == 'forwards')
    return getIdInNextMeasure(currEl, dir, stN, lyN);
  if (incr == 'measure' && dir == 'backwards') {
    let firstId = getFirstInMeasure(measure, navElsSelector, stN, lyN);
    let currId = currEl.getAttribute('id');
    if (currChord) currId = currChordId;
    let firstChord = document.querySelector('g#'+firstId).closest('.chord');
    if (firstChord) firstId = firstChord.getAttribute('id');
    if (currId == firstId) {
      let id = getIdInNextMeasure(currEl, dir.substring(0, 4), stN, lyN);
      console.info('getIdOfNextElement ' + dir.substring(0, 4) + ', ' +
        stN + '/' + lyN + ', id: ' + id);
      return id;
    } else return firstId;
  }
  let id = '';
  let elementList = Array.from(measure.querySelectorAll(sel));
  if (dir == 'backwards') elementList.reverse();
  // console.info("getIdOfNextSvgElement: elementList ", elementList);
  let found = false;
  for (i of elementList) { // go thru all elements on page
    if (found && i.closest('.staff').getAttribute('data-n') == stN &&
      i.closest('.layer').getAttribute('data-n') == lyN) {
      let ch = i.closest('.chord'); // ignore tones of same chord
      if (ch && ch.getAttribute('id') == currChordId) continue;
      id = i.getAttribute("id"); // if layer-matched -- wonderful!
      break;
    }
    if (i.getAttribute('id') === currEl.getAttribute('id')) found = true;
  }
  if (id) {
    console.info('getIdOfNextSvgElement: staff/layer-matched id: ' + id);
    return id;
  } else {
    id = getIdInNextMeasure(currEl, dir, stN, lyN);
    console.info('getIdOfNextSvgElement: empty string for ' +
      currEl.getAttribute('id') + ', ' + dir + '; new: ' + id);
    return id;
  }
}

// returns id in next (dir = backwards/forwards) measure, at same staff and/or
// layer if existent (otherwise in same staff)
export function getIdInNextMeasure(currEl, dir = 'forwards', stN = 0, lyN = 0) {
  let measureList = Array.from(document.querySelectorAll('.measure'));
  if (dir.startsWith('back')) measureList.reverse();
  let measure = currEl.closest('.measure');
  if (lyN == 0) lyN = currEl.closest('.layer').getAttribute('data-n');
  if (stN == 0) stN = currEl.closest('.staff').getAttribute('data-n');
  let found = false;
  for (m of measureList) {
    // console.info('getIdInNextMeasure ' + dir + ', m: ', m);
    if (found) {
      if (dir == 'backwards')
        return getLastInMeasure(m, navElsSelector, stN, lyN);
      else // forwards, back
        return getFirstInMeasure(m, navElsSelector, stN, lyN);
    }
    if (m.getAttribute('id') === measure.getAttribute('id')) found = true;
  }
}

export function getFirstInMeasure(measure, list, stN, lyN) {
  let foundElementId = '';
  let staff = measure.querySelector('.staff[data-n="' + stN + '"]');
  // console.info('getFirstInMeasure: staff ', staff);
  if (staff) {
    let el;
    let layer = staff.querySelector('.layer[data-n="' + lyN + '"]');
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

export function getLastInMeasure(measure, list, stN, lyN) {
  let foundElementId = '';
  let staff = measure.querySelector('.staff[data-n="' + stN + '"]');
  // console.info('getLastInMeasure staff: ', staff);
  if (staff) {
    let els;
    let layer = staff.querySelector('.layer[data-n="' + lyN + '"]');
    // console.info('layer: ', layer);
    if (layer) {
      els = layer.querySelectorAll(list);
    } else {
      els = staff.querySelectorAll(list);
    }
    if (els) foundElementId = els[els.length - 1].getAttribute('id');
    // console.info('els: ', els);
  }
  return foundElementId;
}

export function getX(element, what = 'median') {
  let x = [];
  if (element.getAttribute('class').includes("chord")) {
    let els = element.querySelectorAll('g.note');
    els.forEach((item, i) => {
      x.push(getX(item));
    });
  } else if (navElsArray.some(el =>
      element.getAttribute('class').includes(el))) {
    // (element.getAttribute('class').includes("note")) {
    let els = element.querySelectorAll('.notehead > use[x]'); // should be one!
    if (els.length == 0) els = element.querySelectorAll('use[x]'); // non-notes
    els.forEach((item, i) => {
      x.push(parseInt(item.getAttribute('x')));
    });
  }
  if (what == 'median') return median(x);
  if (what == 'range') return (Math.max(x) - Math.min(x));
  if (what == 'array') return x;
}

export function getY(element) {
  let y = [];
  if (element.getAttribute('class').includes("chord")) {
    let els = element.querySelectorAll('g.note');
    els.forEach((item, i) => {
      y.push(getY(item));
    });
  } else if (navElsArray.some(el =>
      element.getAttribute('class').includes(el))) {
    let els = element.querySelectorAll('.notehead > use[y]'); // should be one!
    if (els.length == 0) els = element.querySelectorAll('use[y]'); // non-notes
    els.forEach((item, i) => {
      y.push(parseInt(item.getAttribute('y')));
    });
  }
  return median(y);
}

export function median(numbers) {
  const sorted = numbers.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[middle - 1] + sorted[middle]) / 2;
  return sorted[middle];
}

// returns true when element is the first in SVG page in same staff & layer
export function isFirstElementOnPage(id) {
  if (!id) return true;
  let element = document.querySelector('g#' + id);
  if (!element) return true;
  let measure = element.closest('.measure');
  let stN = element.closest('.staff').getAttribute('data-n');
  let lyN = element.closest('.layer').getAttribute('data-n');
  // console.info('isFirstElement this measure: ', measure);
  // console.info('isFirstElement st/ly: ' + stN + '/' + lyN);
  let thisId = getFirstInMeasure(measure, navElsSelector, stN, lyN);
  let m = document.querySelector('.measure');
  let firstId = getFirstInMeasure(m, navElsSelector, stN, lyN);
  console.info('isFirstElement: firstId: ' + firstId + ', thisId: ' + thisId +
    ', BOOL: ' + (thisId == firstId));
  return (thisId == firstId);
}
