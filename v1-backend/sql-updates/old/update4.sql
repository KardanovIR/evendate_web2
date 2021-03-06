INSERT INTO notification_types (id, type, timediff, text)
VALUES (14, 'notification-one-day-registration-close', -1, 'Остался один день до конца регистрации на {title}');

CREATE TABLE vk_groups (
  id          SERIAL PRIMARY KEY NOT NULL,
  gid         INT                NOT NULL UNIQUE,
  name        TEXT,
  screen_name VARCHAR(255),
  description TEXT,
  photo       TEXT
);


CREATE TABLE vk_users_subscriptions (
  id          SERIAL PRIMARY KEY NOT NULL,
  user_id     INT                NOT NULL,
  vk_group_id INT                NOT NULL,
  FOREIGN KEY (vk_group_id) REFERENCES vk_groups (id),
  FOREIGN KEY (user_id) REFERENCES users (id),
  UNIQUE (user_id, vk_group_id)
);

/*VIEW*/
CREATE OR REPLACE VIEW view_organizations AS
  SELECT DISTINCT
    organizations.id :: INT,
    organizations.description,
    organizations.id :: INT                                                                                      AS oid,
    organizations.images_domain || 'organizations_images/backgrounds/medium/' ||
    organizations.background_medium_img_url                                                                      AS background_medium_img_url,
    organizations.images_domain || 'organizations_images/backgrounds/small/' ||
    organizations.background_small_img_url                                                                       AS background_small_img_url,
    organizations.images_domain || 'organizations_images/logos/medium/' ||
    organizations.img_medium_url                                                                                 AS img_medium_url,
    organizations.images_domain || 'organizations_images/logos/small/' ||
    organizations.img_small_url                                                                                  AS img_small_url,
    organizations.site_url,
    organizations.name,
    organizations.type_id :: INT,
    organizations.images_domain || 'organizations_images/logos/large/' ||
    organizations.img_url                                                                                        AS img_url,
    organizations.images_domain || 'organizations_images/backgrounds/large/' ||
    organizations.background_img_url                                                                             AS background_img_url,
    TRUE                                                                                                         AS status,
    organizations.short_name,
    organization_types.name                                                                                      AS type_name,
    organizations.default_address,
    organization_types."order" :: INT                                                                            AS organization_type_order,
    organization_types."id" :: INT                                                                               AS organization_type_id,
    DATE_PART(
        'epoch',
        organizations.updated_at) :: INT                                                                         AS updated_at,
    DATE_PART(
        'epoch',
        organizations.created_at) :: INT                                                                         AS created_at,
    (
      SELECT COUNT(
                 id) :: INT AS subscribed_count
      FROM
        subscriptions
      WHERE
        subscriptions.status
        =
        TRUE
        AND
        subscriptions.organization_id
        =
        organizations.id
    )                                                                                                            AS subscribed_count,

    organizations.vk_url_path,
    organizations.facebook_url_path
  FROM organizations
    INNER JOIN organization_types ON organization_types.id = organizations.type_id AND organizations.status = TRUE
  WHERE organizations.status = TRUE;


INSERT INTO notification_types (id, type, timediff, text)
VALUES (15, 'notification-before-quarter-of-hour', 900, 'До начала события {title} осталось 15 минут');

DROP VIEW view_events CASCADE;

CREATE OR REPLACE VIEW view_events AS
  SELECT DISTINCT
    events.id :: INT,
    events.title,
    events.creator_id :: INT,
    events.description,
    events.detail_info_url,
    events.begin_time,
    events.end_time,
    events.latitude :: REAL,
    events.longitude :: REAL,
    events.location,
    events.min_price,
    events.public_at,
    events.canceled,
    vk_posts.group_id                                                                AS vk_group_id,
    vk_posts.image_path                                                              AS vk_image_path,
    vk_posts.message                                                                 AS vk_message,
    events.registration_required,
    DATE_PART('epoch', events.registration_till) :: INT                              AS registration_till,
    events.is_free,
    ((SELECT SUM(counter)
      FROM (SELECT DISTINCT
              events_dates.start_time,
              events_dates.end_time,
              1 AS counter
            FROM events_dates
            WHERE event_id = events.id AND status = TRUE) AS sb) = 1) :: BOOL
                                                                                     AS is_same_time,
    events.organization_id :: INT,
    'http://evendate.io/event.php?id=' || events.id                                  AS link,
    TRUE                                                                             AS status,
    events.images_domain || 'event_images/large/' || events.image_vertical           AS image_vertical_url,
    events.images_domain || 'event_images/large/' || events.image_horizontal         AS image_horizontal_url,
    events.images_domain || 'event_images/large/' || events.image_vertical           AS image_vertical_large_url,
    events.images_domain || 'event_images/large/' || events.image_horizontal         AS image_horizontal_large_url,

    events.images_domain || 'event_images/square/' || events.image_vertical          AS image_square_vertical_url,
    events.images_domain || 'event_images/square/' || events.image_horizontal        AS image_square_horizontal_url,

    events.images_domain || 'event_images/medium/' || events.image_horizontal        AS image_horizontal_medium_url,
    events.images_domain || 'event_images/medium/' || events.image_vertical          AS image_vertical_medium_url,

    events.images_domain || 'event_images/small/' || events.image_vertical           AS image_vertical_small_url,
    events.images_domain || 'event_images/small/' || events.image_horizontal         AS image_horizontal_small_url,
    events.images_domain || 'event_images/vk/' || vk_posts.image_path                AS vk_image_url,
    view_organizations.img_medium_url                                                AS organization_logo_medium_url,
    view_organizations.img_url                                                       AS organization_logo_large_url,
    view_organizations.img_small_url                                                 AS organization_logo_small_url,
    view_organizations.name                                                          AS organization_name,
    organization_types.name                                                          AS organization_type_name,
    view_organizations.short_name                                                    AS organization_short_name,
    (SELECT DATE_PART('epoch', MIN(events_dates.event_date)) :: INT
     FROM events_dates
     WHERE event_id = events.id AND events_dates.event_date >= NOW()::DATE AND events_dates.status =
                                                                               TRUE) AS nearest_event_date,
    (SELECT DATE_PART('epoch', MIN(events_dates.event_date)) :: INT
     FROM events_dates
     WHERE event_id = events.id AND events_dates.status = TRUE)                      AS first_event_date,
    (SELECT DATE_PART('epoch', MAX(events_dates.event_date)) :: INT
     FROM events_dates
     WHERE event_id = events.id AND events_dates.status = TRUE)                      AS last_event_date,
    DATE_PART('epoch', events.created_at) :: INT                                     AS created_at,
    DATE_PART('epoch', events.updated_at) :: INT                                     AS updated_at,
    (SELECT COUNT(id) :: INT AS favored_count
     FROM favorite_events
     WHERE status = TRUE AND event_id =
                             events.id)                                              AS favored_users_count
  FROM events
    INNER JOIN view_organizations ON view_organizations.id = events.organization_id
    INNER JOIN organization_types ON organization_types.id = view_organizations.type_id
    LEFT JOIN vk_posts ON events.id = vk_posts.event_id
  --LEFT JOIN events_tags ON events.id = events_tags.event_id
  --LEFT JOIN tags ON tags.id = events_tags.tag_id
  WHERE view_organizations.status = TRUE
        AND events.status = TRUE;


CREATE VIEW view_actions AS SELECT
                              stat_events.stat_type_id,
                              stat_events.event_id,
                              stat_event_types.name,
                              stat_event_types.entity,
                              stat_event_types.type_code,
                              tokens.user_id,
                              NULL                                                   AS organization_id,
                              DATE_PART('epoch', MAX(stat_events.created_at)) :: INT AS created_at
                            FROM stat_events
                              INNER JOIN stat_event_types ON stat_event_types.id = stat_events.stat_type_id
                              INNER JOIN tokens ON tokens.id = stat_events.token_id
                              INNER JOIN view_events ON view_events.id = stat_events.event_id
                            WHERE
                              view_events.status = TRUE
                              AND (stat_event_types.type_code = 'fave'
                                   OR stat_event_types.type_code = 'unfave')
                            GROUP BY stat_events.event_id, tokens.user_id, stat_events.stat_type_id,
                              stat_event_types.name,
                              stat_event_types.entity,
                              stat_event_types.type_code
                            UNION

                            SELECT
                              stat_organizations.stat_type_id,
                              NULL                                                          AS event_id,
                              stat_event_types.name,
                              stat_event_types.entity,
                              stat_event_types.type_code,
                              tokens.user_id,
                              stat_organizations.organization_id                            AS organization_id,
                              DATE_PART('epoch', MAX(stat_organizations.created_at)) :: INT AS created_at
                            FROM stat_organizations
                              INNER JOIN stat_event_types ON stat_event_types.id = stat_organizations.stat_type_id
                              INNER JOIN tokens ON tokens.id = stat_organizations.token_id
                              INNER JOIN view_organizations
                                ON view_organizations.id = stat_organizations.organization_id
                            WHERE (stat_event_types.type_code = 'subscribe'
                                   OR stat_event_types.type_code = 'unsubscribe')
                            GROUP BY stat_organizations.organization_id, tokens.user_id,
                              stat_organizations.stat_type_id, stat_event_types.name,
                              stat_event_types.entity,
                              stat_event_types.type_code;


CREATE VIEW view_auto_notifications AS
  SELECT DISTINCT
    events_notifications.*,
    view_events.organization_id,
    view_events.title,
    organizations.short_name,
    organizations.notification_suffix,
    view_events.image_square_vertical_url,
    view_events.image_square_horizontal_url,
    notification_types.type AS notification_type_name,
    notification_types.text AS notification_type_text
  FROM events_notifications
    INNER JOIN view_events ON events_notifications.event_id = view_events.id
    INNER JOIN notification_types ON notification_types.id = events_notifications.notification_type_id
    INNER JOIN organizations ON organizations.id = view_events.organization_id
  WHERE notification_time <= NOW() AND done = FALSE;



DROP VIEW view_notifications;

CREATE VIEW view_notifications AS
  SELECT
    users_notifications.uuid,
    users_notifications.user_id,
    users_notifications.id as user_notification_id,
    NULL                                                             AS events_notification_id,
    users_notifications.event_id,
    DATE_PART('epoch', users_notifications.notification_time) :: INT AS notification_time,
    notification_time AS notification_time_original,
    users_notifications.status,
    nt1.id                                                           AS notification_type_id,
    nt1.type                                             AS notification_type,
    users_notifications.done,
    DATE_PART('epoch', users_notifications.sent_time) :: INT         AS sent_time,
    users_notifications.created_at,
    users_notifications.updated_at
  FROM users_notifications
    INNER JOIN notification_types nt1 ON nt1.id = users_notifications.notification_type_id
  UNION
  SELECT
    NULL                                                              AS uuid,
    NULL                                                              AS user_id,
    NULL                                                              AS user_notification_id,
    events_notifications.id                                           AS events_notification_id,
    events_notifications.event_id,
    DATE_PART('epoch', events_notifications.notification_time) :: INT AS notification_time,
    notification_time AS notification_time_original,
    events_notifications.status,
    events_notifications.notification_type_id,
    nt2.type                                                          AS notification_type,
    events_notifications.done,
    NULL                                                              AS sent_time,
    events_notifications.created_at,
    events_notifications.updated_at
  FROM events_notifications
    INNER JOIN notification_types nt2 ON events_notifications.notification_type_id = nt2.id;
