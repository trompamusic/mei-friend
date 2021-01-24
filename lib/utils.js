'use babel';


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

// creates a random ID value in Verovio style
export function generateUUID() {
  let tmp = Math.round((Math.random() * 32768) * (Math.random() * 32768)).toString();
  uuid = '';
  for (let i = 0; i < 16 - tmp.length; i++) {
    uuid += '0';
  }
  return uuid + tmp;
}
