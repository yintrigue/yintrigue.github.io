// http://closure-compiler.appspot.com/
// ==ClosureCompiler==
// @output_file_name script.closure.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// @code_url http://yintegral.com/js/sc/jquery-1.8.3.js
// @code_url http://yintegral.com/js/sc/velocity.min.js
// @code_url http://yintegral.com/js/sc/pxem.jQuery.js
// @code_url http://yintegral.com/js/sc/imagesloaded.pkgd.min.js
// @code_url http://yintegral.com/js/sc/jquery.popupoverlay.js
// @code_url http://yintegral.com/js/sc/jquery.ripples.js
// @code_url http://yintegral.com/js/sc/mobile-check.js
// @code_url http://yintegral.com/js/sc/jquery.easing.1.3.js
// @code_url http://yintegral.com/js/sc/script.js
// ==/ClosureCompiler==

/** global config variables */
var SLIDE_SPEED 						= 700;
var SLIDE_MOTION 						= [ 200, 10 ]; // about animation
var ANCHOR_SCROLL_SPEED 				= 1000; // animation time to scroll to the top of #container_portfolio
var ANCHOR_SCROLL_MOTION 				= 'easeOutElastic';
var MEDUSA_ANIMATE_INTERVAL 			= 1500; // 50% chance that Medusa's eyes will close every interval
var MEDUSA_EYES_CLOSED_TIME_MAX 		= 500; // the longest time that Medusa's eyes can stay closed

var GLOBAL_NAV_HEIGHT;
var GLOBAL_NAV_HEIGHT_VISIBLE;
var SLIDE_IN_SPEED_GLOBAL_NAV 		= 1000;
var SLIDE_OUT_SPEED_GLOBAL_NAV 		= 1000;
var SLIDE_IN_MOTION_NAV 			= [ 300, 10 ];
var SLIDE_OUT_MOTION_NAV 			= 'easeOutCirc';
var GLOBAL_NAV_ANIMATION_STATE 		= false;
var GLOBAL_NAV_STATE 				= "i"; // c->closed, o->opened, i->init state
var GLOBAL_MENU_COLUMN_GAP 			= 13; // in px

/** variables for portfolio layout switch */
var TWO_COLUMN 						= 2;
var ONE_COLUMN 						= 1;
var portfolioLayout = TWO_COLUMN;
var portfolioLeftColumn; // stores original child elements under #portfolio_left
var portfolioRightColumn; // stores original child elements under #portfolio_right

var PRELOADER_OVERLAY_BG_COLOR 			= "#ff3506";
var PRELOADER_OVERLAY_TRANSITION_TIME 	= "all 0.5s ease-in";
var BLUR_INTRO_TRANSITION_TIME 			= "all 1.5s ease-out";
var INTRO_BLUR_PX						= 20;
var LOAD_SCREEN_MIN_TIME				= 1000;

var WATER_DROP_INTERVAL					= 10000;
var WATER_DROP_MAX_RADIUS				= 10;
var WATER_DROP_MIN_RADIUS				= 30;
var WATER_DROP_MAX_STRENGTH				= 0.001;
var WATER_DROP_MIN_STRENGTH				= 0.004;
var WATER_DROP_INI_STRENGTH				= 0.15;

var WATER_DROP_INTERVAL_MOBILE			= 10000;
var WATER_DROP_MAX_RADIUS_MOBILE		= 50;
var WATER_DROP_MIN_RADIUS_MOBILE		= 150;
var WATER_DROP_MAX_STRENGTH_MOBILE		= 0.07;
var WATER_DROP_MIN_STRENGTH_MOBILE		= 0.03;
var WATER_DROP_INI_STRENGTH_MOBILE		= 0.05;
var WATER_DROP_CLICK_STRENGTH_MOBILE	= 0.1;
var WATER_DROP_CLICK_RADIUS_MOBILE		= 100;

var WATER_DROP_MOUSE_DEFAULTS 			= 	{
												resolution: 512,
												dropRadius: 20, // px
												perturbance: 0.04,
											}
var WATER_DROP_MOUSE_DEFAULTS_MOBILE	= 	{
												resolution: 100,
												dropRadius: 200, // px
												interactive: false, // force manual riple on mobile; defualt click interaction provided does not work for some unknow reason
												perturbance: 0.01,
											}

var IS_MOBILE							= false;


/** Enable animation after DOM is ready. */
$(document).ready(function () {
	
	IS_MOBILE = window.isMobileAndTablet();
	
	// intro animaion blur
	// exclude firefox because of the dumb bug that prevents firefox from rendering properly when filter is applied
	if (!$.browser.mozilla) {
		blurElement("#container_main", INTRO_BLUR_PX);
	}
	
	// initialize contact popup
	// #preloader_overlay_base required because of the fucking dumb popup plug in won't allow different transition intervals betwee transition-in and transition-out
	// goal is to peopl on the overlay immediately at transition-in but fade out at transition-out
	$("#preloader_overlay").popup({
		opacity				: 1,
		color				: PRELOADER_OVERLAY_BG_COLOR,
		backgroundactive	: false,
		scrolllock			: true
	});
	$("#preloader_overlay").popup("show");

	// remove css bg and let the ripple plug in handle the bg rendering instead
	var cover = $('#container_cover');
	var bg = cover.css("background-image");
	bg = bg.replace('url(','').replace(')','').replace(/\"/gi, "");
	cover.css("background-image", "none");
	WATER_DROP_MOUSE_DEFAULTS["imageUrl"] = bg;
	WATER_DROP_MOUSE_DEFAULTS_MOBILE["imageUrl"] = bg;
	
	// initialize ripple effect
	// enable ripple effect only on desktop & ipad
	// this has to be done at doc ready as loading bg takes time
	// https://github.com/sirxemic/jquery.ripples
	if (!IS_MOBILE) {
		
		try {
			cover.ripples(WATER_DROP_MOUSE_DEFAULTS); // ini	
			dropRandomRipples(cover, WATER_DROP_INTERVAL);	
		} catch (e) {
			console.log(e);
		}
		
	} else {

		try {
			cover.ripples(WATER_DROP_MOUSE_DEFAULTS_MOBILE); // ini	
			dropRandomRipples(cover, WATER_DROP_INTERVAL_MOBILE);	
		} catch (e) {
			console.log(e);
		}
		
		// do nothing about the cover bg; bg URL is already set in CSS
		document.addEventListener("touchstart", function(){}, true);
	}
});
/** Load portfolio only after the cover & about is loaded. */
$(window).on("load", function() {	
	$("#container_portfolio").load("portfolio.html", function() {
		// store original child elements
		portfolioLeftColumn = jQuery.makeArray($("#portfolio_left .work_wrapper"));
		portfolioRightColumn = jQuery.makeArray($("#portfolio_right .work_wrapper"));
		
		$(window).on('resize', onWindowsResize);
		animateMedusa();
		enableYintrigue(); // enable interaction for Yintrigue
		
		
		
		// hack to fix the fucking bug that Safari and Chrome fire onLoad as soon as DOM is ready
		// repeatedly check layout for 30s 
		// this assumes that portfolio would complete loading all images within 30s
		$("#container_main").imagesLoaded( function() {
			// images have loaded
			onWindowsResize();
		});
		$("#global_nav").imagesLoaded( function() {
			// images have loaded
			onWindowsResize();
			
			updateGlobalNav(); // update the global nav layout
			enableGlobalNavInteraction();
			enableAbout();
			
			$("#preloader_overlay_base").popup({
				opacity				: 1,
				color				: PRELOADER_OVERLAY_BG_COLOR,
				transition			: PRELOADER_OVERLAY_TRANSITION_TIME,
				backgroundactive	: false,
				scrolllock			: true
			});
			$("#preloader_overlay_base").popup("show");
			
			// ensure at least some time for loading screen
			// this avoids showing contents before the popup intro animation finishes
			var invervalCount = 0;
			var refreshId = setInterval( function() 
			{
				clearInterval(refreshId)
				
				$("#preloader_overlay").popup("hide");
				$("#preloader_overlay_base").popup("hide");
				if (!$.browser.mozilla) {
					blurElement("#container_main", 0, BLUR_INTRO_TRANSITION_TIME);
				}
				
				var cover = $("#container_cover");
				
				// force dropping the first wave of ripples
				var x 			= Math.floor( cover.width() );
				var y 			= Math.floor( cover.height() );
				var radius 		= Math.floor( cover.width() / 2 );
				var strength 	= WATER_DROP_INI_STRENGTH;
				if (IS_MOBILE) {
					strength 	= WATER_DROP_INI_STRENGTH_MOBILE;
					
					cover.ripples('drop', 0, 0, radius, strength); 
					cover.ripples('drop', x, 0, radius, strength);
					cover.ripples('drop', x/2, y/2, radius, strength/2);
					cover.click(function (event) {
						cover.ripples('drop', event.pageX, event.pageY, WATER_DROP_CLICK_RADIUS_MOBILE, WATER_DROP_CLICK_STRENGTH_MOBILE);
					});
				}
				cover.ripples('drop', 0, 0, radius, strength); 
				cover.ripples('drop', x, 0, radius, strength);
				cover.ripples('drop', x/2, y/2, radius, strength);
					
			}, LOAD_SCREEN_MIN_TIME);
			
			
		});
	});
});
function onWindowsResize() {	
	
	updateGlobalNav();
	
	// fix the weird bug that something is adding 15px margin to the body
	$("body").css({"margin-right":"0px"});
	
	// switch column layout depending on the window width
	if ( ($("#portfolio_left").css("float") == "none") && (portfolioLayout == TWO_COLUMN) ){
		var lostCapital	= $("#work_lostCapital").parent().detach();
		var cSplash		= $("#work_creative_splash").parent().detach();
		var jumpman23 	= $("#work_jumpman23").parent().detach();
		var chatO 		= $("#work_chat_o").parent().detach();
		var yintrigue 	= $("#work_yintrigue").parent().detach();
		//var moments 		= $("#work_moments").parent().detach();
		var ea 			= $("#work_ea").parent().detach();
		var phpBooking 	= $("#work_php_booking").parent().detach();
		//var nau 			= $("#work_nau").parent().detach();
		
		// switch to one column layout
		$("#portfolio_left").append(lostCapital, cSplash, yintrigue, chatO, jumpman23, ea, phpBooking);
		portfolioLayout = ONE_COLUMN;
	} else if ( ($("#portfolio_left").css("float") == "left") && (portfolioLayout == ONE_COLUMN) ) {
		//restore two column layout
		$(portfolioLeftColumn).appendTo( $("#portfolio_left") );
		$(portfolioRightColumn).appendTo( $("#portfolio_right") );
		portfolioLayout = TWO_COLUMN;
	}
	/*
	// fill in the bottom if two column layout
	if (portfolioLayout == TWO_COLUMN) {
		
		var lastChild;
		var bgColor;
		var lastChildHeight;
		
		var leftH = parseInt($("#portfolio_left").outerHeight(true));
		var rightH = parseInt($("#portfolio_right").outerHeight(true));
		var hDiff = Math.abs(leftH - rightH);
		
		if ( leftH < rightH ) {
			lastChild = $("#portfolio_left .work_wrapper:last-child").children();
		} else {
			lastChild = $("#portfolio_right .work_wrapper:last-child").children();
		}
		
		bgColor = lastChild.css("background-color");
		lastChildHeight = parseInt(lastChild.css("height"));
		lastChildHeight += hDiff;
		lastChild.css("height", lastChildHeight);
		
		$("#container_portfolio").css("background-color", bgColor);
	}
	*/
}



function enableAbout() {
	// disable right click on about
	$("#container_about").on("contextmenu",function(){
       return false;
    }); 
	
	var slider = $('#slider');
	var slider_ul = $('#slider ul');
	var slider_li = $('#slider ul li');
	
	// assuming all slides are of equal width
	var slideCount = slider_li.length;
	var slideWidth = slider_li.width();
	var sliderDivWidth = slideCount * slideWidth;
	
	var iniSliderDivX = ($(window).width() - slideWidth)/2;
	var sliderDivLeftX = iniSliderDivX;
	var slideProgress = 0;
		
	slider.css({ left: iniSliderDivX });
	slider.parent().mousemove(function( event ) {
		if (event.pageX <= $(window).width()/2) {
			slider.parent().css( 'cursor', 'url(img/about/cursor-left.png), pointer' );
		} else {
			slider.parent().css( 'cursor', 'url(img/about/cursor-right.png), pointer' );
		}
	});
	slider.parent().click(function (event) {
        var slideDirection = Math.round(event.clientX/$(window).width());
		slide(slider, slideDirection);
    });
	
	/**
	 * slideDirection: 1 to right right; -1 to the left
	 */
    function slide(slider, slideDirection) {
		
		slider.stop(); // kill previous animation
		
		// only allow slide to previous on desktop
		if (slideDirection == 1 || IS_MOBILE) {
			// slide to the right (i.e. next slide)
			if ((slideProgress * slideWidth) == (sliderDivWidth - slideWidth)) {
				// reset slider position
				sliderDivLeftX = iniSliderDivX;
				slideProgress = 0;
			} else {
				// move on to the next slide
				sliderDivLeftX -= slideWidth;
				slideProgress++;
			}
		} else {
			// slide to the left (i.e. previous slide)
			if (slideProgress == 0) {
				/*
				// slide to the last slide
				sliderDivLeftX = -1 * (sliderDivWidth - slideWidth) + iniSliderDivX;
				slideProgress = slideCount - 1;
				*/
				
				// reset slider position
				sliderDivLeftX = iniSliderDivX;
				slideProgress = 0;
				
				slider.css("left", "100px");
			} else {
				// move on to the next slide
				sliderDivLeftX += slideWidth;
				slideProgress--;
			}
		}
		
		updateYingFace(slideProgress);
		
        slider.velocity({
            left: sliderDivLeftX
        }, {
			duration: SLIDE_SPEED, 
			/** http://gsgd.co.uk/sandbox/jquery/easing/ */
			easing: SLIDE_MOTION
		});
    };
	
	function updateYingFace(slideNum) {
		var yingCreating = $('#ying_creating');
		var yingThinking = $('#ying_thinking');
		var yingQuestioning = $('#ying_questioning');
		var YingClickMe = $('#ying_click_me');
		
		// hard code to change Ying's face to save time
		switch(slideNum) {
			
			case 0:
				yingCreating.css('visibility', 'hidden');
				yingThinking.css('visibility', 'hidden');
				yingQuestioning.css('visibility', 'visible');
				YingClickMe.css('visibility', 'hidden');
				break;
			case 7:
				yingCreating.css('visibility', 'hidden');
				yingThinking.css('visibility', 'hidden');
				yingQuestioning.css('visibility', 'visible');
				YingClickMe.css('visibility', 'hidden');
				break;
			case 8:
				yingCreating.css('visibility', 'visible');
				yingThinking.css('visibility', 'hidden');
				yingQuestioning.css('visibility', 'hidden');
				YingClickMe.css('visibility', 'hidden');
				break;
			default:
				yingCreating.css('visibility', 'hidden');
				yingThinking.css('visibility', 'visible');
				yingQuestioning.css('visibility', 'hidden');
				YingClickMe.css('visibility', 'hidden');
		}
	}
	
	$(window).on('resize', function(){
		slideWidth = slider_li.width();
		sliderDivWidth = slideCount * slideWidth;
		iniSliderDivX = ($(window).width() - slideWidth)/2;
		sliderDivLeftX = iniSliderDivX - (slideProgress * slideWidth);
		
		slider.css({ left: sliderDivLeftX });
	});
}



function dropRandomRipples(target, interval) {
	
	var refreshId = setInterval( function() 
	{
		var x;
		var y;
		var radius;
		var strength;
		
		x = Math.round( Math.random() * target.width() );
		y = Math.round( Math.random() * target.height() );
			
		if (!IS_MOBILE) {
			radius 		= Math.random() * ( WATER_DROP_MAX_RADIUS - WATER_DROP_MIN_RADIUS ) + WATER_DROP_MIN_RADIUS;
			strength 	= Math.random() * ( WATER_DROP_MAX_STRENGTH - WATER_DROP_MIN_STRENGTH ) + WATER_DROP_MIN_STRENGTH;
		} else {
			radius 		= Math.random() * ( WATER_DROP_MAX_RADIUS_MOBILE - WATER_DROP_MIN_RADIUS_MOBILE ) + WATER_DROP_MIN_RADIUS_MOBILE;
			strength 	= Math.random() * ( WATER_DROP_MAX_STRENGTH_MOBILE - WATER_DROP_MIN_STRENGTH_MOBILE ) + WATER_DROP_MIN_STRENGTH_MOBILE;
		}
		
		x = Math.round(x);
		y = Math.round(y);
		radius = Math.round( radius );
		strength = Math.round( strength * 1000 ) / 1000;
		
		target.ripples('drop', x, y, radius, strength);
		
	}, interval);
	
}
function updateGlobalNav() {
	var nav = $( "#global_nav" );

	var menuWrapper = $("#logo_menu_wrapper");
	var menuHeight = menuWrapper.outerHeight();
	
	GLOBAL_NAV_HEIGHT_VISIBLE = menuHeight;
	GLOBAL_NAV_HEIGHT = GLOBAL_NAV_HEIGHT_VISIBLE * 2;
	var menuTopMargin = GLOBAL_NAV_HEIGHT - GLOBAL_NAV_HEIGHT_VISIBLE;
	var visibleMovement = GLOBAL_NAV_HEIGHT_VISIBLE - GLOBAL_NAV_HEIGHT;
	
	// update overall layout
	nav.css("height", GLOBAL_NAV_HEIGHT + "px");
	menuWrapper.css("margin-top", menuTopMargin + "px");
	if (GLOBAL_NAV_STATE == "i" || GLOBAL_NAV_STATE == "o" ) {
		openTopNav(true, false, true);
	} else {
		openTopNav(false, false);
	}
	
	
	// update column gap
	var leftColumnWidth = $("#global_nav #logo_menu_wrapper #global_menu #global_left").width();
	var rightColumnMargin = leftColumnWidth + GLOBAL_MENU_COLUMN_GAP;
	$("#global_nav #logo_menu_wrapper #global_menu #global_right").css("margin-left", rightColumnMargin);
	
}
function enableGlobalNavInteraction() {
	
	var nav = $( "#global_nav" );
	var cover = $( "#container_cover" );
	
	$(window).scroll(function (event) {
    var scroll = $(window).scrollTop();
		var scrollPosition = $(window).scrollTop();
		if ( scrollPosition <= 0 ) {
			openTopNav(true);
		} else {
			openTopNav(false);
		}
	});
	
	cover.click(function (event) {
        openTopNav(false);
    });

}
/**
  * @parm enforce Force open/close regardless of GLOBAL_NAV_STATE
  */
function openTopNav(toOpen, doAnimation, enforce) {
	
	// default to do animation
	if (typeof doAnimation === "undefined") {
		doAnimation = true;
	}
	// default not to force open/close
	if (typeof enforce === "undefined") {
		enforce = false;
	}
	
	var nav = $( "#global_nav" );
	if ( (toOpen && GLOBAL_NAV_STATE != "o") || (enforce && toOpen) ) { // open only if currently closed
		
		GLOBAL_NAV_STATE = "o";
		GLOBAL_NAV_ANIMATION_STATE = true;
		
		// hard code to fix the issue that some browsers show nav contents before they are moved off screen
		// css set to hidden first; JS makes is visible upon opening
		$("#logo_menu_wrapper").css("visibility", "visible");
		
		var visibleMovement = GLOBAL_NAV_HEIGHT_VISIBLE - GLOBAL_NAV_HEIGHT;
		nav.velocity("stop");
		if (doAnimation) {
			nav.velocity({
				top: visibleMovement
			}, {
				duration: SLIDE_IN_SPEED_GLOBAL_NAV, 
				easing: SLIDE_IN_MOTION_NAV
			});
		} else {
			nav.css("top", visibleMovement);
		}
		
	} else if ((!toOpen && GLOBAL_NAV_STATE != "c") || (enforce && !toOpen) ) { // close only if currently opened
		
		GLOBAL_NAV_STATE = "c";
		GLOBAL_NAV_ANIMATION_STATE = false;
		
		nav.velocity("stop");
		if (doAnimation) {
			nav.velocity({
				top: -GLOBAL_NAV_HEIGHT
			}, {
				duration: SLIDE_OUT_SPEED_GLOBAL_NAV, 
				easing: SLIDE_OUT_MOTION_NAV
			});
		} else {
			nav.css("top", -GLOBAL_NAV_HEIGHT);
		}
		
	}
	
}



function animateMedusa() {
	var refreshId = setInterval( function() 
    {
        if (Math.random() < 0.5) {
			var blinktime = Math.round( Math.random() * MEDUSA_EYES_CLOSED_TIME_MAX );
			blinkMedusaEyes(blinktime);
		}
    }, MEDUSA_ANIMATE_INTERVAL);
	
}
function blinkMedusaEyes(blinkTime) {
	var clsoedEyes = $("#work_lostCapital .medusa_eyes_closed");
	if ( clsoedEyes.css("visibility") == "hidden" ) {
		// close Medusa's eyes if currently opened
		clsoedEyes.css("visibility", "visible");
		// open Medusa's eyes again after blinkTime
		var refreshId = setInterval( function() 
    	{
			clsoedEyes.css("visibility", "hidden");
			clearInterval(refreshId);
    	}, blinkTime);
	} else {
		clsoedEyes.css("visibility", "hidden");
	}
}


function enableYintrigue () {
	var yinHeader = $('#work_yintrigue .header');
	var yinSubTitle = $('#work_yintrigue .subtitle');
	var yinSubTitleBG = $('#work_yintrigue .subtitle-bg');

	yinHeader.mouseenter(function() {
		yinSubTitle.velocity("stop");
		yinSubTitleBG.velocity("stop");
		yinSubTitle.velocity({
			opacity: "1"
		}, {delay: 100});
		yinSubTitleBG.velocity({
			opacity: "0.4"
		});
	});
	yinHeader.mouseleave(function() {
		yinSubTitle.velocity("stop");
		yinSubTitleBG.velocity("stop");
		yinSubTitle.velocity({
			opacity: "0"
		});
		yinSubTitleBG.velocity({
			opacity: "0"
		});
	});
}



function blurElement(element, size, transition) {
	var filterVal = 'blur(' + size + 'px)';
	$(element)
		.css('filter', filterVal)
		.css('-webkit-filter', filterVal)
		.css('-moz-filter', filterVal)
		.css('-o-filter', filterVal)
		.css('-ms-filter', filterVal);
	if (typeof transition === undefined) {
		transition = 'all 0s';
	}
	$(element)
		.css('transition', transition)
		.css('-webkit-transition', transition)
		.css('-moz-transition', transition)
		.css('-o-transition', transition);

}
/** Scroll to an anchor */
$(function() {
    $('a[href*="#"]:not([href="#"])').click(function() {
        if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
			var target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
			if (target.length) {
                $('html, body').animate({
                    scrollTop: target.offset().top
                }, {
                    duration: ANCHOR_SCROLL_SPEED,
                    easing: ANCHOR_SCROLL_MOTION
                });
                return false;
            }
        }
    });
});