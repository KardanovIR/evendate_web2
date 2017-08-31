<aside id="main_sidebar" class="-unselectable">
	<a href="/" class="brand_block link Link">
		<svg width="135px" height="24.70001px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 135 24.70001">
			<path id="evendate_logo_text" transform="translate(-2.375 -0.69998)" fill="#9fa6b3"
			      d="M18.675,16.4c0-5.3-3-8.5-8.1-8.5a8.42015,8.42015,0,0,0-8.2,8.7,8.38058,8.38058,0,0,0,8.5,8.8,7.55515,7.55515,0,0,0,7.5-5.2l-3.7-1.2a3.57051,3.57051,0,0,1-3.7,2.5,3.98288,3.98288,0,0,1-4.1-3.7h11.7A13.80487,13.80487,0,0,0,18.675,16.4Zm-11.8-1.6a3.55717,3.55717,0,0,1,3.7-3.2,3.363,3.363,0,0,1,3.7,3.2h-7.4Zm24.3-6.3-3.9,11-4.1-11h-4.9l6.7,16.4h4.4l6.5-16.4h-4.7Zm20.6,7.9c0-5.3-3-8.5-8.1-8.5a8.25038,8.25038,0,0,0-8.1,8.6,8.38058,8.38058,0,0,0,8.5,8.8,7.55522,7.55522,0,0,0,7.5-5.2l-3.8-1.1a3.57051,3.57051,0,0,1-3.7,2.5,3.98293,3.98293,0,0,1-4.1-3.7h11.7A13.79661,13.79661,0,0,0,51.775,16.4Zm-11.7-1.6a3.55712,3.55712,0,0,1,3.7-3.2,3.36289,3.36289,0,0,1,3.7,3.2h-7.4ZM62.975,8a5.385,5.385,0,0,0-4.7,2.5v-2h-4.3V24.9h4.4V15.4c0-1.9,1.1-3.4,3.1-3.4,2.1,0,3,1.4,3,3.3v9.6h4.4V14.5C68.875,10.9,66.975,8,62.975,8Zm24.8,13.9V0.7h-4.4v9.4c-0.5-.9-1.8-2-4.6-2-4.6,0-7.9,3.8-7.9,8.6,0,5,3.3,8.6,8,8.6a5.101,5.101,0,0,0,4.6-2.3,7.75394,7.75394,0,0,0,.2,1.9h4.2A26.28237,26.28237,0,0,1,87.775,21.9Zm-8.3-.6c-2.4,0-4.1-1.8-4.1-4.7s1.8-4.6,4.1-4.6,4,1.6,4,4.6S81.675,21.3,79.475,21.3Zm25.2,1V14.2c0-3.3-1.9-6.2-7.1-6.2-4.4,0-6.8,2.8-7,5.4l3.9,0.8a2.92541,2.92541,0,0,1,3.1-2.7c1.9,0,2.8,1,2.8,2.1a1.19858,1.19858,0,0,1-1.2,1.2l-4,.6c-2.8.4-5,2-5,5,0,2.6,2.1,4.9,5.6,4.9a5.40058,5.40058,0,0,0,4.8-2.4,12.30577,12.30577,0,0,0,.2,2h4.1A18.36784,18.36784,0,0,1,104.675,22.3Zm-4.3-4.2c0,3-1.8,3.9-3.6,3.9a1.89565,1.89565,0,0,1-2.1-1.9,2.094,2.094,0,0,1,2-2.1l3.7-.6v0.7Zm16.3-5.8V8.5h-3.3V3.6h-4.1V5.9a2.33883,2.33883,0,0,1-2.5,2.6h-0.8v3.9h3V20c0,3.2,2,5.1,5.2,5.1a5.9567,5.9567,0,0,0,2.5-.4V21a4.92317,4.92317,0,0,1-1.4.1,1.61828,1.61828,0,0,1-1.9-1.9V12.3h3.3Zm17.2,4.1a10.91279,10.91279,0,0,0-.47-3.3h-0.03a5.49026,5.49026,0,0,1-5.47-4.98,9.60458,9.60458,0,0,0-2.13-.22,8.25043,8.25043,0,0,0-8.1,8.6,8.38058,8.38058,0,0,0,8.5,8.8,7.55517,7.55517,0,0,0,7.5-5.2l-3.8-1.1a3.57051,3.57051,0,0,1-3.7,2.5,3.98284,3.98284,0,0,1-4.1-3.7h11.7A13.80487,13.80487,0,0,0,133.875,16.4Zm-11.7-1.6a3.55721,3.55721,0,0,1,3.7-3.2,3.363,3.363,0,0,1,3.7,3.2h-7.4Z"></path>
			<circle id="evendate_logo_dot" cx="131" cy="6.90002" r="4" fill="#f82969"></circle>
		</svg>
		<img class="brand" src="/app/img/brand.png?v=f7ff6c58ee76c1a3a7ed091510e9e288">
	</a>

	<div class="sidebar_main_wrapper scrollbar-outer SidebarScroll">
		<nav class="sidebar_navigation SidebarNav"><?php
			if ($is_user_editor) { ?>
				<a href="/admin" class="sidebar_navigation_item SidebarNavItem link Link"><span>Администрирование</span></a>
				<a href="/add/event" class="sidebar_navigation_item SidebarNavItem link Link"><span>Создать событие</span></a><?php
			} ?>
			<a href="/feed" class="sidebar_navigation_item SidebarNavItem link Link"><span>События</span><span
					class="counter sidebar_navigation_counter -hidden SidebarNavFeedCounter"></span></a>
			<a href="/organizations"
			   class="sidebar_navigation_item SidebarNavItem link Link"><span>Организаторы</span></a><?php
			if (!$is_user_not_auth) { ?>
				<a href="/my/profile" class="sidebar_navigation_item SidebarNavItem link Link"><span>Мой профиль</span></a>
				<a href="/my/tickets" class="sidebar_navigation_item SidebarNavItem link Link"><span>Мои билеты</span></a>
				<a href="/my/orders" class="sidebar_navigation_item SidebarNavItem link Link"><span>Мои заказы</span></a><?php
			} ?>
		</nav>
		<hr class="sidebar_divider">
		<div class="sidebar_organizations_wrapper scrollbar-outer SidebarOrganizationsScroll"><?php
			if (!$is_user_not_auth) { ?>
				<div class="sidebar_wrapper">
					<span class="sidebar_section_heading">Подписки</span>
					<div class="sidebar_organizations_list SidebarOrganizationsList"></div>
				</div><?php
			} ?>
		</div>
		<footer class="sidebar_footer">
			<div class="sidebar_download_app_buttons">
				<p>Скачайте наши приложения</p>
				<a href="https://itunes.apple.com/us/app/evendate/id1044975200?mt=8" class="button -color_default fa_icon fa-apple" target="_blank">iOS</a>
				<a href="https://play.google.com/store/apps/details?id=ru.evendate.android" class="button -color_default fa_icon fa-android" target="_blank">Android</a>
			</div>
			<div class="sidebar_links">
				<a href="/landing.php" class="link">О нас</a>
				<a href="//evendate.io/blog" class="link">Наш блог</a>
				<a href="/organization.php" class="link">Стать организатором</a>
				<a href="//evendate.io/docs/terms.pdf" class="link">Условия пользования</a>
				<a href="//evendate.io/docs/useragreement.pdf" class="link">Пользовательское соглашение</a>
			</div>
			<p>Evendate 2015-<?= (new DateTimeImmutable())->format('Y'); ?></p>
		</footer>
	</div>
</aside>