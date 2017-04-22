/**
 * @requires ../Class.AdminPage.js
 */
/**
 * @abstract
 * @class AdminOrganizationPage
 * @extends AdminPage
 */
AdminOrganizationPage = extending(AdminPage, (function() {
	/**
	 *
	 * @param {(string|number)} org_id
	 * @constructor
	 * @constructs AdminOrganizationPage
	 */
	function AdminOrganizationPage(org_id) {
		AdminPage.apply(this);
		this.id = org_id;
		this.organization = new OneOrganization(this.id);
		this.with_header_tabs = true;
		
		this.organization_fields = new Fields();
	}
	
	AdminOrganizationPage.prototype.fetchData = function() {
		return this.fetching_data_defer = this.organization.fetchOrganization(this.organization_fields);
	};
	
	AdminOrganizationPage.prototype.renderHeaderTabs = function(){
		__APP.renderHeaderTabs([
			{title: 'Обзор', page: '/admin/organization/'+this.id+'/overview'},
			{title: 'События', page: '/admin/organization/'+this.id+'/events'},
			{title: 'Настройки', page: '/admin/organization/'+this.id+'/settings'},
			{title: 'Редактирование', page: '/admin/organization/'+this.id+'/edit'}
		]);
	};
	
	return AdminOrganizationPage;
}()));