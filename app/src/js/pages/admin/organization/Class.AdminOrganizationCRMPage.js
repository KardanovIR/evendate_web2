/**
 * @requires Class.AdminOrganizationPage.js
 */
/**
 *
 * @class AdminOrganizationCRMPage
 * @extends AdminOrganizationPage
 */
AdminOrganizationCRMPage = extending(AdminOrganizationPage, (function() {
	/**
	 *
	 * @param {(string|number)} org_id
	 * @constructor
	 * @constructs AdminOrganizationCRMPage
	 *
	 * @property {Fields} organization_fields
	 * @property {OrganizationSubscribersCollection} organization_subscribers
	 * @property {Fields} subscribers_fields
	 * @property {DataTable.Api} CRMTable
	 * @property {jQuery} $loader
	 */
	function AdminOrganizationCRMPage(org_id) {
		var self = this;
		
		AdminOrganizationPage.call(this, org_id);
		
		this.organization_fields = this.organization_fields.add('subscribed_count');
		this.subscribers_fields = new Fields(
			'email',
			'accounts_links',
			'interests'
		);
		this.organization_subscribers = new OrganizationSubscribersCollection(org_id);
		this.CRMTable = null;
		this.$loader = $();
		
		Object.defineProperty(this, 'page_title_obj', {
			get: function() {
				return [{
					title: 'Организации',
					page: '/admin'
				}, self.organization.short_name + ' - CRM'];
			}
		});
	}
	
	/**
	 *
	 * @enum {string}
	 */
	AdminOrganizationCRMPage.TABLE_COLUMNS = [
		'name',
		'email',
		'accounts',
		'gender',
		'country',
		'city',
		'auth_date',
		'subscription_date',
		'unsubscription_date',
		'organization_page_view',
		'event_page_view',
		'notifications_received',
		'notifications_opened',
		'notifications_hidden',
		'registrations',
		'favored',
		'shared_event',
		'average_check',
		'overall_average_check',
		'spent_on_me',
		'overall_spent',
		'friends',
		'loyalty',
		'solvency'
	];
	
	AdminOrganizationCRMPage.prototype.initCRMTable = function() {
		var self = this;
		
		this.CRMTable = this.$wrapper.find('.CRMTable').eq(0).DataTable({
			paging: true,
			select: {
				style: 'single',
				selector: 'td',
				className: '-selected',
				info: false
			},
			columnDefs: [
				{
					targets: 0,
					width: 350
				},
				{
					targets: 1,
					width: 550
				},
				{
					targets: 2,
					width: 90
				},
				{
					targets: 3,
					width: 60
				},
				{
					targets: range(24, 4),
					width: 100,
					visible: false,
					searchable: false
				}
			],
			fixedColumns: true,
			scrollX: '100%',
			scrollCollapse: true,
			dom: 't<"data_tables_pagination"p>',
			language: {
				url: __LOCALE.DATATABLES_URL
			}
		});
		
		this.$wrapper.find('.CRMTableSearch').on('input', function() {
			self.CRMTable.search(this.value).draw();
		});
	};
	/**
	 *
	 * @param {(number|AdminOrganizationCRMPage.TABLE_COLUMNS)} index
	 */
	AdminOrganizationCRMPage.prototype.toggleColumn = function(index) {
		var column = this.CRMTable.column( (+index === index) ? index : AdminOrganizationCRMPage.TABLE_COLUMNS.indexOf(index) );
		
		column.visible( ! column.visible() );
		this.CRMTable.rows().recalcHeight().columns.adjust().fixedColumns().relayout().draw();
	};
	
	AdminOrganizationCRMPage.prototype.init = function() {
		this.initCRMTable();
		bindDropdown(this.$wrapper);
	};
	
	AdminOrganizationCRMPage.prototype.render = function() {
		var self = this,
			$header_buttons = $();
		
		$header_buttons = $header_buttons.add(new DropDown('export-formats', 'Выгрузка', {
			classes: [
				__C.CLASSES.SIZES.LOW,
				__C.CLASSES.ICON_CLASS,
				__C.CLASSES.ICONS.DOWNLOAD,
				__C.CLASSES.COLORS.MARGINAL_PRIMARY,
				__C.CLASSES.HOOKS.RIPPLE,
				__C.CLASSES.HOOKS.DROPDOWN_BUTTON
			]
		}, {
			width: 'self',
			position: {
				x: 'right',
				y: 5
			}
		}, {
			xlsx_href: '/api/v1/statistics/organizations/'+this.organization.id+'/subscribers/export?format=xlsx',
			html_href: '/api/v1/statistics/organizations/'+this.organization.id+'/subscribers/export?format=html'
		}));
		
		this.$wrapper.html(tmpl('admin-organization-crm-page', {
			header_buttons: $header_buttons,
			loader: (this.$loader = __APP.BUILD.overlayLoader())
		}));
		this.$wrapper.find('.CRMTableWrapper').addClass(__C.CLASSES.STATUS.DISABLED);
		
		this.init();
		
		this.organization_subscribers.fetchAllSubscribers(this.subscribers_fields).then(function(subscribers) {
			var $rows = tmpl('admin-organization-crm-page-tr', subscribers.map(function(subscriber) {
				
				return {
					user_avatar_block: __APP.BUILD.avatarBlocks(subscriber, {
						entity: __C.ENTITIES.USER,
						avatar_classes: [__C.CLASSES.SIZES.X30, __C.CLASSES.UNIVERSAL_STATES.ROUNDED]
					}),
					email: subscriber.email,
					accounts: __APP.BUILD.socialLinks(subscriber.accounts_links),
					gender: (function(gender) {
						switch (gender) {
							case OneUser.GENDER.MALE:
								return 'М';
							case OneUser.GENDER.FEMALE:
								return 'Ж';
							default:
							case OneUser.GENDER.NEUTRAL:
								return '—';
						}
					}(subscriber.gender))
				};
			}));
			
			$rows.each(function(i) {
				$(this).data('client', subscribers[i]);
			});
			
			if (!self.CRMTable) {
				self.initCRMTable();
			}
			self.CRMTable.rows.add($rows).draw();
			try {
				self.CRMTable.rows().recalcHeight().columns.adjust().fixedColumns().relayout().draw();
			} catch (e) {
				__APP.reload();
			}
			
			self.CRMTable.on('deselect', function() {
				$('body').off('keyup.DeselectCurrent');
				AbstractAppInspector.hideCurrent();
			});
			
			self.CRMTable.on('select', function(e, dt, type, indexes) {
				var $row,
					data;
				
				if (type === 'row') {
					$row = $(dt.row(indexes).node());
					data = $row.data();
					
					if (data.inspector && data.inspector.is_shown) {
						data.inspector.hide();
						
						$('body').off('keyup.DeselectCurrent');
					} else {
						if (!(data.inspector instanceof ClientAppInspector)) {
							data.inspector = new ClientAppInspector(data.client);
							$row.data(data);
						}
						data.inspector.show();
						
						$('body').off('keyup.DeselectCurrent').on('keyup.DeselectCurrent', function(e) {
							if (isKeyPressed(e, __C.KEY_CODES.ESC)) {
								dt.row(indexes).deselect();
							}
						});
					}
				}
			});
			
			self.$wrapper.find('.CRMTableWrapper').removeClass(__C.CLASSES.STATUS.DISABLED);
			self.$loader.remove();
		});
	};
	
	return AdminOrganizationCRMPage;
}()));