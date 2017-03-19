CREATE OR REPLACE VIEW view_events_tickets_sold AS
  SELECT
    COUNT(tickets.id),
    ticket_orders.event_id
  FROM tickets
    INNER JOIN ticket_orders ON tickets.ticket_order_id = ticket_orders.id
    INNER JOIN ticket_types ON tickets.ticket_type_id = ticket_types.id
    INNER JOIN tickets_orders_statuses ON ticket_orders.order_status_id = tickets_orders_statuses.id
  WHERE tickets.status = TRUE
        AND tickets_orders_statuses.type_code NOT IN ('returned', 'payment_canceled_auto', 'payment_canceled_by_client')
  GROUP BY ticket_orders.event_id;

CREATE OR REPLACE VIEW view_all_events AS
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
    DATE_PART('epoch', events.public_at :: TIMESTAMPTZ) :: INT                         AS public_at,
    (events.status = FALSE AND events.public_at IS NOT
                               NULL)                                                   AS is_delayed,
    events.status,
    events.canceled,
    events.canceled                                                                    AS is_canceled,
    vk_posts.group_id                                                                  AS vk_group_id,
    vk_posts.image_path                                                                AS vk_image_path,
    vk_posts.message                                                                   AS vk_message,
    events.registration_required,
    DATE_PART('epoch', events.registration_till :: TIMESTAMPTZ) :: INT                 AS registration_till,
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
    'http://evendate.ru/event/' || events.id                                           AS link,
    events.images_domain || 'event_images/large/' || events.image_vertical             AS image_vertical_url,
    events.images_domain || 'event_images/large/' || events.image_horizontal           AS image_horizontal_url,
    events.images_domain || 'event_images/large/' || events.image_vertical             AS image_vertical_large_url,
    events.images_domain || 'event_images/large/' || events.image_horizontal           AS image_horizontal_large_url,

    events.images_domain || 'event_images/square/' || events.image_vertical            AS image_square_vertical_url,
    events.images_domain || 'event_images/square/' || events.image_horizontal          AS image_square_horizontal_url,

    events.images_domain || 'event_images/medium/' || events.image_horizontal          AS image_horizontal_medium_url,
    events.images_domain || 'event_images/medium/' || events.image_vertical            AS image_vertical_medium_url,

    events.images_domain || 'event_images/small/' || events.image_vertical             AS image_vertical_small_url,
    events.images_domain || 'event_images/small/' || events.image_horizontal           AS image_horizontal_small_url,
    events.images_domain || 'event_images/vk/' || vk_posts.image_path                  AS vk_image_url,
    view_organizations.img_medium_url                                                  AS organization_logo_medium_url,
    view_organizations.img_url                                                         AS organization_logo_large_url,
    view_organizations.img_small_url                                                   AS organization_logo_small_url,
    view_organizations.name                                                            AS organization_name,
    organization_types.name                                                            AS organization_type_name,
    view_organizations.short_name                                                      AS organization_short_name,
    (SELECT DATE_PART('epoch',
                      MIN((events_dates.event_date :: DATE || ' ' || events_dates.start_time) :: TIMESTAMPTZ)) :: INT
     FROM events_dates
     WHERE event_id = events.id AND events_dates.event_date >= NOW() :: DATE AND events_dates.status =
                                                                                 TRUE) AS nearest_event_date,
    DATE_PART('epoch', events.first_event_date) :: INT                                 AS first_event_date,
    DATE_PART('epoch', events.last_event_date) :: INT                                  AS last_event_date,
    DATE_PART('epoch', events.created_at) :: INT                                       AS created_at,
    DATE_PART('epoch', events.updated_at) :: INT                                       AS updated_at,
    (SELECT COUNT(id) :: INT AS favored_count
     FROM favorite_events
     WHERE status = TRUE AND event_id =
                             events.id)                                                AS favored_users_count,
    events.fts,
    events.registration_approvement_required,
    events.registration_limit_count,
    events.registration_locally,
    events.registered_count,
    (events.registration_locally = TRUE
     AND events.status = TRUE
     AND (events.registration_limit_count >
          COALESCE((SELECT view_events_tickets_sold.count
                    FROM view_events_tickets_sold
                    WHERE
                      view_events_tickets_sold.event_id = events.id), 0) :: INT OR
          events.registration_limit_count IS NULL)
     AND (DATE_PART('epoch', NOW()) :: INT < (DATE_PART('epoch', events.registration_till) :: INT) OR
          events.registration_till IS NULL))                                           AS registration_available,
    view_organizations.is_private                                                      AS organization_is_private,
    events.first_event_date                                                            AS first_event_date_dt,
    events.last_event_date                                                             AS last_event_date_dt,
    DATE_PART('epoch', events.registration_since :: TIMESTAMPTZ) :: INT                AS registration_since,
    events.ticketing_locally,
    events.is_online,
    view_organizations.city_id
  FROM events
    INNER JOIN view_organizations ON view_organizations.id = events.organization_id
    INNER JOIN organization_types ON organization_types.id = view_organizations.type_id
    LEFT JOIN vk_posts ON events.id = vk_posts.event_id
  WHERE view_organizations.status = TRUE;

CREATE OR REPLACE VIEW view_events AS
  SELECT *
  FROM view_all_events
  WHERE status = TRUE;


CREATE OR REPLACE VIEW view_tickets AS
  SELECT
    tickets.id,
    tickets.user_id,
    tickets.ticket_type_id,
    tickets.ticket_order_id,
    tickets.status,
    tickets.checked_out,
    tickets.uuid,
    view_all_ticket_types.uuid                                                                 AS ticket_type_uuid,
    view_tickets_orders.uuid                                                                   AS ticket_order_uuid,
    DATE_PART('epoch', tickets.created_at) :: INT                                              AS created_at,
    DATE_PART('epoch', tickets.updated_at) :: INT                                              AS updated_at,
    view_tickets_orders.event_id                                                               AS event_id,
    (view_tickets_orders.status_type_code IN
     ('returned_by_organization', 'payment_canceled_auto', 'payment_canceled_by_client', 'returned_by_user') =
     TRUE) :: BOOLEAN                                                                          AS is_canceled,
    (view_tickets_orders.status_type_code NOT IN
     ('returned_by_organization', 'payment_canceled_auto', 'payment_canceled_by_client', 'returned_by_user') =
     TRUE) :: BOOLEAN                                                                          AS is_active,
    view_all_ticket_types.type_code,
    view_all_ticket_types.price,
    RPAD(tickets.id :: TEXT || '00' || reverse((view_tickets_orders.id * 16) :: TEXT), 9, '0') AS number
  FROM tickets
    INNER JOIN view_tickets_orders ON view_tickets_orders.id = tickets.ticket_order_id
    INNER JOIN view_all_ticket_types ON view_all_ticket_types.id = tickets.ticket_type_id;


CREATE OR REPLACE VIEW view_users_names AS
  SELECT
    users.id,
    users.email,
    users.first_name,
    users.last_name,
    users.first_name || ' ' || users.last_name AS first_last_name,
    users.last_name || ' ' || users.first_name AS last_first_name
  FROM users;