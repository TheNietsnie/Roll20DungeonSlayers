var whatev = whatev || {};

whatev.encounter = (function()
{
	return {
		combatStart: function(who)
		{
			var turnOrder = [];

			_.each(findObjs(
				{
					_subtype: "token", 
					_type: "graphic", 
					_pageid: Campaign().get("playerpageid"),
					layer: "objects"
				}), function(token)
				{
					// check if dead
					var isDead = token.get("status_dead");
					if (!isDead)
					{
						var initiative = getInitiative(token);
						if (initiative)
							turnOrder.push({id: token.get("_id"), pr: initiative});                            
					}
				}
			);
			sendChat(who, "/w " + who + " Initiatives calculated! Combat started.");
			setInitiative(turnOrder);     
			Campaign().set("initiativepage", Campaign().get("playerpageid"));
		},
		combatEnd: function(who)
		{
			setInitiative([]);
			Campaign().set("initiativepage", false);
			sendChat(who, "/w " + who + " Combat ended.");
		},
		findMobs: function()
		{
				log("Looking for mob page.");
				var mobPageId = null;
				_.each(findObjs({_type: "page", name : "Mob Page"}), function(obj)
				{
					mobPageId = obj.get("_id");
					log("Found mob page id: " + mobPageId);
				});
				
				_.each(findObjs({_subtype: "token", _pageid: mobPageId}), function(obj)
				{            
					log(obj);
					try
					{
						var gmNotes = decodeURIComponent(obj.get("gmnotes")).replace(/<\/?[^>]+>/gi, '');
						var mobData = JSON.parse(gmNotes);
						log(mobData);
					}
					catch (ex)
					{
						log("Failed to parse gm notes: " + ex);
					}
				});
		},
		endTurn: function(msg)
		{
			var currentTurnOrder = JSON.parse(Campaign().get("turnorder"));  
			var currentTurn = currentTurnOrder[0];
			if (currentTurn)
			{
				var token = getObj("graphic", currentTurn.id);
				if (token)
				{
					var character = getObj("character", token.get("_represents"));
					if (character)
					{
						var controllers = character.get("controlledby");
						if (controllers.indexOf(msg.playerid) != -1)
						{
							currentTurnOrder.splice(0, 1);
							currentTurnOrder.push(currentTurn);
							Campaign().set("turnorder", JSON.stringify(currentTurnOrder)); 
							sendChat(msg.who, "I have completed my turn."); 
						}
					}
				}
			}
		},
        ready: function(msg)
        {
            whatev.commands.register("endTurn",
            { 
                func: whatev.encounter.endTurn,
                help: "Used during combat to end player turn",
                usage: "Use !endTurn to finish your turn and move to the next member on the initiative pane."
            });            
        }
	};
})();

on("ready", function()
{
    whatev.encounter.ready();
});