/**
 * @requires Class.AbstractModal.js
 */
/**
 * @class
 * @extends AbstractModal
 */
AuthModal = extending(AbstractModal, (function() {
	
	function AuthModal() {
		if (typeof AuthModal.instance === 'object') {
			return AuthModal.instance;
		}
		AbstractModal.call(this, {
			type: 'AuthModal',
			content: tmpl('modal-auth-content', {
				heading: 'Войдите через социальную сеть, чтобы совершить это действие'
			}),
			classes: ['-size_tiny'],
			content_classes: ['-align_center']
		});
		
		this.modal.find('.AuthButton').each(function() {
			$(this).on('click', function (e) {
				var network = $(this).data('auth_network');
				yaCounter32442130.reachGoal(network.toUpperCase() + 'AuthStart');
				
				if (isNotDesktop()) {
					window.location.href = __APP.AUTH_URLS[network];
				} else {
					window.open(__APP.AUTH_URLS[network], network.toUpperCase() + '_AUTH_WINDOW', 'status=1,toolbar=0,menubar=0&height=500,width=700');
				}
				e.preventDefault();
			});
		});
		
		bindRippleEffect(this.modal);
		AuthModal.instance = this;
	}
	
	return AuthModal;
}()));