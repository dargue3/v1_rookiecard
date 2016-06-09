<?php

namespace App\Http\Requests;

use App\Http\Requests\Request;

class CreateTeamRequest extends Request
{
    
    //anyone is allowed to send one of these requests
    public function authorize()
    {
        return true;
    }


    //pick easier error message for team inputs
    public function messages() 
    {
        return [
            'name.required'     => 'Give your team a name',
            'name.max'          => 'Keep it less than 50 characters',
            'teamname.required' => 'Pick a username for your team',
            'teamname.alpha_num'=> 'Only use letters and numbers',
            'teamname.unique'   => 'Already taken, try another',
            'teamname.max'      => 'Keep it 18 characters or less',
            'teamname.not_in'   => 'Reserved name, try another',
            'slogan.max'        => 'Keep it less than 50 characters',
            'homefield.max'     => 'Keep it less than 50 characters',
            'city.required'     => "Select your team's hometown",        
            'lat.required'      => "Select your team's hometown",        
            'long.required'     => "Select your team's hometown",        
        ];
    }

    
    //define the rules applied to the inputs 
    public function rules()
    {
        return [
            'name'              => 'required|max:50',
            'teamname'          => 'required|unique:rc_teams|alpha_num|max:18|not_in:create',
            'gender'            => 'required|size:1',
            'sport'             => 'required|between:1,2',
            'slogan'            => 'max:50',
            'homefield'         => 'max:50',
            'city'              => 'required',
            'lat'               => 'required|numeric',
            'long'              => 'required|numeric',
            'userIsA'           => 'required|size:1',
            'players'           => 'required|array',
            'coaches'           => 'required|array',
            'userStats'         => 'array',
            'rcStats'           => 'array',
        ];
    }
}