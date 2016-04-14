'use strict';

// Events class, intended to be extended.

// Example:
// ```js
// var e = new Events();
// 
// function boom() {
//   console.log('big bada boom');
// }
// 
// e.on('explode', boom);
// e.on('explode', function() { console.log('holy shit that was one hell of an explosion'); });
//
// e.fire('explode');
// // 'big bada boom'
// // 'holy shit that was one hell of an explosion'
//
// e.off('explode', boom);
// 
// e.fire('explode');
// // 'holy shit that was one hell of an explosion'
// ```

class Events {

  constructor() {
    this.events = {};
  }

  on(name, callback) {
    this.events[name] = this.events[name] || [];
    this.events[name].push(callback);
  }

  off(name, callback) {
    
    this.eachEvent(name, function(ev, i) {
      if(ev == callback) {
        this.events[name].splice(i, 1);
        return true;
      }
    })
    
  }

  emit(name, data) {
    
    this.eachEvent(name, function(ev) {
      ev(data);
    })
    
  }

  eachEvent(name, callback) {
    this.events[name] = this.events[name] || [];

    for(var i=0; i<this.events[name].length; i++) {
      if(callback(this.events[name][i], i)) break;
    }
    
  }

}

module.exports = Events;

