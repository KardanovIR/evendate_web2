/**
 * @requires ../Class.AbstractModal.js
 */
/**
 * @class
 * @abstract
 * @extends AbstractModal
 */
AbstractListModal = extending(AbstractModal, (function() {
	/**
	 *
	 * @param {OneEntity} entity
	 * @constructor
	 * @constructs AbstractListModal
	 */
	function AbstractListModal(entity) {
		AbstractModal.call(this);
		this.content = tmpl('modal-list-content');
		this.entity = entity;
		this.entities = new EntitiesCollection();
		this.content_is_scrollable = true;
	}
	
	/**
	 *
	 * @return {AbstractListModal}
	 */
	AbstractListModal.prototype.render = function() {
		this.__render({
			width: 384,
			height: 'calc(100% - 140px)',
			classes: ['material', '-floating', '-fixed'],
			content_classes: ['list_modal_content']
		});
		
		return this;
	};
	/**
	 *
	 * @abstract
	 * @return {Promise}
	 */
	AbstractListModal.prototype.uploadEntities = function() {
		return Promise.resolve();
	};
	/**
	 *
	 * @abstract
	 * @param {EntitiesCollection} entities
	 * @return {jQuery}
	 */
	AbstractListModal.prototype.buildEntities = function(entities) {
		return $();
	};
	/**
	 *
	 * @return {AbstractListModal}
	 */
	AbstractListModal.prototype.show = function() {
		var self = this;
		
		if(this.content.children().length) {
			this.__show();
			return this;
		}
		
		this.render();
		this.content.append(this.buildEntities(this.entities));
		
		if (this.entities.length < 5) {
			this.uploadEntities().then(function() {
				self.__show();
			});
		} else {
			this.__show();
		}
		
		return this;
	};
	/**
	 *
	 * @return {AbstractListModal}
	 */
	AbstractListModal.prototype.onScrollToBottom = function(callback) {
		var self = this,
			$loader = __APP.BUILD.loaderBlock(this.content);
		
		this.uploadEntities()
			.catch(function() {
				self.block_scroll = false;
			})
			.then(function(){
				$loader.remove();
				callback.call(self);
			});
		
		return this;
	};
	
	return AbstractListModal;
}()));