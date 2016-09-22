/**
 * Created by Инал on 20.06.2015.
 */

"use strict";

var __STATES = {
		event: OneEvent,
		feed: Feed,
		organizations: OrganizationsList,
		organization: Organization,
		onboarding: Onboarding,
		search: Search,
		friends: Friends,
		friend: OneFriend,
		edit_event: EditEvent,
		statistics: StatisticsOverview,
		organization_statistics: StatisticsOrganization,
		event_statistics: StatisticsEvent,
		getCurrentState: function(){
			return window.location.pathname.split('/')[1];
		},
		get entityId(){
			var page = this.getCurrentState();
			switch(page){
				case 'event':
				case 'friend':
				case 'organization': {
					return window.location.pathname.split('/')[2];
				}
				case 'edit_event': {
					return History.getState().data.eventId;
				}
				case 'add_organization': {
					break;
				}
				case 'edit_organization': {
					return History.getState().data.organizationId;
				}
				case 'statistics': {
					break;
				}
				default: {
					console.log('Using method in unexpected place');
					return undefined;
				}
			}

		}
	};

/* PAGE CONTROLLERS */
function Feed($view){
	var $window = $(window),
		$wrapper = $view.find('.page_wrapper'),
		state = History.getState(),
		state_data = state.data,
		tab_state_id = $wrapper.data('tab_state_id') ? $wrapper.data('tab_state_id') : 0,
		current_offset = 0,
		ajax_url = '/api/v1/events/',
		fields = [
			'organization_name',
			'organization_short_name',
			'organization_logo_small_url',
			'dates',
			'favored_users_count',
			'is_favorite',
			'favored{fields:"is_friend",order_by:"-is_friend",length:10}',
			'registration_required',
			'registration_till',
			'is_free',
			'min_price'
		],
		sub_states = {
			'actual': {
				label: 'Актуальные',
				ajax_url: ajax_url + 'my',
				ajax_data: {
					fields: Array.newFrom(fields, 'actuality'),
					future: true,
					order_by: '-actuality'
				},
				hidden: false
			},
			'timeline': {
				label: 'По времени',
				ajax_url: ajax_url + 'my',
				ajax_data: {
					fields: fields,
					future: true
				},
				hidden: false
			},
			'favored': {
				label: 'Избранные',
				ajax_url: ajax_url + 'favorites',
				ajax_data: {
					fields: fields,
					future: true
				},
				hidden: false
			},
			'recommendations': {
				label: 'Рекомендованные',
				ajax_url: ajax_url + 'recommendations',
				ajax_data: {
					fields: fields,
					future: true,
					order_by: '-rating'
				},
				hidden: false
			},
			'friends': {
				label: 'Друзья',
				ajax_url: ajax_url + 'my',
				ajax_data: {
					fields: Array.newFrom(fields, 'favored_friends_count'),
					future: true,
					order_by: '-favored_friends_count'
				},
				hidden: true
			},
			'day': {
				label: moment(state_data.date).format('DD MMMM YYYY'),
				ajax_url: ajax_url + 'my',
				ajax_data: {
					fields: fields,
					future: false,
					date: state_data.date
				},
				hidden: true
			}
		};

	function renderFeedHeaderTabs(sub_states, active_state){
		var header_tabs = [];
		$.each(sub_states, function(sub_state, options){
			if(!options.hidden){
				header_tabs.push({
					label: options.label,
					dataset: {
						page: 'feed',
						tab_state: sub_state,
						title: options.label
					},
					classes: (active_state == sub_state) ? [__C.CLASSES.NEW_ACTIVE, 'Controller'] : ['Controller']
				});
			}
		});
		renderHeaderTabs(header_tabs);
	}

	function bindEventsEvents($parent){
		bindAddAvatar($parent);
		trimAvatarsCollection($parent);
		bindRippleEffect($parent);
		bindDropdown($parent);
		Modal.bindCallModal($parent);
		bindControllers($parent);
		bindSubscribeButton($parent, {
			labels: {
				subscribe: 'Добавить в избранное',
				subscribed: 'Избранное событие',
				unsubscribe: 'Удалить из избранного'
			},
			icons: {
				subscribe: 'fa-star-o',
				subscribed: 'fa-star',
				unsubscribe: 'fa-times'
			}
		});

		$parent.find('.HideEvent').not('.-Handled_HideEvent').each(function(){
			var $this = $(this),
				$event = $this.parents('.FeedEvent'),
				event_id = $this.data("event-id");

			$this.on('click', function(){
				$event.addClass('-cancel');
				$.ajax({
					url: '/api/v1/events/'+event_id+'/status',
					data: {
						hidden: true
					},
					method: 'PUT',
					success: function(res){
						ajaxHandler(res, function(data, text){
							$event.after(tmpl('button', {
								classes: '-color_neutral ReturnEvent',
								title: 'Вернуть событие',
								dataset: 'data-event-id="'+event_id+'"'
							}));
							$event.siblings('.ReturnEvent').not('.-Handled_ReturnEvent').on('click', function(){
								var $remove_button = $(this);
								$.ajax({
									url: '/api/v1/events/'+event_id+'/status',
									data: {
										hidden: false
									},
									method: 'PUT',
									success: function(res){
										ajaxHandler(res, function(data, text){
											$remove_button.remove();
											$event.removeClass('-cancel');
										}, ajaxErrorHandler)
									}
								});
							}).addClass('-Handled_ReturnEvent');
						}, ajaxErrorHandler)
					}
				});
			});
		}).addClass('-Handled_HideEvent');
	}

	function initFeedCalendar($parent){
		var state_date = state_data.date,
			MainCalendar = new Calendar($parent.find('.FeedCalendar'), {
			classes: {
				wrapper_class: 'feed_calendar_wrapper',
				table_class: 'feed_calendar_table',
				thead_class: 'feed_calendar_thead',
				tbody_class: 'feed_calendar_tbody',
				th_class: 'feed_calendar_th',
				td_class: 'feed_calendar_td',
				td_disabled: '-disabled'
			}
		});

		function setDaysWithEvents(calendar){
			calendar.$calendar.find('.feed_calendar_td').removeClass('Controller has_favorites').addClass(__C.CLASSES.NEW_DISABLED);
			$.ajax({
				url: '/api/v1/events/dates',
				data: {
					since: calendar.current_month.startOf('month').format(__C.DATE_FORMAT),
					till: calendar.current_month.endOf('month').format(__C.DATE_FORMAT),
					offset: 0,
					length: 500,
					my: true,
					unique: true
				},
				success: function(res){
					res.data.forEach(function(day){
						$('.Day_' + moment.unix(day.event_date).format(__C.DATE_FORMAT))
							.data('page', 'feed')
							.addClass('Controller')
							.addClass(day.favorites_count > 0 ? 'has_favorites' : '')
							.removeClass(__C.CLASSES.NEW_DISABLED);
					});
					calendar.bindDaySelection();

					bindControllers(calendar.$calendar);
				}
			});
		}

		MainCalendar.init();
		if(state_date){
			MainCalendar.setMonth(state_date.split('-')[1], state_date.split('-')[0]).selectDays(state_date);
		}
		setDaysWithEvents(MainCalendar);
		MainCalendar.$calendar.on('month-changed', function(){
			bindControllers(MainCalendar.$calendar);
			setDaysWithEvents(MainCalendar);
		});
	}

	function uploadMoreEvents(sub_state, length, offset, success){
		var $events = $(),
			ajax_data = sub_state.ajax_data;
		ajax_data.length = length;
		ajax_data.offset = offset;
		ajax_data.fields = Array.isArray(ajax_data.fields) ? ajax_data.fields.join(',') : ajax_data.fields;
		$.ajax({
			url: sub_state.ajax_url,
			data: ajax_data,
			method: 'GET',
			success: function(res){
				ajaxHandler(res, function(data, text){
					data.forEach(function(event){
						var $subscribers = buildAvatarCollection(event.favored, 4),
							avatars_collection_classes = [],
							favored_users_count = ($subscribers.length <= 4) ? 0 : event.favored_users_count - 4,
							$event;

						if(event.is_favorite){
							avatars_collection_classes.push('-subscribed');
							if($subscribers.length > 4){
								avatars_collection_classes.push('-shift');
							}
						}

						event.subscribe_button_classes = event.is_favorite ? ['fa-star', '-color_accent', '-Subscribed'].join(' ') : ['fa-star-o', '-color_neutral_accent'].join(' ');
						event.subscribe_button_text = event.is_favorite ? 'Избранное событие' : 'Добавить в избранное';
						event.subscribers = $subscribers;
						event.avatars_collection_classes = avatars_collection_classes.join(' ');
						event.favored_users_show = favored_users_count ? '' : '-cast';
						event.favored_users_count = favored_users_count;

						if(event.nearest_event_date){
							event.feed_event_infos = tmpl('feed-event-info', {text: moment.unix(event.nearest_event_date).format('D MMMM, HH:mm')});
						} else {
							var time = event.dates[0].start_time.split(':');
							time.pop();
							event.feed_event_infos = tmpl('feed-event-info', {text: moment.unix(event.dates[0].event_date).format('D MMMM')+', '+time.join(':')});
						}
						if(event.registration_required){
							event.feed_event_infos = event.feed_event_infos.add(tmpl('feed-event-info', {text: 'Регистрация до '+moment.unix(event.registration_till).format('D MMMM, HH:mm')}));
						}
						if(event.is_free){
							event.feed_event_infos = event.feed_event_infos.add(tmpl('feed-event-info', {text: 'Бесплатно'}));
						} else {
							event.feed_event_infos = event.feed_event_infos.add(tmpl('feed-event-info', {text: 'Цена от '+(event.min_price ? event.min_price : 0) +' руб.'}));
						}

						$event = tmpl('feed-event', event);
						$event.appear(function() {
							storeStat(event.id, __C.STATS.EVENT_ENTITY, __C.STATS.EVENT_VIEW);
						}, {accY: 100});

						$events = $events.add($event);
					});
					if(success && typeof success == 'function'){
						success($events);
					}
				}, ajaxErrorHandler)
			}
		});
	}
	
	function addNoEventsBlock($wrapper){
		var $no_events_block = tmpl('feed-no-event', {
			text: 'Как насчет того, чтобы подписаться на организации?',
			button: buildButton({
				title: 'Перейти к каталогу',
				classes: ['-color_neutral_accent', 'RippleEffect', 'Controller'],
				dataset: {
					page: 'organizations',
					title: 'Организации'
				}
			})
		}, $wrapper);
		bindControllers($no_events_block);
		bindRippleEffect($no_events_block);
	}

	if(!state_data.tab_state){
		if(state_data.date){
			state_data.tab_state = 'day'
		} else {
			state_data.tab_state = 'actual'
		}
		state_data._index = History.getCurrentIndex();
		state_data.reload = false;
		History.replaceState(state_data, sub_states[state_data.tab_state].label);
	}
	$wrapper.empty().data('tab_state_id', ++tab_state_id);
	$wrapper.append(tmpl('feed-event-wrapper', {}));
	renderFeedHeaderTabs(sub_states, state_data.tab_state);
	initFeedCalendar($wrapper);
	$window.off('scroll');
	uploadMoreEvents(sub_states[state_data.tab_state], 10, current_offset, function($events){
		if($wrapper.data('tab_state_id') == tab_state_id){

			$window.data('block_scroll', false);
			if($events.length){
				$wrapper.find('.FeedEvents').append($events);
				$window.on('scroll.upload'+state_data.tab_state.capitalize()+'Events', function(){
					if($window.height() + $window.scrollTop() + 200 >= $(document).height() && !$window.data('block_scroll')){
						$window.data('block_scroll', true);
						uploadMoreEvents(sub_states[state_data.tab_state], 10, current_offset+=10, function($events){
							if($events.length){
								$wrapper.find('.FeedEvents').append($events);
								bindEventsEvents($events);
							} else {
								addNoEventsBlock($wrapper.find('.FeedEvents'));
								$window.off('scroll.upload'+state_data.tab_state.capitalize()+'Events');
							}
							$window.data('block_scroll', false);
						});
					}
				});
			} else {
				addNoEventsBlock($wrapper.find('.FeedEvents'));
			}
			bindEventsEvents($wrapper);
		}
	});
}

function OneEvent($view){
	var $wrapper = $view.find('.page_wrapper'),
		event_id = __STATES.entityId;

	function initEventPage($parent){
		bindAddAvatar($parent);
		trimAvatarsCollection($parent);
		bindRippleEffect($parent);
		bindDropdown($parent);
		//bindShareButtons($parent);
		Modal.bindCallModal($parent);
		bindCollapsing($parent);
		initNotifications($parent);
		bindControllers($parent);
		bindSubscribeButton($parent, {
			labels: {
				subscribe: 'Добавить в избранное',
				subscribed: 'Избранное событие',
				unsubscribe: 'Удалить из избранного'
			},
			icons: {
				subscribe: 'fa-star-o',
				subscribed: 'fa-star',
				unsubscribe: 'fa-times'
			}
		});

		$parent.find('.CancelEvent').on('click.CancelEvent', function(){
			$.ajax({
				url: '/api/v1/events/'+event_id+'/status',
				method: 'PUT',
				data: {canceled: true},
				success: function(res){
					ajaxHandler(res, function(data, text){
						$parent.find('.event_canceled_cap').removeClass('-hidden');
					}, ajaxErrorHandler)
				}
			});
		});

		$parent.find('.CancelCancellation').on('click.CancelCancellation', function(){
			$.ajax({
				url: '/api/v1/events/'+event_id+'/status',
				method: 'PUT',
				data: {canceled: false},
				success: function(res){
					ajaxHandler(res, function(data, text){
						$parent.find('.event_canceled_cap').addClass('-hidden');
					}, ajaxErrorHandler)
				}
			});
		});

		$parent.find('.ExternalLink').on('click.sendStat', function(){
			storeStat(event_id, __C.STATS.EVENT_ENTITY, __C.STATS.EVENT_OPEN_SITE);
		});

		$parent.find('.EventMap').on('click.sendStat', function(){
			storeStat(event_id, __C.STATS.EVENT_ENTITY, __C.STATS.EVENT_OPEN_MAP);
		});
	}

	function initNotifications($parent){
		$parent = $parent ? $parent : $('body');
		$parent.find('.ToggleNotification').each(function(){
			var $this = $(this),
				url, method;

			$this.on('change', function(){
				$this.prop('disabled', true);
				if($this.prop('checked')){
					url = '/api/v1/events/'+$this.data('event_id')+'/notifications';
					method = 'POST';
				} else {
					url = '/api/v1/events/'+$this.data('event_id')+'/notifications/'+$this.data('uuid');
					method = 'DELETE';
				}
				$.ajax({
					url: url,
					method: method,
					data: {notification_type: $this.val()},
					success: function(res){
						ajaxHandler(res, function(data, text){
							if(data.uuid){
								$this.data('uuid', data.uuid);
							} else {
								$this.data('uuid', undefined);
							}
							$this.prop('disabled', false);
						}, ajaxErrorHandler)
					}
				});
			})
		});
	}
	
	function buildNotifications(raw_notifications, event_id, first_date){
		var m_today = moment(),
			all_notifications = {
				'notification-before-quarter-of-hour': {
					label: 'За 15 минут',
					moment: moment.unix(first_date).subtract(15, 'minutes').unix()
				},
				'notification-before-three-hours':  {
					label: 'За 3 часа',
					moment: moment.unix(first_date).subtract(3, 'hours').unix()
				},
				'notification-before-day': {
					label: 'За день',
					moment: moment.unix(first_date).subtract(1, 'days').unix()
				},
				'notification-before-three-days': {
					label: 'За 3 дня',
					moment: moment.unix(first_date).subtract(3, 'days').unix()
				},
				'notification-before-week': {
					label: 'За неделю',
					moment: moment.unix(first_date).subtract(1, 'week').unix()
				}
			},
			$notifications = $(),
			current_notifications = {},
			i = 0;
		for(var notif in raw_notifications){
			if(raw_notifications.hasOwnProperty(notif)){
				current_notifications[raw_notifications[notif].notification_type] = raw_notifications[notif];
			}
		}

		for(var notification in all_notifications){

			if(all_notifications.hasOwnProperty(notification)){
				var is_disabled = moment.unix(all_notifications[notification].moment).isBefore(m_today),
					data = {
						id: 'event_notify_'+(++i),
						classes: ['ToggleNotification'],
						name: 'notification_time',
						label: all_notifications[notification].label,
						attributes: {
							value: notification
						},
						dataset: {
							event_id: event_id
						}
					};

				if(current_notifications[notification]){
					is_disabled = is_disabled || current_notifications[notification].done || !current_notifications[notification].uuid;
					if(current_notifications[notification].uuid){
						data.dataset.uuid = current_notifications[notification].uuid;
					}
					data.attributes.checked = true;
				}
				if(is_disabled){
					data.unit_classes = ['-status_disabled'];
					data.attributes.disabled = true;
				}
				$notifications = $notifications.add(buildRadioOrCheckbox('checkbox', data))
			}
		}
		return $notifications;
	}

	$wrapper.empty();

	$.ajax({
		url: '/api/v1/events/'+event_id+'?fields=image_horizontal_large_url,favored{fields:"is_friend",order_by:"-is_friend",length:10},favored_users_count,is_favorite,notifications{fields:"notification_type,done"},description,location,can_edit,registration_required,registration_till,is_free,min_price,organization_logo_small_url,organization_short_name,is_same_time,dates{fields:"start_time,end_time"},tags,detail_info_url,canceled',
		method: 'GET',
		success: function(res){
			ajaxHandler(res, function(data, text){
				data = data[0];
				var $subscribers = buildAvatarCollection(data.favored, 6),
					avatars_collection_classes = [],
					favored_users_count = ($subscribers.length <= 6) ? 0 : data.favored_users_count - 6;

				if(data.is_favorite){
					avatars_collection_classes.push('-subscribed');
					if($subscribers.length > 4){
						avatars_collection_classes.push('-shift');
					}
				}

				data.subscribe_button_classes = data.is_favorite ? ['fa-star', '-color_accent', '-Subscribed'].join(' ') : ['fa-star-o', '-color_neutral_accent'].join(' ');
				data.subscribe_button_text = data.is_favorite ? 'Избранное событие' : 'Добавить в избранное';
				data.subscribers = $subscribers;
				data.avatars_collection_classes = avatars_collection_classes.join(' ');
				data.favored_users_show = favored_users_count ? '' : '-cast';
				data.favored_users_count = favored_users_count;
				data.notifications = buildNotifications(data.notifications, event_id, data.last_event_date);
				data.location_sanitized = encodeURI(data.location);

				data.event_edit_functions = data.can_edit ? tmpl('event-edit-functions', data) : '';
				data.event_registration_information = data.registration_required ? tmpl('event-registration-info', {registration_till: moment.unix(data.registration_till).format('D MMMM')}) : '';
				data.event_price_information = data.is_free ? '' : tmpl('event-price-info', {min_price: data.min_price ? data.min_price : '0'});
				data.canceled = data.canceled ? '' : '-hidden';
				
				
				

				data.event_additional_fields = $();
				if(data.is_same_time){
					/*data.event_additional_fields = data.event_additional_fields.add(tmpl('event-additional-info', {
						key: 'Дата',
						value: $(formatDates(data.dates).map(function(elem){return $('<span>').addClass('event_date').text(elem);})).map(function(){return this.toArray();})
					}));*/
					data.event_additional_fields = data.event_additional_fields.add(tmpl('event-additional-info', {
						key: 'Время',
						value: (data.dates[0].start_time == '00:00:00' && data.dates[0].end_time == '00:00:00') ? 'Весь день' : data.dates[0].start_time.split(':').slice(0,2).join(':') + ' - ' + data.dates[0].end_time.split(':').slice(0,2).join(':')
					}));
				} else {
					var date_times = $();
					data.dates.forEach(function(date){
						date_times = date_times.add(tmpl('event-date-time-row', {
							date: moment.unix(date.event_date).format('D MMMM'),
							start_time: date.start_time.split(':').slice(0,2).join(':'),
							end_time: date.end_time.split(':').slice(0,2).join(':')
						}));
					});
					data.event_additional_fields = data.event_additional_fields.add(tmpl('event-date-time', {date_times: date_times}));
				}
				data.event_additional_fields = data.event_additional_fields = data.event_additional_fields.add(tmpl('event-additional-info', {
					key: 'Место',
					value: data.location
				}));
				data.event_additional_fields = data.event_additional_fields = data.event_additional_fields.add(tmpl('event-additional-info', {
					key: 'Теги',
					value: data.tags.map(function(tag){
						return tag.name.toLowerCase();
					}).join(', ')
				}));
				if(data.detail_info_url){
					data.event_additional_fields = data.event_additional_fields = data.event_additional_fields.add(tmpl('event-detail-link', {detail_info_url: data.detail_info_url}));
				}
				/*
				 data.share_block = $();
				 data.share_block = data.share_block.add(tmpl('vk-share-button', data));
				 data.share_block = data.share_block.add(tmpl('facebook-share-button', data));
				 data.share_block = data.share_block.add(tmpl('twitter-share-button', data));*/
				data.cancel_cancellation = data.can_edit ? tmpl('button', {
					classes: '-color_primary RippleEffect CancelCancellation',
					title: 'Вернуть событие'
				}) : '';


				$wrapper.append(tmpl('event-page', data));
				if(data.is_same_time){
					var m_nearest_date = data.nearest_event_date ? moment.unix(data.nearest_event_date) : moment.unix(data.first_event_date),
						event_calendar = new Calendar($wrapper.find('.EventCalendar'), {
							classes: {
								wrapper_class: 'feed_calendar_wrapper',
								td_class: 'event_calendar_day'
							},
							selection_type: Calendar.SELECTION_TYPES.MULTI,
							disable_selection: true
						});
					event_calendar
						.init()
						.setMonth(m_nearest_date.format('M'), m_nearest_date.format('YYYY'))
						.selectDays(
							data.dates.map(function(date) {
								return moment.unix(date.event_date).format(__C.DATE_FORMAT)
							})
						);
				}
				initEventPage($view);
			}, ajaxErrorHandler)
		}
	});

}

function OrganizationsList($view){
	var $wrapper = $view.find('.page_wrapper'),
		all_categories = [],
		all_organizations = [],
		organizations_by_categories = [];

	function bindOrganizationsEvents($parent) {
		bindRippleEffect($parent);
		bindSubscribeButton($parent, {
			colors: {
				subscribe: '-color_marginal_accent'
			},
			icons: null
		});
		bindControllers($parent);
	}

	function uploadOrganizations(success) {
		all_categories = [];
		all_organizations = [];
		organizations_by_categories = [];

		$.ajax({
			url: '/api/v1/organizations/types',
			method: 'GET',
			data: {
				fields: 'organizations{fields: "img_small_url,is_subscribed,subscribed_count,privileges", order_by: "-subscribed_count"}',
				order_by: 'order_position'
			},
			success: function(res){
				var categories = [];
				ajaxHandler(res, function(data, text){
					data.forEach(function(category) {
						all_organizations = all_organizations.concat(category.organizations);
					});
					all_organizations.sort(function(a, b) {
						return b.subscribed_count - a.subscribed_count
					});

					data.forEach(function(cat){
						if(typeof all_categories[cat.id] == 'undefined'){
							all_categories[cat.id] = {
								is_parent_type: true,
								type_id: cat.id,
								type_name: cat.name,
								order_position: cat.order_position,
								new_events_count: 0
							};
						}
						all_categories[cat.id].new_events_count += cat.new_events_count;

						if(typeof organizations_by_categories[cat.id] == 'undefined'){
							organizations_by_categories[cat.id] = cat.organizations;
						}
					});
					categories = Array.newFrom(all_categories);
					categories.clean();
					categories.sort(function(a, b) {
						return a.order_position - b.order_position
					});
					$.each(categories, function(i, cat){
						if(cat.is_parent_type){
							cat.aside_classes = ['counter'];
							if(cat.new_events_count){
								cat.new_events_count = '+' + cat.new_events_count;
							} else {
								cat.aside_classes.push(__C.CLASSES.NEW_HIDDEN);
							}
						} else {
							cat.new_events_count = '';
							cat.aside_classes = ['fa_icon', 'fa-angle-down', '-empty'];
						}
						cat.aside_classes = cat.aside_classes.join(' ');
					});
					success(organizations_by_categories, categories, all_organizations);
				}, ajaxErrorHandler)
			}
		});
	}

	function initOrganizationsPage($parent) {
		var $categories = $parent.find('.Category');

		bindOrganizationsEvents($parent);
		$parent.find('.OrganizationsCategoriesScroll').scrollbar({disableBodyScroll: true});
		$parent.find('.ShowAllOrganizations').on('click.showAllOrganizations', function(){
			$categories.removeClass(__C.CLASSES.NEW_ACTIVE).siblings('.SubcategoryWrap').height(0);

			uploadOrganizations(function(organizations_by_categories, categories, all_organizations) {
				$parent.empty().append(tmpl('organizations-wrapper', {
					organization_categories: tmpl('organization-category', categories),
					organization_units: buildOrganisationUnits(all_organizations)
				}));
				initOrganizationsPage($parent);
			});
		});
		$categories.on('click.selectCategory', function(){
			var $this = $(this),
				$wrap = $this.next('.SubcategoryWrap'),
				is_parent_category = !!$wrap.length,
				is_this_active = $this.hasClass(__C.CLASSES.NEW_ACTIVE),
				type_id = $this.data('type-id');
			$this.parent().find('.Category').not($this).removeClass(__C.CLASSES.NEW_ACTIVE).filter('.SubcategoryWrap').height(0);
			if(is_parent_category){
				$wrap.height(is_this_active ? 0 : $wrap.children().outerHeight());
				$this.toggleClass(__C.CLASSES.NEW_ACTIVE);
			} else {
				if(is_this_active){
					uploadOrganizations(function(organizations_by_categories, categories) {
						$parent.empty().append(tmpl('organizations-wrapper', {
							organization_categories: tmpl('organization-category', categories),
							organization_units: buildOrganisationUnits(organizations_by_categories[type_id])
						}));
						selectCategory(all_categories[type_id]);
						initOrganizationsPage($parent);
					});
				} else {
					selectCategory(all_categories[type_id]);
					bindOrganizationsEvents($parent.find('.OrganizationsWrapper').html(buildOrganisationUnits(organizations_by_categories[type_id])));
				}
			}
		});
	}

	function buildOrganisationUnits(data){
		data.forEach(function(org){
			org.subscribe_button_text = org.is_subscribed ? 'Подписан' : 'Подписаться';
			org.subscribe_button_classes = org.is_subscribed ? '-color_accent -Subscribed' : '-color_marginal_accent';
			org.subscribed_text = org.subscribed_count + getUnitsText(org.subscribed_count, __C.TEXTS.SUBSCRIBERS);
			org.privileges.forEach(function(privilege) {
				if(privilege.role_id == 1 || privilege.name == 'admin'){
					org.redact_org_button = buildButton({
						classes: ['-size_low','-color_marginal_primary','fa_icon','fa-pencil','-empty','RippleEffect'],
						dataset: {
							'page': 'edit_organization',
							'organization-id': org.id,
							'title': 'Редактирование организации'
						}
					})
				}
			});
		});
		return tmpl('organization-unit', data);
	}

	function selectCategory(category){
		var state_data = History.getState().data;

		state_data.title = category.type_name ? category.type_name : state_data.title;
		state_data.type_id = category.type_id ? category.type_id : state_data.type_id;
		state_data._index = History.getCurrentIndex();
		state_data.reload = false;
		$wrapper.find('.Category').filter('[data-type-id="'+state_data.type_id+'"]').addClass(__C.CLASSES.NEW_ACTIVE);
		History.replaceState(state_data, category.type_name);
		changeMainTitle(state_data.title);
	}

	$wrapper.empty();
	uploadOrganizations(function(organizations_by_categories, categories, all_organizations) {
		var type_id = History.getState().data.type_id,
			organizations = type_id ? organizations_by_categories[type_id] : all_organizations;
		$wrapper.append(tmpl('organizations-wrapper', {
			organization_categories: tmpl('organization-category', categories),
			organization_units: buildOrganisationUnits(organizations)
		}));
		if(type_id){
			selectCategory(type_id);
		}
		initOrganizationsPage($wrapper);
	});

}

function Organization($view){
	var organization_id = __STATES.entityId,
		url = '/api/v1/organizations/'+organization_id,
		EVENT_TYPES = {
			FUTURE: 'future',
			PAST: 'past',
			DELAYED: 'delayed',
			CANCELED: 'canceled'
		},
		SCROLL_EVENTS = {
			future: 'scroll.uploadFutureEvents',
			past: 'scroll.uploadPastEvents',
			delayed: 'scroll.uploadDelayedEvents',
			canceled: 'scroll.uploadCanceledEvents'
		};

	function bindEventsEvents($parent){
		bindRippleEffect($parent);
		bindAddAvatar($parent);
		trimAvatarsCollection($parent);
		bindSubscribeButton($parent, {
			labels: {
				subscribe: 'Добавить в избранное',
				subscribed: 'В избранном'
			}
		});
		Modal.bindCallModal($parent);
		bindControllers($parent);
	}

	function initOrganizationPage($parent){
		bindTabs($parent);
		bindSubscribeButton($parent.find('.OrganizationSubscribeButtonWrap'), {
			colors: {
				subscribe: '-color_accent',
				unsubscribe: '-color_neutral',
				subscribed: '-color_neutral'
			}
		});
		bindEventsEvents($parent);
		Modal.bindCallModal($parent);

		$parent.find('.Tabs').on('change.tabs', function(){
			$(window).off(Object.values(SCROLL_EVENTS).join(' '));
			bindUploadEventsOnScroll($(this).find('.TabsBody.-active'));
		});

		$parent.find('.ExternalPage').on('click.sendStat', function(){
			storeStat(organization_id, __C.STATS.ORGANIZATION_ENTITY, __C.STATS.ORGANIZATION_OPEN_SITE);
		});
	}

	function buildSubscribers(subscribers, is_first, $scrollbar){
		var $subscribers = $(),
			last_is_fiends = false;

		if(typeof $scrollbar != 'undefined'){
			last_is_fiends = $scrollbar.find('.subscriber').eq(-1).data('is_friend') == true;
		}

		subscribers.forEach(function(subscriber, i){
			if((is_first && !i) || last_is_fiends != subscriber.is_friend){
				$subscribers = $subscribers.add(tmpl('subscriber-divider', {label: subscriber.is_friend ? 'Друзья' : 'Все подписчики'}));
				last_is_fiends = subscriber.is_friend;
			}
			
			$subscribers = $subscribers.add(tmpl('subscriber', {
				avatar_block: buildAvatarBlocks({
					avatar_classes: ['-size_40x40','-rounded','-bordered'],
					name: [subscriber.first_name, subscriber.last_name].join(' '),
					avatar_url: subscriber.avatar_url
				}),
				id: subscriber.id,
				name: [subscriber.first_name, subscriber.last_name].join(' '),
				is_friend: subscriber.is_friend
			}));
		});
		//placeAvatarDefault($subscribers);

		return $subscribers;
	}

	function uploadMoreSubscribers($wrapper){
		var offset = $wrapper.data('next_offset');
		$.ajax({
			url: url,
			method: 'GET',
			data: {
				fields: 'subscribed{fields:"is_friend",order_by:"-is_friend,first_name",length:10,offset:'+offset+'}'
			},
			success: function(res){
				ajaxHandler(res, function(data){
					if(data[0].subscribed.length){
						var $subscribers = buildSubscribers(data[0].subscribed, false, $wrapper);
						$wrapper.append($subscribers);
						$wrapper.data('next_offset', offset+10);
					} else {
						$wrapper.off('scroll.onScroll');
					}
					bindControllers($wrapper);
				}, ajaxErrorHandler)
			}
		});
	}

	function buildEvents(events, type, $wrapper){
		var $events = $(),
			last_date = false,
			sort_date_type = 'nearest_event_date';

		if(typeof $wrapper != 'undefined'){
			last_date = $wrapper.find('.subscriber').eq(-1).data('date');
		}
		switch(type){
			case EVENT_TYPES.FUTURE: {
				sort_date_type = 'nearest_event_date'; break;
			}
			case EVENT_TYPES.PAST: {
				sort_date_type = 'last_event_date'; break;
			}
			case EVENT_TYPES.DELAYED: {
				sort_date_type = 'public_at'; break;
			}
			case EVENT_TYPES.CANCELED: {
				sort_date_type = 'first_event_date'; break;
			}
		}

		events.forEach(function(event){
			var m_event_date = moment.unix(event[sort_date_type]),
				$subscribers = buildAvatarCollection(event.favored, 4),
				times = [],
				avatars_collection_classes = [],
				favored_users_count = ($subscribers.length <= 4) ? 0 : event.favored_users_count - 4,
				$event;
			if(last_date != m_event_date.format(__C.DATE_FORMAT)){
				var display_date = m_event_date.calendar(null, {
					sameDay: '[Сегодня]',
					nextDay: '[Завтра]',
					lastDay: '[Вчера]',
					nextWeek: 'dddd',
					lastWeek: 'D MMMM',
					sameElse: 'D MMMM'
				}).capitalize();

				$events = $events.add(tmpl('organization-feed-divider', {
					formatted_date: display_date,
					date: m_event_date.format(__C.DATE_FORMAT)
				}));
				last_date = m_event_date.format(__C.DATE_FORMAT);
			}
			event.dates.forEach(function(date){
				if(moment.unix(date.event_date).format(__C.DATE_FORMAT) == m_event_date.format(__C.DATE_FORMAT)){
					if(date.start_time == date.end_time && date.start_time == '00:00:00' ) {
						times.push('Весь день');
					} else if(date.end_time){
						times.push(date.start_time.substr(0, 5)+' - '+date.end_time.substr(0, 5));
					} else {
						times.push(date.start_time.substr(0, 5));
					}
				}
			});
			if(event.is_favorite){
				avatars_collection_classes.push('-subscribed');
				if($subscribers.length > 4){
					avatars_collection_classes.push('-shift');
				}
			}
			$event = tmpl('organization-feed-event', $.extend({}, event, {
				subscribe_button_classes: event.is_favorite ? ['fa-check', '-color_accent', '-Subscribed'].join(' ') : ['fa-plus', '-color_neutral_accent'].join(' '),
				subscribe_button_text: event.is_favorite ? 'В избранном' : 'Добавить в избранное',
				date: m_event_date.format(__C.DATE_FORMAT),
				subscribers: $subscribers,
				avatars_collection_classes: avatars_collection_classes.join(' '),
				favored_users_show: favored_users_count ? '' : '-cast',
				favored_users_count: favored_users_count,
				time: times.join('; ')
			}));
			$event.appear(function() {
				storeStat(event.id, __C.STATS.EVENT_ENTITY, __C.STATS.EVENT_VIEW);
			}, {accY: 100});
			$events = $events.add($event);
		});

		return $events;
	}

	function uploadEvents($wrapper, type, onSuccess){
		var data = {},
			offset = $wrapper.data('next_offset') ? $wrapper.data('next_offset') : 0,
			setts = {
				length: 10,
				offset: offset,
				organization_id: organization_id,
				fields: [
					'image_horizontal_medium_url',
					'favored_users_count',
					'is_favorite',
					'favored{length:5}',
					'dates',
					'updated_at',
					'public_at'
				].join(',')
			};
		
		switch(type){
			case EVENT_TYPES.FUTURE: {
				data.future = 'true';
				data.order_by = 'nearest_event_date';
				break;
			}
			case EVENT_TYPES.PAST: {
				data.till = moment().format(__C.DATE_FORMAT);
				data.order_by = '-last_event_date';
				break;
			}
			case EVENT_TYPES.DELAYED: {
				data.is_delayed = true;
				data.is_canceled = false;
				data.order_by = 'public_at';
				break;
			}
			case EVENT_TYPES.CANCELED: {
				data.is_canceled = true;
				data.order_by = '-updated_at';
				break;
			}
		}
		
		$.extend(data, setts);
		$.ajax({
			url: '/api/v1/events/',
			method: 'GET',
			data: data,
			success: function(res){
				ajaxHandler(res, function(data){
					var $events = $();
					if(data.length){
						$events = buildEvents(data, type, $wrapper);
						$wrapper.append($events);
						$wrapper.data('next_offset', offset+10);
					} else {
						$wrapper.append('<p class="organization_feed_text">Больше событий нет :(</p>');
						$wrapper.data('disable_upload', true);
						$(window).off(SCROLL_EVENTS[type]);
					}
					if(typeof onSuccess == 'function'){
						onSuccess($events);
					}
					if($wrapper.hasClass(__C.CLASSES.NEW_ACTIVE)){
						$wrapper.parent().height($wrapper.height());
					}
				}, ajaxErrorHandler)
			}
		});
	}

	function bindUploadEventsOnScroll($wrapper){
		var $window = $(window),
			$document = $(document),
			type = $wrapper.data('type'),
			scroll_event = SCROLL_EVENTS[type];

		$window.data('block_scroll', false);
		if(!$wrapper.data('disable_upload')){
			$window.on(scroll_event, function(){
				if($window.height() + $window.scrollTop() + 200 >= $document.height() && !$window.data('block_scroll')){
					$window.data('block_scroll', true);
					uploadEvents($wrapper, type, function($events){
						bindEventsEvents($events);
						$window.data('block_scroll', false);
					});
				}
			});
		}
	}

	$view.find('.page_wrapper').empty();
	$('.SidebarOrganizationsList').find('[data-organization_id="'+organization_id+'"]').find('.OrganizationCounter').addClass('-hidden');
	$.ajax({
		url: url,
		method: 'GET',
		data: {
			fields: 'img_small_url,description,site_url,is_subscribed,privileges,default_address,subscribed_count,privileges,subscribed{fields:"is_friend",order_by:"-is_friend,first_name",length:10}'
		},
		success: function(res){
			ajaxHandler(res, function(data){
				var $page_wrapper = $view.find('.page_wrapper'),
					$past_events_wrapper,
					$future_events_wrapper,
					$delayed_events_wrapper,
					$canceled_events_wrapper,
					role;

				data = data[0];
				
				role = recognizeRole(data.privileges);
				if(role == __C.ROLES.ADMIN){
					data.redact_org_button = buildButton({
						title: 'Редактировать',
						classes: ['-fill','-color_neutral','fa_icon','fa-pencil','RippleEffect'],
						dataset: {
							'page': 'edit_organization',
							'organization-id': data.id,
							'title': 'Редактирование организации'
						}
					})
				}
				data.hidden_for_users = (role != __C.ROLES.USER) ? '' : '-hidden';
				$page_wrapper.append(tmpl('organization-info-page', $.extend({
					subscribe_button_classes: data.is_subscribed ? ['fa-check', '-color_neutral', '-Subscribed'].join(' ') : ['fa-plus', '-color_accent'].join(' '),
					subscribe_button_text: data.is_subscribed ? 'Подписан' : 'Подписаться',
					has_address: data.default_address ? '' : '-hidden'
				}, data)));

				$past_events_wrapper = $view.find('.PastEvents');
				$future_events_wrapper = $view.find('.FutureEvents');
				$delayed_events_wrapper = $view.find('.DelayedEvents');
				$canceled_events_wrapper = $view.find('.CanceledEvents');

				uploadEvents($future_events_wrapper, EVENT_TYPES.FUTURE, function($events){
					uploadEvents($past_events_wrapper, EVENT_TYPES.PAST, function($events){
						if (role != __C.ROLES.USER){
							uploadEvents($delayed_events_wrapper, EVENT_TYPES.DELAYED, function($events){
								uploadEvents($canceled_events_wrapper, EVENT_TYPES.CANCELED, function($events){
									bindEventsEvents($view);
								});
							});
						} else {
							bindEventsEvents($view);
						}
					});
					initOrganizationPage($view);
					bindUploadEventsOnScroll($future_events_wrapper);
				});

				$page_wrapper.append(tmpl('organization-subscribers-page', {
					subscribers_count: data.subscribed_count,
					subscribers: buildSubscribers(data.subscribed, true)
				}));

				var $subscribers_scroll = $view.find('.SubscribersScroll');
				$subscribers_scroll.data('next_offset', 10);
				$subscribers_scroll.scrollbar({
					disableBodyScroll: true,
					onScroll: function(y, x){
						if(y.scroll == y.maxScroll){
							uploadMoreSubscribers($subscribers_scroll);
						}
					}
				});

			}, ajaxErrorHandler);
		}
	});

}

function Search($view){
	var $wrapper = $view.find('.page_wrapper'),
		ajax_url = '/api/v1/search/',
		_search = searchToObject();
	
	if (_search.hasOwnProperty('q')){
		$('#search_bar_input').val(_search.q);
	}
	_search['fields'] = 'events{fields:"image_horizontal_medium_url,detail_info_url,is_favorite,nearest_event_date,can_edit,location,favored_users_count,organization_name,organization_short_name,organization_logo_small_url,description,favored,is_same_time,tags,dates",filters:"future=true"},organizations{fields:"subscribed_count"}';
	
	function uploadMoreEvents(ajax_data, ajax_url, success){
		var $events = $(),
			$organizations = $();
		ajax_data.fields = Array.isArray(ajax_data.fields) ? ajax_data.fields.join(',') : ajax_data.fields;
		$.ajax({
			url: ajax_url,
			data: ajax_data,
			method: 'GET',
			success: function(res){
				ajaxHandler(res, function(data, text){
					data.events.forEach(function(event){
						var $subscribers = buildAvatarCollection(event.favored, 4),
							avatars_collection_classes = [],
							favored_users_count = ($subscribers.length <= 4) ? 0 : event.favored_users_count - 4;
						
						if(event.is_favorite){
							avatars_collection_classes.push('-subscribed');
							if($subscribers.length > 4){
								avatars_collection_classes.push('-shift');
							}
						}
						
						event.subscribe_button_classes = event.is_favorite ? ['fa-star', '-color_accent', '-Subscribed'].join(' ') : ['fa-star-o', '-color_neutral_accent'].join(' ');
						event.subscribe_button_text = event.is_favorite ? 'Избранное событие' : 'Добавить в избранное';
						event.subscribers = $subscribers;
						event.avatars_collection_classes = avatars_collection_classes.join(' ');
						event.favored_users_show = favored_users_count ? '' : '-cast';
						event.favored_users_count = favored_users_count;
						
						if(event.nearest_event_date){
							event.feed_event_infos = tmpl('feed-event-info', {text: moment.unix(event.nearest_event_date).format('D MMMM, HH:mm')});
						} else {
							var time = event.dates[0].start_time.split(':');
							time.pop();
							event.feed_event_infos = tmpl('feed-event-info', {text: moment.unix(event.dates[0].event_date).format('D MMMM')+', '+time.join(':')});
						}
						if(event.registration_required){
							event.feed_event_infos = event.feed_event_infos.add(tmpl('feed-event-info', {text: 'Регистрация до '+moment.unix(event.registration_till).format('D MMMM, HH:mm')}));
						}
						if(event.is_free){
							event.feed_event_infos = event.feed_event_infos.add(tmpl('feed-event-info', {text: 'Бесплатно'}));
						} else {
							event.feed_event_infos = event.feed_event_infos.add(tmpl('feed-event-info', {text: 'Цена от '+(event.min_price ? event.min_price : 0) +' руб.'}));
						}
						
						
						$events = $events.add(tmpl('feed-event', event));
					});
					
					data.organizations.forEach(function(organization){
						organization.subscribed_count_text = getUnitsText(organization.subscribed_count, __C.TEXTS.SUBSCRIBERS);
						$organizations = $organizations.add(tmpl('organization-search-item', organization));
					});
					
					if(success && typeof success == 'function'){
						success($events, $organizations);
					}
				}, ajaxErrorHandler)
			}
		});
	}
	
	function bindEventsEvents($parent){
		bindAddAvatar($parent);
		trimAvatarsCollection($parent);
		bindRippleEffect($parent);
		Modal.bindCallModal($parent);
		bindControllers($parent);
		bindSubscribeButton($parent, {
			labels: {
				subscribe: 'Добавить в избранное',
				subscribed: 'Избранное событие',
				unsubscribe: 'Удалить из избранного'
			},
			icons: {
				subscribe: 'fa-star-o',
				subscribed: 'fa-star',
				unsubscribe: 'fa-times'
			}
		});
		
		$parent.find('.HideEvent').addClass(__C.CLASSES.NEW_HIDDEN);
	}
	
	$wrapper.empty();
	uploadMoreEvents(_search, ajax_url, function($events, $organizations){
		
		if ($events.length == 0){
			$events = tmpl('search-no-events', {});
		}
		if ($organizations.length == 0){
			$organizations = tmpl('search-no-organizations', {});
		}
		
		$wrapper.append(tmpl('search-page', {
			organizations: $organizations,
			events: $events
		}));
		$wrapper.find('.search-organizations-wrapper').scrollbar({
			disableBodyScroll: true
		});
		bindEventsEvents($wrapper);
	});
}

function OneFriend($view){
	var friend_id = __STATES.entityId,
		$content = $view.find('.one-friend-main-content'),
		page_number = 0;

	getFriendsList($view.find('.friends-right-bar'), function(){
		$('.friend-item.friend-' + friend_id).addClass(__C.CLASSES.ACTIVE).siblings().removeClass(__C.CLASSES.ACTIVE);
	});
	$view.find('.friends-main-content').addClass(__C.CLASSES.HIDDEN);
	$content.removeClass(__C.CLASSES.HIDDEN).empty();

	function getFriendFeed(){
		var $load_btn = $content.find('.load-more-btn');
		if (page_number == 0){
			$content.find('.friend-events-block').remove();
		}
		$.ajax({
			url: '/api/v1/users/' + friend_id + '/actions?fields=entity,created_at,user,type_code,event{fields:"organization_logo_small_url,image_square_vertical_url,organization_short_name"},organization{fields:"subscribed_count,img_medium_url"}&&order_by=-created_at&length=10&offset=' + (10 * page_number++),
			success: function(res){
				var hide_btn = false;
				if ((res.data.length == 0 && page_number != 1) || (res.data.length < 10 && res.data.length > 0)){
					$load_btn.addClass(__C.CLASSES.HIDDEN);
					hide_btn = true;
				}else if (res.data.length == 0 && page_number == 1){
					$load_btn.before(tmpl('no-activity', {}));
					$load_btn.addClass(__C.CLASSES.HIDDEN);
					hide_btn = true;
				}
				var cards_by_users = {};
				res.data.forEach(function(stat){
					var date = moment.unix(stat.created_at),
						ent = stat[stat.entity],
						key = [stat.entity, stat.stat_type_id, stat.user.id, date.format('DD.MM')].join('-');
					if (cards_by_users.hasOwnProperty(key) == false){
						cards_by_users[key] = {
							user: stat.user,
							entity: stat.entity,
							type_code: stat.type_code,
							date: date.format(__C.DATE_FORMAT) == moment().format(__C.DATE_FORMAT) ? 'Сегодня': date.format('DD.MM'),
							action_name: __C.ACTION_NAMES[stat.type_code][0].capitalize(),
							first_name: stat.user.first_name,
							avatar_url: stat.user.avatar_url,
							friend_id: stat.user.id,
							last_name: stat.user.last_name,
							entities: []
						};
					}

					cards_by_users[key].entities.push(ent);
				});

				$.each(cards_by_users, function(key, value){
					var $card = tmpl('friends-feed-card-short', value),
						item_tmpl_name = value.entity == __C.ENTITIES.EVENT ? 'friends-feed-event' : 'friends-feed-organization';

					value.entities.forEach(function(ent){
						$card.append(tmpl(item_tmpl_name, ent));
					});
					$load_btn.before($card);
				});
				if (!hide_btn){
					$load_btn.removeClass(__C.CLASSES.HIDDEN).find('.btn').removeClass(__C.CLASSES.DISABLED);
				}
				$load_btn.off('click').on('click', getFriendFeed);
				$view.find('.EventController').each(function(){
					var $this = $(this);
					$this.on('click.storeStats', function(){
						//storeStat($this.data('event-id'), 'friend', 'view_event_from_user');
					});
				});
				bindControllers($view);
			}
		});
	}

	$.ajax({
		url: '/api/v1/users/' + friend_id + '?fields=subscriptions',
		success: function(res){
			$content.append(tmpl('friends-page-header', res.data[0]));
			$content.find('.friend-user-link').on('click', function(){
				window.open(res.data[0].link, '_blank');
			});

			if (res.data[0].subscriptions.length == 0){
				tmpl('no-subscriptions', {}, $content.find('.one-friend-subscriptions'));
			}else{
				tmpl('friends-subscription', res.data[0].subscriptions, $content.find('.one-friend-subscriptions'))
			}


			$content.find('.friend-subscription-block').each(function(index){
				var $this = $(this);
				setTimeout(function(){
					$this.fadeIn(300);
				}, index * 40 + 500);
			});
			$content.find('.user-btn').on('click', function(){
				var $this = $(this);
				$this.addClass(__C.CLASSES.ACTIVE);
				$this.siblings().removeClass(__C.CLASSES.ACTIVE);
				$content.find('.' + $this.data('tab'))
					.removeClass(__C.CLASSES.HIDDEN)
					.siblings()
					.addClass(__C.CLASSES.HIDDEN);
			});

			$view.find('.back-to-friends-list').on('click', function(){
				History.pushState({_index: History.getCurrentIndex(), page: 'friends'}, 'Мои друзья', '/friends');
			});
			getFriendFeed();
		}
	});
}

function Friends($view){
	var page_number = 0;
	function getFeed(){
		if (page_number == 0){
			$view.find('.friend-events-block').remove();
		}
		$.ajax({
			url: '/api/v1/users/feed?fields=entity,created_at,user,type_code,event{fields:"organization_logo_small_url,image_square_vertical_url,organization_short_name"},organization{fields:"subscribed_count,img_medium_url"}&&order_by=-created_at&length=10&offset=' + (10 * page_number++),
			success: function(res){
				var cards_by_users = {};
				res.data.forEach(function(stat){
					var date = moment.unix(stat.created_at),
						ent = stat[stat.entity],
						key = [stat.entity, stat.stat_type_id, stat.user.id, date.format('DD.MM')].join('-');
					if (cards_by_users.hasOwnProperty(key) == false){
						cards_by_users[key] = {
							user: stat.user,
							entity: stat.entity,
							type_code: stat.type_code,
							date: date.format(__C.DATE_FORMAT) == moment().format(__C.DATE_FORMAT) ? 'Сегодня': date.format('DD.MM'),
							action_name: __C.ACTION_NAMES[stat.type_code][0],
							first_name: stat.user.first_name,
							friend_id: stat.user.id,
							avatar_url: stat.user.avatar_url,
							last_name: stat.user.last_name,
							entities: []
						};
					}
					cards_by_users[key].entities.push(ent);
				});

				$.each(cards_by_users, function(key, value){
					var $card = tmpl('friends-feed-card', value),
						item_tmpl_name = value.entity == __C.ENTITIES.EVENT ? 'friends-feed-event' : 'friends-feed-organization';

					value.entities.forEach(function(ent){
						$card.append(tmpl(item_tmpl_name, ent));
					});
					$load_btn.before($card);
				});
				$load_btn.removeClass(__C.CLASSES.HIDDEN).find('.btn').removeClass(__C.CLASSES.DISABLED);
				bindControllers($view);
			}
		});
	}



	var $main_content = $view.find('.friends-main-content').removeClass(__C.CLASSES.HIDDEN),
		$friends_right_list = $view.find('.friends-right-bar'),
		$load_btn = $view.find('.load-more-btn').addClass(__C.CLASSES.HIDDEN),
		$user_content = $view.find('.one-friend-main-content').addClass(__C.CLASSES.HIDDEN);


	getFriendsList($friends_right_list, function(res){});
	$load_btn.find('.btn').on('click', getFeed);
	getFeed();
}

function EditEvent($view){
	var $wrapper = $view.find('.page_wrapper'),
		event_id = __STATES.entityId;

	function initEditEventPage($view){

		function bindLoadByURLButton(){
			$('.LoadByURLButton').not('-Handled_LoadByURLButton').on('click', function(){
				var $this = $(this),
					$input = $('#'+$this.data('load_input'));
				$this.data('url', $input.val());
				window.current_load_button = $this;
				socket.emit('image.getFromURL', $input.val());
				window.paceOptions = {
					catchupTime : 10000,
					maxProgressPerFrame:1,
					ghostTime: Number.MAX_SAFE_INTEGER,
					checkInterval :{
						checkInterval: 10000
					},
					eventLag : {
						minSamples: 1,
						sampleCount: 30000000,
						lagThreshold: 0.1
					}
				}; //хз зачем, все равно не работает
				Pace.restart();
			}).addClass('-Handled_LoadByURLButton');
		}

		function handleImgUpload($context, source, filename){
			var $parent = $context.closest('.EditEventImgLoadWrap'),
				$preview = $parent.find('.EditEventImgPreview'),
				$file_name_text = $parent.find('.FileNameText'),
				$file_name = $parent.find('.FileName'),
				$data_url = $parent.find('.DataUrl'),
				$button = $parent.find('.CallModal');

			$preview.attr('src', source);
			$file_name_text.html('Загружен файл:<br>'+filename);
			$file_name.val(filename);
			$button
				.data('source_img', source)
				.on('crop', function(event, cropped_src, crop_data){
					$preview.attr('src', cropped_src);
					$button.data('crop_data', crop_data);
					$data_url.val('data.source').data('source', $preview.attr('src')).trigger('change');
				})
				.trigger('click.CallModal');
		}

		function initEditEventMainCalendar($view){
			//TODO: Refactor this!! Make it more readable

			var $selected_days_text = $view.find('.EventSelectedDaysText'),
				$selected_days_table_rows = $view.find('.SelectedDaysRows'),
				MainCalendar = new Calendar('.EventDatesCalendar', {
					weekday_selection: true,
					month_selection: true,
					min_date: moment().format(__C.DATE_FORMAT)
				}),
				dates = {},
				genitive_month_names = {
					'январь': 'января',
					'февраль': 'февраля',
					'март': 'марта',
					'апрель': 'апреля',
					'май': 'мая',
					'июнь': 'июня',
					'июль': 'июля',
					'август': 'августа',
					'сентябрь': 'сентября',
					'октябрь': 'октября',
					'ноябрь': 'ноября',
					'декабрь': 'декабря'
				},
				$fucking_table = $();
			MainCalendar.init();
			MainCalendar.$calendar.on('days-changed.displayFormattedText', displayFormattedText);



			function bindRemoveRow($parent){
				$parent.find('.RemoveRow').not('.-Handled_RemoveRow').each(function(i, elem){
					$(elem).on('click', function(){
						MainCalendar.deselectDays($(this).closest('tr').data('date'));
					}).addClass('-Handled_RemoveRow');
				});
			}

			function displayFormattedText(){
				dates = {};
				MainCalendar.selected_days.forEach(function(date, i, days){
					var _date = moment(date);

					if(typeof dates[_date.month()] === 'undefined'){
						dates[_date.month()] = {};
						dates[_date.month()].selected_days = [];
						dates[_date.month()].month_name = genitive_month_names[_date.format('MMMM')];
					}
					dates[_date.month()].selected_days.push(_date.date());
				});

				$selected_days_text.empty().removeClass('hidden');
				if(Object.keys(dates).length){
					$.each(dates, function(i, elem){
						$selected_days_text.append($('<p>').text(elem.selected_days.join(', ') + ' ' + elem.month_name))
					});
				} else {
					$selected_days_text.html('<p>Даты не выбраны</p>');
				}
			}

			function doTheFuckingSort($rows, $parent){
				$rows.sort(function(a,b){
					var an = $(a).data('date'),
						bn = $(b).data('date');

					if(an > bn) return 1;
					else if(an < bn) return -1;
					else return 0;
				});
				$rows.detach().appendTo($parent);
			}

			function buildTable(selected_days){
				//TODO: BUG. On multiple selection (month or weekday) duplicates appearing in table.
				//TODO: Bind time on building table
				var $output = $();
				if(Array.isArray(selected_days)){
					selected_days.forEach(function(day){
						$output = $output.add(tmpl('selected-table-day', {
							date: day,
							formatted_date: day.split('-').reverse().join('.')
						}));
					});
				}
				else {
					$output = tmpl('selected-table-day', {
						date: selected_days,
						formatted_date: selected_days.split('-').reverse().join('.')
					});
				}
				bindDatePickers($output);
				bindTimeInput($output);
				bindRemoveRow($output);

				$fucking_table = $fucking_table.add($output);
				$output.find('.DatePicker').each(function(){
					var DP = $(this).data('datepicker');
					DP.$datepicker.on('date-picked', function(){
						MainCalendar.deselectDays(DP.prev_selected_day).selectDays(DP.selected_day);
						doTheFuckingSort($fucking_table, $selected_days_table_rows)
					});
				});
				doTheFuckingSort($fucking_table, $selected_days_table_rows);
			}

			function BuildSelectedDaysTable(){
				if(MainCalendar.last_action === 'select'){
					buildTable(MainCalendar.last_selected_days);
				}
				else if(MainCalendar.last_action === 'deselect'){
					if(Array.isArray(MainCalendar.last_selected_days)){
						var classes = [];
						MainCalendar.last_selected_days.forEach(function(day){
							classes.push('.TableDay_'+day);
						});
						$fucking_table.detach(classes.join(', '));
						$fucking_table = $fucking_table.not(classes.join(', '));
					}
					else {
						$fucking_table.detach('.TableDay_'+MainCalendar.last_selected_days);
						$fucking_table = $fucking_table.not('.TableDay_'+MainCalendar.last_selected_days);
					}
				}

				doTheFuckingSort($fucking_table, $selected_days_table_rows);

				//TODO: Do not forget to rename 'fucking' names
				//TODO: Please, don't forget to rename 'fucking' names

			}

			$view.find('#edit_event_different_time').on('change', function(){
				var $table_wrapper = $view.find('#edit_event_selected_days_wrapper'),
					$table_content = $table_wrapper.children();
				if($(this).prop('checked')){
					buildTable(MainCalendar.selected_days);
					$table_wrapper.height($table_content.height()).one('transitionend', function(){
						$table_wrapper.css({
							'height': 'auto',
							'overflow': 'visible'
						})
					});
					MainCalendar.$calendar.on('days-changed.buildTable', BuildSelectedDaysTable);
				} else {
					$table_wrapper.css({
						'height': $table_content.height(),
						'overflow': 'hidden'
					}).height(0);
					$fucking_table.remove();
					MainCalendar.$calendar.off('days-changed.buildTable');
				}
				$view.find('.MainTime').toggleStatus('disabled');
			});

			var AddRowDatePicker = $view.find('.AddDayToTable').data('datepicker');
			AddRowDatePicker.$datepicker.on('date-picked', function(){
				MainCalendar.selectDays(AddRowDatePicker.selected_day);
			});

		}

		bindDatePickers($view);
		bindTimeInput($view);
		bindSelect2($view);
		bindTabs($view);
		limitInputSize();
		bindRippleEffect();
		bindFileLoadButton();
		bindLoadByURLButton();
		initEditEventMainCalendar($view);

		//TODO: perepilit' placepicker
		$view.find(".Placepicker").placepicker();

		$view.find('.EventTags').select2({
			tags: true,
			width: '100%',
			placeholder: "Выберите до 5 тегов",
			maximumSelectionLength: 5,
			maximumSelectionSize: 5,
			tokenSeparators: [',', ';'],
			multiple: true,
			createSearchChoice: function(term, data) {
				if ($(data).filter(function() {
						return this.text.localeCompare(term) === 0;
					}).length === 0) {
					return {
						id: term,
						text: term
					};
				}
			},
			ajax: {
				url: '/api/v1/tags/',
				dataType: 'JSON',
				data: function (term, page) {
					return {
						name: term // search term
					};
				},
				results: function(data) {
					var _data = [];
					data.data.forEach(function(value){
						value.text = value.name;
						_data.push(value);
					});
					return {
						results: _data
					}
				}
			},
			containerCssClass: "form_select2",
			dropdownCssClass: "form_select2_drop"
		});

		$view.find('.EditEventDefaultAddress').off('click.defaultAddress').on('click.defaultAddress', function(){
			var $this = $(this);
			$this.closest('.form_group').find('input').val($this.data('default_address'))
		});

		$view.find('#edit_event_delayed_publication').off('change.DelayedPublication').on('change.DelayedPublication', function(){
			$view.find('.DelayedPublication').toggleStatus('disabled');
		});

		$view.find('#edit_event_registration_required').off('change.RequireRegistration').on('change.RequireRegistration', function(){
			$view.find('.RegistrationTill').toggleStatus('disabled');
		});

		$view.find('#edit_event_free').off('change.FreeEvent').on('change.FreeEvent', function(){
			$view.find('.MinPrice').toggleStatus('disabled');
		});

		$view.find('.MinPrice').find('input').inputmask({
			'alias': 'numeric',
			'autoGroup': false,
			'digits': 2,
			'digitsOptional': true,
			'placeholder': '0',
			'rightAlign': false
		});

		socket.on('image.getFromURLDone', function(response){
			if(response.error){
				showNotifier({text: response.error, status: false});
			} else {
				handleImgUpload(window.current_load_button, response.data, response.filename);
			}
		});

		$view.find('.LoadImg').off('change.LoadImg').on('change.LoadImg', function(e){
			var $this = $(e.target),
				files = e.target.files;

			if (files.length == 0) return false;
			for(var i = 0, f; f = files[i]; i++) {
				var reader = new FileReader();
				if (!f.type.match('image.*'))	continue;
				reader.onload = (function(the_file) {
					return function(e) {
						handleImgUpload($this, e.target.result, the_file['name']);
					};
				})(f);
				reader.readAsDataURL(f);
			}

		});

		$view.find('#edit_event_to_public_vk').off('change.PublicVK').on('change.PublicVK', function(){
			var $vk_post_wrapper = $view.find('#edit_event_vk_publication'),
				$vk_post_content = $vk_post_wrapper.children();
			if($(this).prop('checked')){
				$vk_post_wrapper.height($vk_post_content.height());
			} else {
				$vk_post_wrapper.height(0);
			}
			$vk_post_wrapper.toggleStatus('disabled');

			$vk_post_content.find('.DeleteImg').off('click.DeleteImg').on('click.DeleteImg', function(){
				$(this).closest('.EditEventImgLoadWrap').find('input').val('').end().find('img').attr('src', '');
				toggleVkImg();
			})

		});

		$view.find('#edit_event_submit').off('click.Submit').on('click.Submit', submitEditEvent);

	}


	socket.on('vk.getGroupsToPostDone', function(response){
		if(response.error){
			showNotifier({text: response.error, status: false});
		} else {
			var data = response.data.response,
				$groups = $view.find('#edit_event_vk_groups');
			if(data.length || data[0]){
				data.splice(0,1);
				data.forEach(function(option){
					$groups.append(tmpl('option', {
						val: option.gid,
						display_name: option.name,
						data: "data-img='"+option.photo+"'"
					}));
				});
				initSelect2($groups);
			} else {
				$view.find('#edit_event_to_public_vk').toggleStatus('disabled').prop('checked', false).trigger('change');
			}
		}
	});

	socket.on('vk.post.error', function(response){
		console.log(response);
		showNotifier({text: 'Не удалось опубликовать событие в группе vk. Пожалуйста, попробуйте еще раз.', status: false});
	});

	function initOrganization(selected_id){
		$.ajax({
			url: '/api/v1/organizations',
			method: 'GET',
			data: {
				privileges: 'can_add',
				fields: 'default_address'
			},
			success: function(res){
				ajaxHandler(res, function(data){
					var $wrapper = $('.EditEventOrganizations'),
						organizations_options = $(),
						$default_address_button = $view.find('.EditEventDefaultAddress'),
						$select = $wrapper.find('#edit_event_organization'),
						selected_address;

					data.forEach(function(organization){
						if(organization.id == selected_id){
							selected_address = organization.default_address;
						}
						organizations_options = organizations_options.add(tmpl('option', {
							val: organization.id,
							data: "data-image-url='"+organization.img_url+"' data-default-address='"+organization.default_address+"'",
							display_name: organization.name
						}));
					});

					$select.append(organizations_options).select2({
						containerCssClass: 'form_select2',
						dropdownCssClass: 'form_select2_drop'
					}).on('change', function(){
						$default_address_button.data('default_address', $(this).children(":selected").data('default-address'));
					});
					if(selected_id){
						$select.select2('val', selected_id);
						$default_address_button.data('default_address', selected_address);
					} else {
						$default_address_button.data('default_address', data[0].default_address);
					}
					if(organizations_options.length > 1){
						$wrapper.removeClass('-hidden');
					} else {
						$wrapper.addClass('-hidden');
					}
				}, ajaxErrorHandler)
			}
		});
	}

	function toggleVkImg(){
		var $wrap = $view.find('#edit_event_vk_publication').find('.EditEventImgLoadWrap'),
			$left_block = $wrap.children().eq(0),
			$right_block = $wrap.children().eq(1);

		if(!$left_block.hasClass('-hidden')){
			$right_block.find('.LoadImg').off('change.ToggleVkImg').one('change.ToggleVkImg', toggleVkImg);
			$right_block.find('.Text').text('Добавить картинку');
		} else {
			$right_block.find('.LoadImg').off('change.ToggleVkImg');
			$right_block.find('.Text').text('Изменить');
		}
		$left_block.toggleClass('-hidden');
		$right_block.toggleClass('-align_center');
	}

	function selectDates($view, raw_dates){
		var	MainCalendar = $view.find('.EventDatesCalendar').data('calendar'),
			$table_rows = $view.find('.SelectedDaysRows'),
			dates = [];
		raw_dates.forEach(function(date){
			date.event_date = moment.unix(date.event_date).format('YYYY-MM-DD');
			dates.push(date.event_date);
		});
		MainCalendar.selectDays(dates);
		raw_dates.forEach(function(date){
			var $day_row = $table_rows.find('.TableDay_'+date.event_date),
				start_time = date.start_time.split(':'),
				end_time = date.end_time ? date.end_time.split(':') : [];
			$day_row.find('.StartHours').val(start_time[0]);
			$day_row.find('.StartMinutes').val(start_time[1]);
			if(end_time.length){
				$day_row.find('.EndHours').val(end_time[0]);
				$day_row.find('.EndMinutes').val(end_time[1]);
			}
		});
	}

	function selectTags($view, tags){
		var	selected_tags = [];
		tags.forEach(function(tag){
			selected_tags.push({
				id: parseInt(tag.id),
				text: tag.name
			});
		});

		$view.find('#event_tags').select2('data', selected_tags);
	}

	function initVkImgCopying(){
		var $vk_wrapper = $view.find('#edit_event_vk_publication');
		$view.find('#edit_event_image_horizontal_src').on('change.CopyToVkImg', function(){
			var $wrap = $(this).closest('.EditEventImgLoadWrap'),
				$vk_wrap = $view.find('#edit_event_vk_publication'),
				$vk_preview = $vk_wrap.find('.EditEventImgPreview'),
				$vk_button = $vk_wrap.find('.CallModal'),
				$vk_$data_url = $vk_wrap.find('#edit_event_vk_image_src'),
				$button_orig = $wrap.find('.CallModal'),
				src = $(this).data('source');

			if(!$view.find('.edit_event_vk_right_block').hasClass('-align_center')){
				toggleVkImg();
			}
			$vk_$data_url.val('data.source').data('source', src);
			$vk_preview.attr('src', src);
			$vk_wrap.find('#edit_event_vk_image_filename').val($view.find('#edit_event_image_horizontal_filename').val());
			$vk_button
				.data('crop_data', $button_orig.data('crop_data'))
				.data('source_img', $button_orig.data('source_img'))
				.on('crop', function(event, cropped_src, crop_data){
					$vk_preview.attr('src', cropped_src);
					$vk_button.data('crop_data', crop_data);
					$vk_$data_url.data('source', $vk_preview.attr('src')).trigger('change');
				});

		});
		$vk_wrapper.find('.FileLoadButton, .CallModal, .DeleteImg').on('click.OffCopying', function(){
			$view.find('#edit_event_image_horizontal_src').off('change.CopyToVkImg');
		});
	}

	function formatVKPost(){
		var $post = $view.find('#edit_event_vk_post'),
			$title = $view.find('#edit_event_title'),
			$calendar = $view.find('.EventDatesCalendar').data('calendar'),
			$place = $view.find('#edit_event_placepicker'),
			$description = $view.find('#edit_event_description'),
			$is_free = $view.find('#edit_event_free'),
			$min_price = $view.find('#edit_event_min_price'),
			$is_required = $view.find('#edit_event_registration_required'),
			$registration_till = $view.find('.RegistrationTill'),
			$tags = $view.find('.EventTags'),
			tags = [],
			$link = $view.find('#edit_event_url'),
			post_text = '';

		post_text +=$title.val() ? $title.val() + '\n\n' : '';

		if($calendar.selected_days){
			post_text += ($calendar.selected_days.length > 1) ? 'Дата начала: ' : 'Начало: ';
			post_text += moment($calendar.selected_days[0]).format('D MMMM YYYY');
			if($calendar.selected_days.length == 1){
				var $main_time_inputs = $view.find('.MainTime').find('input');
				post_text += $main_time_inputs.eq(0).val() ? ' в ' + parseInt($main_time_inputs.eq(0).val()) : '';
				post_text += $main_time_inputs.eq(1).val() ? ':' + $main_time_inputs.eq(1).val() : '';
			}
		}
		if($is_required.prop('checked')){
			var $inputs = $registration_till.find('input');
			if($inputs.eq(0).val()){
				post_text += ' (регистрация заканчивается: ' + moment($inputs.eq(0).val()).format('D MMMM YYYY');
				post_text += $inputs.eq(1).val() ? ' в ' + parseInt($inputs.eq(1).val()) : '';
				post_text += $inputs.eq(2).val() ? ':' + $inputs.eq(2).val() : '';
				post_text += ')\n';
			} else {
				post_text += '\n';
			}
		} else {
			post_text += '\n';
		}
		post_text += $place.val() ? $place.val() + '\n\n' : '';
		post_text += $description.val() ? $description.val() + '\n\n' : '';

		if(!$is_free.prop('checked')){
			post_text += $min_price.val() ? 'Цена от ' + $min_price.val() + '\n\n' : '';
		}

		$tags.find('.select2-search-choice').each(function(i,tag){
			tags.push('#' + $(tag).text().trim());
		});
		post_text += tags ? tags.join(' ') + '\n\n' : '';

		if($link.val()){
			post_text += $link.val()
		} else if(event_id) {
			post_text += 'https://evendate.ru/event/'+event_id;
		}

		$post.val(post_text);
	}

	function checkVkPublicationAbility(){
		if(__USER.accounts.indexOf("vk") !== -1){
			socket.emit('vk.getGroupsToPost', __USER.id);
			$view
				.find(
					'#edit_event_title,' +
					'#edit_event_placepicker,' +
					'#edit_event_description,' +
					'#edit_event_free,' +
					'#edit_event_min_price,' +
					'#edit_event_registration_required,' +
					'#edit_event_url,' +
					'.EventTags'
				)
				.add('.RegistrationTill input')
				.add('.MainTime input')
				.on('change.FormatVkPost', formatVKPost);
			$view.find('.EventDatesCalendar').data('calendar').$calendar.on('days-changed.FormatVkPost', formatVKPost);
		} else {
			$view.find('#edit_event_to_public_vk').toggleStatus('disabled');
		}
	}

	function submitEditEvent(){
		function formValidation($form, for_edit){
			var is_valid = true,
				$times = $form.find('#edit_event_different_time').prop('checked') ? $form.find('[class^="TableDay_"]') : $form.find('.MainTime');

			$form.find(':required').not(':disabled').each(function(){
				var $this = $(this),
					max_length = $this.data('maxlength');
				if($this.val() === "" || (max_length && $this.val().length > max_length)){
					if(is_valid){
						$('body').stop().animate({scrollTop: Math.ceil($this.offset().top - 150)}, 1000, 'swing');
					}
					handleErrorField($this);
					is_valid = false;
				}
			});

			$times.each(function(){
				var $row = $(this),
					start = $row.find('.StartHours').val()+$row.find('.StartMinutes').val(),
					end = $row.find('.EndHours').val()+$row.find('.EndMinutes').val();
				if(start > end){
					if(is_valid){
						$('body').stop().animate({scrollTop: Math.ceil($row.offset().top - 150)}, 1000, 'swing');
					}
					showNotifier({text: 'Начальное время не может быть меньше конечного', status: false});
					is_valid = false;
				}
			});

			if(!for_edit){
				$form.find('.DataUrl').each(function(){
					var $this = $(this);
					if($this.val() === ""){
						if(is_valid){
							$('body').stop().animate({scrollTop: Math.ceil($this.closest('.EditEventImgLoadWrap').offset().top - 150)}, 1000, 'swing', function(){
								showNotifier({text: 'Пожалуйста, добавьте к событию обложку', status: false})
							});
						}
						is_valid = false;
					}
				});
			}
			return is_valid;
		}

		var $form = $view.find("#edit-event-form"),
			data = {
				event_id: null,
				title: null,
				image_horizontal: null,
				organization_id: null,
				location: null,
				description: null,
				detail_info_url: null,
				different_time: null,
				dates: null,
				tags: null,
				registration_required: null,
				registration_till: null,
				is_free: null,
				min_price: null,
				delayed_publication: null,
				public_at: null,
				filenames: {
					horizontal: null
				}
			},
			form_data = $form.serializeForm(),
			tags = form_data.tags ? form_data.tags.split(',') : null,
			url = form_data.event_id ? '/api/v1/events/'+form_data.event_id : '/api/v1/events/',
			method = form_data.event_id ? 'PUT' : 'POST',
			valid_form = formValidation($form, !!(form_data.event_id));

		if(valid_form){
			$.extend(true, data, form_data);

			data.tags = tags;
			data.filenames = {
				horizontal: data.filename_horizontal
			};
			if(data.registration_required){
				data.registration_till = ""+data.registration_till_date+'T'+data.registration_till_time_hours+':'+data.registration_till_time_minutes+':00'
			}
			if(data.delayed_publication){
				data.public_at = ""+data.public_at_date+'T'+data.public_at_time_hours+':'+data.public_at_time_minutes+':00'
			}

			data.dates = [];
			if(data.different_time){
				var	selected_days_rows = $('.SelectedDaysRows').children();

				selected_days_rows.each(function(){
					var $this = $(this);
					data.dates.push({
						event_date: $this.find('.DatePicker').data('selected_day'),
						start_time: $this.find('.StartHours').val() + ':' + $this.find('.StartMinutes').val(),
						end_time: $this.find('.EndHours').val() + ':' + $this.find('.EndMinutes').val()
					});
				});
			} else {
				var	MainCalendar = $('.EventDatesCalendar').data('calendar'),
					$main_time = $('.MainTime'),
					start_time = $main_time.find('.StartHours').val() + ':' + $main_time.find('.StartMinutes').val(),
					end_time = $main_time.find('.EndHours').val() + ':' + $main_time.find('.EndMinutes').val();

				MainCalendar.selected_days.forEach(function(day){
					data.dates.push({
						event_date: day,
						start_time: start_time,
						end_time: end_time
					})
				});
			}
			
			$view.addClass('-faded');
			$.ajax({
				url: url,
				data: JSON.stringify(data),
				contentType: 'application/json',
				method: method,
				success: function(res){
					ajaxHandler(res, function(res_data){/*
					 if(data.event_id){
					 $('body').stop().animate({scrollTop:0}, 1000, 'swing', function() {
					 showNotification('Событие успешно обновлено', 3000);
					 });
					 } else {
					 $view.find('#edit_event_event_id').val(res_data.event_id);
					 $('body').stop().animate({scrollTop:0}, 1000, 'swing', function() {
					 showNotification('Событие успешно добавлено', 3000);
					 });
					 }*/
						if($view.find('#edit_event_to_public_vk').prop('checked')){
							socket.emit('vk.post', {
								guid: data.vk_group,
								event_id: data.event_id ? data.event_id : res_data.event_id,
								message: data.vk_post,
								image: {
									base64: data.vk_image_src,
									filename : data.vk_image_filename
								},
								link: data.detail_info_url
							});
						}
						changeState('/event/'+res_data.event_id, data.title, {event_id: res_data.event_id});
					}, function(res){
						$view.removeClass('-faded');
						if(res.text){
							showNotifier({text: res.text, status: false});
						} else {
							ajaxErrorHandler(res);
						}
					});
				},
				error: function(jqXHR, textStatus, errorThrown) {
					$view.removeClass('-faded');
				}
			});
		}

	}

	$wrapper.empty();
	var additional_fields = {
		event_id: event_id,
		header_text: 'Новое событие',
		public_at_data_label: 'Дата',
		registration_till_data_label: 'Дата',
		current_date: moment().format(__C.DATE_FORMAT),
		tomorrow_date: moment().add(1, 'd').format(__C.DATE_FORMAT)
	};
	if(typeof event_id === 'undefined'){
		additional_fields.button_text = 'Опубликовать';
		$wrapper.html(tmpl('edit-event-page', additional_fields));
		initEditEventPage($view);
		Modal.bindCallModal($view);
		initOrganization();
		checkVkPublicationAbility();
		toggleVkImg();
		initVkImgCopying();
	} else {
		var url = '/api/v1/events/'+event_id;
		$.ajax({
			url: url,
			method: 'GET',
			data: {
				fields: 'location,description,tags,nearest_event_date,detail_info_url,public_at,registration_required,registration_till,is_free,min_price,is_same_time,dates{length:0,fields:"start_time,end_time"}'
			},
			success: function(res){
				ajaxHandler(res, function(data){
					data = Array.isArray(data) ? data[0] : data;
					additional_fields.header_text = 'Редактирование события';
					additional_fields.button_text = 'Сохранить';
					if(data.public_at !== null){
						var m_public_at = moment(data.public_at);
						additional_fields.public_at_data = m_public_at.format('YYYY-MM-DD');
						additional_fields.public_at_data_label = m_public_at.format('DD.MM.YYYY');
						additional_fields.public_at_time_hours = m_public_at.format('HH');
						additional_fields.public_at_time_minutes = m_public_at.format('mm');
					}
					if(data.registration_required){
						var m_registration_till = moment.unix(data.registration_till);
						additional_fields.registration_till_data = m_registration_till.format('YYYY-MM-DD');
						additional_fields.registration_till_data_label = m_registration_till.format('DD.MM.YYYY');
						additional_fields.registration_till_time_hours = m_registration_till.format('HH');
						additional_fields.registration_till_time_minutes = m_registration_till.format('mm');
					}
					if(data.image_horizontal_url){
						additional_fields.image_horizontal_filename = data.image_horizontal_url.split('/').reverse()[0];
						additional_fields.vk_image_url = data.image_horizontal_url;
						additional_fields.vk_image_filename = additional_fields.image_horizontal_filename;
					}
					if(data.vk_image_url){
						additional_fields.vk_image_url = data.vk_image_url;
						additional_fields.vk_image_filename = data.vk_image_url.split('/').reverse()[0];
					}

					$.extend(true, data, additional_fields);
					$wrapper.html(tmpl('edit-event-page', data));

					initEditEventPage($view);
					initOrganization(data.organization_id);
					checkVkPublicationAbility();

					if(data.is_same_time){
						var $day_row = $view.find('.MainTime'),
							start_time = data.dates[0].start_time.split(':'),
							end_time = data.dates[0].end_time ? data.dates[0].end_time.split(':') : [];
						$day_row.find('.StartHours').val(start_time[0]);
						$day_row.find('.StartMinutes').val(start_time[1]);
						if(end_time.length){
							$day_row.find('.EndHours').val(end_time[0]);
							$day_row.find('.EndMinutes').val(end_time[1]);
						}
					} else {
						$view.find('#edit_event_different_time').prop('checked', true).trigger('change');
					}
					selectDates($view, data.dates);
					selectTags($view, data.tags);
					Modal.bindCallModal($view);

					if(data.image_horizontal_url){
						toDataUrl(data.image_horizontal_url, function(base64_string){
							$view.find('#edit_event_image_horizontal_src').val(base64_string ? base64_string : null);
						});
						$view.find('.CallModal').removeClass('-hidden').on('crop', function(event, cropped_src, crop_data){
							var $button = $(this),
								$parent = $button.closest('.EditEventImgLoadWrap'),
								$preview = $parent.find('.EditEventImgPreview'),
								$data_url = $parent.find('.DataUrl');
							$data_url.val('data.source').data('source', $preview.attr('src')).trigger('change');
							$preview.attr('src', cropped_src);
							$button.data('crop_data', crop_data);
						});
					}
					if(additional_fields.vk_image_url){
						toDataUrl(additional_fields.vk_image_url, function(base64_string){
							$view.find('#edit_event_vk_image_src').val(base64_string ? base64_string : null);
						});
					}
					else {
						toggleVkImg();
					}


					if(!data.is_free){
						$view.find('#edit_event_free').prop('checked', false).trigger('change');
						$view.find('#edit_event_min_price').val(data.min_price);
					}
					if(data.registration_required){
						$view.find('#edit_event_registration_required').prop('checked', true).trigger('change');
					}
					if(data.public_at !== null){
						$view.find('#edit_event_delayed_publication').prop('checked', true).trigger('change');
					}

					formatVKPost();

				}, ajaxErrorHandler);
			}
		});
	}

}

function Onboarding($view){
	/* onboarding */
	var $wrapper = $view.find(".page_wrapper"),
		scroll_rec = 0;

	function organisationSubscriptions($parent) {
		$parent.find(".OnboardingOrgItem").not('.-Handled_OnboardingOrgItem').on('click', function(){
			var $this = $(this);
			$.ajax({
				url: '/api/v1/organizations/'+$this.data("organization_id")+'/subscriptions',
				method: $this.hasClass(__C.CLASSES.NEW_ACTIVE) ? 'DELETE' : 'POST',
				success: function(res){
					ajaxHandler(res, function(data){}, ajaxErrorHandler)
				}
			});
			$this.toggleClass(__C.CLASSES.NEW_ACTIVE);
		}).addClass('-Handled_OnboardingOrgItem');
	}

	$wrapper.empty();
	$.ajax({
		url: '/api/v1/organizations/recommendations',
		method: 'GET',
		data: {
			length: 10,
			offset: 0,
			fields: 'img_small_url'
		},
		success: function(res){
			ajaxHandler(res, function(data){
				$wrapper.append(tmpl("onboarding-main", {recommendation_items: tmpl("onboarding-recommendation", data)}));
				$wrapper.find(".RecommendationsScrollbar").scrollbar({
					onScroll: function(y, x){
						console.log(y.scroll == y.maxScroll);
						if(y.scroll == y.maxScroll){
							$.ajax({
								url: '/api/v1/organizations/recommendations',
								method: 'GET',
								data: {
									length: 10,
									offset: scroll_rec+=10
								},
								success: function(res){
									ajaxHandler(res, function(data){
										$wrapper.find(".RecommendationsWrapper").eq(1).append(tmpl("onboarding-recommendation", data));
										organisationSubscriptions($wrapper);
									}, ajaxErrorHandler)
								}
							});
						}
					}
				});
				organisationSubscriptions($wrapper);
				bindRippleEffect($wrapper);
				bindControllers($wrapper);
				$wrapper.find('.Controller').on('click', function(){
					renderSidebarOrganizations(null, bindControllers);
				});
			}, ajaxErrorHandler)
		}
	});
}

function StatisticsOverview($view) {

}

function StatisticsOrganization($view) {
	var current_state = window.location.pathname.split('/')[2],
		sub_states = {
			overview: Overview,
			events: Events,
			auditory: Auditory,
			promotion: Promotion,
			settings: Settings,
			support: Support
		},
		$wrapper = $view.find('.page_wrapper');
	
	function Overview($wrapper) {
		var org_id = 1,
			org_fields = [
				'description',
				'img_medium_url',
				'default_address',
				'staff',
				'privileges',
				'events{length:3,future:true,is_canceled:true,is_delayed:true,fields:"public_at"}'
			],
			stat_fields = [
				'subscribe',
				'view',
				'fave',
				'conversion',
				'audience',
				'dynamics'+JSON.stringify({
					scale: 'week',
					fields: [
						'subscribe',
						'view',
						'fave',
						'conversion'
					].join(',')
				})
			].join(',');
		
		
		function getStatistics(org_id, scale, since, till, fields, success){
			$.ajax({
				url: '/api/v1/statistics/organizations/'+org_id,
				data: {
					scale: scale,
					since: since,
					till: till,
					fields: fields
				},
				method: 'GET',
				success: function(res){
					ajaxHandler(res, function(data, text){
						if(success && typeof success == 'function'){
							success(data);
						}
					}, ajaxErrorHandler)
				}
			});
		}
		
		function getOrganizationData(org_id, fields, success){
			$.ajax({
				url: '/api/v1/organizations/'+org_id,
				data: {
					fields: Array.isArray(fields) ? fields.join(',') : fields
				},
				method: 'GET',
				success: function(res){
					ajaxHandler(res, function(data, text){
						if(success && typeof success == 'function'){
							success(data);
						}
					}, ajaxErrorHandler)
				}
			});
		}
		
		function getSpecificStaff(role, staff){
			var specific_staff = [];
			staff.forEach(function(man){
				if(man.role == role){
					specific_staff.push({
						id: man.id,
						avatar_url: man.avatar_url,
						name: man.first_name + ' ' + man.last_name,
						is_link: true,
						avatar_classes: ['-size_40x40','-rounded']
					})
				}
			});
			return specific_staff;
		}
		
		function updateScoreboards($wrapper, numbers, dynamics) {
			var order = ['subscribe', 'fave', 'view', 'conversion'],
				fields = {
					'subscribe': 'Подписчиков организатора',
					'fave': 'Добавлений в избранное',
					'view': 'Просмотров организатора',
					'conversion': 'Конверсия откытий/подписки'
				};
			
			order.forEach(function(field){
				var measure = field == 'conversion' ? '%' : '',
					$scoreboard = $wrapper.find('.Scoreboard'+field.capitalize());
				
				if(!$scoreboard.length){
					$scoreboard = tmpl('orgstat-scoreboard', {
						type: 'Scoreboard'+field.capitalize(),
						title: fields[field],
						number: 0 + measure,
						dynamic_by_week: 0 + measure
					}, $wrapper)
				}
				
				if(numbers[field]){
					$scoreboard.find('.ScoreboardNumber').animateNumber({
						number: Math.round(numbers[field][0].value),
						suffix: measure
					}, 2000, 'easeOutSine');
				}
				
				if(dynamics[field]){
					var dynamic = dynamics[field][0].value;
					$scoreboard
						.find('.ScoreboardDynamic')
						.animateNumber({
							number: Math.round(dynamic),
							prefix: dynamic == 0 ? '' : (dynamic > 0 ? '+' : '-'),
							suffix: measure
						}, 2000, 'easeOutSine')
						.siblings('label')
						.removeClass('fa-caret-up -color_franklin fa-caret-down -color_bubblegum')
						.addClass(dynamic == 0 ? '' : (dynamic > 0 ? 'fa-caret-up -color_franklin' : 'fa-caret-down -color_bubblegum'));
				}
				
			});
		}
		
		$wrapper.empty();
		getOrganizationData(org_id, org_fields, function(org_data) {
			var role;
			org_data = org_data[0];
			
			changeMainTitle(['Организации', org_data.short_name]);
			
			role = recognizeRole(org_data.privileges);
			
			org_data.administrators = getSpecificStaff('admin', org_data.staff);
			org_data.moderators = getSpecificStaff('moderator', org_data.staff);
			switch(role){
				case __C.ROLES.ADMIN: {
					org_data.administrators.push({
						avatar_url: '/app/img/add_user.png',
						name: 'Добавить администратора',
						block_classes: ['-add_new','-color_marginal','AddAdmin'],
						avatar_classes: ['-size_40x40','-rounded']
					});
				}
				case __C.ROLES.MODERATOR: {
					org_data.moderators.push({
						avatar_url: '/app/img/add_user.png',
						name: 'Добавить модератора',
						block_classes: ['-add_new','-color_marginal','AddModerator'],
						avatar_classes: ['-size_40x40','-rounded']
					});
					break;
				}
			}
			org_data.administrators = buildAvatarBlocks(org_data.administrators);
			org_data.moderators = buildAvatarBlocks(org_data.moderators);
			org_data.event_blocks = org_data.events.map(function(event) {
				var event_block = {
					title: event.title,
					day: moment.unix(event.first_event_date).format("D"),
					month: moment.unix(event.first_event_date).format("MMM"),
					badges: []
				};
				if(event.canceled)
					event_block.badges.push('Отменено');
				if(event.public_at && moment.unix(event.public_at).isBefore())
					event_block.badges.push('Не опубликовано');
				return event_block;
			});
			org_data.event_blocks = tmpl('orgstat-event-block', org_data.event_blocks);
			
			$wrapper.append(tmpl('orgstat-overview', org_data));
			
			getStatistics(org_id, 'year', moment().subtract(6, 'd').format(), moment().format(), stat_fields, function(stat_data){
				
				function initPieChart($container, data) {
					var pie_chart_options = {
						chart: {
							backgroundColor: null,
							plotBorderWidth: null,
							plotShadow: false,
							type: 'pie',
							height: 200,
							style: {
								fontFamily: 'inherit',
								fontSize: 'inherit'
							}
						},
						title: {
							text: false
						},
						tooltip: {
							pointFormat: '<b>{point.percentage:.1f}%</b>'
						},
						plotOptions: {
							pie: {
								center: [45, '50%'],
								allowPointSelect: true,
								cursor: 'pointer',
								size: 120,
								dataLabels: {
									distance: -35,
									defer: false,
									formatter: function () {
										return this.percentage > 15 ? Math.round(this.percentage)+'%' : null;
									},
									style: {"color": "#fff", "fontSize": "20px", "fontWeight": "300", "textShadow": "none" },
									y: -6
								},
								showInLegend: true
							}
						},
						legend: {
							align: 'right',
							verticalAlign: 'top',
							layout: 'vertical',
							width: 100,
							itemStyle: { "color": "#333333", "cursor": "pointer", "fontSize": "14px", "fontWeight": "500" },
							y: 12
						}
					};
					
					function pieChartDataGenerator(raw_data) {
						var default_colors = [__C.COLORS.FRANKLIN,__C.COLORS.ACCENT,__C.COLORS.MUTED,__C.COLORS.MUTED_80,__C.COLORS.MUTED_50,__C.COLORS.MUTED_30],
							STD_NAMES = {
								"browser": "Браузер",
								"android": "Аndroid",
								"ios": "iOS",
								"female": "Женщины",
								"male": "Мужчины",
								"other": "Остальные",
								null: "Не указано"
							},
							output = {
								colorByPoint: true,
								data: raw_data.map(function(line, i) {
									return {
										name: line.name ? STD_NAMES[line.name] : STD_NAMES[line.gender],
										color: default_colors[i],
										y: line.count
									}
								})
							};
						return {series: [output]};
					}
					
					$container.highcharts($.extend(true, {}, pie_chart_options, pieChartDataGenerator(data)));
				}
				
				initPieChart($wrapper.find('.GenderPieChart'), stat_data.audience.gender);
				initPieChart($wrapper.find('.DevicePieChart'), stat_data.audience.devices);
				
				$wrapper.find('.OrgstatOverviewContent').append(tmpl('orgstat-overview-content', {}));
				
				updateScoreboards($wrapper.find('.Scoreboards'), stat_data, stat_data.dynamics);
				
				getStatistics(org_id, 'week', moment().subtract(11, 'months').format(), moment().format(), 'view,subscribe,unsubscribe,conversion,notification', function(stat_data){
					
					var area_chart_default_options = {
						chart: {
							type: 'areaspline'
						},
						title: {text: false},
						xAxis: {
							type: 'datetime',
							showEmpty: false
						},
						yAxis: {
							title: {text: false}
						},
						plotOptions: {
							areaspline: {
								stacking: 'normal',
								pointStart: Date.UTC(2010, 0, 1),
								pointIntervalUnit: 'year',
								tooltip: {
									headerFormat: '<b>{point.key}</b><br/>',
									xDateFormat: '%d %m %Y'
								},
								marker: {
									enabled: false,
									symbol: 'circle',
									radius: 2,
									states: {
										hover: {
											enabled: true
										}
									}
								}
							}
						}
					},
						area_stock_chart_default_options = {
							title: {
								text: 'chart.type is set to \'areaspline\''
							},
							chart: {
								type: 'areaspline'
							},
							
							rangeSelector: {
								selected: 1
							}
						};
					
					function areaChartSeriesNormalize(raw_data) {
						var line_colors = [__C.COLORS.FRANKLIN,__C.COLORS.ACCENT],
							fill_colors = [__C.COLORS.FRANKLIN_ALT,__C.COLORS.ACCENT_ALT],
							STD_NAMES = {
								'view': 'Просмотры страницы организации',
								'conversion': 'Конверсия',
								'subscribe': 'Подписалось',
								'unsubscribe': 'Отписалось'
							},
							output = [],
							i = 0;
						
						$.each(raw_data, function(key, data){
							output.push({
								name: STD_NAMES[key],
								fillColor: fill_colors[i],
								lineColor: line_colors[i++],
								data: data.reverse().map(function(line, i) {
									return [moment.unix(line.since).valueOf(), line.value];
								})
							});
						});
						
						return output;
					}
					
					$wrapper.find('.SubscribersAreaChart').highcharts($.extend(true, {}, area_chart_default_options, {
						title: {
							text: 'Подписчики'
						},
						tooltip: {
							shared: true
						},
						series: areaChartSeriesNormalize({subscribe: stat_data.subscribe, unsubscribe: stat_data.unsubscribe})
					}));
					
					$wrapper.find('.ViewsAreaChart').highcharts('StockChart', $.extend(true, {}, area_stock_chart_default_options, {
						series: areaChartSeriesNormalize({view: stat_data.view})
					}));
					
					$wrapper.find('.ConversionsAreaChart').highcharts($.extend(true, {}, area_chart_default_options, {
						title: {
							text: 'Конверсия просмотров/подписок'
						},
						tooltip: {
							valueSuffix: ' %'
						},
						series: areaChartSeriesNormalize({conversion: stat_data.conversion})
					}));
					
					console.log(stat_data);
				});
				
				
				
				
				console.log(stat_data);
				console.log(org_data);
			});
			bindRippleEffect($wrapper);
			bindControllers($wrapper);
		});
	}
	
	function Events($wrapper) {}
	
	function Auditory($wrapper) {}
	
	function Promotion($wrapper) {}
	
	function Settings($wrapper) {}
	
	function Support($wrapper) {}
	
	if(!current_state)
		current_state = 'overview';
	
	sub_states[current_state]($wrapper);
	$('body').addClass('-state_statistics');
	
}

function StatisticsEvent($view) {

}

function ajaxHandler(result, success, error){
	error = typeof error !== 'undefined' ? error : function(){
		console.log(result);
		showNotifier({text: 'Упс, что-то пошло не так', status: false});
	};
	success = typeof success !== 'function' ? function(){} : success;
	try {
		if(result.status){
			success(result.data, result.text);
		} else {
			error(result);
		}
	} catch(e){
		error(e);
	}
}

function ajaxErrorHandler(event, jqxhr, settings, thrownError){
	var args = Array.prototype.slice.call(arguments),
		fields = ['event', 'jqxhr', 'settings', 'thrownError'];
	window.debug = {};
	args.forEach(function(arg, i){
		window.debug[fields[i]] = arg;
	});
	console.groupCollapsed('AJAX error');
	if(thrownError)
		console.log('Thrown error:', thrownError);
	if(event && event.type)
		console.log('Error type:', event.type);
	if(event && event.text)
		console.log('Description:', event.text);
	if(jqxhr && jqxhr.responseJSON && jqxhr.responseJSON.text){
		console.log('Response:', jqxhr.responseJSON.text);
		showNotifier({text: jqxhr.responseJSON.text, status: false});
	}
	if(settings){
		console.log('URL:', settings.url);
		console.log('Method:', settings.type);
	}
	console.error('Error stacktrace:');
	console.groupEnd();
}

$(document)
	.ajaxStart(function(){
		Pace.restart()
	})
	.ajaxError(ajaxErrorHandler)
	.ready(function(){

		function initSidebar(){
			var $sidebar = $('#main_sidebar'),
				$sidebar_nav = $sidebar.find('.SidebarNav'),
				$sidebar_nav_items = $sidebar_nav.find('.SidebarNavItem');

			$sidebar_nav.addClass('-items_'+$sidebar_nav_items.not('.-hidden').length);

			renderSidebarOrganizations(null, function($list){
				((window.innerHeight > 800) ? $('.SidebarOrganizationsScroll') : $('.SidebarScroll')).scrollbar({
					disableBodyScroll: true
				});
				bindControllers($list);
			});
		}
		function initTopBar(){
			var $main_header = $('#main_header');

			$main_header.find('#search_bar_input').on('keypress', function(e){
				if (e.which == 13){
					History.pushState({_index: History.getCurrentIndex(), page: 'search'}, 'Поиск: ' + this.value, '/search?q=' + encodeURIComponent(this.value));
				}
			});

			$main_header.find('#user_bar').on('click.openUserBar', function(){
				var $this = $(this),
					$document = $(document);
				$this.addClass('-open');
				$document.on('click.closeUserBar', function(e){
					if(!$(e.target).parents('#user_bar').length){
						$document.off('click.closeUserBar');
						$this.removeClass('-open');
					}
				})
			});
			$main_header.find('.LogoutButton').on('click', function(){
				$.ajax({
					url: '/index.php?logout=true',
					method: 'GET',
					success: function(){
						window.location.href = '/';
					}
				});
			});
			bindRippleEffect($main_header);
			bindControllers($main_header);
		}

		History.Adapter.bind(window, 'statechange', renderState);

		initSidebar();
		initTopBar();
		$.ajax({
			url: '/api/v1/users/me',
			method: 'GET',
			success: function(res){
				ajaxHandler(res, function(data){
					window.__USER = data[0];
					bindControllers();
					renderState();
				}, ajaxErrorHandler);
			}
		});
	});