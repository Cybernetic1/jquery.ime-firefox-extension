$( document ).ready( function () {
	// Extend the ime preference system
	$.extend( $.ime.preferences, {

		save: function () {
			localStorage.setItem( 'imepreferences', JSON.stringify( this.registry ) );
		},

		load: function () {
			this.registry = JSON.parse( localStorage.getItem( 'imepreferences' ) ) || this.registry;
		}

	} );

	
	function quickList() {
		var unique = [ $( 'html' ).attr( 'lang' ) || 'en' ],
			previousIMELanguages;

		previousIMELanguages = $.ime.preferences.getPreviousLanguages() || [];
		$.each( previousIMELanguages, function ( i, v ) {
			if ( $.inArray( v, unique ) === -1 ) {
				unique.push( v );
			}
		} );

		return unique.slice( 0, 6 );
	}
	
	function availableLanguages() {
		var language,
			availableLanguages = {};

		for ( language in $.ime.languages ) {
			availableLanguages[language] = $.ime.languages[language].autonym;
		}
		return availableLanguages;
	};
	
	// Load the ime preferences
	$.ime.preferences.load();
	
	$( 'body' ).on( 'focus.ime', 'input:not([type]), input[type=text], input[type=search], textarea', function () {
		var $input = $( this );
		$input.ime( {
			languages: quickList(),
			languageSelector: function () {
				var $ulsTrigger;
	
				$ulsTrigger = $( '<a>' ).text( '...' )
					.addClass( 'ime-selector-more-languages selectable-row selectable-row-item' );
	
				$ulsTrigger.uls( {
					onSelect: function ( language ) {
						$input.data( 'imeselector' ).selectLanguage( language );
						$input.focus();
					},
					lazyload: false,
					languages: availableLanguages()
					// top: $( window ).height()/2 - 214,
					// left: $( window ).width()/2 - 358
				} );
	
				return $ulsTrigger;
			},
			helpHandler: function ( ime ) {
				return $( '<a>' )
					.attr( {
						href: 'https://www.mediawiki.org/wiki/Special:MyLanguage/Help:Extension:UniversalLanguageSelector/Input_methods/$1'.replace( '$1', ime ),
						target: '_blank',
						title: 'How to use'
					} )
					.addClass( 'ime-perime-help' )
					.click( function ( event ) {
						event.stopPropagation();
					} );
			}
		} );

		$input.data( 'ime' ).constructor.prototype.load = function ( inputmethodId ) {
			var ime = this,
				deferred = $.Deferred(),
				dependency,
				runtimeOrExtension;

			if ( $.ime.inputmethods[inputmethodId] ) {
				return deferred.resolve();
			}

			dependency = $.ime.sources[inputmethodId].depends;
			if ( dependency ) {
				return $.when( this.load( dependency ), this.load( inputmethodId ) );
			}

			// notify addon script to inject required file
			self.port.emit( 'injectScript', $.ime.sources[inputmethodId].source );

			// Callback function from addon script to notify whether
			// script injected successfully or not.
			self.port.on( 'injectSciptCallback', function ( response ) {
				if ( response.injected ) {
					// script injected successfully
					eval( response.scriptToInject );
					console.log( name + ' loaded' );
					deferred.resolve();
				} else {
					// some error occured while injecting script
					console.log( 'Error in loading inputmethod ' + name + ' Error: ' + response.errorMessage );
				}
				
			} );

			return deferred.promise();
		}
	} );
} );