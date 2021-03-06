angular.module('ListModule.components', [])

.directive('eventslist', function(EventService, $timeout, $rootScope){
	return {
		restrict: 'A',
		scope: {
			data: '='
		},
		link: function (scope, element, attrs) {
			scope.vm = {};
			scope.data.count = 1;

			// template
			var template = function(events) {
				var old_timestring = '';
				var old_event_titles = {};
				var old_event_featured_images = [];
				var old_date = '';
				scope.data.count = 0; // will be advanced if pass validation below
				if (events.length) {

					var html = '		<div class="my-events">\n';
					for (var each in events) {
						var event = events[each];

						// validate
						if (!event.texts) {
							continue;
						}
						if (old_event_titles[ event.texts[0].replace(/\w/g,'') ]) {
							continue;
						}
						old_event_titles[ event.texts[0].replace(/\w/g,'') ] = true;

						// build
						var timestring = Date.create(event.timestamp).short();
						var todayEnd = moment().endOf('day').format('x');
						if (event.timestamp < todayEnd -1) { // party must end before midnight, because we don't know when exactly tomorrow's dates are, most come in as 12:00am
							timestring = 'today';
						} else if (event.timestamp < todayEnd -1 + 1000*60*60*24) {
							timestring = 'tomorrow';
						} else if (event.timestamp < todayEnd -1 + 1000*60*60*24 *6) {
							timestring = 'this week';
						} else if (event.timestamp < todayEnd -1 + 1000*60*60*24 *30) {
							timestring = 'this month';
						}
						//event.timestamp = event.timestamp.replace(' 12:00am','');
						if (!scope.data.time && timestring != old_timestring) {
							//var timeUnique = cutOldBeginning(old_timestamp, event.timestamp);
							html += '<div class="events-timestamp-spacer"> </div>\n';
							html += '<div class="events-timestamp"><span>' + timestring + '</span></div>\n';
						}
						var ev = '';
						ev += '		<div class="events-event '+ (event.featured?'event-featured':'') +'" style="background-image:url(\'' + event.featured + '\');">';
						ev += '			<div class="event-text">\n';
						if (event.texts[0]) {
							ev += '			<span><a class="event-link" href="' + event.link + '" target="_blank" prevent-default onClick="window.open(\'' + event.link + '\', \'_system\')">' + event.texts[0] + '</a></span>\n';
						}
						if (event.image) {
							ev += '			<span class="event-image"><img src="' + event.image + '" /></span>\n';
						}
						if (event.texts[1]) {
							ev += '			<span>' + event.texts[1] + '</span>\n';
						}
						if (event.texts[2]) {
							ev += '			<span>' + event.texts[2] + '</span>\n';
						}
						ev += '			</div>\n';
						ev += '			<div class="event-subtext">\n';

						var time = moment(event.timestamp).format('h:mma');
						if (time=='12:00am') {
							time = '';
						}
						ev += '		<span ng-click><span class="icon-star"></span> </span>\n';
						if (timestring.indexOf('week') !=1 || timestring.indexOf('month') !=1) {
							ev += '		<span ng-click><span class="ion-calendar"></span> <span>' + moment(event.timestamp).format('MMM D') +' '+time+ '</span></span>\n';
						} else if (time && time!='12:00am') {
							ev += '		<span ng-click><span class="ion-calendar"></span> <span>' + time + '</span></span>\n';
						}
						// if (event.price) {
						// 	ev += '			<span class="subtext-price"><span class="ion-pricetag"></span> <span>'+event.price+'</span></span>\n';
						// }
						ev += '			<a class="subtext-source" href="' + event.source_link + '" target="_blank" prevent-default onClick="window.open(\'' + event.source_link + '\', \'_system\')"><span class="icon-link"></span> ' + (event.source_host.substr(0, event.source_host.indexOf('.'))) + '</a>\n';
						// ev += '			<span class="subtext-fave" ng-click=""><span class="icon-star-outline"></span></span>\n';
						ev += '			</div>\n';
						ev += '		</div>';
						//
						html += ev;
						old_timestring = timestring;

						scope.data.count++;


						// <event>
						if (event.featured) {
							var event_featured = JSON.parse(JSON.stringify(event));
							if (old_event_featured_images.indexOf(event_featured.image) == -1) {
								event_featured.eventsHTML = $sce.trustAsHtml(ev);
								vm.featuredEvents[event.random] = event_featured;
								old_event_featured_images.push(event_featured.image);
							}
						}
						// </event>
						

					}
					html += '		</div>\n';

					return html;
				}

			}

			// add
			scope.list_ready = function(){
				var query = {};
				query.category = scope.data.category;
				query.text = scope.data.text;
				query.time = scope.data.time;
				EventService.getEvents(query)
				.then(function (response) {
					//scope.vm.events = response.data.data;
					angular.element(element)[0].innerHTML = template(response.data.data);
					if (!$rootScope.initiallyLoaded) {
						document.getElementById('stats').innerHTML = '<span>loaded in '+((Date.now()-window.loadStart)/1000)+'s</span>';
						window.setTimeout(function(){
							$rootScope.initiallyLoaded = true;
						},500);
					} else {
						document.getElementById('stats').innerHTML = '';
					}
				}, function (error) {
					console.error(error);
				});
			}

			// remove
			scope.list_reset = function(){
				//scope.vm = {};
				scope.data.count = 0;
				angular.element(element)[0].innerHTML = '<div class="loading-dance" style="background-image:url(\'gfx/gif/dance.gif\')"></div>';
				$timeout(function(){
					if (element) {
						$(element).addClass('ready');
					}
				},500);
			}

			// lazyload
			scope.list_reset();
			if (!$rootScope.lazyLoadedLists) {
				$rootScope.lazyLoadedLists = {};
			}
			scope.element = element;
			var lazy_load = function(){
				element = scope.element;
				var window_width = (document.body.clientWidth || document.documentElement.clientWidth || document.clientWidth ||window.innerWidth);
				var rect = element[0].getBoundingClientRect();
				if (rect.left > 0 && rect.left < window_width) {

					if (!$rootScope.lazyLoadedLists[ scope.data.category ]) {
						$rootScope.lazyLoadedLists[ scope.data.category ] = scope;
						scope.list_ready();
					}

				} else {
					if ($rootScope.lazyLoadedLists[ scope.data.category ]) {
						delete $rootScope.lazyLoadedLists[ scope.data.category ];
						scope.list_reset();
					}
				}
			}
			scope.$watch(lazy_load);
			$(window).on("resize.doResize", lazy_load);
			scope.$on("$destroy",function (){
				$(window).off("resize.doResize");
			});
		}
	}
})