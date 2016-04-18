<?php

abstract class AbstractException extends \Exception{
	private $db;
	protected $user_message;
	protected $internal_code;
	protected $http_code;
	const HTTP_CODE = 500;
	const ERROR_CODE = 10000;

	public function __construct($message, PDO $db, $user_m = ''){
		parent::__construct($message);
		$this->user_message = $user_m == '' ? $message : $user_m;
		$this->db = $db;
	}

	public function write(){
		$q_ins = App::queryFactory()->newInsert();
		$q_ins
			->cols(array(
				':' => ''
			));
		$this->db->prepare($q_ins->getStatement());
	}

	public function getUserMessage(){
		return $this->user_message;
	}

	public function setInternalCode(int $code){
		$this->internal_code = $code;
	}

	public function setHttpCode(int $code){
		$this->http_code = $code;
	}

	public function getInternalCode(){
		return $this->internal_code ?? self::ERROR_CODE;
	}

	public function getHttpCode(){
		return $this->http_code ?? self::HTTP_CODE;
	}

	public function __toString(){
		return "errorMessage: {$this->user_message} \n\r
				errorCode: {$this->getCode()}";
	}
}
