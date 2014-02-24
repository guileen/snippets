;(function() {

/*
 * Author: Gui Lin
 * guileen AT gmail DOT com
 */
function $ (selector, el) {
  return (el||document).querySelector(selector);
}
function $$ (selector, el) {
  return Array.prototype.slice.call((el||document).querySelectorAll(selector));
}

// coordinate.
function getAbsolutOffset(el) {
  var left, top;
  left = top = 0;
  if (el.offsetParent) {
    do {
      left += el.offsetLeft;
      top += el.offsetTop;
    } while (el = el.offsetParent);
  }
  return {
    x: left,
    y: top
  };
}

function getWindowSize() {
  return {
    w: window.innerWidth || document.documentElement.clientWidth,
    h: window.innerHeight || document.documentElement.clientHeight,
  }
}

// createHTMLElement
var __nothing_dummyFregment;
function createHTMLElement(html, el, prepend) {
  if(!__nothing_dummyFregment){
    __nothing_dummyFregment = document.createElement('div');
  }
  __nothing_dummyFregment.innerHTML = html;
  var result = __nothing_dummyFregment.firstChild;
  if(el){
    if(typeof el == 'string') el = $(el);
    prepend && el.firstChild ? el.insertBefore(result, el.firstChild) : el.appendChild(result);
  }
  return result;
}

// Element.matches "polyfill"
(function(e){
    if (typeof e.matches !== "function") {
      e.matches = e.webkitMatchesSelector ||
                  e.mozMatchesSelector    ||
                  e.msMatchesSelector     ||
                  e.oMatchesSelector      ||
                  e.matchesSelector;
    }
})(Element.prototype);

function on(selector, eventType, handler) {
  // add listener for all existing elements
  [].forEach.call(document.querySelectorAll(selector), function(elem) {
      elem.addEventListener(eventType, handler);
  });

  // create new "live" observer
  // TODO MutationObserver is not widly supported.
  // modify when insert, append, replace
  var observer = new MutationObserver(function(records) {
      records.forEach(function(record) {
          [].forEach.call(record.addedNodes || [], function(elem) {
              if (elem.matches(selector)) {
                elem.addEventListener(eventType, handler);
              }
          });
      });
  });

  // watch for DOM changes to body's children and body's subtree
  observer.observe(document.body, {
      childList: true,
      subtree: true
  });

  return observer;
}

// calss. Nothing needed except has, add, remove.
function hasClass(el, cls) {
  return new RegExp('(^|\\s)' + cls + '(\\s|$)').test(el.className);
}

function addClass(el, cls) {
  if (!hasClass(el, cls)) el.className += (el.className && ' ') + cls;
}

function removeClass(el, cls) {
  el.className = el.className.replace(new RegExp('(^|\\s)' + cls + '(\\s|$)'), ' ');
}

function toggleClass(el, cls) {
  if (hasClass(el, cls)) {
    removeClass(el, cls);
  }else {
    addClass(el, cls);
  }
}

// Template. '{0} love {1}'.format('I', 'nothing')
String.prototype.format = function() {
  var formatted = this;
  for (var i = 0; i < arguments.length; i++) {
    var regexp = new RegExp('\\{' + i + '\\}', 'gi');
    formatted = formatted.replace(regexp, arguments[i]);
  }
  return formatted;
};

// this function is use to strip url not validation
function parseUrl (url) {
  var r = /^(\w+):\/\/([^\/\?#]+)(\/[^\?#]*)?(\?[^#]*)?(#.*)?$/i.exec(url);
  return r && {
    schema : r[1]
  , domain : r[2]
  , root : r[1] + '://' + r[2]
  , path : r[3]
  , querystring : r[4]
  , anchor : r[5]
  };
}

// QueryString
function parseQueryString(queryString) {
  var result = {};
  if (!queryString) queryString = location.search.replace(/^\?|#.*$/g, '');

  for (var i = 0, pairs = queryString.split('&'), pair; i < pairs.length; i++) {
    pair = pairs[i].split('=');
    result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }

  return result;
}

function buildQueryString(obj) {
  var qs = [], name;
  for (name in obj) {
    qs.push(encodeURIComponent(name) + '=' + encodeURIComponent(obj[name]));
  }
  return qs.join('&');
}

// Form serialize
function formSerialize(form) {
  var i = 0, els = form.elements, result={}, el, n, t;
  for (; i < els.length; i++) {
    el = els[i];
    n = el.name, t = el.type;

    if (!n || el.disabled || t == 'reset' || t == 'button' ||
      (t == 'checkbox' || t == 'radio') && !el.checked ||
      (t == 'submit' || t == 'image') && el.form && el.form.clk != el ||
      el.tagName.toLowerCase() == 'select' && el.selectedIndex == -1) {
      continue;
    }
    // select-one is supported, but select-multi maybe not supported
    result[n] = el.value;
  }
  return result;
}

function formDeserialize(form, obj) {
  form.reset();
  var i = 0, els = form.elements, el, n, t, result;
  for (; i < els.length; i++) {

    el = els[i];
    n = el.name;
    t = el.type;
    if (!n || !obj[n])
      continue;

    if (t == 'radio' || t == 'checkbox') {
      el.checked = !! obj[n];
    }else if (t == 'select-one') {
      //"select-multi": //won't supporte
      for (var index = 0, ops = el.options; index < ops.length; index++) {
        if (ops[index].value == obj[n]) {
          el.selectedIndex = index;
          break;
        }
      }
    }else {
      el.value = obj[n];
    }
  }
}

/*
 * AJAX
 * httpRequest
 *
 * @param url or options
 *       options
 *           method
 *           url
 *           query
 *           data data post to server
 *           type the type of data, can be 'json' or 'form', default is 'form'
 *           headers request headers
 * @param callback
 *           function(err, data, xhr)
 */
function httpRequest(options, callback) {
  var m, u, q, d, h, t, k, err, reply;
  if (typeof options === 'string') {
    u = options;
  } else {
    m = options.method;
    u = options.url || '';
    q = options.query;
    d = options.data;
    h = options.haeder;
    t = options.type;
  }
  if (!m)
    m = d ? 'POST' : 'GET';

  if (q) {
    if (typeof q != 'string')
      q = buildQueryString(q);
    u += u.indexOf('?') >= 0 ? '&' : '?' + q;
  }

  var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.responseXML)
        reply = xhr.responseXML;
      else if (/\bjson\b/.test(xhr.getResponseHeader('content-type')))
        reply = JSON.parse(xhr.responseText);
      else
        reply = xhr.responseText;

      if (xhr.status < 200 || xhr.status >= 300) {
        // 1xx informational response;
        // 3xx Redirection
        // 4xx Client error
        // 5xx Server error
        err = xhr.status;
      }
      // else 2xx successful response;
      callback(err, reply, xhr);
    }
  };

  xhr.open(m, u, true);
  var hasContentType = false;
  var hasAccept = false;
  for (var k in h) {
    v = h[k];
    xhr.setRequestHeader(k, v);
    if (k.toLowerCase() === 'content-type')
      hasContentType = true;
    if (k.toLowerCase() === 'accept')
      hasAccept = true;
  }
  if (d) {
    if (t == 'json') {
      d = JSON.stringify(d);
      t = 'application/json';
      if (!hasAccept) {
        xhr.setRequestHeader('Accept', t);
      }
    }else {
      d = buildQueryString(d);
      t = 'application/x-www-form-urlencoded';
    }
    if (!hasContentType) {
      xhr.setRequestHeader('Content-Type', t);
    }

  }
  xhr.send(d);
}

/**
 * make a form use ajax
 * @param form {HTMLFormElement}
 * @param callback {function(err, reply, xhr)}
 *
 */
function jsonForm(form, signInButton, callback) {
  if(typeof form == 'string') form = $(form);
  form.onsubmit = function() {
    submitJsonForm(form, signInButton, callback);
    return false;
  }
}

function submitJsonForm(form, signInButton, callback) {
  if(typeof form == 'string') form = $(form);
  if(typeof signInButton == 'string') signInButton = $(signInButton);
  if(signInButton) {
    addClass(signInButton, 'disabled');
  }
  var json = formSerialize(form);
  httpRequest({
      data: json
    , url: form.action
    , method: form.method
    , type: 'json'
    }, function(err, reply, xhr) {
      removeClass(signInButton, 'disabled');
      callback(err, reply, xhr);
  });
}

function httpGet(url, query, callback) {
  httpRequest({
      url: url
    , query: query
    , type: 'json'
  }, callback);
}

function httpPost(url, data, callback) {
  httpRequest({
      url: url
    , data: data
    , type: 'json'
  }, callback);
}

// OO. Nothing needed except this.
// Dont touch Object.prototype, it's a nightmair of for(var k in obj)
function merge(a, b) {
  if (a && b) {
    for (var key in b) {
      a[key] = b[key];
    }
  }
  return a;
};

function set(key, value) {
  localStorage[key] = value && JSON.stringify(value);
}

function get(key) {
  var v = localStorage[key];
  return v && JSON.parse(v);
}

function del(key) {
  delete localStorage[key];
}

window.u = window.util = {
  q: $,
  s: $$,
  offset: getAbsolutOffset,
  getWindowSize: getWindowSize,
  html: createHTMLElement,
  hasClass: hasClass,
  addClass: addClass,
  removeClass: removeClass,
  toggleClass: toggleClass,
  parseUrl: parseUrl,
  parseQuery: parseQueryString,
  buildQuery: buildQueryString,
  formSerialize: formSerialize,
  formDeserialize: formDeserialize,
  ajax: httpRequest,
  httpGet: httpGet,
  httpPost: httpPost,
  jsonForm: jsonForm,
  submitJsonForm: submitJsonForm,
  set: set,
  get: get,
  del: del,
  merge: merge
}

})();
