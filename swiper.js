
/**
 * Slider for touch devices - makes a list swipeable
 * @author Joel Larsson @joellarsson
 * @url https://github.com/blmstr/swiper
 * @param el the list element (ul)
 *
 **/
function Swiper(el) {

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
  
  // options
  var o = {
    "snap": true, // snap to element?
    "slide_strength": 5000, // how far should the element slide when you swipe?
    "transition_speed": 250, // the transition speed when swiped
    "animation_type": "linear" // type of swipe animation
  };
  
  function init() {
    // set styles
    set_styles();
    
    // bind resize events
    window.addEventListener("resize", set_styles);
    window.addEventListener("orientationchange", set_styles);
    
    // bind touch start event
    viewport.addEventListener("touchstart", touch_start, false);
  }
  
  // touch start
  function touch_start(e) {
    
    // get the start values
    start_x = cur_pos;
    start_x_offset = event.targetTouches[0].pageX;
    start_y_offset = event.targetTouches[0].pageY;
    touch_start_time = new Date().getTime();
    
    // reset the transition duration
    for (var k in dom_prefixes) {
      viewport.style[dom_prefixes[k] + "TransitionDuration"] = "0ms";
    }
    
    // bind the move and end events
    viewport.addEventListener("touchmove", touch_move, false);
    viewport.addEventListener("touchend", touch_end, false);
  };
  
  // cancel the touch - unbind the events
  function cancel_touch() {
    viewport.removeEventListener('touchmove', touch_move);
    viewport.removeEventListener('touchend', touch_end);
  }
  
  // touch move
  function touch_move(e) {
    
    diff = e.targetTouches[0].pageX;
    
    // cancel touch if more than 1 fingers
    if (e.touches.length > 1) {
      cancel_touch();
    } else {
      // the x and y movement
      var dx = e.touches[0].pageX - start_x_offset,
      dy = e.touches[0].pageY - start_y_offset;
       
      // is the swipe more up/down then left/right? if so - cancel the touch events
      if ((Math.abs(dy) > 1 && Math.abs(dx) < 5) && !lock_x) {   
        cancel_touch();
        return;
      } else {
        // the swipe is mostly going in the x-direction - let the elements follow the finger
        cur_pos = start_x + diff - start_x_offset;
        
        // move the viewport with css3 transform
        for (var k in dom_prefixes) {
          viewport.style[dom_prefixes[k] + "Transform"] = 'translate3d(' + cur_pos + 'px, 0, 0)';
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
    viewport.removeEventListener("touchmove", touch_move, false);

    // push the element a bit more depending on sliding speed...
    // a bit of math vars
    var slide_adjust = (new Date().getTime() - touch_start_time) * 25,
      change_x = o.slide_strength * (Math.abs(start_x) - Math.abs(cur_pos)),
      slide_adjust = Math.round(change_x / slide_adjust),
      new_left = slide_adjust + cur_pos;

    // snap to closest element
    if (o.snap) {
      new_left = -get_closest_element(viewport, new_left).offsetLeft;
    }

    // do the transition!
    for (var k in dom_prefixes) {
      viewport.style[dom_prefixes[k] + "Transition"] = 'all '+o.transition_speed+'ms ' + o.animation_type;
      viewport.style[dom_prefixes[k] + "Transform"] = 'translate3d(' + new_left + 'px, 0, 0)';
    }
    // save the new position
    cur_pos = new_left;
    
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

  init();
}

// external helpers
// set multiple style rules
function style_me(el, styles) {
  // if multiple elements, loop through all the elements
  // if (toString.call(el) === "[object HTMLCollection]") {
  //   for (var k in el) {style_me(el[k], styles);}
  //   return;
  // }
  // loop the style rules and set them
  for (var k in styles) {
    if (el.style) {
      if (k == "float") {el.style.cssFloat = styles[k];}
      el.style[k] = styles[k];
    }
      
  }
  return;
}