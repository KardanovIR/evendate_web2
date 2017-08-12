/**
 * @requires ../Class.Page.js
 */
/**
 *
 * @class OrderPage
 */
OrderPage = extending(Page, (function() {
	/**
	 *
	 * @param {(number|string)} event_id
	 *
	 * @constructor
	 * @constructs OrderPage
	 *
	 * @property {OneEvent} event
	 * @property {Fields} event_fields
	 * @property {OnePromocode} promocode
	 * @property {Fields} promocode_fields
	 * @property {boolean} is_promocode_active
	 */
	function OrderPage(event_id) {
		var self = this;
		
		Page.call(this);
		this.event = new OneEvent(event_id);
		this.event_fields = EventPage.fields.copy().add({
			ticket_types: {
				fields: new Fields(
					'is_selling',
					'comment',
					'price',
					'sell_start_date',
					'sell_end_date',
					'min_count_per_user',
					'max_count_per_user'
				)
			}
		});
		this.promocode = new OnePromocode(event_id);
		this.promocode_fields = new Fields();
		this.is_promocode_active = false;
		
		Object.defineProperty(this, 'page_title', {
			get: function() {
				
				return (self.event.ticketing_locally ? 'Заказ билетов на событие ' : 'Регистрация на событие ') + self.event.title;
			}
		});
	}
	
	OrderPage.prototype.fetchData = function() {
		
		return this.fetching_data_defer = this.event.fetchEvent(this.event_fields);
	};
	/**
	 *
	 * @param {RegistrationFieldModel} field
	 * @return {jQuery}
	 */
	OrderPage.buildRegistrationField = function(field) {
		var default_props = {
			id: 'registration_form_' + field.uuid,
			name: field.uuid,
			unit_classes: ['Registration' + field.type.toCamelCase('_') + 'Field'],
			label: $('<span>'+ field.label +'</span>').add((field.required ? tmpl('required-star') : $())),
			required: field.required
		};
		
		switch (field.type) {
			case RegistrationFieldModel.TYPES.SELECT: {
				
				return (function(props, values) {
					
					return tmpl('form-unit', Builder.normalizeBuildProps({
						unit_classes: props.unit_classes,
						label: tmpl('label', {
							id: props.id,
							label: props.label
						}),
						form_element: __APP.BUILD.select(
							values.map(function(value) {
								
								return {
									display_name: value.value,
									val: value.uuid || guid()
								}
							}), {
								id: props.id,
								name: props.name,
								required: props.required
							}, props.classes
						)
					}));
				}($.extend({}, default_props, {classes: ['form_select2', 'ToSelect2']}), field.values instanceof Array ? field.values : []));
			}
			case RegistrationFieldModel.TYPES.SELECT_MULTI: {
				
				return (function(props, values) {
					
					return tmpl('form-unit', Builder.normalizeBuildProps($.extend(true, {}, props, {
						unit_classes: props.classes,
						label: tmpl('label', {
							id: props.id + '_label',
							label: props.label
						}),
						form_element: __APP.BUILD.checkbox.apply(__APP.BUILD, values.map(function(value) {
							
							return {
								id: 'registration_field_value_' + (value.uuid || guid()),
								name: props.name,
								label: value.value,
								attributes: {
									value: value.uuid || guid(),
									required: props.required
								}
							};
						}))
					})));
				}($.extend({}, default_props, {type: 'checkbox'}), field.values instanceof Array ? field.values : []));
			}
			default: {
				
				return __APP.BUILD.formUnit($.extend({}, default_props, {
					type: field.type === RegistrationFieldModel.TYPES.EXTENDED_CUSTOM ? 'textarea' : field.type,
					placeholder: field.label,
					helptext: (function(type) {
						switch (type) {
							case RegistrationFieldModel.TYPES.EMAIL:
								return 'На почту Вам поступит сообщение с подтверждением регистрации';
							case RegistrationFieldModel.TYPES.FIRST_NAME:
								return 'Используйте настоящее имя для регистрации';
							case RegistrationFieldModel.TYPES.LAST_NAME:
								return 'Используйте настоящюю фамилию для регистрации';
							default:
								return '';
						}
					})(field.type)
				}));
			}
		}
	};
	
	OrderPage.prototype.disablePage = function(message) {
		var self = this;
		
		this.$wrapper.find('.OrderFormWrapper').addClass(__C.CLASSES.DISABLED).attr('disabled', true);
		
		this.$wrapper.find('.OrderPage').append(__APP.BUILD.overlayCap(tmpl('order-overlay-cap-content', {
			message: message,
			return_button: __APP.BUILD.link({
				page: '/event/' + this.event.id,
				title: 'Вернуться на страницу события',
				classes: [
					__C.CLASSES.COMPONENT.BUTTON,
					__C.CLASSES.COLORS.PRIMARY
				]
			})
		})));
	};
	
	OrderPage.prototype.init = function() {
		var self = this,
			parsed_uri = parseUri(location),
			$main_action_button = this.$wrapper.find('.MainActionButton'),
			$activate_promocode_button = this.$wrapper.find('.ActivatePromocode'),
			$promocode_input = this.$wrapper.find('.PromocodeInput'),
			$pay_buttons = this.$wrapper.find('.PayButtons'),
			$selected_type;
		
		function countTicketTypeSum($ticket_type) {
			var $sum = $ticket_type.find('.TicketTypeSum'),
				value = $ticket_type.find('.QuantityInput').resolveInstance().value;
			
			if (value > 0) {
				$sum.removeClass(__C.CLASSES.HIDDEN);
			} else {
				$sum.addClass(__C.CLASSES.HIDDEN);
			}
			
			$ticket_type.find('.TicketTypeSumText').text(formatCurrency($ticket_type.data('ticket_type').price * value));
		}
		
		function countTotalSum() {
			var sum = Array.prototype.reduce.call(self.$wrapper.find('.TicketTypeSumText'), function(sum, ticket_type_sum) {
				
				return sum + +ticket_type_sum.innerHTML.replace(' ', '');
			}, 0),
				total_sum;
			
			self.$wrapper.find('.TicketsOverallSum').text(formatCurrency(sum));
			
			if (self.is_promocode_active) {
				if (self.promocode.is_fixed) {
					total_sum = sum - self.promocode.effort;
				} else {
					total_sum = sum - (sum * self.promocode.effort / 100);
				}
				
				total_sum = total_sum <= 0 ? 0 : total_sum;
				self.$wrapper.find('.TicketsTotalSum').text(formatCurrency(total_sum));
			} else {
				total_sum = sum;
			}
			
			if (total_sum === 0) {
				$main_action_button.removeClass(__C.CLASSES.COLORS.YANDEX).addClass(__C.CLASSES.COLORS.ACCENT).text('Зарегистрироваться');
				$pay_buttons.addClass(__C.CLASSES.HIDDEN);
			} else {
				$main_action_button.removeClass(__C.CLASSES.COLORS.ACCENT).addClass(__C.CLASSES.COLORS.YANDEX).text('Заплатить через Яндекс');
				$pay_buttons.removeClass(__C.CLASSES.HIDDEN);
			}
		}
		
		bindRippleEffect(this.$wrapper);
		bindControlSwitch(this.$wrapper);
		initSelect2(this.$wrapper.find('.ToSelect2'), {
			dropdownCssClass: 'form_select2_drop form_select2_drop_no_search'
		});
		
		$activate_promocode_button.on('click.ActivatePromocode', function() {
			var $wrapper = self.$wrapper.find('.OrderFormWrapper'),
				code = $promocode_input.val();
			
			if (code === '') {
				showNotifier({
					status: false,
					text: 'Пожалуйста, введите промокод'
				});
			} else {
				$wrapper.attr('disabled', true);
				
				self.promocode.fetchPromocodebyCodeName(code, self.promocode_fields, function() {
					var $promocode_wrapper = $wrapper.find('.PromocodeWrapper');
					
					$wrapper.removeAttr('disabled');
					
					$promocode_wrapper.after(tmpl('order-tickets-selling-promocode', {
						effort: self.promocode.effort + (self.promocode.is_fixed ? ' ₽' : '%')
					}));
					$promocode_wrapper.addClass(__C.CLASSES.HIDDEN);
					
					self.is_promocode_active = true;
					countTotalSum();
				}, function() {
					showNotifier({
						status: false,
						text: 'Указанный промокод не существует или более не активен'
					});
					$wrapper.removeAttr('disabled');
					
					$promocode_input.focus().select();
				});
			}
		});
		
		$promocode_input.on('keypress', function(e) {
			if (isKeyPressed(e, __C.KEY_CODES.ENTER)) {
				$activate_promocode_button.trigger('click.ActivatePromocode');
			}
		});
		
		this.$wrapper.find('.RegistrationFirstNameField').find('input').val(__APP.USER.first_name);
		this.$wrapper.find('.RegistrationLastNameField').find('input').val(__APP.USER.last_name);
		this.$wrapper.find('.RegistrationEmailField').find('input').val(__APP.USER.email);
		
		/**
		 *
		 * @return {(boolean|jqPromise)}
		 */
		function makeOrder() {
			var $main_action_button = $(this),
				$form = self.$wrapper.find('.OrderForm');
			
			if (__APP.USER.isLoggedOut()) {
				(new AuthModal(window.location.href)).show();
				
				return false;
			} else {
				if (isFormValid($form)) {
					$main_action_button.attr('disabled', true);
					
					return self.event.makeOrder(
						self.$wrapper.find('.OrderFields').serializeForm('array').reduce(function(bundle, field) {
							if (+field.value) {
								bundle.push({
									uuid: field.name,
									count: +field.value
								});
							}
							
							return bundle;
						}, []),
						self.$wrapper.find('.RegistrationFields').serializeForm('array').map(function(field) {
							
							return {
								uuid: field.name,
								value: field.value
							};
						}),
						self.$wrapper.find('.PromocodeInput').val()
					).always(function(data) {
						$main_action_button.removeAttr('disabled');
						
						return data;
					}).promise();
				} else {
					
					return false;
				}
			}
		}
		
		this.$wrapper.find('.QuantityInput').on('QuantityInput::change', function(e, value) {
			countTicketTypeSum($(this).closest('.TicketType'));
			countTotalSum();
		});
		
		this.$wrapper.find('.TicketType').each(function() {
			countTicketTypeSum($(this));
		});
		countTotalSum();
		
		if (parsed_uri.queryKey['ticket_selected']) {
			$selected_type = this.$wrapper.find('.TicketType').filter(function() {
				
				return $(this).data().ticket_type.name === parsed_uri.queryKey['ticket_selected']
			});
			
			if ($selected_type.length) {
				$selected_type.find('.QuantityInput').resolveInstance().increment();
			}
		}
		
		this.render_vars.main_action_button.on('click.MakeOrder', function() {
			var result = makeOrder();
			
			if (result !== false) {
				result.done(function(data) {
					var is_custom_callback = !!parsed_uri.queryKey['away_to'],
						callback_url = parsed_uri.queryKey['away_to'] || '/event/' + self.event.id;
					
					if (self.event.ticketing_locally && data.final_sum !== 0) {
						Payment.doPayment('order-' + data.order.uuid, data.final_sum, is_custom_callback ? callback_url : (window.location.origin + callback_url));
					} else if (is_custom_callback) {
						window.location = callback_url + '?registration=free';
					} else {
						__APP.changeState(callback_url);
						showNotifier({text: 'Регистрация прошла успешно', status: true});
					}
				})
			}
		});
		
		if (this.event.ticketing_locally) {
			this.render_vars.legal_entity_payment_button.on('click.LegalEntityPayment', function() {
				var result = makeOrder();
				
				if (result !== false) {
					result.done(function(data) {
						var parsed_uri = parseUri(location);
						
						try {
							window.localStorage.setItem(self.event.id + '_order_info', JSON.stringify(parsed_uri.queryKey));
						} catch (e) {}
						
						__APP.changeState(parsed_uri.path + '/' + data.order.uuid + '/from_legal_entity');
					});
				}
			});
		}
	};
	
	OrderPage.prototype.preRender = function() {
		var self = this;
		
		if (this.event.ticketing_locally) {
			this.render_vars.tickets_selling = tmpl('order-tickets-selling', {
				ticket_types: tmpl('order-ticket-type', this.event.ticket_types.map(function(ticket_type) {
					
					return {
						name: ticket_type.name,
						ticket_type_uuid: ticket_type.uuid,
						quantity_input: new QuantityInput({
							name: ticket_type.uuid
						}, {
							min: ticket_type.min_count_per_user || 0,
							max: ticket_type.max_count_per_user || ticket_type.amount || 30
						}),
						description: ticket_type.comment,
						type_price: formatCurrency(ticket_type.price),
						sum_price: 0
					};
				})),
				overall_price: 0
			});
			
			this.render_vars.tickets_selling.find('.TicketType').each(function(i) {
				var $this = $(this);
				
				$this.data('ticket_type', self.event.ticket_types[i]);
				
				if (!self.event.ticket_types[i].is_selling) {
					$this.attr('disabled', true);
				}
			});
		}
		
		if (this.event.registration_locally) {
			this.render_vars.registration = tmpl('order-registration', {
				registration_fields: $.makeSet(this.event.registration_fields.map(OrderPage.buildRegistrationField))
			});
		}
		
		this.render_vars.main_action_button = __APP.BUILD.button({
			title: 'Зарегистрироваться',
			classes: [
				__C.CLASSES.COLORS.ACCENT,
				__C.CLASSES.HOOKS.RIPPLE,
				__C.CLASSES.UNIVERSAL_STATES.NO_UPPERCASE,
				'MainActionButton',
				__C.CLASSES.SIZES.WIDE,
				__C.CLASSES.SIZES.HUGE
			]
		});
		
		if (this.event.ticketing_locally) {
			this.render_vars.legal_entity_payment_button = __APP.BUILD.button({
				title: 'Оплатить через юр. лицо',
				classes: [
					__C.CLASSES.COLORS.MARGINAL_PRIMARY,
					__C.CLASSES.TEXT_WEIGHT.LIGHTER,
					__C.CLASSES.HOOKS.RIPPLE,
					'LegalEntityPaymentButton',
					__C.CLASSES.SIZES.WIDE,
					__C.CLASSES.SIZES.BIG,
					__C.CLASSES.UNIVERSAL_STATES.NO_UPPERCASE
				]
			});
			
			this.render_vars.bitcoin_payment_button = __APP.BUILD.button({
				title: 'Заплатить через Bitcoin',
				classes: [
					__C.CLASSES.COLORS.MARGINAL_PRIMARY,
					__C.CLASSES.TEXT_WEIGHT.LIGHTER,
					__C.CLASSES.HOOKS.RIPPLE,
					'BitcoinPaymentButton',
					__C.CLASSES.SIZES.WIDE,
					__C.CLASSES.SIZES.BIG,
					__C.CLASSES.STATUS.DISABLED,
					__C.CLASSES.UNIVERSAL_STATES.NO_UPPERCASE
				]
			});
		}
	};
	
	OrderPage.prototype.render = function() {
		if (__APP.USER.isLoggedOut()) {
			return (new AuthModal(window.location.href, false)).show();
		}
		this.preRender();
		
		this.$wrapper.html(tmpl('order-page', this.render_vars));
		
		if (this.event.ticketing_locally) {
			if (!this.event.ticketing_available) {
				this.disablePage('Заказ билетов на событие невозможен');
			}
		} else {
			if (this.event.registration_locally && !this.event.registration_available) {
				this.disablePage('Регистрация на событие не доступно');
			}
		}
		
		this.init();
	};
	
	return OrderPage;
}()));