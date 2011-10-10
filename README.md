# swiper.js
A lightweight js that makes list "swipeable" for touch devices (such as iphone, ipad, android)

swiper.js handles the swiping for you. All you have to do is have a list (wrapped inside a div) in your markup like this:

``` html
<div class="swipes">
  <ul class="inner" id="touch-container">
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
	new Swiper(document.getElementById("touch-container"));
</script>
```
