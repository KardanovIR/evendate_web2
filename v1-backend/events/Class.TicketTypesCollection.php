<?php

class TicketTypesCollection extends AbstractCollection
{
	public static function filter(ExtendedPDO $db,
																AbstractUser $user = null,
																array $filters = null,
																array $fields = null,
																array $pagination = null,
																array $order_by = array('price'))
	{

		$q_get = App::queryFactory()->newSelect();
		$statements = array();
		$is_one_type = false;
		$check_status = true;

		$additional_cols = TicketType::getAdditionalCols();

		//For administrators there are additional fields

		$from_table = 'view_ticket_types';
		if (isset($filters['event']) && $user instanceof User) {
			if ($filters['event'] instanceof Event) {
				if ($user->isAdmin($filters['event']->getOrganization())) {
					$additional_cols = array_merge(TicketType::getAdditionalCols(), TicketType::$FIELDS_FOR_ADMINISTRATOR);
					$from_table = 'view_all_ticket_types';
				}
			}
		}
		if (isset($filters['ticket']) && $user instanceof User) {
			if ($filters['ticket'] instanceof Ticket) {
				$from_table = 'view_all_ticket_types';
				$check_status = false;
			}
		}

		$cols = Fields::mergeFields($additional_cols, $fields, TicketType::getDefaultCols());


		if (isset($pagination['offset'])) {
			$q_get->offset($pagination['offset']);
		}

		if (isset($pagination['length'])) {
			$q_get->limit($pagination['length']);
		}

		foreach ($filters as $name => $value) {
			switch ($name) {
				case 'uuid': {
					$q_get->where('uuid = :uuid');
					$statements[':uuid'] = $value;
					$is_one_type = true;
					break;
				}
				case 'event': {
					if ($value instanceof Event) {
						$q_get->where('event_id = :event_id');
						$statements[':event_id'] = $value->getId();
					}
					break;
				}
				case 'is_selling': {
					$q_get->where('is_selling = :is_selling');
					$statements[':is_selling'] = filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false';
					break;
				}
				case 'ticket': {
					if ($value instanceof Ticket) {
						$q_get->where('uuid = :uuid');
						$statements[':uuid'] = $value->getTicketTypeUuid();
						$from_table = 'view_all_ticket_types';
					}
					break;
				}
			}
		}

		$q_get->distinct()
			->from($from_table)
			->cols($cols)
			->orderBy($order_by);

		if ($from_table == 'view_all_ticket_types' && $check_status) {
			$q_get->where('status = true');
		}

		$p_get_types = $db->prepareExecute($q_get, '', $statements)->fetchAll(PDO::FETCH_CLASS, 'TicketType');
		$types = $p_get_types;
		if (count($types) == 0 && $is_one_type) throw new LogicException('CANT_FIND_TYPE');
		if ($is_one_type) return $types[0];
		$result = array();
		foreach ($types as $type) {
			$result[] = $type->getParams($user, $fields)->getData();
		}
		return new Result(true, '', $result);
	}


	public static function oneByUUID(ExtendedPDO $db,
																	 AbstractUser $user,
																	 string $uuid,
																	 array $fields = null): TicketType
	{
		return self::filter($db, $user, array('uuid' => $uuid), $fields);
	}

	public static function disableAll(ExtendedPDO $db, $event_id)
	{
		$q_upd_all = App::queryFactory()->newUpdate();
		$q_upd_all->table('ticket_types')
			->cols(array('status' => 'false'))
			->where('event_id = ?', $event_id);
		$db->prepareExecute($q_upd_all, 'CANT_UPDATE_TICKET_TYPES');
	}

}