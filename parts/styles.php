<link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700" rel="stylesheet">
<?php
if ($DEBUG_MODE) { ?>
	<link rel="stylesheet" href="/dist/vendor.css?rev=a063dadb46237a11b71785a55b56200e">
	<link rel="stylesheet" href="/dist/app.css?rev=6329248be42a823427626f824546d6dd"><?php
} else { ?>
	<link rel="stylesheet" href="/dist/vendor.min.css?rev=4309642f32fa44cab4400c4b952dbced">
	<link rel="stylesheet" href="/dist/app.min.css?rev=b25201acdef9ee45911d4f2e70ac4811"><?php
} ?>