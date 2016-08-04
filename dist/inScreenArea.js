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
                    background: 'rgba(0, 110, 85, 0.2)',
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
                this.watch();
                this.debug.init();

                // public
                this.destroy();
            },
            calcArea: function(){
                this.areaOffset = this.unitTranslator(settings.offset, settings.context.height());
                this.areaHeight = this.unitTranslator(settings.height, settings.context.height());
            },
            watch: function(){
                var _this = this;
                _this.inView();

                if (settings.onScrollDelay) {
                    // set delay for performance reasons (Throttling)
                    var scrollTimer;
                    settings.context.on('resize scroll.inScreenArea' + $main.id, function() {
                        scrollTimer = setTimeout(function() {
                            _this.inView();
                        }, settings.onScrollDelay);
                    });
                } else {
                    settings.context.on('resize scroll.inScreenArea' + $main.id, function(){
                        _this.inView();
                    })
                }


                _this.calcArea();
                var resizeTimeout;
                settings.context.resize(function() {
                    // Debouncing
                    if(!!resizeTimeout){ clearTimeout(resizeTimeout); }
                    resizeTimeout = setTimeout(function(){
                        _this.calcArea();
                    }, settings.onResizeDelay);
                });


            },
            inView: function() {
                var _this = this;
                // each passed jquery object
                $.each($main, function(){
                    var rect = this.getBoundingClientRect();

                    if (_this.positionChecker(rect)) {
                        $(this).trigger( "inSA:in", rect, $main );

                        if (settings.debug && settings.debugOptions.elIdentifier) {
                            _this.debug.setOutline(true, $(this));
                        }
                    } else {
                        $(this).trigger( "inSA:out",  rect, $main );
                        if (settings.debug && settings.debugOptions.elIdentifier) {
                            _this.debug.setOutline(false, $(this));
                        }
                    }
                })

            },
            positionChecker: function(rect){
                //console.log(settings.elementTolerance);
                if (this.elementTolerance == 0) {
                    // it isn't necessary to calc
                    return rect.top >= this.areaOffset && rect.bottom <= this.areaOffset + this.areaHeight
                } else {
                    // use unitTranslator for
                    this.elPercentage = this.unitTranslator(settings.elementTolerance, rect.height);
                    return rect.top >= this.areaOffset - this.elPercentage && rect.bottom <= this.areaOffset + this.areaHeight + this.elPercentage
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

            debug: {
                init: function(){
                    if (settings.context.get() != $(window).get()) {
                        // Easy debugging only works on context that uses the fullscreen beacouse it's built with position: fixed
                        console.warn("debugging doesn't work well on windows that aren't fullscreen");
                    }

                    if (settings.debug) {
                        // simple debugging element
                        var debugEl = $('<div>').css({
                            'position'  : 'fixed',
                            'z-index'   : settings.debugOptions.zIndex,
                            'width'     : '100%',
                            'height'    : settings.height,
                            'top'       : settings.offset,
                            'left'      : 0,
                            'background': settings.debugOptions.background,
                            'pointer-events': 'none'
                        });
                        $('body').append(debugEl);
                    }
                },
                setOutline: function(type, el) {
                    // If type is true set Outline Green
                    if (type) {
                        el.css({
                            'outline': settings.debugOptions.elIdentifierStyle.in,
                            'outline-offset': -4
                        });
                    } else {
                        el.css({
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
                }
            }
        };
        app.init();

        return $main;
    }
}( jQuery ));