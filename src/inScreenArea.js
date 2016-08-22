// jquery.inScreenArea, v1
// Made by Dimitri van der Vliet
// Distributed under Apache-2.0
// https://github.com/HolygrowJS/inScreenArea
(function( $ ){
    'use strict';
    var id = 0;
    $.fn.inScreenArea = function(options) {
        var $main = this,
            settings = $.extend({
                context: $(window),
                height: '100%',
                offset: 0,
                elementTolerance: 0,
                debug: false,
                debugOptions: {
                    areaBgColor: 'rgba(255,216,0, 0.054)',
                    areaOutline: '5px #FFD800 dashed',
                    zIndex: '999',
                    elIdentifier: true,
                    elIdentifierStyle: {
                        in: '2px green dotted',
                        out: '2px red dotted'
                    }
                },
                onScrollDelay: 200,
                onResizeDelay: 200
            }, options );

        // give id
        $main.id = id++;

        var app = {
            areaOffset: 0,
            areaHeight: 0,
            alive: true,

            init: function(){
                // private
                this.calcArea();
                this.listener();
                this.debug.init();

                // public
                this.destroy();
            },
            calcArea: function(){
                this.areaOffset = this.unitTranslator(settings.offset, settings.context.height());
                this.areaHeight = this.unitTranslator(settings.height, settings.context.height());
            },
            listener: function(){
                var _this = this;
                _this.inArea();

                if (settings.onScrollDelay) {
                    // set delay for performance reasons (Throttling)
                    var scrollTimer;
                    settings.context.on('scroll.inScreenArea' + $main.id, function() {
                        scrollTimer = setTimeout(function() {
                            _this.inArea();
                        }, settings.onScrollDelay);
                    });
                } else {
                    settings.context.on('scroll.inScreenArea' + $main.id, function(){
                        _this.inArea();
                    })
                }


                _this.calcArea();
                var resizeTimeout;
                settings.context.on('resize.inScreenArea' + $main.id, function() {
                    // Debouncing
                    if(!!resizeTimeout){ clearTimeout(resizeTimeout); }
                    resizeTimeout = setTimeout(function(){
                        _this.calcArea();
                    }, settings.onResizeDelay);
                });


            },
            inArea: function() {
                var _this = this;
                // each passed jquery object
                $main.each(function(){
                    var rect        = this.getBoundingClientRect(),
                        position    = _this.positionChecker(rect),
                        positionDetails = {
                            viewport: rect,
                            area: position.details
                        },
                        areaDetails = {
                            offset:     _this.areaOffset,
                            height:     _this.areaHeight
                        },
                        $this = $(this);

                    $this.tolerance = _this.elTolerance;

                    // BOOlEANS:
                    // TRUE  == in area
                    // FALSE == out area

                    if (position.inArea) {
                        _this.dataAttrCheck(true, $this);
                        $this.trigger( "area:in", [$this, positionDetails, areaDetails] );

                        // Debugging outline
                        if (settings.debug && settings.debugOptions.elIdentifier) {
                            _this.debug.setOutline(true, $this);
                        }
                    } else {
                        _this.dataAttrCheck(false, $this);
                        $this.trigger( "area:out", [$this, positionDetails, areaDetails] );

                        // Debugging outline
                        if (settings.debug && settings.debugOptions.elIdentifier) {
                            _this.debug.setOutline(false, $this);
                        }
                    }
                })

            },
            positionChecker: function(rect){
                this.elTolerance = 0;

                if (settings.elementTolerance != 0) {
                    // use unitTranslator
                    this.elTolerance = this.unitTranslator(settings.elementTolerance, rect.height);
                }

                var inArea = rect.top >= this.areaOffset - this.elTolerance && rect.bottom <= this.areaOffset + this.areaHeight + this.elTolerance;

                return {
                    inArea: inArea,
                    details: {
                        fromTop:    rect.top - this.areaOffset,
                        ratio:      Math.round( (rect.top - this.areaOffset ) / this.areaHeight * 1000) / 1000
                    }
                }
            },
            unitTranslator: function(unit, relative){
                var _this = this;

                // Calculate units (relative of x (like window or element))
                if (unit !== parseInt(unit)) {
                    if (unit.indexOf('calc') >= 0) {
                        // Calc function e.g. calc(100% - 2px)

                        // Remove unnecessary calc( and )
                        unit = unit.replace('calc(', '').replace(')', '');

                        // Loop trough exploded string
                        // If string in array is unit use self to parse int or/and calc relative unit
                        // Join and calc with JS eval function
                        var unitExploded = unit.split(' ');
                        $.each(unitExploded, function(i, val) {
                            if ( /[+\-*\/]/.test(val) == false )
                                unitExploded[i] = _this.unitTranslator(val, relative)
                        });
                        unit = eval(unitExploded.join(' '));

                    } else if (unit.indexOf('%') >= 0) {
                        // Calc unit of relative amount
                        unit = relative * ( parseInt(unit) / 100 );
                    } else {
                        unit = parseInt(unit);
                    }
                }

                return Math.round(unit);
            },
            dataAttrCheck: function(type, $el){
                var dataAttr = $el.data(),
                    prefix   = 'area';
                // Stop when data attribute is not used
                if ($.isEmptyObject(dataAttr)) {
                   return;
                }
                // change type from bool to string
                var typeStr = type ? 'In' : 'Out',
                    altType = type ? 'Out' : 'In';

                if (dataAttr[prefix + typeStr]){
                    $el.addClass(dataAttr[prefix + typeStr]);
                };

                if (dataAttr[prefix + typeStr + 'Toggle']){
                    $el.addClass(dataAttr[prefix + typeStr + 'Toggle']);
                }

                if (dataAttr[prefix + altType + 'Toggle']){
                    $el.removeClass(dataAttr[prefix + altType + 'Toggle']);
                }
            },
            debug: {
                init: function(){
                    if (settings.debug) {

                        if (settings.context.outerHeight() != $(window).outerWidth()) {
                            // Easy debugging only works on context that uses the fullscreen beacouse it's built with position: fixed
                            console.warn("debugging doesn't work well on windows that aren't fullscreen");
                        }

                        // simple debugging element
                        var debugEl = $('<div>').css({
                            'position'  : 'fixed',
                            'z-index'   : settings.debugOptions.zIndex,
                            'width'     : '100%',
                            'height'    : settings.height,
                            'top'       : settings.offset,
                            'left'      : 0,
                            'background': settings.debugOptions.areaBgColor,
                            'border': settings.debugOptions.areaOutline,
                            'pointer-events': 'none'
                        })
                        .addClass('debugger-' + $main.id);

                        $('body').append(debugEl);
                    }
                },
                setOutline: function(type, $el) {
                    // If type is true set Outline Green
                    if (type) {
                        $el.css({
                            'outline': settings.debugOptions.elIdentifierStyle.in,
                            'outline-offset': -4
                        });
                    } else {
                        $el.css({
                            'outline': settings.debugOptions.elIdentifierStyle.out,
                            'outline-offset': -4
                        });
                    }
                }
            },
            // Public Functions
            destroy: function(){
                $main.destroy = function(){
                    // Kill all events
                    settings.context.off('.inScreenArea' + $main.id);
                    $('.debugger-' + $main.id).remove();
                }
            }
        };
        app.init();

        return $main;
    }
}( jQuery ));