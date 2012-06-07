"use strict";
/**
 * Slider for touch devices - makes a list swipeable
 * @author Joel Larsson @joellarsson
 * @url https://github.com/blmstr/swiper
 * @version 0.6.0.8
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
  this.parent_swiper = null;
  
  this.pos = 0;
  this.el_start_x = 0;
  this.index = 0;
  this.current_offset = 0;
  this.current_page_x_offset = 0;
  this.is_touch = is_touch_device();
  
  // private vars
  var viewport = el.parentNode,
      start_y = 0,
      touch_start_time,
      start_page_x_offset = 0,
      start_page_y_offset = 0,
      direction = null, 
      lock_x = false,
      dom_prefixes = "Webkit Moz O ms Khtml".split(" "),
      delta_x = 0,
      moving_el, // the current moving element
      moving_parent = false, // status var: are we moving a parent?
      children_num = el.children.length;
  
  function event_props(e) {
    return {
      'page_x': e.pageX || e.touches[0].pageX,
      'page_y': e.pageY || e.touches[0].pageY
    }
  }
  var events = {
    'start': this.is_touch ? "touchstart" : "mousedown",
    'move': this.is_touch ? "touchmove" : "mousemove",
    'stop': this.is_touch ? "touchend" : "mouseup"
  }
  
  // default options
  var o = {
    "snap": true, // snap to element?
    "slide_strength": 25000, // how far should the element slide when you swipe?
    "transition_speed": 250, // the transition speed when swiped
    "animation_type": "linear", // type of swipe animation
    "support_mouse": false, // support mouse swiping - experimental
    "after_swipe_callback": null, // callback after a swipe is finished
    "set_sizes": true, // should swiper set width on the elements?
    "only_slide_one_el": true // should we be able to "swipe away" the element more than one element? No!
  };
  // override the default options with the params
  for (var k in params) {
    o[k] = params[k];
  }
  
  function init() {
    
    // Stop here if we don't want to support mouse swiping on non touch devices (or when addeventlistener isn't supported)
    if ((!self.is_touch && !o.support_mouse) || !window.addEventListener) {
      return false;
    }
    
    // if swipers array doenst yet exist - go ahead and create it
    if (typeof window.swipers == 'undefined')
      window.swipers = [];

    // push this into swipers array
    window.swipers.push(self);

    for (var i = 0, len = window.swipers.length; i < len; i++) {
      if (find_parent(self.el, window.swipers[i].el))
        self.parent_swiper = window.swipers[i];
    }
    
    // set styles on the elements
    if (o.set_sizes) {
      // set styles now
      set_sizes();
      
      // ... and when the window is resized
      if (self.is_touch) {
        window.addEventListener("orientationchange", set_sizes);
      } else {
        window.addEventListener("resize", set_sizes);
      }
    }

    // bind touch start event
    el.addEventListener(events.start, touch_start, false);
  }
  
  // touch start
  function touch_start(e) {
    if (!self.is_touch)
      e.preventDefault();
    
    // reset the transition duration
    for (var k in dom_prefixes) {
      el.style[dom_prefixes[k] + "TransitionDuration"] = "0ms";
    }
    
    // Create support for swipers inside swipers. If there's already a swiper active. Don't go further.
    if (typeof window.swiper_active == "undefined" || window.swiper_active == false) {
      window.swiper_active = true;
    } else {
      // another swiper is active. stop this
      return false;
    }
    // reset the delta x
    delta_x = 0;

    // set the start x to the current position of the current element
    self.el_start_x = self.pos;
    
    // Get the x/y offsets
    start_page_x_offset = event_props(e).page_x;
    start_page_y_offset = event_props(e).page_y;
    
    // save the time
    touch_start_time = new Date().getTime();

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
    // are we moving a parent?
    moving_parent = false;
    // the moving el
    moving_el = el;
    // the current page x offset 
    self.current_page_x_offset = event_props(e).page_x;
    
    // cancel touch if more than 1 fingers
    if (self.is_touch && e.touches.length > 1) {
      cancel_touch();
    } else {
      // the x and y movement
      var delta_x = self.current_page_x_offset - start_page_x_offset,
      delta_y = event_props(e).page_y - start_page_y_offset; 
      
      // is the swipe more up/down then left/right? if so - cancel the touch events
      if ((Math.abs(delta_y) > 1 && Math.abs(delta_x) < 5) && !lock_x) {   
        cancel_touch();
        return;
      } else {
        // if we are on the first or last slide we should move the parent element if we have on OR increase resistance if we dont.
        if (self.index == 0 && delta_x > 0 || self.index == children_num - 1 && delta_x < 0) {
          // if we have a parent - move that!
          if (self.parent_swiper) {
            moving_parent = true;
            moving_el = self.parent_swiper.el;
            delta_x = -delta_x;
            
          } else {
            // otherwise increase the resistance
            // delta_x = (delta_x / (Math.abs(delta_x) / viewport.clientWidth + 1)) * 1;
          }
        } else {      
          delta_x = 0;
        }
        
        // set the pos if we dont move a parent
        if (!moving_parent) {
          self.pos = self.el_start_x + self.current_page_x_offset - start_page_x_offset;
        }
        // save the current offset (pos) for later use
        self.current_offset = (-delta_x) + (moving_parent ? self.parent_swiper.pos : self.pos);

        // move the el with css3 transform
        for (var k in dom_prefixes) {
          moving_el.style[dom_prefixes[k] + "Transform"] = 'translate3d(' + self.current_offset + 'px, 0px, 0px)';
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
    var current_swiper = moving_parent ? self.parent_swiper : self;
    var pos = moving_parent ? self.current_offset : self.pos;
    // set global swiper actice var to false to make room for another swiper
    window.swiper_active = false;
    lock_x = false;
    window.removeEventListener(events.move, touch_move, false);
    window.removeEventListener(events.stop, touch_end, false);

    // push the element a bit more depending on sliding speed...
    // a bit of math vars
    var slide_adjust = (new Date().getTime() - touch_start_time) * 50,
        change_x = o.slide_strength * (Math.abs(current_swiper.el_start_x) - Math.abs(pos)),
        slide_adjust = change_x && slide_adjust ? Math.round(change_x / slide_adjust) : 0,
        new_left = slide_adjust + pos;

    // abort if we slide to the left and on the first slide
    if (!moving_parent && (((current_swiper.el_start_x - current_swiper.pos) < 0 && current_swiper.index == 0) || ((current_swiper.el_start_x - current_swiper.pos) > 0 && current_swiper.index == current_swiper.el.children.length-1))) {
      current_swiper.goto_index(current_swiper.index);
      return;
    }
    
    // snap to closest element
    if (o.snap) {
      var closest_el = get_closest_element(moving_el || el, new_left);
      var closest_el_index = current_swiper.get_index_of_el(closest_el);

      // how big is the difF?
      var diff = Math.abs(current_swiper.index - closest_el_index);

      // never swipe away more than one element. if diff is bigger than 0 we have swiped good enough to send away
      if (o.only_slide_one_el && diff > 0) {
        var direction = start_page_x_offset - self.current_page_x_offset;
        // to the left
        if (direction < 0) {
          current_swiper.goto_index(current_swiper.index-1);
        } else {
          current_swiper.goto_index(current_swiper.index+1);
        }
        return;
      }
      new_left = closest_el ? -(closest_el_index * viewport.clientWidth) : 0;
    }
    
    // Go to the new position!
    current_swiper.goto_pos(new_left);

  };
  
  // set the sizes (width) on the elements
  function set_sizes() {

    // get the width from the viewports parent
    var w = viewport.parentNode.clientWidth,
        unit = "px";

    if (parseInt(w) == 0) {
      w = parseInt(viewport.parentNode.style.width);
    }

    
    // the viewport get the width
    viewport.style.width = w+unit;
    
    // set a width that's big enough for the children inside
    el.style.width = (el.children.length * w) + unit;
    
    // set a width on all the children
    for (var i = 0, els = el.children, len = els.length; i < len; i++) {
      els[i].style.width = w+unit;
    }

  }

  // Get the closest element to a "viewport"
  function get_closest_element(parent, pos) {
    if (parent) {
      // the vars
      var children = parent.children,
          min = 9999999,
          current_pos = Math.abs(pos),
          el = null;
      
      // loop through our childrens to find the closest one to our parent (aka "viewport")
      for (var i = 0, len = children.length; i < len; i++) {
        // get our "value"; that is the current children's offset minus our current position
        var value = (i * viewport.clientWidth) - current_pos;
        // flip the value from negative to positive to get the same results from elements from both left and right side 
        if (value < 0)
          value = -value;
        
        // lets find the lowest value (aka closest element)
        if (value < min) {
          min = value;
          el = children[i];
        }
      }
    }
    // return the element
    return el;
  };
  
  // Get the current element in the viewport
  function get_current_el_in_view() {
    return get_closest_element(el, self.pos);
  }
  
  // get index of specific el
  function get_index_of_el(el) {
    for (var i = 0, len = children_num; i < len; i++) {
      if (self.el.children[i] == el) {
        return i;
      }
    }
  }
  this.get_index_of_el = get_index_of_el;
  
  // Reset the positioning. Go back to the start position
  this.reset = function() {
    // go to slide without animation
    self.goto_index(0, false);
  };
  
  // Go to specific element
  // @param goto_el {Li List element} The element to go to
  this.goto_el = function(goto_el) {
    self.goto_index(get_index_of_el(goto_el));
    return goto_el;
  };
  
  // Go to specific element by list item number
  // @param index {Number} The index of element to go to
  this.goto_index = function(i, animate) {
    self.goto_pos(-(viewport.clientWidth * i), animate);
  }
  
  // Go to specific position
  // @param x {Integer} The x-value to send the list item to (preferable a negative value)
  this.goto_pos = function(x, animate) {
    // animate optio, default to true
    animate = typeof animate == "undefined" ? true : animate;
    // update index
    for (var i = 0; i < children_num; i++) {
      if (-(viewport.clientWidth * i) == x) {
        self.set_index(i);
      }
    }

    // do the transition!
    for (var k in dom_prefixes) {
      // animate it with transition or not?
      if (animate)
        el.style[dom_prefixes[k] + "Transition"] = 'all '+o.transition_speed+'ms ' + o.animation_type;
      else
        el.style[dom_prefixes[k] + "Transition"] = 'none';
      
      // set the transform - remove the transform if it's 0 (performance)
      if (x == 0)
        el.style[dom_prefixes[k] + "Transform"] = 'none';
      else
        el.style[dom_prefixes[k] + "Transform"] = 'translate3d(' + x + 'px, 0px, 0px)';
    }
    // save the new position
    self.pos = x;
    
     // Run callback after the transition speed
      setTimeout(function() {
        
        // after swipe callback
        if (o.after_swipe_callback)
          o.after_swipe_callback.call(self);
          
      }, o.transition_speed);
    
    return x;
  };
  // Go to next item in list
  this.goto_next = function() {
    if (self.el.children[self.index+1]) 
      self.goto_index(self.index+1);
  }
  // Go to previous item in list
  this.goto_prev = function() {
    if (self.el.children[self.index-1]) 
      self.goto_index(self.index-1);
  }
  
  this.get_index = function() {
    return self.index;
  }
  this.set_index = function(i) {
    self.index = i;
  }
  
  // unload swiper. killl event listenerse etc
  this.unload = function() {
    window.removeEventListener("orientationchange", set_sizes);
    window.removeEventListener("resize", set_sizes);
    window.removeEventListener(events.start, touch_start);
    window.removeEventListener(events.move, touch_move);
    window.removeEventListener(events.stop, touch_end);
  }

  init();
}

// external helpers

// Check to see if we can create touch events to see if it's a "touch device"
function is_touch_device() {
  return !!('ontouchstart' in window);
}

// test if child is child of parent
function find_parent(child, parent) {
  var child_parent = child.parentNode;
  while (child_parent != parent) {
    if (child_parent.parentNode)
      child_parent = child_parent.parentNode;
    else
      return false;
  }
  return child_parent;
}