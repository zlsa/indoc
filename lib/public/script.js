
$(document).ready(function() {
  
  $('#header #filename').click(function() {
    $('#header').toggleClass('files-hidden');
  });
  
  $('#header .files-menu a').click(function() {
    $('#header').addClass('files-hidden');
  });

});
