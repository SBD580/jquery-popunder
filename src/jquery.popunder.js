/*!
 * jquery-popunder
 *
 * @fileoverview jquery-popunder plugin
 *
 * @author Hans-Peter Buniat <hpbuniat@googlemail.com>
 * @copyright 2012-2014 Hans-Peter Buniat <hpbuniat@googlemail.com>
 * @license http://opensource.org/licenses/BSD-3-Clause
 */

/*global jQuery, window, screen, navigator, opener, top, document */
(function($, window, screen, navigator, document) {
    "use strict";

    /**
     * Create a popunder
     *
     * @param  {Array|function} aPopunder The popunder(s) to open
     * @param  {string|object} form A form, where the submit is used to open the popunder
     * @param  {string|object} trigger A button, where the mousedown & click is used to open the popunder
     * @param  {object} eventSource The source of the event
     *
     * @return jQuery
     */
    $.popunder = function(aPopunder, form, trigger, eventSource) {
        var t = $.popunder.helper,
            u = 'undefined';
        if (arguments.length === 0) {
            aPopunder = window.aPopunder;
        }

        if (trigger || form) {
            t.bindEvents(aPopunder, form, trigger);
        }
        else {
            aPopunder = (typeof aPopunder === 'function') ? aPopunder(eventSource) : aPopunder;
            if (t.ua.ie === true || t.ua.g === true) {
                aPopunder = t.handleTargetBlank(aPopunder, eventSource);
            }

            t.reset();
            if (typeof aPopunder !== u) {
                do {
                    t.queue(aPopunder, eventSource);
                }
                while (aPopunder.length > 0);
                t.queue(aPopunder, eventSource);
            }
        }

        return $;
    };

    /* several helper functions */
    $.popunder.helper = {

        /**
         * Reference to the window
         *
         * @var window
         */
        _top: window.self,

        /**
         * Reference to the last popup-window
         *
         * @var object
         */
        lastWin: null,

        /**
         * Reference to the last url
         *
         * @var string
         */
        lastTarget: null,

        /**
         * The flip-popup
         *
         * @var window|boolean
         */
        f: false,

        /**
         * Was the last popunder was processed
         *
         * @var boolean
         */
        last: false,

        /**
         * About:blank
         *
         * @var string
         */
        b: 'about:blank',

        /**
         * The last opened window-url (before calling href)
         *
         * @var string
         */
        o: null,

        /**
         * Dummy placeholder - prevent opening a popup but do the magic
         *
         * @var string
         */
        du: '__jqpu',

        /**
         * User-Agent-Handling
         *
         * @var object
         */
        ua: {
            ie: !!(/msie|trident/i.test(navigator.userAgent)),
            oldIE: !!(/msie/i.test(navigator.userAgent)),
            ff: !!(/firefox/i.test(navigator.userAgent)),
            o: !!(/opera/i.test(navigator.userAgent)),
            g: !!(/chrome/i.test(navigator.userAgent)),
            w: !!(/webkit/i.test(navigator.userAgent)),
            fl: !!(navigator.mimeTypes["application/x-shockwave-flash"])
        },
        m: {
            g: 'tab'
        },

        /**
         * The handler-stack
         *
         * @var Array
         */
        hs: [],

        /**
         * The event-namespace
         *
         * @var String
         */
        ns: 'jqpu',

		/**
		 * The flash overlay element (per 'hs')
		 */
		overlayElement: [],
		
		/**
		 * The source (mousedown) event triggered the overlay (per 'hs')
		 */
		overlaySource: [],
		
        /**
         * The default-options
         *
         * @var object
         */
        def: {

            // properites of the opened window
            window: {
                'toolbar': 0,
                'scrollbars': 1,
                'location': 1,
                'statusbar': 1,
                'menubar': 0,
                'resizable': 1,
                'width': (screen.availWidth - 122).toString(),
                'height': (screen.availHeight - 122).toString(),
                'screenX': 0,
                'screenY': 0,
                'left': 0,
                'top': 0
            },

            // name of the popunder-cookie (defaults to a random-string, when not set)
            name: '__pu',

            // name of the cookie
            cookie: '__puc',

            // the block-time of a popunder in minutes
            blocktime: false,

            // chrome-exclude user-agent-string
            chromeExclude: 'chrome\/(4[1-9]|[5-9][\d])\.',

            // user-agents to skip
            skip: {
                'opera': true,
                'linux': true,
                'android': true,
                'iphone': true,
                'ipad': true
            },

            // callback function, to be executed when a popunder is opened
            cb: null,

            // flash-url (e.g. jq-pu-toolkit.swf)
            fs: false,

            // set to true, if the url should be opened in a popup instead of a popunder
            popup: false
        },

        /**
         * Set the method for a specific agent
         *
         * @param {String} ua The agent
         * @param {String} m The method
         *
         * @returns $.popunder.helper
         */
        setMethod: function (ua, m) {
            var t = this;
            t.m[ua] = m;

            return t;
        },

        /**
         * Simple user-agent test
         *
         * @param  {string} ua The user-agent pattern
         *
         * @return {Boolean}
         */
        uaTest: function(ua) {
            return !!(new RegExp(ua, "i").test(navigator.userAgent.toString()));
        },

        /**
         * Process the queue
         *
         * @param  {Array} aPopunder The popunder(s) to open
         * @param  {object} eventSource The source of the event
         *
         * @return $.popunder.helper
         */
        queue: function(aPopunder, eventSource) {
            var b = false,
                t = this;

            if (aPopunder.length > 0) {
                while (b === false) {
                    var p = aPopunder.shift();
                    b = (p) ? t.open(p[0], p[1] || {}, aPopunder.length, eventSource) : true;
                }
            }
            else if (t.last === false) {
                t.last = true;
                t.bg().href(true);
            }
            else if (!t.f && !t.ua.g && !t.ua.ie) {
                t.bg();
            }

            return t;
        },

        /**
         * A handler-stub
         *
         * @param  {int} i The handler-stack-index
         * @param  {string|jQuery.Event} trigger The trigger-source
         *
         * @return void
         */
        handler: function(i, trigger) {
            if (typeof this.hs[i] === 'function') {
                this.hs[i](trigger||this.overlaySource[i]);
				if(this.overlaySource[i]){
					this.overlayElement[i].css({
						top: -1,
						left: -1,
						visibility: 'hidden'
					});
					this.overlayElement[i] = this.overlaySource[i] = null;
				}
            }
        },

        /**
         * Create a popunder
         *
         * @param  {Array} aPopunder The popunder(s) to open
         * @param  {string|jQuery} form A form, where the submit is used to open the popunder
         * @param  {string|jQuery} trigger A button, where the mousedown & click is used to open the popunder
         *
         * @return $.popunder.helper
         */
        bindEvents: function(aPopunder, form, trigger) {
            var t = this,
                s = 'string',
                hs = t.hs.length,
                c = (function(i) {
                    return function(event) {
                        t.handler(i, event);
                    };
                }(hs));

            t.hs[hs] = (function(aPopunder){
                return function(event) {
                    if (event && !event.target) {
                        event = {
                            target: t.getTrigger(event)
                        };
                    }

                    $.popunder(aPopunder, false, false, event);
                    return true;
                };
            })(aPopunder);

            if (form && !t.ua.g) {
                form = (typeof form === s) ? $(form) : form;
                form.on('submit.' + t.ns, c);
            }

            if (trigger) {
                trigger = (typeof trigger === s) ? $(trigger) : trigger;
                if (t.ua.g) {
                    t.def.skip[t.def.chromeExclude] = true;
                    if (t.def.fs && t.ua.fl) {
                        t.overlay(trigger, hs);
                    }
                }else{
					trigger.on('click.' + t.ns, c);
				}
            }

            return t;
        },

        /**
         * Create an flash-overlay to catch the click over a button or link
         *
         * @param  {object} trigger The click-trigger (button, link, etc.)
         * @param  {int} hs The handler-stack index
         *
         * @return $.popunder.helper
         */
        overlay: function(trigger, hs) {
			this.createOverlay(hs);
			trigger.on('mousedown.'+this.ns,$.proxy(function(e){
				if(e.which==1 && e.target==e.currentTarget && this.t.overlayElement[this.hs]){
					this.t.overlayElement[this.hs].css({
						top: e.pageY,
						left: e.pageX,
						visibility: 'visible'
					});
					this.t.overlaySource[this.hs] = e;
				}
			},{t:this,hs:hs}));

            return this;
        },
		
		/**
		 * Generate the flash overylay element
		 */
		createOverlay: function(hs){
			if(!this.overlayElement[hs]){
				var o = $('<object type="application/x-shockwave-flash" data="' + this.def.fs + '" />').css($.extend(true, {}, {
					position: 'absolute',
					top: -1,
					left: -1,
					width: 1,
					height: 1,
					visibility: 'hidden',
					zIndex: 2147483647
				}));
				o.append('<param name="wmode" value="transparent" />');
                o.append('<param name="menu" value="false" />');
                o.append('<param name="allowScriptAccess" value="always" />');
                o.append('<param name="flashvars" value="'+$.param({hs:hs})+'" />');
				
				this.overlayElement[hs] = o.appendTo('body');
			}
		},

        /**
         * Load the flash-handler
         *
         * @return $.popunder.helper
         */
        loadfl: function() {
            var t = this,
                $o = $('div.jq-pu object');
            t.setMethod('g','overlay');
            $o.css('zIndex', 'auto');
            t.def.skip[t.def.chromeExclude] = false;

            return t;
        },

        /**
         * Helper to create a (optionally) random value with prefix
         *
         * @param  {string} sUrl The url to open
         * @param  {Object} o The options
         *
         * @return boolean
         */
        cookieCheck: function(sUrl, o) {
            var t = this,
                name = t.rand(o.cookie, false),
                cookie = $.cookie(name),
                ret = false;

            if (!cookie) {
                cookie = sUrl;
            }
            else if (cookie.indexOf(sUrl) === -1) {
                cookie += sUrl;
            }
            else {
                ret = true;
            }

            $.cookie(name, cookie, {
                expires: new Date((new Date()).getTime() + o.blocktime * 60000)
            });

            return ret;
        },

        /**
         * Helper to create a (optionally) random value with prefix
         *
         * @param  {string|boolean} name
         * @param  {boolean} rand
         *
         * @return string
         */
        rand: function(name, rand) {
            var t = this,
                p = (!!name) ? name : t.du;
            return p + (rand === false ? '' : Math.floor(89999999 * Math.random() + 10000000).toString()).replace('.', '');
        },

        /**
         * Open the popunder
         *
         * @param  {string} sUrl The URL to open
         * @param  {object} opts Options for the Popunder
         * @param  {int} iLength Length of the popunder-stack
         * @param  {object} eventSource The source of the event
         *
         * @return boolean
         */
        open: function(sUrl, opts, iLength, eventSource) {
            var t = this,
                i, o, s, l,
                f = 'function';

            o = $.extend(true, {}, t.def, opts);
            s = o.skip;

            t.o = sUrl;
            if (top !== window.self) {
                try {
                    if (top.document.location.toString()) {
                        t._top = top;
                    }
                } catch (err) {}
            }

            for (i in s) {
                if (s.hasOwnProperty(i)) {
                    if (s[i] === true && t.uaTest(i)) {
                        return false;
                    }
                }
            }

            if (o.blocktime && (typeof $.cookie === f) && t.cookieCheck(sUrl, o)) {
                return false;
            }

            if (sUrl !== t.du) {
                t.lastTarget = sUrl;
                if (t.ua.g === true && t.m.g === 'tab') {
                    t.switcher.tab(t, t.o);
                }
                else {
                    t.lastWin = (t._top.window.open(t.o, t.rand(o.name, !opts.name), t.getOptions(o.window)) || t.lastWin);
                }

                if (t.ua.ff === true) {
                    t.bg();
                }

                t.href(iLength);
                if (typeof o.cb === f) {
                    o.cb(t.lastWin);
                }
            }

            return true;
        },

        /**
         * Move a popup to the background
         *
         * @param  {int|boolean|string} l True, if the url should be set
         *
         * @return $.popunder.helper
         */
        bg: function(l) {
            var t = this;
            if (t.lastWin && t.lastTarget && !l) {
                if (t.ua.ie === true) {
                    t.switcher.simple(t);
                }
                else if (!t.ua.g) {
                    t.switcher.pop(t);
                }
            }
            else if (l === 'oc') {
                t.switcher.pop(t);
            }

            return t;
        },

        /**
         * Handle the window switching
         *
         * @return void
         */
        switcher: {

            /**
             * Classic popunder, used for ie
             *
             * @param  {$.popunder.helper} t
             */
            simple: function(t) {
                try {
                    t.lastWin.blur();
                }
                catch (err) {}
                window.focus();
            },

            /**
             * Popunder for firefox & old google-chrome
             * In ff4+, chrome21-23 we need to trigger a window.open loose the focus on the popup. Afterwards we can re-focus the parent-window
             *
             * @param  {$.popunder.helper} t
             */
            pop: function(t) {
                (function(e) {
                    try {
                        t.f = e.window.open('about:blank');
                        if (!!t.f) {
                            t.f.close();
                        }
                    }
                    catch (err) {}

                    try {
                        e.opener.window.focus();
                    }
                    catch (err) {}
                })(t.lastWin);
            },

            /**
             * "tab"-under for google-chrome 31+
             *
             * @param  {$.popunder.helper} t
             * @param  {String} h
             *
             * @return $.popunder.helper
             */
            tab: function(t, h) {
                var u = (!h) ? 'data:text/html,<script>window.close();</script>;' : h,
                    p = !h,
                    a = $('<a/>', {
                        'href': u
                    }).appendTo(document.body),
                    e = document.createEvent("MouseEvents");

                p = (t.m.g === 'tab') ? !p : p;
                e.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, p, false, !p, p, 0, null);
                a[0].dispatchEvent(e);
                a[0].parentNode.removeChild(a[0]);

                return t;
            }
        },

        /**
         * Set the popunders url
         *
         * @param  {int|boolean} l True, if the url should be set
         *
         * @return $.popunder.helper
         */
        href: function(l) {
            var t = this, d;
            if (l && t.lastTarget && t.lastWin && t.lastTarget !== t.b && t.lastTarget !== t.o) {
                if (t.ua.g === true && t.m.g !== 'simple') {
                    d = t.lastWin.document;
                    d.open();
                    d.write('<html><head><title>' + document.title + '</title><script type="text/javascript">window.location="' + t.lastTarget + '";<\/script></head><body></body></html>');
                    d.close();
                }
                else {
                    t.lastWin.document.location.href = t.lastTarget;
                }
            }

            return t;
        },

        /**
         * Handle forms with target="_blank"
         *
         * @param  {Array} aPopunder
         * @param  {jQuery.Event} source
         *
         * @return Array
         */
        handleTargetBlank: function(aPopunder, source) {
            if (source && typeof source.target !== 'undefined') {
                var t = this,
                    form = null,
                    $target = $(source.target),
                    s;

                if ($target.is('input[type="submit"]') === true) {
                    form = source.target.form;
                }

                if (form && form.target === '_blank') {
                    s = t.du;
                    if (t.ua.ie) {
                        s = form.action + '/?' + $(form).serialize();
                    }

                    aPopunder.unshift([s, {
                        popup: true
                    }]);
                }
            }

            return aPopunder;
        },

        /**
         * Reset the instance
         *
         * @return $.popunder.helper
         */
        reset: function() {
            var t = this;
            t.f = t.last = false;
            t.lastTarget = t.lastWin = null;
            return t;
        },

        /**
         * Unbind a popunder-handler
         *
         * @return $.popunder.helper
         */
        unbind: function(form, trigger) {
            var t = this,
                s = 'string';

            t.reset();
            form = (typeof form === s) ? $(form) : form;
            form.off('submit.' + t.ns);
            trigger = (typeof trigger === s) ? $(trigger) : trigger;
            trigger.off('click.' + t.ns).next('.jq-pu object').remove().unwrap();

            window.aPopunder = [];

            return t;
        },

        /**
         * Get the option-string for the popup
         *
         * @return {String}
         */
        getOptions: function(opts) {
            var a = [], i;
            for (i in opts) {
                if (opts.hasOwnProperty(i)) {
                    a.push(i + '=' + opts[i]);
                }
            }

            return a.join(',');
        }
    };
})(jQuery, window, screen, navigator, document);
