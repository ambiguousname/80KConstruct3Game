// Forgive me for all of the ugly tricks I've had to use to shorten the number of lines this has. I could just minify, but this at least allows me to somewhat read my code.
import {Enemy, Jumper, Digger, Destroyer, enemies, obstacles, paths} from "./utility.js"; var setLoadNext = function (runtime) {if (runtime.layout.name.includes("Level")) {OnBeforeProjectStart(runtime);} if (runtime.objects.Player.getFirstInstance()) { runtime.getLayout(runtime.objects.Player.getFirstInstance().instVars.NextLevel).addEventListener("beforelayoutstart", () => {setLoadNext(runtime);});}};
runOnStartup(async runtime => runtime.addEventListener("beforeprojectstart", () => {setLoadNext(runtime)}));
async function OnBeforeProjectStart(runtime)
{
	paths.clear(); enemies.splice(0, enemies.length); obstacles.splice(0, obstacles.length); //Reset global variables for a new scene load.
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
			case "Jumper": enemyClass = Jumper; break; case "Digger": enemyClass = Digger; break; case "Destroyer": enemyClass = Destroyer; break;
		}
		var enemy = new enemyClass(e.instVars.EnemyName, e, enemies.length); enemy.initializePathing(); runtime.globalVars.ExistingEnemies += 1;
		enemies.push(enemy);
	});
	var inv = runtime.objects.InventoryInit.getFirstInstance().instVars; var invActual = runtime.objects.Inventory.getFirstInstance().getDataMap(); var invCost = runtime.objects.InventoryCost.getFirstInstance().getDataMap(); var invCostInit = runtime.objects.InventoryCostInit.getFirstInstance().instVars; runtime.globalVars.SelectedName = Object.keys(inv)[0]; runtime.objects.Shop.getFirstInstance().setAnimation(Object.keys(inv)[0]);
	runtime.objects.Shop_text.getFirstInstance().text = "Trap: " + Object.keys(inv)[0] + ". Count: " + inv[Object.keys(inv)[0]] + ".";
	Object.keys(inv).forEach((trapName)=> {invActual.set(trapName, inv[trapName]); runtime.globalVars[trapName + "Placed"] = 0; invCost.set(trapName, invCostInit[trapName]);}); runtime.objects.UI_trap.getFirstInstance().text = "Cost: " +  invCost.get(Object.keys(inv)[0]);
	runtime.addEventListener("tick", () => Tick(runtime));
}

function Tick(runtime){
	var inv = runtime.objects.Inventory.getFirstInstance().getDataMap(); var invTemp = runtime.objects.InventoryInit.getFirstInstance().instVars;
	for (var i = 0; i < Object.keys(invTemp).length; i++){
		if (runtime.keyboard.isKeyDown("Digit" + (i + 1)) || runtime.keyboard.isKeyDown("Numpad" + (i + 1))) {
			runtime.globalVars.SelectedName = Object.keys(invTemp)[i]; runtime.globalVars.Selected = i; if (runtime.globalVars.SelectedName == "Trapdoor" && inv.get(runtime.globalVars.SelectedName) > 0) { runtime.objects.InventoryCost.getFirstInstance().getDataMap().set("Trapdoor", 1000); }
			runtime.objects.Shop_text.getFirstInstance().text = "Trap: " + runtime.globalVars.SelectedName + ". Count: " + inv.get(runtime.globalVars.SelectedName) + "."; runtime.objects.Shop.getFirstInstance().setAnimation(runtime.globalVars.SelectedName); runtime.objects.UI_trap.getFirstInstance().text = "Cost: " + runtime.objects.InventoryCost.getFirstInstance().getDataMap().get(runtime.globalVars.SelectedName);
		}
	}
	if (runtime.keyboard.isKeyDown("Space") && inv.get(runtime.globalVars.SelectedName) > 0 && !runtime.spaceDown) { runtime.spaceDown = true;
		if (runtime.globalVars.SelectedName === "Dog") { inv.set("Dog", inv.get("Dog") - 1 ); for (var i = 0; i < 3; i++){ 
			var random = Object.keys(invTemp)[Math.floor(Math.random() * Object.keys(invTemp).length)]; if (random === "Dog" || random === "Trapdoor") { random = "Pitfall"; } inv.set(random, inv.get(random) + 1);
		} runtime.objects.Shop_text.getFirstInstance().text = "Trap: " + Object.keys(invTemp)[runtime.globalVars.Selected] + ". Count: " + inv.get(runtime.globalVars.SelectedName) + ".";} else {var trap = runtime.objects[Object.keys(invTemp)[runtime.globalVars.Selected]].createInstance(0, runtime.objects.Player.getFirstInstance().x, runtime.objects.Player.getFirstInstance().y); trap.isOpen = true;
		if (runtime.globalVars.SelectedName === "Trapdoor") { runtime.objects.InventoryCost.getFirstInstance().getDataMap().set("Trapdoor", 1000); runtime.objects.UI_trap.getFirstInstance().text = "Cost: " + runtime.objects.InventoryCost.getFirstInstance().getDataMap().get(runtime.globalVars.SelectedName); trap.isOpen = false; }
		trap.width = trap.width * runtime.objects.Player.getFirstInstance().instVars.localScale; trap.height = trap.height * runtime.objects.Player.getFirstInstance().instVars.localScale;
		trap.trapIndex = obstacles.length; obstacles.push(trap);
		inv.set(runtime.globalVars.SelectedName, inv.get(runtime.globalVars.SelectedName) - 1);
		runtime.objects.Shop_text.getFirstInstance().text = "Trap: " + Object.keys(invTemp)[runtime.globalVars.Selected] + ". Count: " + inv.get(runtime.globalVars.SelectedName) + "."; runtime.globalVars[Object.keys(invTemp)[runtime.globalVars.Selected] + "Placed"] += 1;}
	} else if (runtime.keyboard.isKeyDown("Space") && runtime.globalVars.SelectedName == "Trapdoor" && inv.get(runtime.globalVars.SelectedName) <= 0 && !runtime.spaceDown) {
		runtime.spaceDown = true; var trap = runtime.objects.Trapdoor.getFirstInstance(); trap.isOpen = !trap.isOpen; if (trap.isOpen) { trap.setAnimation("Open"); } else { trap.setAnimation("Trapdoor"); }
	} else if (!runtime.keyboard.isKeyDown("Space") && runtime.spaceDown === true) runtime.spaceDown = false;
	enemies.forEach((e) => {e.update(e); obstacles.forEach((o)=> {e.getCollision(e, o);})});
	if (runtime.keyboard.isKeyDown("KeyR")){
		obstacles.forEach((o)=> {if(runtime.objects.Player.getFirstInstance().testOverlap(o)) {
			o.destroy(); obstacles.splice(o.trapIndex, 1);
			if(o.objectType.name == "Trapdoor") {
				runtime.objects.InventoryCost.getFirstInstance().getDataMap().set("Trapdoor", runtime.objects.InventoryCostInit.getFirstInstance().instVars["Trapdoor"]); runtime.objects.UI_trap.getFirstInstance().text = "Cost: " + runtime.objects.InventoryCost.getFirstInstance().getDataMap().get(runtime.globalVars.SelectedName);
			}
			runtime.objects.Player.getFirstInstance().instVars.Coins += Math.floor(runtime.objects.InventoryCost.getFirstInstance().getDataMap().get(o.objectType.name) * 0.5);
		}});
	}
	if(runtime.globalVars.EnemiesDestroyed == runtime.globalVars.ExistingEnemies) {
		runtime.goToLayout(runtime.objects.Player.getFirstInstance().instVars.NextLevel);
	}
}