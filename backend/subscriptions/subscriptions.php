<?php

require_once $ROOT_PATH.'backend/subscriptions/Class.Subscription.php';
require_once $ROOT_PATH.'backend/organizations/Class.Organization.php';
require_once $ROOT_PATH.'backend/organizations/Class.OrganizationsCollection.php';

$__modules['subscriptions'] = array(
	'GET' => array(
		'my' => function() use ($__db, $__request, $__user){
			//return $collection->
		},
		'{/(id:[0-9]+)}' => function () use ($__db, $__request, $__user){
			return $__user->createEvent($__request['payload']);
		},
		'all' => function () use ($__db, $__request, $__user) {
			$collection = new OrganizationsCollection($__db, $__user);
			if (isset($__request['with_subscriptions'])){
				$collection->setUser($__user);
				return $collection->getUserOrganizations();
			}else{
				return $collection->getAllActive();
			}
		},
		'' => function () use ($__db, $__request, $__user) {
			$collection = new OrganizationsCollection($__db, $__user);
			if (isset($__request['with_subscriptions'])){
				$collection->setUser($__user);
				return $collection->getUserOrganizations();
			}else{
				return $collection->getAllActive();
			}
		},
	),
	'POST' => array(
		'' => function () use ($__db, $__request, $__user){
			$organization = new Organization($__request['organization_id'], $__db);
			return Subscription::create($__user, $organization, $__db);
		},
	),
	'DELETE' => array(
		'{/(id:[0-9]+)}' => function ($id) use ($__db, $__request, $__user){
			$subscription = new Subscription($id, $__db);
			$result = $subscription->delete($__user);
			return $result;
		},
	)
);