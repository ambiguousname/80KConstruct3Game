export {Enemy, Jumper, paths, enemies, obstacles};
var paths = new Map(); var enemies = []; var obstacles = [];
class Enemy {
	constructor(enemyName, enemyType, enemyInstance, immunity) {
		this.name = enemyName; this.type = enemyType; this.instance = enemyInstance; this.pathIndex = 0; this.dying = false; this.dead = false;
		this.trapImmunity = immunity;
	}
	initializePathing(){
		this.instance.behaviors.MoveTo.addEventListener("arrived", () => this.updatePath(this));
		this.instance.behaviors.MoveTo.moveToPosition(paths[this.name][this.pathIndex][0], paths[this.name][this.pathIndex][1]);
	}
	updatePath(self){
		if (!self.dying && !self.dead){
			self.instance.behaviors.MoveTo.moveToPosition(paths[self.name][self.pathIndex][0], paths[self.name][self.pathIndex][1]); self.pathIndex += 1;
			if (self.pathIndex >= paths[self.name].length) self.pathIndex = 0;
		}
	}
	update(self){
		if (!self.dead){
			if(self.instance.width <= 0 && self.instance.height <= 0) {self.instance.destroy(); self.dead = true;}
			if (self.dying) self.dyingUpdate(self, self.killer);
		}
	}
	dyingUpdate(self){
		switch (self.killer.objectType.name) {
			case "Pitfall":
				self.instance.width -= self.instance.width/16; self.instance.height -= self.instance.height/16;
				break;
		}
	}
	getCollision(self, trapInstance){
		if (!self.dying && !self.trapImmunity.includes(trapInstance.objectType.name) && self.instance.testOverlap(trapInstance)) {
			self.dying = true; self.killer = trapInstance; self.instance.behaviors.MoveTo.moveToPosition(trapInstance.x, trapInstance.y);
		}
	}
}
class Jumper extends Enemy {
	
}