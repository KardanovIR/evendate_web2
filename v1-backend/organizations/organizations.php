<?php

require_once $BACKEND_FULL_PATH . '/organizations/Class.OrganizationsCollection.php';
require_once $BACKEND_FULL_PATH . '/organizations/Class.Organization.php';
require_once $BACKEND_FULL_PATH . '/events/Class.EventsCollection.php';

$__modules['organizations'] = array(
	'GET' => array(
		'{{/(id:[0-9]+)}}' => function($id) use ($__db, $__request, $__user, $__fields){
			$organization = OrganizationsCollection::one(
				$__db,
				$__user,
				$id,
				$__fields);

			return new Result(true, '', array($organization->getParams($__user, App::$__FIELDS)->getData()));
		},
		'' => function () use ($__db, $__request, $__user, $__fields){
			return OrganizationsCollection::filter (
				$__db,
				$__user,
				$__request,
				$__fields,
				array('length' => App::$__LENGTH, 'offset' => App::$__OFFSET),
				array('organization_type_order', 'organization_type_id')
			);
		},
		'subscriptions' => function () use ($__db, $__request, $__user, $__fields){
			return OrganizationsCollection::filter (
				$__db,
				$__user,
				array_merge($__request, array('is_subscribed' => true)),
				$__fields,
				array('length' => App::$__LENGTH, 'offset' => App::$__OFFSET),
				array('organization_type_order', 'organization_type_id')
			);
		}
	),
	'POST' => array(
		'subscriptions' => function () use ($__db, $__request, $__user){
			$organization = OrganizationsCollection::one(
				$__db,
				$__user,
				intval($__request['organization_id']),
				App::$__FIELDS
			);
			return $organization->addSubscription($__user);
		},
	),
	'DELETE' => array(
		'{(id:[0-9]+)/subscriptions}' => function ($id) use ($__db, $__request, $__user){
			$organization = OrganizationsCollection::one($__db, $__user, $id);
			$result = $organization->deleteSubscription($__user);
			return $result;
		},
	)
);