// Forgive me for all of the ugly tricks I've had to use to shorten the number of lines this has. I could just minify, but this at least allows me to somewhat read my code.
import {Enemy, Jumper, Digger, Whip, enemies, obstacles, paths} from "./utility.js"; var setLoadNext = function (runtime) {if (runtime.layout.name.includes("Level")) {OnBeforeProjectStart(runtime);} if (runtime.objects.Player.getFirstInstance()) { runtime.getLayout(runtime.objects.Player.getFirstInstance().instVars.NextLevel).addEventListener("beforelayoutstart", () => {setLoadNext(runtime);});}};
runOnStartup(async runtime => runtime.addEventListener("beforeprojectstart", () => {setLoadNext(runtime)})); var addedTick = false;
async function OnBeforeProjectStart(runtime)
{
	paths.clear(); enemies.clear(); obstacles.clear(); //Reset global variables for a new scene load.
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
			case "Jumper": enemyClass = Jumper; break; case "Digger": enemyClass = Digger; break; case "Destroyer": enemyClass = Destroyer; break; case "Whip": enemyClass = Whip; break; case "AnimalHandler": enemyClass = AnimalHandler; break; case "BossDuplicate": enemyClass = BossDuplicate; break; case "Boss": enemyClass = Boss; break;
		}
		var enemy = new enemyClass(e.instVars.EnemyName, e, runtime.globalVars.ExistingEnemies, runtime.objects.Player.getFirstInstance().instVars.localScale, e.instVars.EnemyType); enemy.initializePathing(); runtime.globalVars.ExistingEnemies += 1; if(e.instVars.EnemyType === "Boss") { runtime.bossWeakness = enemy.weakness; }
		enemies.set(enemy.name, enemy);
	}); runtime.globalVars.totalPlaced = 0;
	var inv = runtime.objects.InventoryInit.getFirstInstance().instVars; var invActual = runtime.objects.Inventory.getFirstInstance().getDataMap(); var invCost = runtime.objects.InventoryCost.getFirstInstance().getDataMap(); var invCostInit = runtime.objects.InventoryCostInit.getFirstInstance().instVars;
	runtime.objects.Shop_text.getFirstInstance().text = "Trap: " + Object.keys(inv)[0] + ". Count: " + inv[Object.keys(inv)[0]] + "."; runtime.globalVars.totalPlaced = 0; 
	Object.keys(inv).forEach(function(trapName){ runtime.globalVars[trapName + "Placed"] = 0; invActual.set(trapName, inv[trapName]); runtime.objects[trapName].getAllInstances().forEach(function(t) {t.isOpen = true; t.trapIndex = runtime.globalVars.totalPlaced; runtime.globalVars.totalPlaced += 1; obstacles.set(t.trapIndex, t);}); invCost.set(trapName, invCostInit[trapName]);}); runtime.objects.UI_trap.getFirstInstance().text = "Cost: " +  invCost.get(Object.keys(inv)[0]);
	if (!addedTick) {runtime.addEventListener("tick", () => Tick(runtime));addedTick = true;} runtime.globalVars.SelectedName = Object.keys(inv)[0]; setTrapInv(runtime);
}

function Tick(runtime){
	var inv = runtime.objects.Inventory.getFirstInstance().getDataMap(); var invTemp = runtime.objects.InventoryInit.getFirstInstance().instVars;
	for (var i = 0; i < Object.keys(invTemp).length; i++){
		if (runtime.keyboard.isKeyDown("Digit" + (i + 1)) || runtime.keyboard.isKeyDown("Numpad" + (i + 1))) {
			runtime.globalVars.SelectedName = Object.keys(invTemp)[i]; runtime.globalVars.Selected = i; if ((runtime.globalVars.SelectedName === "Trapdoor" || runtime.globalVars.SelectedName === "Piston") && inv.get(runtime.globalVars.SelectedName) > 0) { runtime.objects.InventoryCost.getFirstInstance().getDataMap().set(runtime.globalVars.SelectedName, 1000); }
			runtime.objects.Shop_text.getFirstInstance().text = "Trap: " + runtime.globalVars.SelectedName + ". Count: " + inv.get(runtime.globalVars.SelectedName) + ".";  runtime.objects.UI_trap.getFirstInstance().text = "Cost: " + runtime.objects.InventoryCost.getFirstInstance().getDataMap().get(runtime.globalVars.SelectedName); setTrapInv(runtime);
		}
	}
	if (runtime.keyboard.isKeyDown("Space") && inv.get(runtime.globalVars.SelectedName) > 0 && !runtime.spaceDown) { runtime.spaceDown = true;
		if (runtime.globalVars.SelectedName === "Dog") { inv.set("Dog", inv.get("Dog") - 1 ); for (var i = 0; i < 3; i++){ 
			var random = Object.keys(invTemp)[Math.floor(Math.random() * Object.keys(invTemp).length)]; if (random === "Dog" || random === "Trapdoor" || random === "Piston") { random = "Pitfall"; } inv.set(random, inv.get(random) + 1);
		} runtime.objects.Shop_text.getFirstInstance().text = "Trap: " + Object.keys(invTemp)[runtime.globalVars.Selected] + ". Count: " + inv.get(runtime.globalVars.SelectedName) + "."; setTrapInv(runtime);} else {var trap = runtime.objects[Object.keys(invTemp)[runtime.globalVars.Selected]].createInstance(0, runtime.objects.Player.getFirstInstance().x, runtime.objects.Player.getFirstInstance().y); trap.isOpen = true;
		if (runtime.globalVars.SelectedName === "Trapdoor" || runtime.globalVars.SelectedName === "Piston") { runtime.objects.InventoryCost.getFirstInstance().getDataMap().set(runtime.globalVars.SelectedName, 1000); runtime.objects.UI_trap.getFirstInstance().text = "Cost: " + runtime.objects.InventoryCost.getFirstInstance().getDataMap().get(runtime.globalVars.SelectedName); trap.isOpen = false; trap.openTimer = 0; }
		if(runtime.globalVars.SelectedName === "Piston") {trap.angleDegrees = runtime.objects.Player.getFirstInstance().angleDegrees + 180; trap.y -= trap.height/2 * Math.cos(trap.angle); trap.x += trap.height/2 * Math.sin(trap.angle); trap.actualPos = [runtime.objects.Player.getFirstInstance().x, runtime.objects.Player.getFirstInstance().y]; }
		trap.width = trap.width * runtime.objects.Player.getFirstInstance().instVars.localScale; trap.height = trap.height * runtime.objects.Player.getFirstInstance().instVars.localScale;
		trap.trapIndex = runtime.globalVars.totalPlaced; runtime.globalVars.totalPlaced += 1; obstacles.set(trap.trapIndex, trap);
		inv.set(runtime.globalVars.SelectedName, inv.get(runtime.globalVars.SelectedName) - 1);
		runtime.objects.Shop_text.getFirstInstance().text = "Trap: " + Object.keys(invTemp)[runtime.globalVars.Selected] + ". Count: " + inv.get(runtime.globalVars.SelectedName) + "."; runtime.globalVars[Object.keys(invTemp)[runtime.globalVars.Selected] + "Placed"] += 1; setTrapInv(runtime);
		if(runtime.globalVars.SelectedName === "Wind") { trap.angleDegrees = runtime.objects.Player.getFirstInstance().angleDegrees + 180; trap.wind = runtime.objects.WindParticles.createInstance(0, trap.x + trap.height/4 * Math.sin(trap.angle), trap.y - trap.height/4 * Math.cos(trap.angle)); trap.wind.angleDegrees = trap.angleDegrees - 90; var vector = {x: trap.height * Math.sin(trap.angle), y: trap.height * Math.cos(trap.angle)}; var magnitude = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2)); trap.endDest = {x: trap.x + ((vector.x / magnitude)) * 700 * runtime.objects.Player.getFirstInstance().instVars.localScale, y: trap.y - ((vector.y / magnitude) * 700 * runtime.objects.Player.getFirstInstance().instVars.localScale)}; trap.actualPos = [runtime.objects.Player.getFirstInstance().x, runtime.objects.Player.getFirstInstance().y];}
		}
	} else if (runtime.keyboard.isKeyDown("Space") && (runtime.globalVars.SelectedName === "Trapdoor" || runtime.globalVars.SelectedName === "Piston") && inv.get(runtime.globalVars.SelectedName) <= 0 && !runtime.spaceDown) {
		runtime.spaceDown = true; var trap = runtime.objects[runtime.globalVars.SelectedName].getFirstInstance(); trap.isOpen = !trap.isOpen; if (trap.isOpen) { trap.setAnimation("Open"); if(runtime.globalVars.SelectedName === "Piston") {trap.openTimer = 0.25;} } else { trap.setAnimation(runtime.globalVars.SelectedName); trap.openTimer = 0; }
	} else if (!runtime.keyboard.isKeyDown("Space") && runtime.spaceDown === true) runtime.spaceDown = false;
	enemies.forEach((e) => {e.update(e); obstacles.forEach((o)=> {e.getCollision(e, o); if(o.openTimer > 0) { o.openTimer -= runtime.dt; } else if (o.openTimer <= 0) { o.isOpen = false }})});
	if (runtime.keyboard.isKeyDown("KeyR")){
		obstacles.forEach((o)=> {if(runtime.objects.Player.getFirstInstance().testOverlap(o) && !o.inactive) { if (o.objectType.name == "Wind") { o.wind.destroy(); }
			if(o.objectType.name === "Wind" || o.objectType.name === "Snake") {
				o.inactive = true;
				o.opacity = 0;
				if (o.wind){
					o.wind.destroy();
				}
			} else {
				obstacles.delete(o.trapIndex); o.destroy(); 
			}
			if (runtime.objects.InventoryCost.getFirstInstance().getDataMap().get(o.objectType.name) != 500){runtime.objects.Player.getFirstInstance().instVars.Coins += Math.floor(runtime.objects.InventoryCost.getFirstInstance().getDataMap().get(o.objectType.name) * 0.5);}
		}});
	} if (runtime.keyboard.isKeyDown("KeyQ")) { setTrapInv(runtime); }
	if(runtime.globalVars.EnemiesDestroyed == runtime.globalVars.ExistingEnemies) {
		runtime.goToLayout(runtime.objects.Player.getFirstInstance().instVars.NextLevel);
	}
	if (runtime.globalVars.Total_time <= 0 && runtime.keyboard.isKeyDown("KeyR")) { runtime.layout.addEventListener("beforelayoutstart", function(){ setLoadNext(runtime); }); runtime.goToLayout(runtime.layout.name); }
}
function setTrapInv(runtime){ var inv = runtime.objects.Inventory.getFirstInstance().getDataMap();
	if (inv.get(runtime.globalVars.SelectedName) > 0) { runtime.objects.Store.getFirstInstance().setAnimation(runtime.globalVars.SelectedName);} else { runtime.objects.Store.getFirstInstance().setAnimation("Store"); } console.log(runtime.objects.InventoryCost.getFirstInstance().getDataMap().get(runtime.globalVars.SelectedName));
	if (runtime.objects.InventoryCost.getFirstInstance().getDataMap().get(runtime.globalVars.SelectedName) === 500) { runtime.objects.UI_trap.getFirstInstance().text = "Cannot Buy."; }
}