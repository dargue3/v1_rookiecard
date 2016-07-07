<?php
namespace App\RC\Team;

use App;
use App\Team;
use App\User;
use Carbon\Carbon;
use App\RC\User\UserRepository;
use Illuminate\Support\Facades\Auth;


class TransformsTeamData
{

	/**
     * Format members' data for front-end consumption
     * 
     * @param  Illuminate\Support\Collection $members 
     * @param  int $team_id 
     * @return array
     */
    public function members($members, $team_id)
    {
        $userRepo = App::make(UserRepository::class);
        $memberRepo = App::make(TeamMemberRepository::class);

        $admin = $userRepo->isTeamAdmin($team_id);
        $formatted = [];

        foreach ($members as $member) {

	        $user = $userRepo->find($member->user_id) ?: [];

            if ($member->user_id == 0) {
                // mock user data for ghosts
                $user['id'] = 0;
                $user['username'] = null;
                $meta = json_decode($member->meta);
                $name = explode(' ', $meta->name);
                $user['firstname'] = $name[0];
                $user['lastname'] = $name[1];
                $user['pic'] = '/images/ghost.png';

                if (! $admin) unset($meta->email); // hide sensitive data if not an admin
                $member->meta = json_encode($meta);
            }
	        
        	$memberRepo->using($member);

	        $formatted[] = [
	        	'id'					=> $user['id'],
                'username'              => $user['username'],
                'firstname'             => $user['firstname'],     
                'lastname'              => $user['lastname'],     
                'pic'                   => $user['pic'],
		        'member_id' 			=> $member->id,
                'isCoach'               => $memberRepo->isCoach(),
                'isPlayer'              => $memberRepo->isPlayer(),
                'isFan'                 => $memberRepo->isFan(),
                'isAdmin'               => $memberRepo->isAdmin(),
                'isGhost'               => $memberRepo->isGhost(),
                'hasBeenInvited'        => $memberRepo->hasBeenInvited(),
                'hasRequestedToJoin'    => $memberRepo->hasRequestedToJoin(),
		        'meta'					=> $member->meta
	        ];
	    }

        return $formatted;
    }


    /**
     * Format the events' data for front-end consumption
     * 
     * @param  Illuminate\Support\Collection $events
     * @return array 
     */
    public function events($events)
    {
    	$formatted = [];
    	foreach ($events as $event) {
    		$formatted[] = [
    			'id'			=> $event->id,
    			'title'			=> $event->title,
    			'start'			=> $event->start,
    			'end'			=> $event->end,
    			'type'			=> $event->type,
    			'creator_id'	=> $event->creator_id,
    			'details' 		=> $event->details
    		];
    	}

    	return $formatted;
    }


    /**
     * Format the team's data for front-end consumption
     * @param  Team $team 
     * @return array       
     */
    public function team($team)
    {
        return [
            'name'          => $team->name,
            'teamname'      => $team->teamname,
            'gender'        => $team->gender,
            'long'          => $team->long,
            'lat'           => $team->lat,
            'meta'          => $team->meta,
            'pic'           => $team->pic,
            'backdrop'      => $team->backdrop,
            'creator_id'    => $team->creator_id,
            'season'        => $team->season,
        ];
    }



    /**
     * Format the news feed entries for front-end consumption
     * 
     * @param  Illuminate\Support\Collection $feed
     * @return array       
     */
    public function feed($feed)
    {
    	$formatted = [];
    	foreach ($feed as $entry) {
    		$formatted[] = [
    			'id'			=> $entry->id,
    			'type'			=> $entry->type,
    			'creator_id'	=> $entry->creator_id,
    			'meta' 			=> $entry->meta,
                'date'          => Carbon::parse($entry->created_at, 'UTC')->timestamp
    		];
    	}

    	return $formatted;
    }


    /**
     * Format the list of users associated with this team
     * 
     * @param  Illuminate\Support\Collection $users 
     * @return array        
     */
    public function users($users)
    {
        $formatted = [];

        foreach ($users as $user) {
            $formatted[] = $user->user_id;
        }

        return $formatted;
    }
}