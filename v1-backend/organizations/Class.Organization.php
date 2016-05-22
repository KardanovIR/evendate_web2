<?php


require_once $BACKEND_FULL_PATH . '/bin/Class.AbstractEntity.php';

class Organization extends AbstractEntity
{


    const SUBSCRIBED_FIELD_NAME = 'subscribed';
    const EVENTS_FIELD_NAME = 'events';
    const SUBSCRIPTION_ID_FIELD_NAME = 'subscription_id';
    const IS_SUBSCRIBED_FIELD_NAME = 'is_subscribed';
    const NEW_EVENTS_COUNT_FIELD_NAME = 'new_events_count';
    const IMAGES_PATH = 'organizations_images/';
    const IMAGE_SIZE_LARGE = '/large/';
    const IMAGE_TYPE_BACKGROUND = '/backgrounds/';
    const IMAGE_TYPE_LOGO = '/logos/';
    const RANDOM_FIELD_NAME = 'random';

    
    const RATING_OVERALL = 'rating';
    const RATING_SUBSCRIBED_FRIENDS = 'rating_subscribed_friends';
    const RATING_ACTIVE_EVENTS = 'rating_active_events_count';
    const RATING_LAST_EVENTS_COUNT = 'rating_last_events_count';
    const RATING_SUBSCRIBED_IN_SOCIAL_NETWORK = 'rating_subscribed_in_social_network';
    
    protected $description;
    protected $background_medium_img_url;
    protected $background_small_img_url;
    protected $img_medium_url;
    protected $img_small_url;
    protected $site_url;
    protected $name;
    protected $type_id;
    protected $img_url;
    protected $background_img_url;
    protected $status;
    protected $short_name;
    protected $type_name;
    protected $organization_type_order;
    protected $organization_type_id;
    protected $updated_at;
    protected $created_at;
    protected $subscribed_count;
    protected $is_subscribed;


    protected $db;

    protected static $DEFAULT_COLS = array(
        'id',
        'name',
        'type_id',
        'img_url',
        'background_img_url',
        'short_name',
        'type_name',
        'organization_type_id',
        'organization_type_order'
    );
    protected static $ADDITIONAL_COLS = array(
        'description',
        'background_medium_img_url',
        'img_medium_url',
        'img_small_url',
        'site_url',
        'subscribed_count',
        'default_address',
        'created_at',
        'updated_at',
        'background_small_img_url',
        self::RANDOM_FIELD_NAME => '(SELECT created_at / (random() * 9 + 1)
			FROM view_organizations AS vo
			WHERE vo.id = view_organizations.id) AS random',
        self::IS_SUBSCRIBED_FIELD_NAME => '(SELECT
				id IS NOT NULL AS is_subscribed
				FROM subscriptions
				WHERE organization_id = view_organizations.id
					AND subscriptions.status = TRUE
					AND user_id = :user_id) IS NOT NULL AS ' . self::IS_SUBSCRIBED_FIELD_NAME,
        self::NEW_EVENTS_COUNT_FIELD_NAME => '(
		SELECT
			COUNT(view_events.id)
			FROM view_events
			WHERE
				organization_id = view_organizations.id
				AND
				view_events.last_event_date > DATE_PART(\'epoch\', NOW()) :: INT
				AND view_events.created_at > 
					(SELECT DATE_PART(\'epoch\', stat_organizations.created_at)::INT
					    FROM stat_organizations
					    INNER JOIN stat_event_types ON stat_organizations.stat_type_id = stat_event_types.id
					    INNER JOIN tokens ON stat_organizations.token_id = tokens.id
					    WHERE type_code=\'view\'
					    AND organization_id = view_organizations.id
					    AND tokens.user_id = :user_id
					    ORDER BY stat_organizations.created_at DESC LIMIT 1)
				AND
				id NOT IN
					(SELECT event_id
						FROM view_stat_events
					WHERE
						user_id = :user_id
					)
				) :: INT AS ' . self::NEW_EVENTS_COUNT_FIELD_NAME
    );

    public function __construct()
    {
        $this->db = App::DB();
    }

    /**
     * @return mixed
     */
    public function getTypeName()
    {
        return $this->type_name;
    }

    /**
     * @return mixed
     */
    public function getOrganizationTypeOrder()
    {
        return $this->organization_type_order;
    }

    /**
     * @return mixed
     */
    public function getOrganizationTypeId()
    {
        return $this->organization_type_id;
    }

    /**
     * @return mixed
     */
    public function getUpdatedAt()
    {
        return $this->updated_at;
    }

    /**
     * @return mixed
     */
    public function getCreatedAt()
    {
        return $this->created_at;
    }

    public function addSubscription(User $user)
    {
        $q_ins_sub = 'INSERT INTO subscriptions(organization_id, user_id, status)
			VALUES(:organization_id, :user_id, TRUE)
			ON CONFLICT(organization_id, user_id) DO UPDATE SET status = TRUE RETURNING id::INT;';

        $p_ins_sub = $this->db->prepare($q_ins_sub);
        $result = $p_ins_sub->execute(array(':organization_id' => $this->getId(), ':user_id' => $user->getId()));

        if ($result === FALSE)
            throw new DBQueryException('SUBSCRIPTION_QUERY_ERROR', $this->db);

        Statistics::Organization($this, $user, $this->db, Statistics::ORGANIZATION_SUBSCRIBE);

        return new Result(true, 'Подписка успешно оформлена');
    }

    public function deleteSubscription(User $user)
    {
        $q_upd_sub = 'UPDATE subscriptions
			SET status = FALSE
			WHERE user_id = :user_id
			AND organization_id = :organization_id
			RETURNING id::INT';
        $p_upd_sub = $this->db->prepare($q_upd_sub);
        $p_upd_sub->execute(array(':organization_id' => $this->getId(), ':user_id' => $user->getId()));
        Statistics::Organization($this, $user, $this->db, Statistics::ORGANIZATION_UNSUBSCRIBE);
        return new Result(true, 'Подписка успешно отменена');
    }

    /**
     * @return mixed
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @return mixed
     */
    public function getStatus()
    {
        return $this->status;
    }

    /**
     * @return mixed
     */
    public function getTypeId()
    {
        return $this->type_id;
    }

    /**
     * @return mixed
     */
    public function getImgUrl()
    {
        return $this->img_url;
    }

    /**
     * @return mixed
     */
    public function getDescription()
    {
        return $this->description;
    }

    /**
     * @return mixed
     */
    public function getShortName()
    {
        return $this->short_name;
    }

    /**
     * @return mixed
     */
    public function getBackgroundImgUrl()
    {
        return $this->background_img_url;
    }

    /**
     * @return mixed
     */
    public function getSubscribedCount()
    {
        return $this->subscribed_count;
    }

    /**
     * @return mixed
     */
    public function getSiteUrl()
    {
        return $this->site_url;
    }

    /**
     * @return mixed
     */
    public function getBackgroundMediumImgUrl()
    {
        return $this->background_medium_img_url;
    }

    /**
     * @return mixed
     */
    public function getImgMediumUrl()
    {
        return $this->img_medium_url;
    }

    /**
     * @return mixed
     */
    public function getBackgroundSmallImgUrl()
    {
        return $this->background_small_img_url;
    }

    /**
     * @return mixed
     */
    public function getImgSmallUrl()
    {
        return $this->img_small_url;
    }

    public function getParams(User $user = null, array $fields = null) : Result
    {
        $result_data = parent::getParams($user, $fields)->getData();

        if (isset($fields[Organization::SUBSCRIBED_FIELD_NAME])) {
            $users_pagination = $fields[Organization::SUBSCRIBED_FIELD_NAME];
            $result_data[Organization::SUBSCRIBED_FIELD_NAME] = $this->getSubscribed(
                $this->db,
                $user,
                Fields::parseFields($users_pagination['fields'] ?? ''),
                Fields::parseFilters($users_pagination['filters'] ?? ''),
                Fields::parseOrderBy($users_pagination['order_by'] ?? ''),
                $users_pagination['pagination'] ??
                array(
                    'length' => $users_pagination['length'] ?? App::DEFAULT_LENGTH,
                    'offset' => $users_pagination['offset'] ?? App::DEFAULT_OFFSET
                ));
        }

        $events_field = $fields[Organization::EVENTS_FIELD_NAME] ?? null;
        if (is_array($events_field)) {
            $result_data[Organization::EVENTS_FIELD_NAME] = $this->getEvents(
                Fields::parseFields($events_field['fields'] ?? ''),
                Fields::parseFilters($events_field['filters'] ?? ''),
                Fields::parseOrderBy($events_field['order_by'] ?? ''),
                array(
                    'length' => $events_field['length'] ?? App::DEFAULT_LENGTH,
                    'offset' => $events_field['offset'] ?? App::DEFAULT_OFFSET
                )
            );
        }

        return new Result(true, '', $result_data);
    }

    private function getSubscribed(PDO $db, User $user, array $fields = null, array $filters, array $order_by = null, array $pagination = null)
    {
        $filters['organization'] = $this;
        return UsersCollection::filter(
            $db,
            $user,
            $filters,
            $fields,
            $pagination,
            $order_by ?? array('last_name', 'first_name')
        )->getData();

    }

    private function getEvents(array $fields = null, array $filters, array $order_by = null, array $pagination = null)
    {
        $filters['organization'] = $this;
        return EventsCollection::filter(
            $this->db,
            App::getCurrentUser(),
            $filters,
            $fields,
            $pagination,
            $order_by ?? array('id')
        )->getData();
    }

    private function isSubscribed(User $user)
    {
        $q_get_subscribed = App::queryFactory()->newSelect();
        $q_get_subscribed
            ->cols(array('id::INT'))
            ->from('subscriptions')
            ->where('subscriptions.user_id = :user_id')
            ->where('subscriptions.organization_id = :organization_id')
            ->where('subscriptions.status = TRUE');
        $p_get_subscribed = $this->db->prepare($q_get_subscribed->getStatement());

        $result = $p_get_subscribed->execute(array(
            ':user_id' => $user->getId(),
            ':organization_id' => $this->getId()
        ));

        if ($result === FALSE) throw new DBQueryException('CANT_GET_SUBSCRIBE_STATUS', $this->db);

        $result = array(
            'is_subscribed' => $p_get_subscribed->rowCount() == 1,
            'subscription_id' => $p_get_subscribed->rowCount() == 1 ? $p_get_subscribed->fetchColumn(0) : null
        );

        return $result;
    }

    public function update(User $user, array $data)
    {

        if ($user->getEditorInstance()->isAdmin($this) == false) throw new PrivilegesException('NOT_ADMIN', $this->db);
        $q_upd_organization = App::queryFactory()->newUpdate();

        $q_upd_organization->table('organizations');

        if (isset($data['name'])) {
            if (mb_strlen($data['name']) <= 3) throw new InvalidArgumentException('Слишком короткое название. Должно быть не менее 3 символов.');
            if (mb_strlen($data['name']) > 150) throw new InvalidArgumentException('Слишком длинное название. Должно быть не более 150 символов.');
            $q_upd_organization->cols(
                array('name' => trim($data['name']))
            );
        }

        if (isset($data['short_name'])) {
            if (mb_strlen($data['short_name']) <= 3) throw new InvalidArgumentException('Слишком короткое сокращение. Должно быть не менее 3 символов.');
            if (mb_strlen($data['short_name']) > 15) throw new InvalidArgumentException('Слишком длинное сокращение. Должно быть не более 15 символов.');
            $q_upd_organization->cols(array('short_name' => trim($data['short_name'])));
        }

        if (isset($data['site_url'])) {
            if (filter_var($data['site_url'], FILTER_VALIDATE_URL) === FALSE) {
                $data['site_url'] = null;
            } else {
                $data['site_url'] = trim($data['site_url']);
            }
            $q_upd_organization->cols(array('site_url' => $data['site_url']));
        }


        if (isset($data['description'])) {
            if (mb_strlen($data['description']) <= 50) throw new InvalidArgumentException('Слишком короткое описание. Должно быть не менее 50 символов.');
            if (mb_strlen($data['description']) > 250) throw new InvalidArgumentException('Слишком длинное описание. Должно быть не более 250 символов.');
            $q_upd_organization->cols(
                array('description' => trim($data['description']))
            );
        }

        if (isset($data['default_address'])) {
            $q_upd_organization->cols(
                array('default_address' => trim($data['default_address']))
            );
        }

        if (isset($data['notification_suffix'])) {
            $q_upd_organization->cols(
                array('notification_suffix' => trim($data['notification_suffix']))
            );
        }

        if (isset($data['vk_url_path'])) {
            $q_upd_organization->cols(
                array('vk_url_path' => trim($data['vk_url_path']))
            );
        }

        if (isset($data['facebook_url_path'])) {
            $q_upd_organization->cols(
                array('facebook_url_path' => trim($data['facebook_url_path']))
            );
        }

        if (isset($data['background'])
            && !empty($data['background'])
            && $data['background'] != null
            && $data['background_filename'] != null
            && isset($data['background_filename'])
            && !empty($data['background_filename'])
        ) {
            $background_filename = md5(App::generateRandomString() . '-background') . '.' . App::getImageExtension($data['background_filename']);
            $background_path = self::IMAGES_PATH . self::IMAGE_TYPE_BACKGROUND . $background_filename;
            $q_upd_organization->cols(array('background_img_url' => $background_path));
            App::saveImage($data['background'], $background_path, 14000);
        }

        if (isset($data['logo'])
            && !empty($data['logo'])
            && $data['logo'] != null
            && $data['logo_filename'] != null
            && isset($data['logo_filename'])
            && !empty($data['logo_filename'])
        ) {
            $logo_filename = md5(App::generateRandomString() . '-logo') . '.' . App::getImageExtension($data['logo_filename']);
            $logo_path = self::IMAGES_PATH . self::IMAGE_TYPE_LOGO . $logo_filename;
            $q_upd_organization->cols(array('img_url' => $logo_path));
            App::saveImage($data['logo'], $logo_path, 14000);
        }

        $q_upd_organization
            ->where('id = ?', $this->id);

        $p_upd_organization = $this->db->prepare($q_upd_organization->getStatement());

        $result = $p_upd_organization->execute($q_upd_organization->getBindValues());

        if ($result === FALSE) throw new DBQueryException('CANT_UPDATE_ORGANIZATION', $this->db);
        return new Result(true, '', array('organization_id' => $this->getId()));
    }

}