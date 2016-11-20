/**
 * @requires Class.OneUser.js
 */
/**
 *
 * @constructor - Implements singleton
 * @augments OneUser
 */
function CurrentUser() {
	if (typeof CurrentUser.instance === 'object') {
		return CurrentUser.instance;
	}
	OneUser.apply(this, ['me']);
	CurrentUser.instance = this;
}
CurrentUser.extend(OneUser);
/**
 *
 * @returns {jqXHR}
 */
CurrentUser.prototype.logout = function() {
	return __APP.SERVER.dealAjax(__APP.SERVER.AJAX_METHOD.GET, '/index.php', {logout: true}, 'application/json', function() {
		window.location = '/';
	});
};
/**
 *
 * @param {(number|string)} [organization_id]
 * @param {AJAXCallback} [success]
 * @returns {(jqXHR|null)}
 */
CurrentUser.prototype.subscribeToOrganization = function(organization_id, success) {
	var self = this;
	if (!self.subscriptions.has(organization_id)) {
		OneOrganization.fetchOrganization(organization_id, self.subscriptions_fields, function(organization) {
			self.subscriptions.push(organization[0]);
			if (success && typeof success == 'function') {
				success.call(self, organization);
			}
		});
		return OneOrganization.subscribeOrganization(organization_id);
	} else {
		console.warn('Current user is already subscribed to this organization');
		return null;
	}
};
/**
 *
 * @param {(number|string)} [organization_id]
 * @param {AJAXCallback} [success]
 * @returns {(jqXHR|null)}
 */
CurrentUser.prototype.unsubscribeFromOrganization = function(organization_id, success) {
	var self = this;
	if (self.subscriptions.has(organization_id)) {
		return OneOrganization.unsubscribeOrganization(organization_id, function() {
			self.subscriptions.remove(organization_id);
			if (success && typeof success == 'function') {
				success.call(self, organization_id);
			}
		});
	} else {
		console.warn('Current user isn`t subscribed to this organization');
		return null;
	}
};
/**
 *
 * @param {(Array|string)} [fields]
 * @param {AJAXData} [subscriptions_ajax_data]
 * @param {AJAXCallback} [success]
 * @returns {jqXHR}
 */
CurrentUser.prototype.fetchUserWithSubscriptions = function(fields, subscriptions_ajax_data, success) {
	var self = this;
	subscriptions_ajax_data = $.extend({fields: self.subscriptions_fields}, subscriptions_ajax_data, {
		offset: self.subscriptions.length
	});
	return OneUser.fetchUser(self.id, fields, function(data) {
		data = data[0];
		OrganizationsCollection.fetchSubscribedOrganizations(subscriptions_ajax_data, function(organizations) {
			data.subscriptions = organizations;
			self.setData(data);
			if (success && typeof success == 'function') {
				success.call(self, data);
			}
		});
	});
};