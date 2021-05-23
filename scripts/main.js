// Forgive me for all of the ugly tricks I've had to use to shorten the number of lines this has. I could just minify, but this at least allows me to somewhat read my code.
import {Enemy, Jumper, enemies, obstacles, paths} from "./utility.js";
runOnStartup(async runtime => runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime)));
async function OnBeforeProjectStart(runtime)
{
	runtime.objects.PathObj.getAllInstances().forEach(function(p){
		var enemyName = p.instVars.EnemyName; // Okay, arrays probably weren't meant to be constructed this way.
		if (enemyName in paths) paths[enemyName][p.instVars.Position] = [p.x, p.y];
		else {
			paths[enemyName] = [];paths[enemyName][p.instVars.Position] = [p.x, p.y];
		}
	});
	runtime.objects.Enemy.getAllInstances().forEach(function(e){
		var enemyClass = Enemy;
		switch(e.instVars.EnemyType){
			case "Jumper": enemyClass = Jumper; break;
		}
		var enemy = new enemyClass(e.instVars.EnemyName, e); enemy.initializePathing();
		enemies.push(enemy);
	});
	var inv = runtime.objects.Inventory.getFirstInstance().instVars; var invActual = runtime.objects.Inventory.getFirstInstance().getDataMap(); var invCost = runtime.objects.InventoryCost.getFirstInstance(); runtime.globalVars.SelectedName = Object.keys(inv)[0];
	runtime.objects.Shop_text.getFirstInstance().text = "Trap: " + Object.keys(inv)[0] + ". Count: " + inv[Object.keys(inv)[0]] + ".";
	Object.keys(inv).forEach((trapName)=> {invActual.set(trapName, inv[trapName]); runtime.globalVars[trapName + "Placed"] = 0; invCost.getDataMap().set(trapName, invCost.instVars[trapName]);});
	runtime.addEventListener("tick", () => Tick(runtime));
}

function Tick(runtime){
	var inv = runtime.objects.Inventory.getFirstInstance().getDataMap(); var invTemp = runtime.objects.Inventory.getFirstInstance().instVars;
	for (var i = 0; i < Object.keys(invTemp).length; i++){
		if (runtime.keyboard.isKeyDown("Digit" + (i + 1)) || runtime.keyboard.isKeyDown("Numpad" + (i + 1))) {
			runtime.globalVars.SelectedName = Object.keys(invTemp)[i]; runtime.globalVars.Selected = i;
			runtime.objects.Shop_text.getFirstInstance().text = "Trap: " + runtime.globalVars.SelectedName + ". Count: " + inv.get(runtime.globalVars.SelectedName) + "."; runtime.objects.Shop.getFirstInstance().setAnimation(runtime.globalVars.SelectedName);
		}
	}
	if (runtime.keyboard.isKeyDown("Space") && inv.get(runtime.globalVars.SelectedName) > 0) {
		var trap = runtime.objects[Object.keys(invTemp)[runtime.globalVars.Selected]].createInstance(0, runtime.objects.Player.getFirstInstance().x, runtime.objects.Player.getFirstInstance().y);
		trap.trapIndex = obstacles.length; obstacles.push(trap);
		inv.set(runtime.globalVars.SelectedName, inv.get(runtime.globalVars.SelectedName) - 1);
		runtime.objects.SelectionText.getFirstInstance().text = "Trap: " + Object.keys(invTemp)[runtime.globalVars.Selected] + ". Count: " + inv[Object.keys(invTemp)[runtime.globalVars.Selected]] + "."; runtime.globalVars[Object.keys(invTemp)[runtime.globalVars.Selected] + "Placed"] += 1;
	}
	enemies.forEach((e) => {e.update(e); obstacles.forEach((o)=> e.getCollision(e, o));});
}