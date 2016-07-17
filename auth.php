<?php


require_once 'v1-backend/bin/db.php';
require_once 'v1-backend/bin/Class.Result.php';

if (isset($_REQUEST['action']) && $_REQUEST['action'] == 'get_urls'){
	if (isset($_REQUEST['mobile']) && $_REQUEST['mobile'] == 'true'){
		$type = 'mobile';
	}else{
		$type = 'popup';
	}
	echo App::getAuthURLs($type);
	exit();
}

try{
	if (!isset($_REQUEST['user_id']) || trim($_REQUEST['user_id']) == '' ||
		!isset($_REQUEST['token']) || trim($_REQUEST['token']) == ''){
		throw new InvalidArgumentException('Пользователь с указанными данными не существует');
	}


	$q_get_user = 'SELECT users.id as user_id, users.token, users.email
				FROM users
				WHERE users.id = :user_id
					AND users.token = :token';
	$p_get_user = $__db->prepare($q_get_user);
	$p_get_user->execute(array(
		':user_id' => $_REQUEST['user_id'],
		':token' => $_REQUEST['token']
	));

	if (!isset($p_get_user) || $p_get_user === FALSE) throw new DBQueryException(null, $__db);
	if ($p_get_user->rowCount() != 1) throw new LogicException('Пользователь с такими данными не найден');



	if ($row_user_info = $p_get_user->fetch()){
		$_SESSION['email'] = $row_user_info['email'];
		$_SESSION['id'] = $row_user_info['user_id'];
		$_SESSION['token'] = $row_user_info['token'];
		echo new Result(true, 'Данные успешно получены');
	}else{
		echo new Result(false, 'Пользователь с такими данными не найден');
	}
}catch(Exception $e){
	header("Content-Type: application/json");
	echo json_encode(array('status' => false, 'text' => $e->getMessage()));
}