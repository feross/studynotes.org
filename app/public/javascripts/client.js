$(function() {
  // Redirect page when user selects from the subsection selector  
  $('select#subsection-select').change(function() {
    window.location.href = $(this).val();
  });
  // Remove borders from image links
  $('a img').parent().css({border: 0});
});



// Footnote link generator in Print view
// function footnotes()
// {

//     var links = $('.post p:not(.longtags) a[href]:not([href^=#],[href^=mailto],[rel=nofollow]), .post ul a[href]:not([href^=#],[href^=mailto],[rel=nofollow])');
//     var notelist = $('<ul class="print_only_notelist"></ul>').insertAfter($('.post'));
//     var i = 0;
    
//     $('<li>', { html: '<h4>Footnotes:</h4>' }).appendTo(notelist);
//     $.each(links, function(){
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