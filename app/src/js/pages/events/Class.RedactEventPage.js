/**
 * @requires ../Class.Page.js
 */
/**
 *
 * @constructor
 * @augments Page
 * @param {(string|number)} [event_id]
 */
function RedactEventPage(event_id) {
	Page.apply(this);
	this.page_title = 'Редактирование события';
	
	this.fields = [
		'image_horizontal_large_url',
		'description',
		'location',
		'can_edit',
		'registration_required',
		'registration_till',
		'is_free',
		'min_price',
		'organization_logo_small_url',
		'organization_short_name',
		'is_same_time',
		'dates{length:0,fields:"start_time,end_time"}',
		'tags',
		'detail_info_url',
		'public_at',
		'canceled'
	];
	this.event = new OneEvent(event_id);
}
RedactEventPage.extend(Page);

/**
 *
 * @param {jQuery} $context
 * @param {string} source
 * @param {string} filename
 */
RedactEventPage.handleImgUpload = function($context, source, filename) {
	var $parent = $context.closest('.EditEventImgLoadWrap'),
		$preview = $parent.find('.EditEventImgPreview'),
		$file_name_text = $parent.find('.FileNameText'),
		$file_name = $parent.find('.FileName'),
		$data_url = $parent.find('.DataUrl'),
		$button = $parent.find('.CallModal');
	
	$preview.attr('src', source);
	$file_name_text.html('Загружен файл:<br>' + filename);
	$file_name.val(filename);
	$button
		.data('source_img', source)
		.on('crop', function(event, cropped_src, crop_data) {
			$preview.attr('src', cropped_src);
			$button.data('crop_data', crop_data);
			$data_url.val('data.source').data('source', $preview.attr('src')).trigger('change');
		})
		.trigger('click.CallModal');
};

RedactEventPage.prototype.fetchData = function() {
	if(this.event.id){
		return this.fetching_data_defer = this.event.fetchEvent(this.fields);
	}
	return Page.prototype.fetchData.call(this);
};

RedactEventPage.prototype.init = function() {
	var PAGE = this,
		$main_tabs = PAGE.$wrapper.find('.EditEventPageTabs'),
		$buttons = PAGE.$wrapper.find('.edit_event_buttons').children(),
		$next_page_button = $buttons.filter('#edit_event_next_page'),
		$prev_page_button = $buttons.filter('#edit_event_prev_page'),
		$submit_button = $buttons.filter('#edit_event_submit');
	
	function submitEditEvent() {
		var $form = PAGE.$wrapper.find("#edit-event-form"),
			/**
			 * @type {Calendar} MainCalendar
			 */
			MainCalendar = PAGE.$wrapper.find('.EventDatesCalendar').resolveInstance(),
			$event_tags = $form.find('input.EventTags'),
			form_data = $form.serializeForm(),
			is_edit = !!(PAGE.event.id),
			is_form_valid,
			data = {
				event_id: null,
				title: null,
				image_horizontal: null,
				organization_id: null,
				location: null,
				description: null,
				detail_info_url: null,
				different_time: null,
				dates: [],
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
			};
		
		is_form_valid = (function validation($form, Calendar) {
			var is_valid = true,
				$times = $form.find('#edit_event_different_time').prop('checked') ? $form.find('[class^="TableDay_"]') : $form.find('.MainTime');
			
			function failSubmit($element, is_form_valid, error_message){
				var $cut_tab,
					$Tabs;
				if(is_form_valid){
					$cut_tab = $element.parents('.TabsBody:last');
					$Tabs = $cut_tab.closest('.Tabs').resolveInstance();
					$Tabs.setToTab($Tabs.find('.TabsBodyWrapper:first').children().index($cut_tab));
					$('html').stop().animate({
							scrollTop: Math.ceil($element.offset().top - 150)
						}, {
							duration: 400,
							easing: 'swing',
							complete: function() {
								showNotifier({text: error_message, status: false});
							}
						}
					);
				}
				handleErrorField($element);
				return false;
			}
			
			$form.find(':required').not(':disabled').each(function() {
				var $this = $(this);
				
				if ($this.val().trim() === '') {
					is_valid = failSubmit($this, is_valid, 'Заполните все обязательные поля');
				} else if ($this.hasClass('LimitSize') && $this.val().trim().length > $this.data('maxlength')) {
					is_valid = failSubmit($this, is_valid, 'Количество символов превышает установленное значение');
				}
			});
			
			if (!Calendar.selected_days.length) {
				is_valid = failSubmit(Calendar.$calendar, is_valid, 'Выберите даты для события');
			}
			
			$times.each(function() {
				var $row = $(this),
					$inputs = $row.find('.StartHours, .StartMinutes, .EndHours, .EndMinutes'),
					start = $row.find('.StartHours').val().trim() + $row.find('.StartMinutes').val().trim(),
					end = $row.find('.EndHours').val().trim() + $row.find('.EndMinutes').val().trim();
				
				$inputs.each(function() {
					var $input = $(this);
					if ($input.val().trim() === '') {
						is_valid = failSubmit($input, is_valid, 'Заполните время события');
					}
				});
				if (is_valid && start > end) {
					is_valid = failSubmit($row, is_valid, 'Начальное время не может быть позже конечного');
				}
			});
			
			if ($event_tags.val().trim() === '') {
				is_valid = failSubmit($event_tags.siblings('.EventTags'), is_valid, 'Необходимо выбрать хотя бы один тэг');
			}
			
			if (!is_edit) {
				$form.find('.DataUrl').each(function() {
					var $this = $(this);
					if ($this.val().trim() === "") {
						is_valid = failSubmit($this.closest('.ImgLoadWrap'), is_valid, 'Пожалуйста, добавьте к событию обложку');
					}
				});
			}
			
			return is_valid;
		})($form, MainCalendar);
		
		function afterSubmit() {
			__APP.changeState('/event/' + PAGE.event.id);
		}
		
		function onError() {
			PAGE.$wrapper.removeClass('-faded');
		}
		
		if (is_form_valid) {
			$.extend(true, data, form_data);
			
			if(form_data.tags){
				data.tags = form_data.tags.split(',');
			}
			data.filenames = {
				horizontal: data.filename_horizontal
			};
			if (data.registration_required) {
				data.registration_till = "" + data.registration_till_date + 'T' + data.registration_till_time_hours + ':' + data.registration_till_time_minutes + ':00'
			}
			if (data.delayed_publication) {
				data.public_at = "" + data.public_at_date + 'T' + data.public_at_time_hours + ':' + data.public_at_time_minutes + ':00'
			}
			
			if (data.different_time) {
				var selected_days_rows = $('.SelectedDaysRows').children();
				
				selected_days_rows.each(function() {
					var $this = $(this);
					data.dates.push({
						event_date: $this.find('.DatePicker').data('selected_day'),
						start_time: $this.find('.StartHours').val() + ':' + $this.find('.StartMinutes').val(),
						end_time: $this.find('.EndHours').val() + ':' + $this.find('.EndMinutes').val()
					});
				});
			} else {
				var $main_time = PAGE.$wrapper.find('.MainTime'),
					start_time = $main_time.find('.StartHours').val() + ':' + $main_time.find('.StartMinutes').val(),
					end_time = $main_time.find('.EndHours').val() + ':' + $main_time.find('.EndMinutes').val();
				
				MainCalendar.selected_days.forEach(function(day) {
					data.dates.push({
						event_date: day,
						start_time: start_time,
						end_time: end_time
					})
				});
			}
			
			PAGE.$wrapper.addClass('-faded');
			try {
				if (is_edit) {
					PAGE.event.updateEvent(data, afterSubmit, onError);
				} else {
					PAGE.event.createEvent(data, afterSubmit, onError);
				}
			} catch (e) {
				PAGE.$wrapper.removeClass('-faded');
				console.error(e);
			}
		}
	}
	
	bindDatePickers(PAGE.$wrapper);
	bindTimeInput(PAGE.$wrapper);
	bindSelect2(PAGE.$wrapper);
	bindTabs(PAGE.$wrapper);
	__APP.MODALS.bindCallModal(PAGE.$wrapper);
	bindLimitInputSize(PAGE.$wrapper);
	bindRippleEffect(PAGE.$wrapper);
	bindFileLoadButton(PAGE.$wrapper);
	(function bindLoadByURLButton() {
		$('.LoadByURLButton').not('-Handled_LoadByURLButton').on('click', function() {
			var $this = $(this),
				$input = $('#' + $this.data('load_input'));
			$this.data('url', $input.val());
			window.current_load_button = $this;
			socket.emit('image.getFromURL', $input.val());
			window.paceOptions = {
				catchupTime: 10000,
				maxProgressPerFrame: 1,
				ghostTime: Number.MAX_SAFE_INTEGER,
				checkInterval: {
					checkInterval: 10000
				},
				eventLag: {
					minSamples: 1,
					sampleCount: 30000000,
					lagThreshold: 0.1
				}
			}; //хз зачем, все равно не работает
			Pace.restart();
		}).addClass('-Handled_LoadByURLButton');
	})();
	(function initEditEventMainCalendar() {
		//TODO: Refactor this!! Make it more readable
		var $selected_days_text = PAGE.$wrapper.find('.EventSelectedDaysText'),
			$selected_days_table_rows = PAGE.$wrapper.find('.SelectedDaysRows'),
			MainCalendar = new Calendar('.EventDatesCalendar', {
				weekday_selection: true,
				month_selection: true,
				min_date: moment().format(__C.DATE_FORMAT)
			}),
			AddRowDatePicker = PAGE.$wrapper.find('.AddDayToTable').data('datepicker'),
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
		
		function bindRemoveRow($parent) {
			$parent.find('.RemoveRow').not('.-Handled_RemoveRow').each(function(i, elem) {
				$(elem).on('click', function() {
					MainCalendar.deselectDays($(this).closest('tr').data('date'));
				}).addClass('-Handled_RemoveRow');
			});
		}
		
		function displayFormattedText() {
			dates = {};
			MainCalendar.selected_days.forEach(function(date, i, days) {
				var _date = moment(date);
				
				if (typeof dates[_date.month()] === 'undefined') {
					dates[_date.month()] = {};
					dates[_date.month()].selected_days = [];
					dates[_date.month()].month_name = genitive_month_names[_date.format('MMMM')];
				}
				dates[_date.month()].selected_days.push(_date.date());
			});
			
			$selected_days_text.empty().removeClass('hidden');
			if (Object.keys(dates).length) {
				$.each(dates, function(i, elem) {
					$selected_days_text.append($('<p>').text(elem.selected_days.join(', ') + ' ' + elem.month_name))
				});
			} else {
				$selected_days_text.html('<p>Даты не выбраны</p>');
			}
		}
		
		function doTheFuckingSort($rows, $parent) {
			$rows.sort(function(a, b) {
				var an = $(a).data('date'),
					bn = $(b).data('date');
				
				if (an > bn) return 1;
				else if (an < bn) return -1;
				else return 0;
			});
			$rows.detach().appendTo($parent);
		}
		
		function buildTable(selected_days) {
			//TODO: BUG. On multiple selection (month or weekday) duplicates appearing in table.
			//TODO: Bind time on building table
			var $output = $(),
				today = moment().format(__C.DATE_FORMAT);
			if (Array.isArray(selected_days)) {
				selected_days.forEach(function(day) {
					$output = $output.add(tmpl('selected-table-day', {
						date: day,
						formatted_date: day.split('-').reverse().join('.'),
						today: today
					}));
				});
			}
			else {
				$output = tmpl('selected-table-day', {
					date: selected_days,
					formatted_date: selected_days.split('-').reverse().join('.'),
					today: today
				});
			}
			bindDatePickers($output);
			bindTimeInput($output);
			bindRemoveRow($output);
			
			$fucking_table = $fucking_table.add($output);
			$output.find('.DatePicker').each(function() {
				var DP = $(this).data('datepicker');
				DP.$datepicker.on('date-picked', function() {
					MainCalendar.deselectDays(DP.prev_selected_day).selectDays(DP.selected_day);
					doTheFuckingSort($fucking_table, $selected_days_table_rows)
				});
			});
			doTheFuckingSort($fucking_table, $selected_days_table_rows);
		}
		
		function BuildSelectedDaysTable() {
			if (MainCalendar.last_action === 'select') {
				buildTable(MainCalendar.last_selected_days);
			}
			else if (MainCalendar.last_action === 'deselect') {
				if (Array.isArray(MainCalendar.last_selected_days)) {
					var classes = [];
					MainCalendar.last_selected_days.forEach(function(day) {
						classes.push('.TableDay_' + day);
					});
					$fucking_table.remove(classes.join(', '));
					$fucking_table = $fucking_table.not(classes.join(', '));
				}
				else {
					$fucking_table.remove('.TableDay_' + MainCalendar.last_selected_days);
					$fucking_table = $fucking_table.not('.TableDay_' + MainCalendar.last_selected_days);
				}
			}
			
			doTheFuckingSort($fucking_table, $selected_days_table_rows);
			
			//TODO: Do not forget to rename 'fucking' names
			//TODO: Please, don't forget to rename 'fucking' names
			
		}
		
		buildTable(MainCalendar.selected_days);
		PAGE.$wrapper.find('.SelectedDaysRows').toggleStatus('disabled');
		
		MainCalendar.$calendar.on('days-changed.displayFormattedText', displayFormattedText);
		MainCalendar.$calendar.on('days-changed.buildTable', BuildSelectedDaysTable);
		
		PAGE.$wrapper.find('#edit_event_different_time').on('change', function() {
			PAGE.$wrapper.find('.MainTime').toggleStatus('disabled');
		});
		
		AddRowDatePicker.$datepicker.on('date-picked', function() {
			MainCalendar.selectDays(AddRowDatePicker.selected_day);
		});
		
	})();
	(function initOrganization(selected_id) {
		OrganizationsCollection.fetchMyOrganizations(['admin', 'moderator'], {fields: ['default_address']}, function(data) {
			var $wrapper = $('.EditEventOrganizations'),
				organizations_options = $(),
				$default_address_button = PAGE.$wrapper.find('.EditEventDefaultAddress'),
				$select = $wrapper.find('#edit_event_organization'),
				selected_address;
			
			data.forEach(function(organization) {
				if (organization.id == selected_id) {
					selected_address = organization.default_address;
				}
				organizations_options = organizations_options.add(tmpl('option', {
					val: organization.id,
					data: "data-image-url='" + organization.img_url + "' data-default-address='" + organization.default_address + "'",
					display_name: organization.name
				}));
			});
			
			$select.append(organizations_options).select2({
				containerCssClass: 'form_select2',
				dropdownCssClass: 'form_select2_drop'
			}).on('change', function() {
				$default_address_button.data('default_address', $(this).children(":selected").data('default-address'));
			});
			if (selected_id) {
				$select.select2('val', selected_id);
				$default_address_button.data('default_address', selected_address);
			} else {
				$default_address_button.data('default_address', data[0].default_address);
			}
			if (organizations_options.length > 1) {
				$wrapper.removeClass('-hidden');
			} else {
				$wrapper.addClass('-hidden');
			}
		});
	})(PAGE.event.organization_id);
	
	bindCollapsing(PAGE.$wrapper);
	
	$main_tabs = $main_tabs.resolveInstance();
	
	//TODO: perepilit' placepicker
	PAGE.$wrapper.find(".Placepicker").placepicker();
	
	PAGE.$wrapper.find('.EventTags').select2({
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
			data: function(term, page) {
				return {
					name: term // search term
				};
			},
			results: function(data) {
				var _data = [];
				data.data.forEach(function(value) {
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
	
	PAGE.$wrapper.find('.EditEventDefaultAddress').off('click.defaultAddress').on('click.defaultAddress', function() {
		var $this = $(this);
		$this.closest('.form_group').find('input').val($this.data('default_address')).trigger('input');
	});
	
	PAGE.$wrapper.find('#edit_event_delayed_publication').off('change.DelayedPublication').on('change.DelayedPublication', function() {
		PAGE.$wrapper.find('.DelayedPublication').toggleStatus('disabled');
	});
	
	PAGE.$wrapper.find('#edit_event_registration_required').off('change.RequireRegistration').on('change.RequireRegistration', function() {
		PAGE.$wrapper.find('.EditEventRegistrationWrap').toggleStatus('disabled');
	});
	
	PAGE.$wrapper.find('#edit_event_free').off('change.FreeEvent').on('change.FreeEvent', function() {
		PAGE.$wrapper.find('.MinPrice').toggleStatus('disabled');
	});
	
	PAGE.$wrapper.find('.MinPrice').find('input').inputmask({
		'alias': 'numeric',
		'autoGroup': false,
		'digits': 2,
		'digitsOptional': true,
		'placeholder': '0',
		'rightAlign': false
	});
	
	PAGE.$wrapper.find('.LoadImg').off('change.LoadImg').on('change.LoadImg', function(e) {
		var $this = $(e.target),
			files = e.target.files,
			reader;
		
		if (files.length == 0) return false;
		for (var i = 0, f; f = files[i]; i++) {
			reader = new FileReader();
			if (!f.type.match('image.*'))  continue;
			reader.onload = (function(the_file) {
				return function(e) {
					RedactEventPage.handleImgUpload($this, e.target.result, the_file.name);
				};
			})(f);
			reader.readAsDataURL(f);
		}
		
	});
	
	$main_tabs.on('change.tabs', function() {
		if($main_tabs.currentTabsIndex === 0){
			$prev_page_button.addClass(__C.CLASSES.NEW_HIDDEN);
		} else {
			$prev_page_button.removeClass(__C.CLASSES.NEW_HIDDEN);
		}
		if ($main_tabs.currentTabsIndex === $main_tabs.tabsCount - 1) {
			$next_page_button.addClass(__C.CLASSES.NEW_HIDDEN);
			$submit_button.removeClass(__C.CLASSES.NEW_HIDDEN);
		} else {
			$next_page_button.removeClass(__C.CLASSES.NEW_HIDDEN);
			$submit_button.addClass(__C.CLASSES.NEW_HIDDEN);
		}
	});
	
	$next_page_button.off('click.nextPage').on('click.nextPage', function() {
		$main_tabs.nextTab();
	});
	
	$prev_page_button.off('click.nextPage').on('click.prevPage', function() {
		$main_tabs.prevTab();
	});
	
	$submit_button.off('click.Submit').on('click.Submit', submitEditEvent);
};

RedactEventPage.prototype.render = function() {
	var PAGE = this,
		is_edit = !!PAGE.event.id,
		page_vars = $.extend(true, {}, Object.getProps(PAGE.event), {
			event_id: PAGE.event.id ? PAGE.event.id : undefined,
			public_at_data_label: 'Дата',
			current_date: moment().format(__C.DATE_FORMAT),
			tomorrow_date: moment().add(1, 'd').format(__C.DATE_FORMAT),
			button_text: is_edit ? 'Сохранить' : 'Опубликовать'
		}),
		registration_props = {
			registration_till_display_date: 'Дата',
			tomorrow_date: page_vars.tomorrow_date
		};
	
	
	if(__APP.USER.id === -1){
		__APP.changeState('/feed/actual', true, true);
		return null;
	}
	if(window.location.pathname.contains('event/add')){
		if(this.organization_id){
			__APP.changeState('/add/event/to/' + this.organization_id, true, true);
		} else {
			__APP.changeState('/add/event', true, true);
		}
		return null;
	}
	
	if (PAGE.event.registration_required) {
		var m_registration_till = moment.unix(PAGE.event.registration_till);
		registration_props = $.extend(registration_props, {
			registration_till_display_date: m_registration_till.format(__LOCALES.ru_RU.DATE.DATE_FORMAT),
			registration_till_date: m_registration_till.format(__C.DATE_FORMAT),
			registration_till_time_hours: m_registration_till.format('HH'),
			registration_till_time_minutes: m_registration_till.format('mm')
		});
	}
	
	if (PAGE.event.image_horizontal_url) {
		page_vars.image_horizontal_filename = PAGE.event.image_horizontal_url.split('/').reverse()[0];
	}
	
	if (PAGE.event.public_at != null) {
		var m_public_at = moment.unix(PAGE.event.public_at);
		page_vars.public_at_data = m_public_at.format('YYYY-MM-DD');
		page_vars.public_at_data_label = m_public_at.format('DD.MM.YYYY');
		page_vars.public_at_time_hours = m_public_at.format('HH');
		page_vars.public_at_time_minutes = m_public_at.format('mm');
		page_vars.public_at_checkbox_attribute = 'checked';
	}
	console.log(page_vars);
	
	PAGE.$wrapper.html(tmpl('edit-event-page', $.extend(page_vars, {
		date_picker: tmpl('edit-event-datepicker', {
			today: page_vars.current_date
		}),
		cover_picker: tmpl('edit-event-cover-picker', {
			image_horizontal_url: PAGE.event.image_horizontal_url,
			image_horizontal_filename: PAGE.event.image_horizontal_filename
		}),
		registration: tmpl('edit-event-registration', registration_props)
	})));
	
	PAGE.init();
	
	if (is_edit) {
		(function selectDates($view, raw_dates, is_same_time) {
			var MainCalendar = $view.find('.EventDatesCalendar').data('calendar'),
				start_time = raw_dates[0].start_time.split(':'),
				end_time = raw_dates[0].end_time ? raw_dates[0].end_time.split(':') : [],
				$table_rows = $view.find('.SelectedDaysRows'),
				dates = [],
				$day_row;
			
			if (is_same_time) {
				$day_row = $view.find('.MainTime');
				$day_row.find('.StartHours').val(start_time[0]);
				$day_row.find('.StartMinutes').val(start_time[1]);
				if (end_time.length) {
					$day_row.find('.EndHours').val(end_time[0]);
					$day_row.find('.EndMinutes').val(end_time[1]);
				}
			} else {
				PAGE.$wrapper.find('#edit_event_different_time').prop('checked', true).trigger('change');
			}
			
			raw_dates.forEach(function(date) {
				date.event_date = moment.unix(date.event_date).format('YYYY-MM-DD');
				dates.push(date.event_date);
			});
			MainCalendar.selectDays(dates);
			raw_dates.forEach(function(date) {
				var $day_row = $table_rows.find('.TableDay_' + date.event_date),
					start_time = date.start_time.split(':'),
					end_time = date.end_time ? date.end_time.split(':') : [];
				$day_row.find('.StartHours').val(start_time[0]);
				$day_row.find('.StartMinutes').val(start_time[1]);
				if (end_time.length) {
					$day_row.find('.EndHours').val(end_time[0]);
					$day_row.find('.EndMinutes').val(end_time[1]);
				}
			});
		})(PAGE.$wrapper, PAGE.event.dates, PAGE.event.is_same_time);
		(function selectTags($view, tags) {
			var selected_tags = [];
			tags.forEach(function(tag) {
				selected_tags.push({
					id: parseInt(tag.id),
					text: tag.name
				});
			});
			
			$view.find('#event_tags').select2('data', selected_tags);
		})(PAGE.$wrapper, PAGE.event.tags);
		
		if (PAGE.event.image_horizontal_url) {
			toDataUrl(PAGE.event.image_horizontal_url, function(base64_string) {
				PAGE.$wrapper.find('#edit_event_image_horizontal_src').val(base64_string ? base64_string : null);
			});
			PAGE.$wrapper.find('.CallModal').removeClass(__C.CLASSES.NEW_HIDDEN).on('crop', function(event, cropped_src, crop_data) {
				var $button = $(this),
					$parent = $button.closest('.EditEventImgLoadWrap'),
					$preview = $parent.find('.EditEventImgPreview'),
					$data_url = $parent.find('.DataUrl');
				$data_url.val('data.source').data('source', $preview.attr('src')).trigger('change');
				$preview.attr('src', cropped_src);
				$button.data('crop_data', crop_data);
			});
		}
		
		if (!PAGE.event.is_free) {
			PAGE.$wrapper.find('#edit_event_free').prop('checked', false).trigger('change');
			PAGE.$wrapper.find('#edit_event_min_price').val(PAGE.event.min_price);
		}
		if (PAGE.event.registration_required) {
			PAGE.$wrapper.find('#edit_event_registration_required').prop('checked', true).trigger('change');
		}
		if(page_vars.created_at == null) {
			PAGE.$wrapper.find('#edit_event_delayed_publication').toggleStatus('disabled');
		}
	}
};