<?php
namespace App\RC\Team\Roles;

use App\RC\Team\Roles\RoleInterface;

class InvitedPlayer implements RoleInterface
{
	/**
	 * The ID of this role, stored this way in rc_team_roles table
	 * 
	 * @var integer
	 */
	private $id = 7;


	/**
	 * Name of this role, stored this way in rc_team_roles table
	 * 
	 * @var string
	 */
	private $name = 'invited_player';


	/**
	 * Returns the ID of this role
	 * 
	 * @return integer
	 */
	public function id()
	{
		return $this->id;
	}



	/**
	 * Returns the name of this role
	 * 
	 * @return string
	 */
	public function name()
	{
		return $this->name;
	}
	
}