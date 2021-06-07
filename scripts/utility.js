var paths = new Map(); var enemies = new Map(); var obstacles = new Map(); export {Enemy, Jumper, Digger, Whip, paths, enemies, obstacles};
class Enemy {
	constructor(enemyName, enemyInstance, index, scale, type) { this.type = type; this.regularAnimation = enemyInstance.animationName; this.scale = scale; this.coinDrop = 10; this.name = enemyName; this.instance = enemyInstance; this.pathIndex = 0; this.dying = false; this.dead = false; this.index = index; this.trapImmunity = ["Balloon"]; this.initAcc = this.instance.behaviors.MoveTo.acceleration; this.initDec = this.instance.behaviors.MoveTo.deceleration; this.initMax = this.instance.behaviors.MoveTo.maxSpeed; this.initRot = this.instance.behaviors.MoveTo.rotateSpeed; }
	initializePathing(){ this.instance.behaviors.MoveTo.addEventListener("arrived", () => this.updatePath(this)); this.instance.behaviors.MoveTo.moveToPosition(paths[this.name][this.pathIndex][0], paths[this.name][this.pathIndex][1]);
	}
	updatePath(self){
		if (!self.dying && !self.dead && !self.immobile){self.instance.behaviors.MoveTo.moveToPosition(paths[self.name][self.pathIndex][0], paths[self.name][self.pathIndex][1]); self.pathIndex += 1;
			if (self.pathIndex >= paths[self.name].length) self.pathIndex = 0;}}
	update(self){if (!self.dead){if (self.dying) self.dyingUpdate(self, self.killer);}}
	kill(self){ self.dead = true; enemies.delete(self.name); self.instance.destroy();self.instance.runtime.objects.Player.getFirstInstance().instVars.Coins += self.coinDrop; if(self.itemDrop) { if(self.itemDrop === "Weakness") { self.instance.runtime.objects.WeaknessText.getFirstInstance().text = "The Boss' Weakness is: " + self.instance.runtime.bossWeakness; } else {self.instance.runtime.objects.Inventory.getFirstInstance().getDataMap().set(self.itemDrop, self.instance.runtime.Inventory.getFirstInstance().getDataMap().get(self.itemDrop) + 1); runtime.objects.Shop_text.getFirstInstance().text = "Trap: " + runtime.globalVars.SelectedName + ". Count: " + inv.get(runtime.globalVars.SelectedName) + ".";}}}
	dyingUpdate(self){
		switch (self.killer.objectType.name) {
			case "Pitfall": self.instance.behaviors.MoveTo.rotateSpeed = 0;
				self.instance.width -= self.instance.width/16; self.instance.height -= self.instance.height/16; self.instance.angle += 0.5; if (self.instance.width <= 0.1) {self.kill(self);} break;
			case "Balloon":
				self.killer.inactive = true; self.instance.behaviors.MoveTo.rotateSpeed = 0;
				self.killer.zElevation += 1; self.instance.zElevation += 1; self.instance.behaviors.MoveTo.moveToPosition(self.killer.x - self.killer.width/2, self.killer.y);
				if (self.instance.zElevation > 100) {self.kill(self); obstacles.delete(self.killer.trapIndex); self.killer.destroy();}
				break;
			case "Snake":
				self.isSnaked = true; self.instance.setAnimation(self.type + "Snaked"); self.instance.behaviors.MoveTo.moveToPosition(Math.sign(self.instance.x - self.killer.x) * 500 * self.scale + self.killer.x, Math.sign(self.instance.y - self.killer.y) * 500 * self.scale + self.killer.y);
				if (self.instance.x == Math.sign(self.instance.x - self.killer.x) * 500 * self.scale + self.killer.x && self.instance.y == Math.sign(self.instance.y - self.killer.y) * 500 * self.scale + self.killer.y) { self.instance.setAnimation(self.regularAnimation); self.dying = false; self.pathIndex = (self.pathIndex + 1) % paths[self.name].length; self.updatePath(self); self.isSnaked = false; }
				break;
			case "Wind":self.instance.setAnimation(self.type + "Snaked"); var killerPos = self.killer.actualPos; self.instance.behaviors.MoveTo.acceleration = 1000; self.instance.behaviors.MoveTo.deceleration = 1000; self.instance.behaviors.MoveTo.maxSpeed = 1000; self.instance.behaviors.MoveTo.rotateSpeed = 0;
				self.isSnaked = true; self.instance.behaviors.MoveTo.moveToPosition(self.killer.endDest.x, self.killer.endDest.y); if (self.instance.x === self.killer.endDest.x && self.instance.y === self.killer.endDest.y) { self.instance.setAnimation(self.regularAnimation); self.dying = false; self.pathIndex = (self.pathIndex + 1) % paths[self.name].length; self.updatePath(self); self.isSnaked = false; self.instance.behaviors.MoveTo.deceleration = self.initDec; self.instance.behaviors.MoveTo.acceleration = self.initAcc; self.instance.behaviors.MoveTo.maxSpeed = self.initMax; self.instance.behaviors.MoveTo.rotateSpeed = self.initRot;} break;}}
	getCollision(self, trapInstance){
		if ((!self.dying || (self.isSnaked && self.killer != trapInstance)) && trapInstance.objectType.name != "Block" && (trapInstance.isOpen === true) && !self.trapImmunity.includes(trapInstance.objectType.name) && self.instance.testOverlap(trapInstance) && !trapInstance.inactive) {
			self.isSnaked = false; self.dying = true; self.killer = trapInstance; self.instance.behaviors.MoveTo.stop(); self.instance.behaviors.MoveTo.moveToPosition(trapInstance.x, trapInstance.y);}}}
class Jumper extends Enemy {
	constructor(enemyName, enemyInstance, index, scale, type){super(enemyName, enemyInstance, index, scale, type); this.trapImmunity = ["Pitfall", "Trapdoor", "Snake"]; this.jumpTimer = 0; this.landTimer = 1; this.coinDrop = 11;}
	update(self){
		if (!self.dead) {if (self.dying) self.dyingUpdate(self, self.killer);} if(self.jumpTimer > 0) {self.jumpTimer -= self.instance.runtime.dt; } else { self.landTimer += self.instance.runtime.dt; if (self.landTimer < 0.1) { self.instance.setAnimation("JumperSnaked"); } if (self.landTimer >= 2 && self.instance.animationName != "jumperforward" && !self.isSnaked) self.instance.setAnimation("jumperforward");}}
	getCollision(self, trapInstance){
		if((!self.dying || (self.isSnaked && self.killer != trapInstance)) && (trapInstance.isOpen === true) && trapInstance.objectType.name != "Block" && self.instance.testOverlap(trapInstance) && !trapInstance.inactive) {
			if (self.trapImmunity.includes(trapInstance.objectType.name) && self.jumpTimer <= 0 && self.landTimer >= 2 && self.instance.animationName === "jumperforward"){
				self.instance.setAnimation("jumper_jump"); self.jumpTimer = 0.8; self.landTimer = 0;} else if (!self.trapImmunity.includes(trapInstance.objectType.name) || (self.jumpTimer <= 0 && self.landTimer < 2 && (self.instance.animationName === "JumperSnaked"))) { self.isSnaked = false; self.dying = true; self.killer = trapInstance; self.instance.behaviors.MoveTo.stop(); self.instance.behaviors.MoveTo.moveToPosition(trapInstance.x, trapInstance.y); self.instance.behaviors.MoveTo.rotateSpeed = 0; }}}}
class Digger extends Enemy {
	constructor(enemyName, enemyInstance, index, scale, type){
		super(enemyName, enemyInstance, index, scale, type); this.trapImmunity = ["Pitfall", "Trapdoor"]; this.surfaceTimer = 0; this.instance.opacity = 0.5; this.immuneTimer = 2; this.coinDrop = 20;
	}
	update(self){
		if (!self.dead) {if (self.dying) self.dyingUpdate(self, self.killer);} if(self.surfaceTimer > 0) {self.surfaceTimer -= self.instance.runtime.dt;} else if (self.surfaceTimer <= 0) {self.immuneTimer += self.instance.runtime.dt; } if (self.surfaceTimer <= 0) { self.instance.opacity = 0.5; self.immobile = false; self.instance.behaviors.MoveTo.moveToPosition(paths[self.name][self.pathIndex][0], paths[self.name][self.pathIndex][1]);}
	}
	getCollision(self, trapInstance){
		if((!self.dying || (self.isSnaked && self.killer != trapInstance)) && (trapInstance.isOpen === true) && trapInstance.objectType.name != "Block" && self.instance.testOverlap(trapInstance) && !trapInstance.inactive) {
			if (self.trapImmunity.includes(trapInstance.objectType.name) && self.surfaceTimer <= 0 && self.immuneTimer > 2){
				self.instance.opacity = 1; self.surfaceTimer = 5; self.immobile = true; self.instance.behaviors.MoveTo.stop(); self.immuneTimer = 0;} else if ((self.surfaceTimer > 0) && !self.trapImmunity.includes(trapInstance.objectType.name)) { self.isSnaked = false; self.dying = true; self.killer = trapInstance; self.instance.behaviors.MoveTo.stop(); self.instance.behaviors.MoveTo.moveToPosition(trapInstance.x, trapInstance.y); self.instance.behaviors.MoveTo.rotateSpeed = 0;}}}}
class Whip extends Enemy {
	constructor(enemyName, enemyInstance, index, scale, type){
		super(enemyName, enemyInstance, index, scale, type); this.trapImmunity = ["Pitfall", "Trapdoor", "Balloon"]; this.jumpTimer = 0; this.isSnaked = false; this.coinDrop = 17; this.jumpingDuration = 0;
	}
	update(self){
		if (!self.dead) {if (self.dying) self.dyingUpdate(self, self.killer);} if(self.jumpTimer > 0) {self.jumpTimer -= self.instance.runtime.dt; self.jumpingDuration += self.instance.runtime.dt;  if (self.jumpTimer <= 0) {self.instance.setAnimation("whip_move"); self.jumpingDuration = 0;} }}
	getCollision(self, trapInstance){
		if((!self.dying || (self.isSnaked && self.killer != trapInstance) || self.jumpingDuration > 0) && (trapInstance.isOpen === true) && trapInstance.objectType.name != "Block" && self.instance.testOverlap(trapInstance) && !trapInstance.inactive) {
			if (self.trapImmunity.includes(trapInstance.objectType.name) && self.jumpingDuration < 2){
				self.instance.setAnimation("whip_jump"); self.jumpTimer = 0.6;
			} else if (!self.trapImmunity.includes(trapInstance.objectType.name) || self.isSnaked === true || self.jumpingDuration >= 3) {
				self.isSnaked = false; self.dying = true; self.killer = trapInstance; self.instance.behaviors.MoveTo.stop(); self.instance.behaviors.MoveTo.moveToPosition(trapInstance.x, trapInstance.y);
			}}}}