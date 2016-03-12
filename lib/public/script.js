
$(document).ready(function() {
  
  $('#header #filename').click(function() {
    $('#header').toggleClass('files-hidden');
  });
  
  $('#header .files-menu a').click(function() {
    $('#header').addClass('files-hidden');
  });

  $('.files').bind('mousewheel DOMMouseScroll', function(e) {

    // Allow scrolling with single-column layout or if on the project overview page
    
    if($(window).width() < 901 || $('body').hasClass('index')) return;

    var scrollTo = null;

    if (e.type == 'mousewheel') {
      scrollTo = (e.originalEvent.wheelDelta * -1);
    }
    else if (e.type == 'DOMMouseScroll') {
      scrollTo = 40 * e.originalEvent.detail;
    }

    if (scrollTo) {
      e.preventDefault();
      $(this).scrollTop(scrollTo + $(this).scrollTop());
    }
  });
  
});
