var paths = new Map(); var enemies = []; var obstacles = []; export {Enemy, Jumper, Digger, Destroyer, Whip, AnimalHandler, BossDuplicate, Boss, paths, enemies, obstacles};
class Enemy {
	constructor(enemyName, enemyInstance, index, scale) { this.scale = scale; this.coinDrop = 5; this.name = enemyName; this.instance = enemyInstance; this.pathIndex = 0; this.dying = false; this.dead = false; this.index = index; this.trapImmunity = [];}
	initializePathing(){ this.instance.behaviors.MoveTo.addEventListener("arrived", () => this.updatePath(this)); this.instance.behaviors.MoveTo.moveToPosition(paths[this.name][this.pathIndex][0], paths[this.name][this.pathIndex][1]);
	}
	updatePath(self){
		if (!self.dying && !self.dead && !self.immobile){self.instance.behaviors.MoveTo.moveToPosition(paths[self.name][self.pathIndex][0], paths[self.name][self.pathIndex][1]); self.pathIndex += 1;
			if (self.pathIndex >= paths[self.name].length) self.pathIndex = 0;}}
	update(self){if (!self.dead){if (self.dying) self.dyingUpdate(self, self.killer);}}
	kill(self){ self.dead = true; enemies.splice(self.index, 1); self.instance.destroy(); self.instance.runtime.Player.getFirstInstance().Coins += self.coinDrop; if(self.itemDrop) { if(self.itemDrop === "Weakness") { self.instance.runtime.WeaknessText.getFirstInstance().text = "The Boss' Weakness is: " + self.instance.runtime.bossWeakness; } else {self.instance.runtime.Inventory.getFirstInstance().getDataMap().set(self.itemDrop, self.instance.runtime.Inventory.getFirstInstance().getDataMap().get(self.itemDrop) + 1); runtime.objects.Shop_text.getFirstInstance().text = "Trap: " + runtime.globalVars.SelectedName + ". Count: " + inv.get(runtime.globalVars.SelectedName) + "."; }}}
	dyingUpdate(self){
		switch (self.killer.objectType.name) {
			case "Trapdoor": case "Pitfall":
				self.instance.width -= self.instance.width/16; self.instance.height -= self.instance.height/16; self.instance.angle += 0.5; if (self.instance.width <= 0.1) {self.kill(self);} break;
			case "Balloon":
				self.killer.inactive = true;
				self.killer.zElevation += 1; self.instance.zElevation += 1; self.instance.behaviors.MoveTo.moveToPosition(self.killer.x - self.killer.width/2, self.killer.y);
				if (self.instance.zElevation > 100) {self.kill(self); obstacles.splice(self.killer.trapIndex, 1); self.killer.destroy();}
				break;
			case "Snake":
				self.isSnaked = true; self.instance.behaviors.MoveTo.moveToPosition(Math.sign(self.instance.x - self.killer.x) * 50 * self.scale + self.killer.x, Math.sign(self.instance.y - self.killer.y) * 50 * self.scale + self.killer.y);
				if (self.instance.x == Math.sign(self.instance.x - self.killer.x) * 50 * self.scale + self.killer.x && self.instance.y == Math.sign(self.instance.y - self.killer.y) * 50 * self.scale + self.killer.y) { self.dying = false; self.pathIndex++; self.updatePath(self); self.isSnaked = false; }
				break;
			case "Wind":
				self.isSnaked = true; self.instance.behaviors.MoveTo.moveToPosition(Math.sign(self.instance.x - self.killer.x) * 100 * self.scale + self.killer.x, Math.sign(self.instance.y - self.killer.y) * 100 * self.scale + self.killer.y); if (self.instance.x == Math.sign(self.instance.x - self.killer.x) * 100 * self.scale + self.killer.x && self.instance.y == Math.sign(self.instance.y - self.killer.y) * 100 * self.scale + self.killer.y) { self.dying = false; self.pathIndex++; self.updatePath(self); self.isSnaked = false; }
				break;}}
	getCollision(self, trapInstance){
		if (!self.dying && trapInstance.objectType.name != "Block" && (trapInstance.isOpen === true) && !self.trapImmunity.includes(trapInstance.objectType.name) && self.instance.testOverlap(trapInstance)) {
			self.dying = true; self.killer = trapInstance; self.instance.behaviors.MoveTo.moveToPosition(trapInstance.x, trapInstance.y);}}}
class Jumper extends Enemy {
	constructor(enemyName, enemyInstance, index, scale){super(enemyName, enemyInstance, index, scale); this.trapImmunity = ["Pitfall", "Trapdoor"]; this.jumpTimer = 0; this.landTimer = 0; this.coinDrop = 6;}
	update(self){
		if (!self.dead) {if (self.dying) self.dyingUpdate(self, self.killer);} if(self.jumpTimer > 0) {self.jumpTimer -= self.instance.runtime.dt; if (self.jumpTimer <= 0) self.instance.zElevation -= 30; } else {self.landTimer += self.instance.runtime.dt;}}
	getCollision(self, trapInstance){
		if(!self.dying && (trapInstance.isOpen === true) && trapInstance.objectType.name != "Block" && self.instance.testOverlap(trapInstance) && !trapInstance.inactive) {
			if (self.trapImmunity.includes(trapInstance.objectType.name) && self.jumpTimer <= 0 && self.landTimer >= 1){
				self.instance.zElevation += 30; self.jumpTimer = 3; self.landTimer = 0;} else if (!self.trapImmunity.includes(trapInstance.objectType.name) || (self.jumpTimer <= 0 && self.landTimer < 1)) { self.dying = true; self.killer = trapInstance; self.instance.behaviors.MoveTo.moveToPosition(trapInstance.x, trapInstance.y); self.instance.behaviors.MoveTo.rotateSpeed = 0; }}}}
class Digger extends Enemy {
	constructor(enemyName, enemyInstance, index, scale){
		super(enemyName, enemyInstance, index, scale); this.trapImmunity = ["Pitfall", "Trapdoor"]; this.surfaceTimer = 0; this.instance.opacity = 0.5; this.immuneTimer = 0; this.coinDrop = 15;
	}
	update(self){
		if (!self.dead) {if (self.dying) self.dyingUpdate(self, self.killer);} if(self.surfaceTimer > 0) {self.surfaceTimer -= self.instance.runtime.dt;} else if (self.surfaceTimer <= 0) {self.immuneTimer += self.instance.runtime.dt; } if (self.surfaceTimer <= 0) { self.instance.opacity = 0.5; self.immobile = false; self.instance.behaviors.MoveTo.moveToPosition(paths[self.name][self.pathIndex][0], paths[self.name][self.pathIndex][1]);}
	}
	getCollision(self, trapInstance){
		if(!self.dying && (trapInstance.isOpen === true) && trapInstance.objectType.name != "Block" && self.instance.testOverlap(trapInstance) && !trapInstance.inactive) {
			if (self.trapImmunity.includes(trapInstance.objectType.name) && self.surfaceTimer <= 0 && self.immuneTimer > 4){
				self.instance.opacity = 1; self.surfaceTimer = 5; self.immobile = true; self.instance.behaviors.MoveTo.stop(); self.immuneTimer = 0;} else if ((self.surfaceTimer > 0) && !self.trapImmunity.includes(trapInstance.objectType.name)) { self.dying = true; self.killer = trapInstance; self.instance.behaviors.MoveTo.moveToPosition(trapInstance.x, trapInstance.y); self.instance.behaviors.MoveTo.rotateSpeed = 0;}}}}
class Destroyer extends Enemy {
	constructor(enemyName, enemyInstance, index, scale){ super(enemyName, enemyInstance, index, scale); this.destructionLeft = 3; this.coinDrop = 15; }
	updatePath(self) { if (!self.dying && !self.dead && !self.immobile){self.instance.behaviors.MoveTo.moveToPosition(Math.floor(Math.random() * self.instance.runtime.layout.width), Math.floor(Math.random() * self.instance.runtime.layout.height))}}
	getCollision(self, trapInstance) { if (self.instance.testOverlap(trapInstance) && self.destructionLeft > 0) { this.destructionLeft -= 1; obstacles.splice(trapInstance.trapIndex, 1); trapInstance.destroy(); } else if(!self.dying && trapInstance.objectType.name != "Block" && (trapInstance.isOpen) && self.instance.testOverlap(trapInstance)) {
		self.dying = true; self.killer = trapInstance; self.instance.behaviors.MoveTo.moveToPosition(trapInstance.x, trapInstance.y);
	}}
}
class Whip extends Enemy {
	constructor(enemyName, enemyInstance, index, scale){
		super(enemyName, enemyInstance, index, scale); this.trapImmunity = ["Pitfall", "Trapdoor", "Balloon"]; this.jumpTimer = 0; this.isSnaked = false; this.coinDrop = 7;
	}
	update(self){
		if (!self.dead) {if (self.dying) self.dyingUpdate(self, self.killer);} if(self.jumpTimer > 0) {self.jumpTimer -= self.instance.runtime.dt; if (self.jumpTimer <= 0) self.instance.zElevation = 2; }}
	getCollision(self, trapInstance){
		if(!self.dying && (trapInstance.isOpen === true) && trapInstance.objectType.name != "Block" && self.instance.testOverlap(trapInstance) && !trapInstance.inactive) {
			if (self.trapImmunity.includes(trapInstance.objectType.name)){
				self.instance.zElevation = 30; self.jumpTimer = 3;} else if (!self.trapImmunity.includes(trapInstance.objectType.name) || self.isSnaked === true ) { self.dying = true; self.killer = trapInstance; self.instance.behaviors.MoveTo.moveToPosition(trapInstance.x, trapInstance.y);}}}}
class AnimalHandler extends Enemy {
	constructor(enemyName, enemyInstance, index, scale) { super(enemyName, enemyInstance, index, scale); this.trapImmunity = ["Pitfall", "Trapdoor", "Balloon"]; this.isSnaked = false; this.coinDrop = 10; this.itemDrop = "Dog"; }
	getCollision(self, trapInstance) { if (!self.dying && (trapInstance.isOpen === true) && trapInstance.objectType.name != "Block" && self.instance.testOverlap(trapInstance) && !trapInstance.inactive) { if (!self.trapImmunity.includes(trapInstance.objectType.name) || self.isSnaked) { self.dying = true; self.killer = trapInstance; self.instance.behaviors.MoveTo.moveToPosition(trapInstance.x, trapInstance.y); }
	}}}
class BossDuplicate extends Enemy { constructor(enemyName, enemyInstance, index, scale) { super(enemyName, enemyInstance, index, scale); this.moveTimer = 0; this.prevPosition = []; this.coinDrop = 0; this.itemDrop = "Weakness";}
	initializePathing() { this.originalPosition = [this.instance.x, this.instance.y]; } updatePath(self){ return; }
	update(self) { if(self.instance.x != self.prevPosition[0] && self.instance.y != self.prevPosition[1]) { self.moveTimer = 3; } if (!self.dead){if (self.dying) self.dyingUpdate(self, self.killer);} self.prevPosition = [self.x, self.y]; }
	getCollision(self) {if (self.moveTimer > 0 && Math.sqrt(Math.pow(self.instance.x - self.originalPosition[0], 2) + Math.pow(self.instance.y - self.originalPosition[1], 2)) > 4 * self.scale) { self.dying = true; self.killer = trapInstance; self.instance.behaviors.MoveTo.moveToPosition(trapInstance.x, trapInstance.y); } }}
class Boss extends Enemy { constructor(enemyName, enemyInstance, index, scale) { super(enemyName, enemyInstance, index, scale); this.coinDrop = 0; this.trapImmunity = ["Pitfall", "Trapdoor", "Balloon", "Snake", "Wind", "Piston"]; this.weakness = this.trapImmunity.splice(Math.floor(Math.random() * this.trapImmunity.llength), 1);} }