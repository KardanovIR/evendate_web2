/**
 * @requires Class.AbstractAppInspector.js
 */
/**
 *
 * @class OrderAppInspector
 * @extends AbstractAppInspector
 */
OrderAppInspector = extending(AbstractAppInspector, (function() {
	/**
	 *
	 * @param {OneOrder} order
	 * @param {OneEvent} event
	 *
	 * @constructor
	 * @constructs OrderAppInspector
	 *
	 * @property {OneOrder} order
	 * @property {OneEvent} event
	 *
	 */
	function OrderAppInspector(order, event) {
		
		this.order = order;
		this.event = event;
		this.title = 'Заказ ' + formatTicketNumber(this.order.number);
		this.$content = tmpl('order-app-inspector', {
			orderer: AbstractAppInspector.build.avatarBlock(this.order.user),
			status_block: __APP.BUILD.orderStatusBlock(this.order.status_type_code),
			tickets_title: AbstractAppInspector.build.title('Билеты'),
			tickets: AbstractAppInspector.build.tickets(this.order.tickets),
			registration_form_title: AbstractAppInspector.build.title('Анкета регистрации'),
			registration_fields: AbstractAppInspector.build.registrationFields(this.order.registration_fields),
			event_title: AbstractAppInspector.build.title('Событие'),
			event: AbstractAppInspector.build.event(this.event)
		});
		
		AbstractAppInspector.call(this);
	}
	
	
	
	return OrderAppInspector;
}()));