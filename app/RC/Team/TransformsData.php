<?php
namespace App\RC\Team;

use App\User;
use App\Team;
use Illuminate\Support\Facades\Auth;

class TransformsData
{

	/**
     * Format members' data for front-end consumption
     * 
     * @param  Collection $members 
     * @return array
     */
    public function transformMembers($members, Team $team)
    {
        $admin = Auth::user()->isTeamAdmin($team);
        $formatted = [];

        foreach ($members as $member) {
	        $user = User::find($member->user_id);
	        $user['isCoach'] = $member->isCoach();
	        $user['isPlayer'] = $member->isPlayer();
	        $user['isFan'] = $member->isFan();
	        $user['isAdmin'] = $member->isAdmin();
	        $user['hasBeenInvited'] = $member->hasBeenInvited();
	        $user['hasRequestedToJoin'] = $member->hasRequestedToJoin();
	        $user['member_id'] 	= $member->id;

	        if (! $admin) {
	            // hide some sensitive data if they're not an admin
	            $meta = json_decode($member->meta);
	            if (isset($meta->ghost)) {
	                unset($meta->ghost->email);
	                $member->meta = json_encode($meta);
	            }
	        }
	        //attach TeamMember meta data instead of User meta data
	        $user['meta'] = $member->meta;

	        $formatted[] = $user;
	    }

        return $formatted;
    }
}