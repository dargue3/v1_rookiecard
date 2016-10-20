import StatHelpers from '../../mixins/StatHelpers.js'

export default
{
	mixins: [ StatHelpers ],

	data()
	{
		return {
			totalStats: [],
			avgStats: [],
			neverSum: ['name', 'abbrName', 'firstname'], 	// never sum these keys in season stats
			neverAvg: ['name', 'abbrName', 'firstname', 	// never average these keys in season stats
								'wins', 'losses', 'ties', 'gp', 'gs'], 	
		}
	},

	watch:
	{
		/**
		 * Whether to view the totals for a season or an average
		 */
		total(val)
		{
			if (val) {
				this.done(this.totalStats);
			}
			else {
				this.done(this.avgStats);
			}
		},


		/**
		 * Acts as a signal from Stats.vue to compile these stats
		 */
		compile(val)
		{
			if (val) {
				this.setup();

				// depending on the type of stats, call the respective function to compile them
				// e.g. this.teamSeasonStats()
				this[`${this.type}Stats`].call(this);
			}
		},
	},

	computed:
	{
		/**
		 * Filter all the stats down to ones that just belong to players
		 */
		playerStats()
		{
			return this.rawStats;
		},
	},


	methods:
	{
		/**
		 * Setup a few variables before compiling any stats
		 * These are used in Stats.vue for displaying correct values
		 */
		setup()
		{
			// only use the keys appropriate for this type
			this.keys = this.keys.filter(key => this.$get(`${this.type}.dontShow`).indexOf(key) === -1)

			this.defaultSortKey();

			this.keys.forEach(key => {
				this.keyNames[key] = this.lookupKeyNames(key);
				this.tooltips[key] = this.lookupTooltips(key);
				this.valLookup[key] = this.lookupValues(key);
				this.valClassLookup[key] = this.lookupValClasses(key);
				this.keyClassLookup[key] = this.lookupKeyClasses(key);
			});
		},


		/**
		 * Done building stats, tell Stats.vue data is ready
		 *
		 * @param {array} stats  Compiled stats
		 */
		done(stats)
		{
			if (! Array.isArray(stats)) stats = [stats];

			if (! stats.length) {
				stats = [this.markEmpty()];
			}

			this.$dispatch('Stats_compiled', stats);
		},


		/**
		 * Fill each stat with null if there are no stats for this entry
		 *
		 * @param {object} merge  Will merge this object with the empty object before returning
		 * @return {object} 			The stats object filled with all the keys pointing to null
		 */
		markEmpty(merge = {})
		{
			var stats = {};
			this.keys.forEach(function(key) {
				stats[key] = null;
			});

			for (var key in merge) {
				stats[key] = merge[key];
			}

			return stats;
		},


		/**
		 * Compile the team's stats down into an array of recent games' stats
		 */
		teamRecentStats()
		{
			let recentStats = [];

			// database just stores player stats, compile those down into raw team stats
			if (! this.rawTeamStats.length) {
				this.createRawTeamStats();
			}

			for (let x = 0; x < this.rawTeamStats.length; x++) {
				let stats = this.addTheDateAndEvent(this.rawTeamStats[x]);

				// located in a sport's Vue component
				stats = this.editEachTeamRecentStats(stats);

				recentStats.push(stats);
			}
			
			this.done(recentStats);
		},


		/**
		 * Compile the team's stats down into a single entry of totals/averages
		 */
		teamSeasonStats()
		{
			let seasonTotals = {};
			for (let stat in this.rawTeamStats) {
				seasonTotals = this.sumCommonStats(this.rawTeamStats[stat], seasonTotals);
				seasonTotals = this.editTeamStatsBeforeAddingThemToSeasonTotals(this.rawTeamStats[stat], seasonTotals);
			}



			// located in a sport's Vue component
			this.totalStats = this.editTeamSeasonTotals(seasonTotals);

			this.avgStats = this.editTeamSeasonAverages(this.perGame(this.totalStats));

			this.done(this.avgStats);
		},


		/**
		 * Calculate each player's season stats to date
		 */
		playerSeasonStats()
		{
			let teamTotals = [];
			let teamAvg = [];
			
			for (let player in this.players) {
				
				let { playerTotals, stats } = this.createPlayerStats(this.players[player]);

				if (! stats.length) {
					teamTotals.push(this.markEmpty(playerTotals));
					teamAvg.push(this.markEmpty(playerTotals));
					continue;
				}

				for (let stat in stats) {
					playerTotals = this.sumCommonStats(stats[stat], playerTotals);
					playerTotals = this.editPlayersStatsBeforeAddingThemToTheirSeasonTotals(stats[stat], playerTotals);
				}

				teamTotals.push(this.editPlayerSeasonTotals(playerTotals));

				teamAvg.push(this.editPlayerSeasonAverages(this.perGame(playerTotals)));
			}

			this.totalStats = teamTotals;
			this.avgStats = teamAvg;
			
			this.done(this.avgStats);
		},


		createPlayerStats(player)
		{
			let playerTotals = {
				name: 			player.lastname,
				firstname: 	player.firstname,
				abbrName: 	player.abbrName,
				member_id: 	player.member_id,
			};

			let stats = this.playerStats.filter(stat => stat.member_id === player.member_id);

			return { playerTotals, stats }
		},


		/**
		 * Compiles an object of lifetime totals into averages based on the number of games played
		 *
		 * @param {object} stats  	Lifetime totals
		 */
		perGame(stats)
		{
			let averaged = {};
			let ignore = this.neverAvg.concat(this.$get(`${this.type}.dontAvg`));
			for (var key in stats) {
				if (ignore.indexOf(key) !== -1) {
					averaged[key] = stats[key];
					continue;
				}

				averaged[key] = stats[key] / stats.gp;
			}

			return averaged;
		},


		/**
		 * Add the given stats to the season totals object, possibly ignoring some keys
		 *
		 * @param {object} data   			The stat object as given from the server
		 * @param {object} statTotals 	The current stat totals object
		 */
		sumCommonStats(data, statTotals)
		{
			let stats = JSON.parse(data.stats);
			let meta = JSON.parse(data.meta);

			let ignore = this.neverSum.concat(this.$get(`${this.type}.dontSum`));

			// add a game to the total
			stats.gp = 1;

			stats.wins = 0;
			stats.losses = 0;
			stats.ties = 0;
			// add a win, loss, or tie to the total depending on the outcome
			if (this.whoWon(data) === 0) stats.losses = 1;
			if (this.whoWon(data) === 1) stats.wins = 1;
			if (this.whoWon(data) === 2) stats.ties = 1;

			// for each key in stats, add it to the total
			for (var key in stats) {
				if (ignore.indexOf(key) !== -1) {
					continue;
				}
				if (typeof statTotals[key] === 'undefined') {
					statTotals[key] = stats[key];
				}
				else {
					statTotals[key] += stats[key];
				}
			}

			return statTotals;
		},


		/**
		 * Sort out the sport-agnostic recent team stats
		 *
		 * @param {object} data  	Not-compiled-yet stats data
		 * @return {object} 		Stats data with date added in
		 */
		addTheDateAndEvent(data)
		{
			let meta = JSON.parse(data.meta);
			let stats = JSON.parse(data.stats);

			// format date to unix time for sorting efficiency, converts to 'M/D' later in Stats.vue
			let date = moment.utc(meta.event.start * 1000).local().unix();

			stats.date = date;
			stats.id = data.id;
			stats.event_id = data.event_id;

			// if they included who this game was against
			if (meta.event.type === 'home_game') {
				// home game
				stats.opp = meta.opp + '***';
			}
			else if (meta.event.type === 'away_game') {
				// away game
				stats.opp = meta.opp + '^^^';
			}
			else {
				// unspecified
				stats.opp = meta.opp;
			}

			stats.win = this.whoWon(data);

			return stats;
		},


		/**
		 * Return whether or not the team is using this key or not
		 *
		 * @param {string} key
		 * @return {boolean} 
		 */
		usingKey(key)
		{
			return this.keys.indexOf(key) !== -1
		},


	}, // end methods


}