<?php

require_once $BACKEND_FULL_PATH . '/tags/Class.TagsCollection.php';
require_once $BACKEND_FULL_PATH . '/tags/Class.Tag.php';

$__modules['tags'] = array(
	'GET' => array(
		'' => function () use ($__db, $__user, $__length, $__page, $__request) {
			if (isset($__request['event_id'])){
				$__request['event'] = EventsCollection::one($__db, $__user,
					intval($__request['event_id']), array());
			}
			return TagsCollection::filter($__db, $__request, App::$__FIELDS, array('id'));
		},
		'{{/(id:[0-9]+)}}' => function ($id) use ($__db, $__user, $__length, $__page) {
			return TagsCollection::filter($__db, array('id' => $id), App::$__FIELDS, array('id'));
		},
		'search' => function () use ($__request, $__db, $__user, $__length, $__page) {
			$__request['q'] = isset($__request['q']) ?? '';
			return TagsCollection::filter($__db, array('name' => $__request['q']), App::$__FIELDS, array('id'));
		}
	)
);