String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
};


$.fn.extend({
	toggleStatus: function(statuses) {
		var $this = this;

		if($this.is('.form_unit')){
			statuses.split(' ').forEach(function(status){
				if(status === 'disabled'){
					var $form_elements = $this.find('input, select, textarea, button');
					if($this.hasClass('-status_disabled')){
						$form_elements.each(function(){
							$(this).removeAttr('disabled');
						});
					} else {
						$form_elements.each(function(){
							$(this).attr('disabled', true)
						});
					}
				}
				$this.toggleClass('-status_'+status);
			});
		} else if($this.is('input, textarea, select, button')){
			$this.closest('.form_unit').toggleStatus(statuses);
		}	else if($this.length) {
			$this.find('.form_unit').toggleStatus(statuses);
		}	else {
			throw Error('Argument not found');
		}

		return this;
	},

	/**
	 * Сбор данных с формы
	 * Метод возвращает javaScript объект, состоящий из атрибутов name и value элементов формы.
	 * Если output_type стоит на array, то возвращается массив из объектов с полями name и value (аналогично с serializeArray).
	 *
	 * @method external:"jQuery.fn".serializeForm
	 *
	 * @param {string} [output_type=object]
	 * @returns {Array|Object}
	 */
	serializeForm: function(output_type) {
		var zb = /^(?:input|select|textarea|keygen)/i,
			yb = /^(?:submit|button|image|reset|file)$/i,
			T = /^(?:checkbox|radio)$/i,
			xb = /\r?\n/g,
			elements = this.map(function() {
				var a = $.prop(this, "elements");
				return a ? $.makeArray(a) : this
			});

		switch(output_type){
			case 'array': {
				/* Работает так же как и serializeArray, с некоторыми модификациями */
				return elements.filter(function() {
					var a = this.type;
					return this.name
						&& !$(this).is(":disabled")
						&& zb.test(this.nodeName)
						&& !yb.test(a)
						&& ((this.checked && this.value != "on") || a != "radio")
						&& ((this.checked && this.value != "on") || this.value == "on" || a != "checkbox")
				}).map(function(a, b) {
					var c = $(this).val(),
						std = "";
					switch(this.type){
						case "radio":
						case "checkbox":{
							std = c == "on" ? ( this.checked ? 1 : 0 ) : c;
							break;
						}
						default:{
							std = c.replace(xb, "\r\n");
						}
					}
					return null == c ? null : {
						name: b.name,
						value: std
					}
				}).get();
			}
			case 'object':
			default: {
				var output = {};
				elements.filter(function() {
					var a = this.type;
					return this.name && !$(this).is(':disabled') && zb.test(this.nodeName) && !yb.test(a) && !T.test(a)
				}).each(function(i,el){
					var $element = $(el),
						name = el.name,
						value = $element.val();

					if(elements.filter("[name='"+name+"']").length > 1 && value != ""){
						output[name] = typeof(output[name]) == "undefined" ? [] : output[name];
						output[name].push(value ? value.replace(xb, "\r\n") : value)
					}
					else if($element.attr('type') === 'hidden' && value.indexOf('data.') === 0){
						var data_names = value.split('.'),
							data = $element.data(data_names[1]),
							n = 2;
						while(data_names[n]){
							data = data[data_names[n]];
							n++;
						}
						output[name] = data;
					}
					else {
						output[name] = value || value === 0 ? value.replace(xb, "\r\n") : null;
					}
				});
				elements.filter(function() {
					var a = this.type;
					return this.name && !$(this).is(":disabled") && T.test(a) && ((this.checked && this.value != "on") || (this.value == "on" && a == "checkbox"))
				}).each(function(i,el){
					var name = el.name,
						value = el.value;

					switch(el.type){
						case 'radio':{
							output[name] = value;
							break;
						}
						case 'checkbox':{
							if(elements.filter("[name='"+name+"']").length > 1 && value != "on"){
								output[name] = typeof(output[name]) == "undefined" ? [] : output[name];
								output[name].push(value)
							}
							else if(value != "on")
								output[name] = value;
							else
								output[name] = el.checked ? true : false;
							break;
						}
					}
				});
				return output;
			}
		}
	}
});

function SubscribeButton($btn, options){
	var self = this;
	this.$btn = $btn;
	this.labels = {
		subscribe: 'Подписаться',
		unsubscribe: 'Отписаться',
		subscribed: 'Подписан'
	};
	this.icons = {
		subscribe: 'fa-plus',
		unsubscribe: 'fa-times',
		subscribed: 'fa-check'
	};
	this.colors = {
		subscribe: '-color_neutral_secondary',
		unsubscribe: '-color_secondary',
		subscribed: '-color_secondary'
	};

	if(typeof options != 'undefined'){
		this.labels = typeof options.labels != 'undefined' ? $.extend(this.labels, options.labels) : this.labels;
		this.icons = typeof options.icons != 'undefined' ? $.extend(this.icons, options.icons) : this.icons;
		this.colors = typeof options.colors != 'undefined' ? $.extend(this.colors, options.colors) : this.colors;
	}

	this.$btn.bindHoverEvents = function(){
		self.$btn
			.off('mouseenter.hoverSubscribed mouseleave.hoverSubscribed')
			.on('mouseenter.hoverSubscribed', function(){
				self.$btn.removeClass([self.icons.subscribed, self.colors.subscribed].join(' ')).addClass([self.icons.unsubscribe, self.colors.unsubscribe].join(' '));
				self.$btn.children('.Text').text(self.labels.unsubscribe);
			})
			.on('mouseleave.hoverSubscribed', function(){
				self.$btn.removeClass([self.icons.unsubscribe, self.colors.unsubscribe].join(' ')).addClass([self.icons.subscribed, self.colors.subscribed].join(' '));
				self.$btn.children('.Text').text(self.labels.subscribed);
			});
		return self.$btn;
	};

	if(this.$btn.hasClass('-Subscribed')){
		this.$btn.bindHoverEvents();
	}

	if(!this.$btn.children('span').length){
		this.$btn.wrapInner('<span class="Text">');
	}

	this.$btn.on('click.changeState', function(){
		if(self.$btn.hasClass('-Subscribed')){
			self.$btn
				.removeClass(['-Subscribed', self.colors.unsubscribe, self.colors.subscribed, self.icons.unsubscribe, self.icons.subscribed].join(' '))
				.addClass([self.colors.subscribe, self.icons.subscribe].join(' '))
				.off('mouseenter.hoverSubscribed mouseleave.hoverSubscribed')
				.children('.Text').text(self.labels.subscribe);
		} else {
			self.$btn
				.removeClass([self.colors.subscribe, self.colors.subscribed, self.icons.subscribe, self.icons.subscribed].join(' '))
				.addClass(['-Subscribed', self.colors.unsubscribe, self.icons.unsubscribe].join(' '))
				.bindHoverEvents()
				.children('.Text').text(self.labels.unsubscribe);
		}
	})
}

function handleErrorField($unit){
	if(!$unit instanceof jQuery){
		handleErrorField($($unit));
	} else if(!$unit.is('.form_unit')) {
		handleErrorField($unit.closest('.form_unit'));
	} else {
		if(!$unit.closest('form_unit').hasClass('-status_error')){
			var $input = $unit.find('input, select, textarea');
			$unit
				.toggleStatus('error')
				.off('input.clear_error change.clear_error')
				.one('input.clear_error change.clear_error', function(){
					$unit.off('input.clear_error change.clear_error').toggleStatus('error');
					$input.off('blur.clear_error');
				});
			$input
				.off('blur.clear_error')
				.one('blur.clear_error', function(){
					if($(this).val() !== ""){
						$unit.trigger('input.clear_error');
					}
				});
		}
	}
}

function bindDatePickers($parent){
	$parent = $parent ? $parent : $('body');
	$parent.find('.DatePicker').not('.-Handled_DatePicker').each(function(i, elem){
		(new DatePicker(elem, $(elem).data())).init();
	}).addClass('-Handled_DatePicker');
}

function bindTimeInput($parent){
	$parent = $parent ? $parent : $('body');
	$parent.find('.TimeInput').not('.-Handled_TimeInput').each(function(i, elem){
		initTimeInput(elem);
	}).addClass('-Handled_TimeInput');
}

function bindTabs($parent){
	$parent = $parent ? $parent : $('body');
	$parent.find('.Tabs').not('.-Handled_Tabs').each(function(i, elem){
		var $this = $(elem),
			$wrapper = $this.find('.TabsBodyWrapper'),
			$tabs = $this.find('.Tab'),
			$bodies = $this.find('.TabsBody');

		if(!$tabs.filter('.-active').length){
			$tabs.eq(0).addClass('-active');
		}
		$bodies.removeClass('-active').eq($tabs.index($tabs.filter('.-active'))).addClass('-active');
		$wrapper.height($bodies.filter('.-active').height());

		$tabs.on('click', function(){
			$tabs.removeClass('-active');
			$bodies.removeClass('-active');
			$(this).addClass('-active');
			$bodies.eq($tabs.index(this)).addClass('-active');
			$wrapper.height($bodies.filter('.-active').height());
			$this.trigger('change.tabs');
		})
	}).addClass('-Handled_Tabs');
}

function bindSelect2($parent){
	$parent = $parent ? $parent : $('body');
	$parent.find('.ToSelect2').not('.-Handled_ToSelect2').each(function(i, el){
		initSelect2($(el));
	});
}

function initSelect2($element, options){
	var opt = {
		containerCssClass: 'form_select2',
		dropdownCssClass: 'form_select2_drop'
	};
	if($element.hasClass('-Handled_ToSelect2')){
		$element.select2('destroy');
	}
	if(options){
		$.extend(true, opt, options);
	}
	$element.select2(opt).addClass('-Handled_ToSelect2')
}

function bindRippleEffect($parent){
	$parent = $parent ? $parent : $('body');
	$parent.find('.RippleEffect').not('.-Handled_RippleEffect').on('click', function(e){
		var $this = $(this), $ripple, size, x, y;

		if($this.children('.ripple').length == 0)
			$this.prepend("<span class='ripple'></span>");

		$ripple = $this.children('.ripple');
		$ripple.removeClass('animate');

		if(!$ripple.height() && !$ripple.width()) {
			size = Math.max($this.outerWidth(), $this.outerHeight());
			$ripple.css({height: size, width: size});
		}

		x = e.pageX - $this.offset().left - ($ripple.width() / 2);
		y = e.pageY - $this.offset().top - ($ripple.height() / 2);

		$ripple
			.css({top: y+'px', left: x+'px'})
			.addClass('animate')
			.one('animationend webkitAnimationEnd', function(){
				$ripple.removeClass('animate');
			});
	}).addClass('-Handled_RippleEffect');
}

function buildAvatarCollection(subscribers, count){
	var $subscribers = $();
	$subscribers = $subscribers.add(tmpl('organization-feed-event-subscriber', __USER));
	subscribers.forEach(function(subscriber){
		if(subscriber.id != __USER.id && $subscribers.length <= count){
			$subscribers = $subscribers.add(tmpl('organization-feed-event-subscriber', subscriber));
		}
	});
	return $subscribers;
}

function bindAddAvatar($parent){
	$parent = $parent ? $parent : $('body');
	$parent.find('.AddAvatar').not('.-Handled_AddAvatar').on('click', function(){
		var $wrapper = $(this).closest('.AddAvatarWrapper'),
			$collection = $wrapper.find('.AvatarsCollection'),
			$favored_count = $wrapper.find('.FavoredCount'),
			$avatars = $collection.find('.avatar'),
			amount = $avatars.length;

		if($collection.data('max_subscribers') >= amount){
			if($collection.hasClass('-subscribed')){
				$collection.removeClass('-subscribed');
				$collection.width(amount == 1 ? 0 : ($avatars.outerWidth()*(amount-1)) - (6*(amount-2)));
			} else {
				$collection.addClass('-subscribed');
				$collection.width(($avatars.outerWidth()*amount) - (6*(amount-1)));
			}
		} else {
			if($favored_count.length){
				var current_count = parseInt($favored_count.text());
				if($collection.hasClass('-subscribed')){
					$favored_count.text(current_count-1);
					if(current_count-1 <= 0){
						$favored_count.parent().addClass('-cast');
					}
				} else {
					$favored_count.text(current_count+1);
					$favored_count.parent().removeClass('-cast');
				}
			}
			$collection.toggleClass('-shift -subscribed');
		}
	}).addClass('-Handled_AddAvatar');
}

function trimAvatarsCollection($parent){
	$parent = $parent ? $parent : $('body');
	$parent.find('.AvatarsCollection').each(function(){
		var $collection = $(this),
			$avatars = $collection.find('.avatar'),
			amount = $avatars.length;
		if($collection.hasClass('-subscribed') && !$collection.hasClass('-shift')){
			$collection.width(amount == 1 ? 0 : ($avatars.outerWidth()*amount) - (6*(amount-1)));
		} else {
			$collection.width(amount == 1 ? 0 : ($avatars.outerWidth()*(amount-1)) - (6*(amount-2)));
		}
	});
}

function placeAvatarDefault($parent){
	var $avatars = $parent.find('.avatar');
	$avatars.each(function(){
		$(this).children('img').one('error', function(){
			this.src = '/app/img/logo_500.png';
		})
	});
}

function bindFileLoadButton(){
	$('.FileLoadButton').not('.-Handled_FileLoadButton').click(function(e){
		var $this = $(this);
		$this.children('input').get(0).click();
	}).addClass('-Handled_FileLoadButton');
}

function limitInputSize(){
	var $elements = $('.LimitSize').not('.-Handled_LimitSize');

	$elements.each(function(i, e) {
		var $this = $(e),
			$form_unit = $this.closest('.form_unit'),
			max = $this.data('maxlength'),
			$prompt = $this.siblings('.form_prompt');
		if(!$prompt.length){
			$this.after($('<p>').addClass('form_prompt').text($this.val().length+'/'+max));
			$prompt = $this.siblings('.form_prompt');
		} else {
			$prompt.text($this.val().length+'/'+max);
		}
		$this.on('input', function(){
			var length = $this.val().length;
			if(length > max){
				$form_unit.addClass('-status_error');
			} else if($form_unit.hasClass('-status_error')) {
				$form_unit.removeClass('-status_error');
			}
			$prompt.text($this.val().length+'/'+max);
		})
	});
	$elements.addClass('-Handled_LimitSize');
}

function initTimeInput(time_field){
	var $time_field = $(time_field),
		$hours = $time_field.find('input').eq(0),
		$minutes = $time_field.find('input').eq(1);

	function onBlur(){
		var $this = $(this);
		if($this.val() == "0" || $this.val() === ""){
			$this.val("00");
		}
		else if($this.val() <= 9){
			$this.val("0"+parseInt($this.val()));
		}
	}

	$hours.inputmask('Regex', {regex: "([01]?[0-9]|2[0-3])"}).on('keyup', function(){
		if($hours.val() > 2 || $hours.val() == "00"){
			$minutes.focus();
			$hours.trigger('blur');
		}
	}).on('blur', onBlur);
	$minutes.inputmask('Regex', {regex: "[0-5][0-9]"}).on('blur', onBlur);
	$time_field.addClass('-Handled_TimeInput');
}

function toDataUrl(url, callback){
	var xhr = new XMLHttpRequest();
	xhr.responseType = 'blob';
	xhr.onload = function() {
		var reader  = new FileReader();
		reader.onloadend = function () {
			callback(reader.result);
		};
		reader.readAsDataURL(xhr.response);
	};
	xhr.open('GET', url);
	xhr.send();
}



function showModal(name){
	var $modal = $('.'+name.capitalize()+'Modal');

	if($modal.length > 0){
		$('.modal_unit').removeClass('-active');
		$('html').addClass('-open_modal');
		$modal.addClass('-active').parent().addClass('-active');
		$('.modal_wrapper').off('mousedown').on('mousedown', function(e){
			if(!$(e.target).closest($modal).length){
				closeModal();
			}
		});
		$modal.find('.CloseModal').off('click').on('click', closeModal);
	} else {
		throw Error('Модального окна '+name+' нет');
	}

}

function closeModal(){
	$('html').removeClass('-open_modal');
	$('.modal_unit').removeClass('-active').parent().removeClass('-active').trigger('modal-close');
}

function initCrop(source, $endpoint_img, options){
	var $img = $('.Cropper').children('img'),
		$crop_button = $('.CropButton'),
		$destroy_button = $('.DestroyCropButton'),
		opt = {
			zoomable: false,
			zoomOnWheel: false/*
			minCanvasWidth: 500,
			minCanvasHeight: 500,
			minCropBoxWidth: 500,
			minCropBoxHeight: 500,
			minContainerWidth: 500,
			minContainerHeight: 500*/
		};
	options = typeof options == 'object' ? options : {};
	$.extend(opt, options);

	$img.cropper('destroy').attr('src', source).cropper(opt);
	showModal('cropper');

	$img.closest('.CropperModal').on('modal-close', function(){
		$img.cropper('destroy');
		$crop_button.off('click');
		$destroy_button.off('click');
	});

	$crop_button.off('click.Crop').one('click.Crop', function(){
		$endpoint_img.attr('src', $img.cropper('getCroppedCanvas').toDataURL()).data('crop_data', $img.cropper('getData'));
		$endpoint_img.trigger('crop-done');
		closeModal();
	});
	$destroy_button.off('click.DestroyCrop').one('click.DestroyCrop', closeModal);
}

function showNotification(text, time, status){
	var $notification = $('#notification');
	$('#notification_text').text(text);
	$notification.addClass('-show');
	if(time !== 'infinite') {
		setTimeout(function(){
			$notification.removeClass('-show');
		}, time);
	}
}