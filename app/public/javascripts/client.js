// jQuery throttle debounce (http://benalman.com/projects/jquery-throttle-debounce-plugin/)
(function(b,c){var $=b.jQuery||b.Cowboy||(b.Cowboy={}),a;$.throttle=a=function(e,f,j,i){var h,d=0;if(typeof f!=="boolean"){i=j;j=f;f=c}function g(){var o=this,m=+new Date()-d,n=arguments;function l(){d=+new Date();j.apply(o,n)}function k(){h=c}if(i&&!h){l()}h&&clearTimeout(h);if(i===c&&m>e){l()}else{if(f!==true){h=setTimeout(i?k:l,i===c?e-m:e)}}}if($.guid){g.guid=j.guid=j.guid||$.guid++}return g};$.debounce=function(d,e,f){return f===c?a(d,e,false):a(d,f,e!==false)}})(this);

// Logging functions for convenience
window.log = function () {
  var args = Array.prototype.slice.call(arguments, 0);
  console.log.apply(console, args);
}
window.error = function () {
  var args = Array.prototype.slice.call(arguments, 0);
  args.unshift('ERROR:');
  console.error.apply(console, args);
}

// Set search bar's width so it fills the header correctly.
// Need to ensure this gets called after Typekit fonts are loaded.
var $header_left = $('#header .left');
var $header_right = $('#header .right');
var $header_search = $('#header .search');
function updateHeaderSearchWidth() {
  var header_left_width = $header_left.width();
  var header_right_width = $header_right.width();
  $header_search
    .css({
      'margin-left': header_left_width,
      'margin-right': header_right_width
    })
    .removeClass('off');

  // Continue to set the width every 100ms until fonts are done loading.
  // If fonts don't load, then wf-loading gets removed automatically after
  // 1000ms, so this won't run forever. 
  if ($('html').hasClass('wf-loading')) {
    setTimeout(updateHeaderSearchWidth, 100);
  }
}

function toggleBrowseMenu (_switch) {
  $('#browse').toggleClass('on', _switch);
  $('#header .browse').toggleClass('on', _switch);
}

$(function () {
  // Browse menu dropdown
  $('#header .browse').on('click', function(e) {
    e.preventDefault();
    toggleBrowseMenu();
  });

  $header_search.on('focusin', function(e) {
    toggleBrowseMenu(false);
  });

  updateHeaderSearchWidth();
});

$(window).load(function () {

});



// Footnote link generator in Print view
// function footnotes()
// {

//     var links = $('.post p:not(.longtags) a[href]:not([href^=#],[href^=mailto],[rel=nofollow]), .post ul a[href]:not([href^=#],[href^=mailto],[rel=nofollow])');
//     var notelist = $('<ul class="print_only_notelist"></ul>').insertAfter($('.post'));
//     var i = 0;
    
//     $('<li>', { html: '<h4>Footnotes:</h4>' }).appendTo(notelist);
//     $.each(links, function (){
//         var parent_class = $(this).parent().attr('class');
//         if(parent_class.indexOf('author') == -1 && parent_class.indexOf('tags') === -1 && parent_class.indexOf('edit') === -1 && parent_class.indexOf('social-icons') === -1)
//         {
//             var link_url = $(this).attr('href');
//             var link_text = $(this).text();
//             if(link_url !== '' && (/^https?:\/\//.test(link_url)))
//             {
//                 if(link_url.search(/\.(jpg|jpeg|gif|png|ico|css|js|zip|tgz|gz|rar|bz2|doc|xls|exe|pdf|ppt|txt|tar|mid|midi|wav|bmp|mp3)/) === -1)
//                 {
//                     if(link_text.search(/Share|On|Twitter/i) === -1)
//                     {
//                         if(link_url.search(/pk_campaign|pk_kwd/i) === -1)
//                         {                   
//                             i = i+1;
//                             $('<sup>',{text:' '+i+''}).addClass('print_only').insertAfter($(this));             
//                             if(link_text.length > 0)
//                             {
//                                 var ftext = link_text+' - '+link_url;
//                             }else{
//                                 var ftext = link_url;
//                             }
//                             $('<li>', { html: '<sup>'+i+'</sup> '+ftext }).appendTo(notelist);
//                         }
//                     }
//                 }
//             }
//         }
//     });
// }

// .print_only_notelist {
//     display: none;
//     margin: 20px 0;
//     list-style-type: none;
// }

// .print_only {
//     display: none;
// }