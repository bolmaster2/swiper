"use strict";
/**
 * Slider for touch devices - makes a list swipeable
 * @author Joel Larsson @joellarsson
 * @url https://github.com/blmstr/swiper
 * @param el {HTMLUListElement} The list element
 * @param options_param {Object} The options object
 *
 **/
function Swiper(el, options_param) {
  var self = this;
  
  // private vars
  var viewport = el,
      start_x = 0,
      start_y = 0,
      cur_pos = 0,
      touch_start_time,
      start_x_offset = 0,
      start_y_offset = 0,
      direction = null, 
      lock_x = false,
      dom_prefixes = "Webkit Moz O ms Khtml".split(" ");
    
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
    "animation_type": "linear" // type of swipe animation
  };
  // override the default options with the params
  for (var k in options_param) {
    o[k] = options_param[k];
  }
  
  function init() {
    // set styles
    set_styles();
    
    // bind resize events
    window.addEventListener("resize", set_styles);
    window.addEventListener("orientationchange", set_styles);
    
    // bind touch start event
    viewport.addEventListener(events.start, touch_start, false);
  }
  
  // touch start
  function touch_start(e) {
    if (!is_touch_device())
      e.preventDefault();

    // get the start values
    start_x = cur_pos;
    start_x_offset = event_props(e).page_x;
    start_y_offset = event_props(e).page_y;
    touch_start_time = new Date().getTime();
    
    // reset the transition duration
    for (var k in dom_prefixes) {
      viewport.style[dom_prefixes[k] + "TransitionDuration"] = "0ms";
    }
    
    // bind the move and end events
    viewport.addEventListener(events.move, touch_move, false);
    viewport.addEventListener(events.stop, touch_end, false);
  };
  
  // cancel the touch - unbind the events
  function cancel_touch() {
    viewport.removeEventListener(events.move, touch_move);
    viewport.removeEventListener(events.stop, touch_end);
  }
  
  // touch move
  function touch_move(e) {

    var diff = event_props(e).page_x;
    
    // cancel touch if more than 1 fingers
    if (is_touch_device() && e.touches.length > 1) {
      cancel_touch();
    } else {
      // the x and y movement
      var dx = event_props(e).page_x - start_x_offset,
      dy = event_props(e).page_y - start_y_offset; 
       
       
      // is the swipe more up/down then left/right? if so - cancel the touch events
      if ((Math.abs(dy) > 1 && Math.abs(dx) < 5) && !lock_x) {   
        cancel_touch();
        return;
      } else {

        // the swipe is mostly going in the x-direction - let the elements follow the finger
        cur_pos = start_x + diff - start_x_offset;

        // move the viewport with css3 transform
        for (var k in dom_prefixes) {
          viewport.style[dom_prefixes[k] + "Transform"] = 'translate3d(' + cur_pos + 'px, 0px, 0px)';
          viewport.style[dom_prefixes[k] + "Transform"] = 'translate(' + cur_pos + 'px, 0px)';
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
    viewport.removeEventListener(events.move, touch_move, false);

    // push the element a bit more depending on sliding speed...
    // a bit of math vars
    var slide_adjust = (new Date().getTime() - touch_start_time) * 25,
        change_x = o.slide_strength * (Math.abs(start_x) - Math.abs(cur_pos)),
        slide_adjust = change_x && slide_adjust ? Math.round(change_x / slide_adjust) : 0,
        new_left = slide_adjust + cur_pos;

    // snap to closest element
    if (o.snap) {
      new_left = -get_closest_element(viewport, new_left).offsetLeft;
    }
    
    // Go to the new position!
    self.goto_pos(new_left);
    
  };
  
  // set some styling on the elements
  function set_styles() {
    var w = window.innerWidth || document.documentElement.clientWidth;

    style_me(el.parentNode, {"minWidth": "0", "width": w+"px", "overflow": "hidden", "display": "block"});
    
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
  
  // Reset the positioning. Go back to the start position
  this.reset = function() {
    get_closest_element(el, 0);
  };
  
  // Go to specific element
  // @param goto_el {Object} The element to go to
  this.goto_el = function(goto_el) {
    self.goto_pos(-goto_el.offsetLeft);
    return goto_el;
  };
  
  this.goto_pos = function(x) {

    // do the transition!
    for (var k in dom_prefixes) {
      viewport.style[dom_prefixes[k] + "Transition"] = 'all '+o.transition_speed+'ms ' + o.animation_type;
      viewport.style[dom_prefixes[k] + "Transform"] = 'translate3d(' + x + 'px, 0px, 0px)';
      viewport.style[dom_prefixes[k] + "Transform"] = 'translate(' + x + 'px, 0px)';
    }
    // save the new position
    cur_pos = x;
    
    return x;
  };

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
	try {
		document.createEvent("TouchEvent");
    return true;
  } catch (e) {
		return false;
  }
}