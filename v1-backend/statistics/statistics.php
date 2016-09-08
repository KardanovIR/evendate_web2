<?php


require_once $BACKEND_FULL_PATH . '/statistics/Class.AbstractAggregator.php';
require_once $BACKEND_FULL_PATH . '/statistics/Class.OrganizationsStatistics.php';
require_once $BACKEND_FULL_PATH . '/statistics/Class.EventsStatistics.php';
require_once $BACKEND_FULL_PATH . '/statistics/Class.Statistics.php';


$__modules['statistics'] = array(
    'GET' => array(
        '{/events/(id:[0-9]+)}' => function () use ($__db, $__request) {
        },
        '{/organizations/(id:[0-9]+)}' => function ($id) use ($__db, $__request, $__user, $__fields) {
            $organization = OrganizationsCollection::one(
                $__db,
                $__user,
                $id,
                array()
            );
            $stats = new OrganizationsStatistics($__db, $organization, $__user);
            return $stats->get($__fields,
                $__request['scale'] ?? Statistics::SCALE_MONTH,
                (new DateTime())->setTimestamp($__request['since'] ?? null),
                (new DateTime())->setTimestamp($__request['till'] ?? null));
        },
    ),
    'POST' => array(
        'batch' => function () use ($__db, $__request, $__user) {
            return Statistics::storeBatch($__request['payload'], $__user, $__db);
        }
    )
);