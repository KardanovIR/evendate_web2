<!-- Google MAPS -->
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCKu_xeHhtme8b1awA_rHjpfV3wVg1fZDg&libraries=places" async
        defer type="text/javascript"></script>
<!-- SOCKET.IO -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.3.6/socket.io.min.js" type="text/javascript"></script>

<?php
if($DEBUG_MODE) { ?>
	<script type="text/javascript" src="/dist/vendor.js?rev=449e064b4fbccf9667c86a956f2af60a" charset="utf-8"></script>
	<script type="text/javascript" src="/dist/app.js?rev=a05881a057fb5dee4a7cddb751f52343" charset="utf-8"></script><?php
} else { ?>
	<script type="text/javascript" src="/dist/vendor.min.js?rev=bee713fbd3cf553fdcdd5b77da7c903c" charset="utf-8"></script>
	<script type="text/javascript" src="/dist/app.min.js?rev=f730883d3e1930ae285194a01e01d36d" charset="utf-8"></script><?php
} ?>