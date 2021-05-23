// Forgive me for all of the ugly tricks I've had to use to shorten the number of lines this has. I could just minify, but this at least allows me to somewhat read my code.
import {Enemy, Jumper, enemies, obstacles, paths} from "./enemies.js";
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
		var enemy_class = Enemy;
		var enemy = new enemy_class(e.instVars.EnemyName, e.instVars.EnemyType, e, []); enemy.initializePathing();
		enemies.push(enemy);
	});
	runtime.globalVars.Selected = 0;
	var inv = runtime.objects.Inventory.getFirstInstance().instVars;
	runtime.objects.SelectionText.getFirstInstance().text = "Trap: " + Object.keys(inv)[0] + ". Count: " + inv[Object.keys(inv)[0]] + ".";
	runtime.addEventListener("tick", () => Tick(runtime));
}

function Tick(runtime){
	var inv = runtime.objects.Inventory.getFirstInstance().instVars;
	for (var i = 0; i < Object.keys(inv).length; i++){
		if (runtime.keyboard.isKeyDown("Digit" + (i + 1)) || runtime.keyboard.isKeyDown("Numpad" + (i + 1))) {
			runtime.globalVars.Selected = i;
			runtime.objects.SelectionText.getFirstInstance().text = "Trap: " + Object.keys(inv)[i] + ". Count: " + inv[Object.keys(inv)[i]] + ".";
		}
	}
	if (runtime.keyboard.isKeyDown("Space") && inv[Object.keys(inv)[runtime.globalVars.Selected]] > 0) {
		var trap = runtime.objects[Object.keys(inv)[runtime.globalVars.Selected]].createInstance(0, runtime.objects.Player.getFirstInstance().x, runtime.objects.Player.getFirstInstance().y);
		obstacles.push(trap);
		inv[Object.keys(inv)[runtime.globalVars.Selected]] -= 1;
		runtime.objects.SelectionText.getFirstInstance().text = "Trap: " + Object.keys(inv)[runtime.globalVars.Selected] + ". Count: " + inv[Object.keys(inv)[runtime.globalVars.Selected]] + ".";
	}
	enemies.forEach((e) => {e.update(e); obstacles.forEach((o)=> e.getCollision(e, o));});
}