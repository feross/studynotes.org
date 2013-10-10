function formatSelect2 (option) {
  var $elem = $(option.element)
  return '<img class="select2-icon" src="' + config.cdnOrigin + '/images/icon/' + $elem.val() + '.png"/>' + option.text
}

// Initialize select2 on <select> elements
$('.select2').select2({
  escapeMarkup: function(m) { return m },
  formatResult: formatSelect2,
  formatSelection: formatSelect2,
  matcher: function(term, text, opt) {
    return text.toLowerCase().indexOf(term.toLowerCase()) >= 0 ||
      (opt.attr('data-alt')
        && opt.attr('data-alt').toLowerCase().indexOf(term.toLowerCase()) >= 0)
  }
})

var $selectCollege = $('select[name="college"]')
var $style = $('#heroStyle')
var currentHero = $selectCollege.val() || $('body').attr('class').trim()

if ($style.length) {
  $selectCollege.on('change', function () {
    var newHero = $(this).val()

    var html = $style.html()
      .replace(new RegExp(currentHero + '\\.jpg', 'g'), newHero + '.jpg')
    $style.html(html)

    currentHero = newHero
  })
}

var parserRules = {
  /**
   * CSS Class white-list
   * Following CSS classes won't be removed when parsed by the wysihtml5 HTML parser
   */
  "classes": { },

  /**
   * Tag list
   *
   * The following options are available:
   *
   *    - add_class:        converts and deletes the given HTML4 attribute (align, clear, ...) via the given method to a css class
   *                        The following methods are implemented in wysihtml5.dom.parse:
   *                          - align_text:  converts align attribute values (right/left/center/justify) to their corresponding css class "wysiwyg-text-align-*")
   *                            <p align="center">foo</p> ... becomes ... <p> class="wysiwyg-text-align-center">foo</p>
   *                          - clear_br:    converts clear attribute values left/right/all/both to their corresponding css class "wysiwyg-clear-*"
   *                            <br clear="all"> ... becomes ... <br class="wysiwyg-clear-both">
   *                          - align_img:    converts align attribute values (right/left) on <img> to their corresponding css class "wysiwyg-float-*"
   *
   *    - remove:             removes the element and its content
   *
   *    - rename_tag:         renames the element to the given tag
   *
   *    - set_class:          adds the given class to the element (note: make sure that the class is in the "classes" white list above)
   *
   *    - set_attributes:     sets/overrides the given attributes
   *
   *    - check_attributes:   checks the given HTML attribute via the given method
   *                            - url:            allows only valid urls (starting with http:// or https://)
   *                            - src:            allows something like "/foobar.jpg", "http://google.com", ...
   *                            - href:           allows something like "mailto:bert@foo.com", "http://google.com", "/foobar.jpg"
   *                            - alt:            strips unwanted characters. if the attribute is not set, then it gets set (to ensure valid and compatible HTML)
   *                            - numbers:  ensures that the attribute only contains numeric characters
   */
  "tags": {
    "tr": {
      "add_class": {
        "align": "align_text"
      }
    },
    "strike": {
      "remove": 1
    },
    "form": {
      "rename_tag": "div"
    },
    "rt": {
      "rename_tag": "span"
    },
    "code": {},
    "acronym": {
      "rename_tag": "span"
    },
    "br": {},
    "details": {
      "rename_tag": "div"
    },
    "h4": {},
    "em": {},
    "title": {
      "remove": 1
    },
    "multicol": {
        "rename_tag": "div"
    },
    "figure": {
        "rename_tag": "div"
    },
    "xmp": {
        "rename_tag": "span"
    },
    "small": {
        "rename_tag": "span",
    },
    "area": {
        "remove": 1
    },
    "time": {
        "rename_tag": "span"
    },
    "dir": {
        "rename_tag": "ul"
    },
    "bdi": {
        "rename_tag": "span"
    },
    "command": {
        "remove": 1
    },
    "ul": {},
    "progress": {
        "rename_tag": "span"
    },
    "dfn": {
        "rename_tag": "span"
    },
    "iframe": {
        "remove": 1
    },
    "figcaption": {
        "rename_tag": "div"
    },
    "a": {}, // manually removed in our own parse function
    "img": {
      "remove": 1
    },
    "rb": {
        "rename_tag": "span"
    },
    "footer": {
        "rename_tag": "div"
    },
    "noframes": {
        "remove": 1
    },
    "abbr": {
        "rename_tag": "span"
    },
    "u": {},
    "bgsound": {
        "remove": 1
    },
    "sup": {},
    "address": {
        "rename_tag": "div"
    },
    "basefont": {
        "remove": 1
    },
    "nav": {
        "rename_tag": "div"
    },
    "h1": {
        "rename_tag": "h3"
    },
    "head": {
        "remove": 1
    },
    "tbody": {
        "remove": 1
    },
    "dd": {
        "rename_tag": "div"
    },
    "s": {
        "rename_tag": "span"
    },
    "li": {},
    "td": {
      "remove": 1
    },
    "object": {
        "remove": 1
    },
    "div": {},
    "option": {
        "rename_tag": "span"
    },
    "select": {
        "rename_tag": "span"
    },
    "i": {
        "rename_tag": "em"
    },
    "track": {
        "remove": 1
    },
    "wbr": {
        "remove": 1
    },
    "fieldset": {
        "rename_tag": "div"
    },
    "big": {
        "rename_tag": "h3",
    },
    "button": {
        "rename_tag": "span"
    },
    "noscript": {
        "remove": 1
    },
    "svg": {
        "remove": 1
    },
    "input": {
        "remove": 1
    },
    "table": {},
    "keygen": {
        "remove": 1
    },
    "h5": {},
    "meta": {
        "remove": 1
    },
    "map": {
        "rename_tag": "div"
    },
    "isindex": {
        "remove": 1
    },
    "mark": {
        "rename_tag": "span"
    },
    "caption": {
        "rename_tag": "p"
    },
    "tfoot": {
        "remove": 1
    },
    "base": {
        "remove": 1
    },
    "video": {
        "remove": 1
    },
    "strong": {},
    "canvas": {
        "remove": 1
    },
    "output": {
        "rename_tag": "span"
    },
    "marquee": {
        "rename_tag": "span"
    },
    "b": {
        "rename_tag": "strong"
    },
    "q": {},
    "applet": {
        "remove": 1
    },
    "span": {},
    "rp": {
        "rename_tag": "span"
    },
    "spacer": {
        "remove": 1
    },
    "source": {
        "remove": 1
    },
    "aside": {
        "rename_tag": "div"
    },
    "frame": {
        "remove": 1
    },
    "section": {
        "rename_tag": "div"
    },
    "body": {
        "rename_tag": "div"
    },
    "ol": {},
    "nobr": {
        "rename_tag": "span"
    },
    "html": {
        "rename_tag": "div"
    },
    "summary": {
        "rename_tag": "span"
    },
    "var": {
        "rename_tag": "span"
    },
    "del": {
        "remove": 1
    },
    "blockquote": {},
    "style": {
        "remove": 1
    },
    "device": {
        "remove": 1
    },
    "meter": {
        "rename_tag": "span"
    },
    "h3": {},
    "textarea": {
        "rename_tag": "span"
    },
    "embed": {
        "remove": 1
    },
    "hgroup": {
        "rename_tag": "div"
    },
    "font": {
        "rename_tag": "span",
    },
    "tt": {
        "rename_tag": "span"
    },
    "noembed": {
        "remove": 1
    },
    "thead": {
        "remove": 1
    },
    "blink": {
        "rename_tag": "span"
    },
    "plaintext": {
        "rename_tag": "span"
    },
    "xml": {
        "remove": 1
    },
    "h6": {},
    "param": {
        "remove": 1
    },
    "th": {
        "remove": 1
    },
    "legend": {
        "rename_tag": "span"
    },
    "hr": {},
    "label": {
        "rename_tag": "span"
    },
    "dl": {
        "rename_tag": "div"
    },
    "kbd": {
        "rename_tag": "span"
    },
    "listing": {
        "rename_tag": "div"
    },
    "dt": {
        "rename_tag": "span"
    },
    "nextid": {
        "remove": 1
    },
    "pre": {},
    "center": {
        "rename_tag": "div",
    },
    "audio": {
        "remove": 1
    },
    "datalist": {
        "rename_tag": "span"
    },
    "samp": {
        "rename_tag": "span"
    },
    "col": {
        "remove": 1
    },
    "article": {
        "rename_tag": "div"
    },
    "cite": {},
    "link": {
        "remove": 1
    },
    "script": {
        "remove": 1
    },
    "bdo": {
        "rename_tag": "span"
    },
    "menu": {
        "rename_tag": "ul"
    },
    "colgroup": {
        "remove": 1
    },
    "ruby": {
        "rename_tag": "span"
    },
    "h2": {
        "rename_tag": "h3"
    },
    "ins": {
        "rename_tag": "span"
    },
    "p": {},
    "sub": {},
    "comment": {
        "remove": 1
    },
    "frameset": {
        "remove": 1
    },
    "optgroup": {
      "rename_tag": "span"
    },
    "header": {
      "rename_tag": "div"
    }
  }
}

// Monkey patch the default parse function (wysihtml5.dom.parse) to do our
// own cleanup
var parser = function (elementOrHtml, rules, context, cleanUp) {
  elementOrHtml = wysihtml5.dom.parse(elementOrHtml, rules, context, cleanUp)
  var isString = (typeof elementOrHtml === 'string')
  var element = (isString)
    ? wysihtml5.dom.getAsDom(elementOrHtml, context)
    : element = elementOrHtml

  var count = 0 // to prevent infinite loops
  function extraCleanup () {
    var didModify = false
    count += 1

    // Remove empty elements
    $(element).find('*').each(function (i, elem) {
      var $elem = $(elem)
      if ($elem.is('br')) return // don't remove <br>s
      var html = $elem.html()
      if (html === '&nbsp;' || /^(\s|\n)*$/.test(html)) {
        console.log('removing ' + $elem[0].outerHTML)
        $elem.remove()
        didModify = true
      }
    })

    // Replace <div>s and <span>s with their contents, since it doesn't affect
    // presentation. De-linkify links, too.
    $(element).find('a, div, span').each(function (i, elem) {
      var $elem = $(elem)
      $elem.replaceWith(function () {
        console.log('replacing ' + $elem[0].outerHTML + ' with its contents')
        var contents = $elem.contents()

        // If removing this element would put its contents directly in the
        // <body>, then append a space so that it doesn't bump against the
        // next element.
        if ($elem.parent().is('body') && contents.length) {
          contents[0].textContent += ' '
        }

        didModify = true
        return contents
      })
      return false
    })

    // If we removed an empty element, then run this function again because
    // there might be more elements that have now become removable. For
    // example, take <p><span></span></p>. Say that <p> is visited first. It
    // cannot be removed the first time around. But after <span> is removed,
    // <p> is now removable.
    if (didModify && count < 1000) extraCleanup()
  }
  extraCleanup()

  return isString ? wysihtml5.quirks.getCorrectInnerHTML(element) : element
}

// Initialize all the wysiwyg editors on the page
$('.editor').each(function (i, editorElem) {
  var editor = new wysihtml5.Editor(editorElem, {
    toolbar: $(editorElem).data('toolbar'),
    autoLink: false, // Don't auto-link URLs
    stylesheets: [config.cdnOrigin + '/css/editor.css'], // Iframe editor css
    parserRules: parserRules, // Rules to parse copy & pasted html
    parser: parser,
    useLineBreaks: false, // Use <p> instead of <br> for line breaks
    cleanUp: true // remove senseless <span> elements (empty or w/o attrs)
  })

  // Auto-resize the editor
  editor.on('load', function() {
    $(editor.composer.iframe).wysihtml5_size_matters()
  })
})