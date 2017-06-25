/**
 * @requires Class.AbstractEditEventPage.js
 */
/**
 *
 * @class EditEventPage
 * @extends AbstractEditEventPage
 */
EditEventPage = extending(AbstractEditEventPage, (function() {
	/**
	 *
	 * @param {(string|number)} [event_id]
	 * @constructor
	 * @constructs EditEventPage
	 */
	function EditEventPage(event_id) {
		AbstractEditEventPage.call(this);
		this.page_title = 'Редактирование события';
		this.event = new OneEvent(event_id);
		this.event_fields = EventPage.fields.copy().add('vk_post_link');
	}
	
	EditEventPage.prototype.fetchData = function() {
		return this.fetching_data_defer = __APP.SERVER.multipleAjax(
			this.event.fetchEvent(this.event_fields),
			this.my_organizations.fetchMyOrganizations(['admin', 'moderator'], this.my_organizations_fields)
		);
	};
	
	EditEventPage.prototype.preRender = function() {
		AbstractEditEventPage.prototype.preRender.call(this);
		
		this.render_vars.button_text = 'Сохранить';
		this.render_vars.image_horizontal_filename = getFilenameFromURL(this.event.image_horizontal_url);
		
		this.render_vars.registration_custom_fields = AbstractEditEventPage.registrationCustomFieldBuilder(this.event.registration_fields.filter(RegistrationFieldModel.isCustomField));
		
		this.render_vars.ticket_types = this.event.ticket_types.length ? AbstractEditEventPage.ticketTypeRowsBuilder(this.event.ticket_types) : tmpl('edit-event-tickets-row-empty');
		
		this.render_vars.vk_post_link = this.event.vk_post_link ? __APP.BUILD.actionLink(
			this.event.vk_post_link,
			'Страница публикации во Вконтакте',
			[__C.CLASSES.COLORS.ACCENT, '-no_uppercase'],
			{},
			{target: '_blank'}
		) : '';
	};
	
	EditEventPage.prototype.init = function() {
		var self = this;
		
		AbstractEditEventPage.prototype.init.call(this);
		
		(function selectDates($view, raw_dates, is_same_time) {
			var MainCalendar = $view.find('.EventDatesCalendar').data('calendar'),
				$table_rows = $view.find('.SelectedDaysRows');
			
			if (!is_same_time) {
				self.$wrapper.find('#edit_event_different_time').prop('checked', true).trigger('change');
			}
			
			MainCalendar.selectDays(raw_dates.map(function(date) {
				
				return moment.unix(date.event_date).format(__C.DATE_FORMAT)
			}));
			
			raw_dates.forEach(function(date) {
				var $day_row = $table_rows.find('.TableDay_' + moment.unix(date.event_date).format(__C.DATE_FORMAT));
				
				$day_row.find('.StartTime').val(date.start_time);
				if (date.end_time.length) {
					$day_row.find('.EndTime').val(date.end_time);
				}
			});
		})(this.$wrapper, this.event.dates, this.event.is_same_time);
		
		(function selectTags($view, tags) {
			var selected_tags = [];
			tags.forEach(function(tag) {
				selected_tags.push({
					id: parseInt(tag.id),
					text: tag.name
				});
			});
			
			$view.find('#event_tags').select2('data', selected_tags);
		})(this.$wrapper, this.event.tags);
		
		if (this.event.image_horizontal_url) {
			toDataUrl(this.event.image_horizontal_url, function(base64_string) {
				self.$wrapper.find('.HorizontalImageSource').val(base64_string ? base64_string : null);
			});
		}
		
		if(empty(this.event.public_at)) {
			this.$wrapper.find('.DelayedPublicationSwitch').toggleStatus('disabled');
		} else {
			this.$wrapper.find('.DelayedPublicationSwitch').prop('checked', true).trigger('change');
		}
		
		if (!this.event.is_free) {
			this.$wrapper.find('.IsFreeSwitch').prop('checked', false).trigger('change');
		}
		
		if (this.event.registration_required) {
			this.$wrapper.find('#edit_event_registration_required').prop('checked', true).trigger('change');
			
			if (this.event.registration_locally) {
				this.$wrapper.find('#edit_event_registration_locally').prop('checked', true).trigger('change');
			} else {
				this.$wrapper.find('#edit_event_registration_side').prop('checked', true).trigger('change');
			}
			
			if (this.event.registration_till) {
				this.$wrapper.find('#edit_event_registration_limit_by_date').prop('checked', true).trigger('change');
			}
			
			if (this.event.registration_limit_count) {
				this.$wrapper.find('#edit_event_registration_limit_by_quantity').prop('checked', true).trigger('change');
			}
			
			if (this.event.registration_approvement_required) {
				this.$wrapper.find('#edit_event_registration_approvement_required').prop('checked', true).trigger('change');
			}
			
			this.event.registration_fields.forEach(function(field) {
				if (!RegistrationFieldModel.isCustomField(field)) {
					self.$wrapper.find('#edit_event_registration_'+field.type+'_field_uuid').val(field.uuid);
					self.$wrapper.find('#edit_event_registration_'+field.type+'_field_enable').prop('checked', true).trigger('change');
					if (field.required) {
						self.$wrapper.find('#edit_event_registration_'+field.type+'_field_required').prop('checked', true);
					}
				}
			});
		}
		
		if (this.event.notifications.has(OneNotification.NOTIFICATIN_TYPES.ADDITIONAL_FOR_ORGANIZATION)) {
			this.$wrapper.find('.AdditionalNotificationSwitch').prop('disabled', false).trigger('change');
		}
		
		this.$wrapper.find('.VkPostFieldset').prop('disabled', true);
		
		if (this.event.vk_post_link) {
			this.$wrapper.find('.VkPostTrigger').prop('checked', true);
		}
	};
	
	return EditEventPage;
}()));