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
    "slide_strength": 5000, // how far should the element slide when you swipe?
    "transition_speed": 250, // the transition speed when swiped
    "animation_type": "linear", // type of swipe animation
    "support_mouse": false, // support mouse swiping - experimental
    "after_swipe_callback": null,
    "set_styles": true // should swiper set css styles on the elements?
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
    el.addEventListener(events.move, touch_move, false);
    window.addEventListener(events.stop, touch_end, false);
  };
  
  // cancel the touch - unbind the events
  function cancel_touch() {
    el.removeEventListener(events.move, touch_move);
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
        
        // increase resistance if first or last slide
        if (index == 0 && delta_x > 0 || index == el.getElementsByTagName("li").length - 1 && delta_x < 0) {
          delta_x = delta_x / ( Math.abs(delta_x) / viewport.clientWidth + 1 );
        } else {
          delta_x = 0;
        }

        // move the el with css3 transform
        for (var k in dom_prefixes) {
          el.style[dom_prefixes[k] + "Transform"] = 'translate3d(' + ((-delta_x) + cur_pos) + 'px, 0px, 0px)';
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
    lock_x = false;
    el.removeEventListener(events.move, touch_move, false);

    // push the element a bit more depending on sliding speed...
    // a bit of math vars
    var slide_adjust = (new Date().getTime() - touch_start_time) * 50,
        change_x = o.slide_strength * (Math.abs(start_x) - Math.abs(cur_pos)),
        slide_adjust = change_x && slide_adjust ? Math.round(change_x / slide_adjust) : 0,
        new_left = slide_adjust + cur_pos;

    // snap to closest element
    if (o.snap) {
      var closest_el = get_closest_element(el, new_left);
      new_left = -closest_el.offsetLeft;
      
      // update index
      for (var i = 0, len = el.getElementsByTagName("li").length; i < len; i++) {
        if (el.getElementsByTagName("li")[i] === closest_el) {
          index = i;
        }
      }
      console.log("set index to: "+index);
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
    var children = parent.getElementsByTagName("li"),
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
  this.goto_index = function(index) {
    var goto_el = el.getElementsByTagName("li")[index];
    self.goto_pos(-goto_el.offsetLeft);
    return goto_el;
  }
  
  // Go to specific position
  // @param x {Integer} The x-value to send the list item to (preferable a negative value)
  this.goto_pos = function(x) {

    // do the transition!
    for (var k in dom_prefixes) {
      el.style[dom_prefixes[k] + "Transition"] = 'all '+o.transition_speed+'ms ' + o.animation_type;
      el.style[dom_prefixes[k] + "Transform"] = 'translate3d(' + x + 'px, 0px, 0px)';
    }
    // save the new position
    cur_pos = x;
    
    // Run callback after the transition speed
    if (o.after_swipe_callback) {
      setTimeout(function() {
        o.after_swipe_callback.call(this, x);
      }, o.transition_speed);
    }
    
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