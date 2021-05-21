// Forgive me for all of the ugly tricks I've had to use to shorten the number of lines this has. I could just minify, but this at least allows me to read my code.
var paths = new Map();
class Enemy {
	constructor(enemyName, enemyType, enemyInstance) {
		this.name = enemyName;
		this.type = enemyType;
		this.instance = enemyInstance;
		this.pathIndex = 0;
	}
	initializePathing(){
		this.instance.behaviors.MoveTo.addEventListener("arrived", () => this.updatePath(this));
		this.instance.behaviors.MoveTo.moveToPosition(paths[this.name][this.pathIndex][0], paths[this.name][this.pathIndex][1]);
	}
	updatePath(self){
		self.instance.behaviors.MoveTo.moveToPosition(paths[self.name][self.pathIndex][0], paths[self.name][self.pathIndex][1]);
		self.pathIndex += 1;
		if (self.pathIndex >= paths[self.name].length) self.pathIndex = 0;
	}
}
runOnStartup(async runtime => runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime)));
async function OnBeforeProjectStart(runtime)
{
	// Get the paths and add them to our object:
	var path_temp_arr = runtime.objects.PathObj.getAllInstances();
	path_temp_arr.forEach(function(p){
		// Okay, arrays probably weren't meant to be constructed this way.
		var enemyName = p.instVars.EnemyName;
		if (enemyName in paths) {
			// We store the x and y coordinates of the path as a small array.
			paths[enemyName][p.instVars.Position] = [p.x, p.y];
		} else {
			paths[enemyName] = [];
			paths[enemyName][p.instVars.Position] = [p.x, p.y];
		}
	});
	// Now we get the enemies:
	runtime.objects.Enemy.getAllInstances().forEach(function(e){
		var enemy = new Enemy(e.instVars.EnemyName, e.instVars.EnemyType, e);
		enemy.initializePathing();
	});
	runtime.globalVars.Selected = 0;
	var inv = runtime.objects.Inventory.getFirstInstance().instVars;
	runtime.objects.SelectionText.getFirstInstance().text = "Trap: Pitfall. Count: " + inv[Object.keys(inv)[0]] + ". Count: " + inv[Object.keys(inv)[0]] + ".";
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
		runtime.objects[Object.keys(inv)[runtime.globalVars.Selected]].createInstance(0, runtime.objects.Player.getFirstInstance().x, runtime.objects.Player.getFirstInstance().y);
		inv[Object.keys(inv)[runtime.globalVars.Selected]] -= 1;
		runtime.objects.SelectionText.getFirstInstance().text = "Trap: " + Object.keys(inv)[runtime.globalVars.Selected] + ". Count: " + inv[Object.keys(inv)[runtime.globalVars.Selected]] + ".";
	}
}