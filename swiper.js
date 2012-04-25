"use strict";
/**
 * Slider for touch devices - makes a list swipeable
 * @author Joel Larsson @joellarsson
 * @url https://github.com/blmstr/swiper
 * @version 0.5
 * Licensed under the MIT license
 *
 * @param el {HTMLUListElement} The list element
 * @param params {Object} The options object
 *
 **/
function Swiper(el, params) {
  var self = this;
  
  // expose "public" vars
  this.el = el;
  
  // if swipers arr doenst yet exist - go ahead and create it
  if (typeof window.swipers == 'undefined')
    window.swipers = [];
    
  // push this into swipers arr
  window.swipers.push(this);
  
  get_parent();
  
  function get_parent() {
    
    for (var i=0; i < window.swipers.length; i++) {

      if (find_parent(self.el, window.swipers[i].el))
        self.parent_swiper = find_parent(self.el, window.swipers[i].el);
    }
    
  }
  
  // private vars
  var viewport = el.parentNode,
      start_x = 0,
      start_y = 0,
      cur_pos = 0,
      touch_start_time,
      start_x_offset = 0,
      start_y_offset = 0,
      direction = null, 
      lock_x = false,
      dom_prefixes = "Webkit Moz O ms Khtml".split(" "),
      delta_x = 0,
      index = 0;
  
  function event_props(e) {
    return {
      'page_x': e.pageX || e.touches[0].pageX,
      'page_y': e.pageY || e.touches[0].pageY
    }
  }
  var events = {
    'start': is_touch_device() ? "touchstart" : "mousedown",
    'move': is_touch_device() ? "touchmove" : "mousemove",
    'stop': is_touch_device() ? "touchend" : "mouseup"
  }
  
  // default options
  var o = {
    "snap": true, // snap to element?
    "slide_strength": 25000, // how far should the element slide when you swipe?
    "transition_speed": 250, // the transition speed when swiped
    "animation_type": "linear", // type of swipe animation
    "support_mouse": false, // support mouse swiping - experimental
    "after_swipe_callback": null,
    "set_styles": true, // should swiper set css styles on the elements?
    "only_slide_one_el": true // should we be able to "swipe away" the element more than one element? No!
  };
  // override the default options with the params
  for (var k in params) {
    o[k] = params[k];
  }
  
  function init() {
    
    // Stop here if we don't want to support mouse swiping on non touch devices (or when addeventlistener isn't supported)
    if ((!is_touch_device() && !o.support_mouse) || !window.addEventListener) {
      return false;
    }
    
    // set styles on the elements
    if (o.set_styles) {
      set_styles();
      window.addEventListener("orientationchange", set_styles);
      // bind resize events
      window.addEventListener("resize", set_styles);
    }
      
    
      
    // bind touch start event
    el.addEventListener(events.start, touch_start, false);
  }
  
  // touch start
  function touch_start(e) {
    if (!is_touch_device())
      e.preventDefault();
  
    // Create support for swipers inside swipers. If there's already a swiper active. Don't go further.
    if (typeof window.swiper_active == "undefined" || window.swiper_active == false) {
      window.swiper_active = true;
    } else {
      window.swiper_active = true;
      return false;
    }
  
    delta_x = 0;

    // get the start values
    start_x = cur_pos;
    start_x_offset = event_props(e).page_x;
    start_y_offset = event_props(e).page_y;
    touch_start_time = new Date().getTime();
    
    // reset the transition duration
    for (var k in dom_prefixes) {
      el.style[dom_prefixes[k] + "TransitionDuration"] = "0ms";
    }
    
    // bind the move and end events
    window.addEventListener(events.move, touch_move, false);
    window.addEventListener(events.stop, touch_end, false);
  };
  
  // cancel the touch - unbind the events
  function cancel_touch() {
    window.swiper_active = false;
    window.removeEventListener(events.move, touch_move);
    window.removeEventListener(events.stop, touch_end);
  }
  
  // touch move
  function touch_move(e) {

    var diff = event_props(e).page_x;
    
    // cancel touch if more than 1 fingers
    if (is_touch_device() && e.touches.length > 1) {
      cancel_touch();
    } else {
      // the x and y movement
      var delta_x = event_props(e).page_x - start_x_offset,
      delta_y = event_props(e).page_y - start_y_offset; 
      
       
      // is the swipe more up/down then left/right? if so - cancel the touch events
      if ((Math.abs(delta_y) > 1 && Math.abs(delta_x) < 5) && !lock_x) {   
        cancel_touch();
        return;
      } else {

        // the swipe is mostly going in the x-direction - let the elements follow the finger
        cur_pos = start_x + diff - start_x_offset;
        
        // in which direction are we swiping?
        var dir = (diff - start_x_offset > 0) ? 'left' : 'right';
        
        // add direction classes
        if (dir == 'left' && !has_class(el, 'left')) {
          remove_class(el, 'swiping-right');
          add_class(el, 'swiping-'+dir);
        } else if (dir == 'right' && !has_class(el, 'right')) {
          remove_class(el, 'swiping-left');
          add_class(el, 'swiping-'+dir);
        }
        
        /*
          TODO swipe parent
        */
        var moving_el;
        
        // if we are on the first or last slide
        if (index == 0 && delta_x > 0 || index == el.children.length - 1 && delta_x < 0) {
          
          // increase resistance
          //delta_x = (delta_x / (Math.abs(delta_x) / viewport.clientWidth + 1)) * 1;
          
          if (self.parent_swiper) {
            moving_el = self.parent_swiper;
          } else {
            moving_el = el;
          }
          
        } else {
          
          delta_x = 0;
          
          moving_el = el;
          
        }
        
        
        // move the el with css3 transform
        for (var k in dom_prefixes) {
          moving_el.style[dom_prefixes[k] + "Transform"] = 'translate3d(' + ((-delta_x) + cur_pos) + 'px, 0px, 0px)';
          // el.style[dom_prefixes[k] + "Transform"] = 'translate(' + cur_pos + 'px, 0px)';
        }

        // set lock x to true and also prevent defaults to prevent scrolling in the y-direction
        lock_x = true;
        
        e.preventDefault();        
        return;
      }
    }

  };
  
  // touch end
  function touch_end(e) {
    // set global swiper actice var to false to make room for another swiper
    window.swiper_active = false;
    lock_x = false;
    window.removeEventListener(events.move, touch_move, false);

    // push the element a bit more depending on sliding speed...
    // a bit of math vars
    var slide_adjust = (new Date().getTime() - touch_start_time) * 50,
        change_x = o.slide_strength * (Math.abs(start_x) - Math.abs(cur_pos)),
        slide_adjust = change_x && slide_adjust ? Math.round(change_x / slide_adjust) : 0,
        new_left = slide_adjust + cur_pos;
    
    // abort if we slide to the left and on the first slide
    if (((start_x - cur_pos) < 0 && index == 0) || ((start_x - cur_pos) > 0 && index == el.children.length-1)) {
      self.goto_index(index);
      return;
    }
    
    // snap to closest element
    if (o.snap) {
      var closest_el = get_closest_element(el, new_left);
      
      // how big is the difF?
      var diff = Math.abs(index - get_index_of_el(closest_el));
      // never swipe away more than one element. if diff is bigger than 0 we have swiped good enough to send away
      if (o.only_slide_one_el && diff > 0) {

        // to the left
        if ((start_x - cur_pos) < 0) {
          self.goto_index(index-1)
        } else {
          self.goto_index(index+1)
        }
        
        return;
      }
      
      new_left = -closest_el.offsetLeft;
    }
    
    // Go to the new position!
    self.goto_pos(new_left);
    
  };
  
  // set some styling on the elements
  function set_styles() {
    // get the width from the viewports parent
    var w = viewport.parentNode.clientWidth;
    
    // style the viewport
    style_me(viewport, {"minWidth": "0", "width": w+"px", "overflow": "hidden", "display": "block"});
    
    style_me(el, {"width": "999920px", "display": "block"});
    var els = el.getElementsByTagName("li");
    for (var i = 0; i < els.length; i++) {
      style_me(els[i], {"width": w+"px", "float": "left", "display": "block"});
    }

  }

  // Get the closest element to a "viewport"
  function get_closest_element(parent, cur_pos) {
    
    // the vars
    var children = parent.childNodes,
        min = 9999999,
        current_pos = -parseInt(cur_pos),
        el = null;
    
    // loop through our childrens to find the closest one to our parent (aka "viewport")
    for (var i = 0; i < children.length; i++) {
      // get our "value"; that is the current children's offset minus our current position
      var value = children[i].offsetLeft - current_pos;
      
      // flip the value from negative to positive to get the same results from elements from both left and right side 
      if (value < 0)
        value = -value;
      
      // lets find the lowest value (aka closest element)
      if (value < min) {
        min = value;
        el = children[i];
      }
    }
    // return the element
    return el;
  };
  
  // Get the current element in the viewport
  function get_current_el_in_view() {
    return get_closest_element(el, cur_pos);
  }
  
  // get index of specific el
  function get_index_of_el(el) {
    for (var i = 0, len = self.el.children.length; i < len; i++) {
      if (self.el.children[i] == el) {
        return i;
      }
    }
  }
  
  // Reset the positioning. Go back to the start position
  this.reset = function() {
    self.goto_el(get_closest_element(el, 0));
  };
  
  // Go to specific element
  // @param goto_el {Li List element} The element to go to
  this.goto_el = function(goto_el) {
    self.goto_pos(-goto_el.offsetLeft);
    return goto_el;
  };
  
  // Go to specific element by list item number
  // @param index {Number} The index of element to go to
  this.goto_index = function(i) {
    index = i;
    var goto_el = el.children[i];
    self.goto_pos(-goto_el.offsetLeft);
    return goto_el;
  }
  
  // Go to specific position
  // @param x {Integer} The x-value to send the list item to (preferable a negative value)
  this.goto_pos = function(x) {
    // update index
    for (var i = 0, len = el.children.length; i < len; i++) {
      if (-el.children[i].offsetLeft == x) {
        index = i;
      }
    }

    // do the transition!
    for (var k in dom_prefixes) {
      el.style[dom_prefixes[k] + "Transition"] = 'all '+o.transition_speed+'ms ' + o.animation_type;
      el.style[dom_prefixes[k] + "Transform"] = 'translate3d(' + x + 'px, 0px, 0px)';
    }
    // save the new position
    cur_pos = x;
    
     // Run callback after the transition speed
      setTimeout(function() {
        
        // remove any swiping direction classes
        remove_class(el, 'swiping-left');
        remove_class(el, 'swiping-right');
        
        // after swipe callback
        if (o.after_swipe_callback)
          o.after_swipe_callback.call(self);
          
      }, o.transition_speed);
    
    return x;
  };
  // Go to next item in list
  this.goto_next = function() {
    var current_el = get_current_el_in_view();   
    var next_el = sibling(current_el);
    if (!next_el) 
      return false;
    self.goto_el(next_el);
  }
  // Go to previous item in list
  this.goto_prev = function() {
    var current_el = get_current_el_in_view();
    var prev_el = sibling(current_el, "previous");
    if (!prev_el) 
      return false;
    self.goto_el(prev_el);
  }
  
  this.get_index = function() {
    return index;
  }
  this.set_index = function(i) {
    index = i;
    cur_pos = -el.children[index].offsetLeft;
  }

  init();
}

// external helpers
// set style rules
function style_me(el, styles) {
  // loop the style rules and set them
  for (var k in styles) {
    if (el.style) {
      if (k == "float") {el.style.cssFloat = styles[k];}
      el.style[k] = styles[k];
    }
      
  }
  return;
}

// Check to see if we can create touch events to see if it's a "touch device"
function is_touch_device() {
  return !!('ontouchstart' in window);
}
// Get next or previous sibling - ignores the textcontent elements
function sibling(el, dir) {
  dir = dir || "next";
  do {
    el = el[dir+"Sibling"];
  } while (el && el.nodeType != 1);
  return el;  
}

// has class
function has_class(ele,cls) {
  return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}

// add class
function add_class(ele,cls) {
  if (!has_class(ele,cls)) ele.className += " "+cls.replace(/^\s|\s$/,'');
}

// remove class
function remove_class(ele,cls) {
  if (has_class(ele,cls)) {
    var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
    ele.className=ele.className.replace(reg,' ').replace(/^\s|\s$/,'');
  }
}

function find_parent(child, parent) {
  var test = child.parentNode;
  while(test != parent) {
    
    if (test.parentNode)
      test = test.parentNode;
    else
      return false;
  
  }
  
  return test;
}