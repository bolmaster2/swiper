# swiper.js
A lightweight js that makes lists "swipeable" for touch devices (such as iphone, ipad, android). 

## Features
- Support for swipers inside swipers
- Support for swiping with the mouse for desktops (for browsers with standard event handling)

## Usage
swiper.js handles the swiping for you. All you have to do is have a list element wrapped in a div in your markup like this:

``` html
<div class="swipes">
  <ul id="swiper-1">
  	<li><img src="img/1.jpg" alt="" /></li>
  	<li><img src="img/2.jpg" alt="" /></li>
  	<li><img src="img/3.jpg" alt="" /></li>
  </ul>
</div>
```

and then include the js and run it:

``` html
<script src="swiper.js"></script>
<script>
	var my_swiper = new Swiper(document.getElementById("swiper-1"));
</script>
```

## Demos
- [Basic demo](http://blmstr.github.com/swiper/)
- [Multiple swiper demo](http://blmstr.github.com/swiper/dev.html)