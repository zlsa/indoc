
$(document).ready(function() {
  if($('body').hasClass('overview')) {

  } else {
    $('#header header').click(function() {
      $('#header').toggleClass('files-visible');
    });
  }
});
