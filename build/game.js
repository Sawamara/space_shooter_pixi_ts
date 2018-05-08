"use strict";
const DIRECTIONS = {
    Left: "left", Right: "right", Up: "up", Down: "down"
};
const STAGE_BOUNDS = {
    Left: 0, Right: 720, Up: 0, Down: 520
};
class PlayerShip {
    constructor(container) {
        this.alive = true;
        this.velocity = 100;
        this.missiles = [];
        this.defaultMissileCooldown = 166;
        this.PullTrigger = () => { this.triggerHeld = true; if (this.missileCooldown <= 0) {
            this.TryToSpawnMissile();
        } };
        this.ReleaseTrigger = () => { this.triggerHeld = false; };
        this.AddForceFromDirection = (direction) => {
            this.activeDirections[direction] = true;
        };
        this.RemoveForceFromDirection = (direction) => {
            this.activeDirections[direction] = false;
        };
        this.TryToSpawnMissile = () => {
            if (!this.alive) {
                return;
            }
            for (let missile of this.missiles) {
                if (!missile.alive) {
                    missile.ActivateAt(this.sprite.x + 5, this.sprite.y + 30);
                    this.missileCooldown = this.defaultMissileCooldown;
                    return;
                }
            }
        };
        this.Update = (deltaTime) => {
            this.emitter.Update();
            this.missileCooldown -= deltaTime;
            if (this.missileCooldown <= 0 && this.triggerHeld === true) {
                this.TryToSpawnMissile();
            }
            for (let missile of this.missiles) {
                missile.Update(deltaTime);
            }
            if (!this.alive) {
                return;
            }
            var amountMoved = this.velocity / deltaTime;
            var burningFuel = false;
            if (this.activeDirections[DIRECTIONS.Right] === true) {
                burningFuel = true;
                if (this.sprite.position.x < STAGE_BOUNDS.Right)
                    this.sprite.position.x += amountMoved;
            }
            else if (this.activeDirections[DIRECTIONS.Left] === true) {
                if (this.sprite.position.x > STAGE_BOUNDS.Left)
                    this.sprite.position.x -= amountMoved;
            }
            if (this.activeDirections[DIRECTIONS.Up] === true) {
                burningFuel = true;
                if (this.sprite.position.y > STAGE_BOUNDS.Up)
                    this.sprite.position.y -= amountMoved;
            }
            else if (this.activeDirections[DIRECTIONS.Down] === true) {
                burningFuel = true;
                if (this.sprite.position.y < STAGE_BOUNDS.Down)
                    this.sprite.position.y += amountMoved;
            }
            this.collisionRectangle = this.sprite.getBounds();
            this.collisionRectangle.width += -15;
            var roll = Math.random();
            if (roll > 0.7) {
                this.emitter.Emit(this.sprite.x - 6 - (roll * 6), this.sprite.y + 15 + (roll * 20));
            }
            if (burningFuel && roll > 0.2) {
                this.emitter.Emit(this.sprite.x - 10 - (roll * 6), this.sprite.y + 12 + (roll * 30));
            }
        };
        var shipTexture = PIXI.Sprite.fromImage('playerShip');
        var missileTexture = PIXI.Texture.fromImage('missile');
        this.sprite = shipTexture;
        this.collisionRectangle = new PIXI.Rectangle(this.sprite.x + 5, this.sprite.y + 3, this.sprite.width, this.sprite.height);
        this.SpawnAt(40, 300);
        this.activeDirections = {};
        this.missileCooldown = 0;
        this.emitter = new Emitter(60, "left", container, ["fuelParticleBlue", "fuelParticleBlueAlternate"]);
        for (let key in DIRECTIONS) {
            this.activeDirections[key] = false;
        }
        for (var i = 0; i < 25; i++) {
            this.missiles.push(new Missile(missileTexture, 180, container));
        }
        container.addChild(shipTexture);
    }
    SpawnAt(x, y) {
        this.sprite.position.set(x, y);
        this.collisionRectangle.x = this.sprite.position.x;
        this.collisionRectangle.y = this.sprite.position.y;
    }
    CheckForCollision(collidables) {
        return false;
    }
}
class ScrollingBackground {
    constructor(container) {
        this.container = container;
        this.defaultScrollTime = 33;
        this.defaultForegroundScrollTime = 16;
        var backTexture = PIXI.Texture.fromImage('tileDeepspace');
        var frontTexture = PIXI.Texture.fromImage('tilePlanets');
        this.backLayer = new PIXI.extras.TilingSprite(backTexture, 800, 600);
        this.frontLayer = new PIXI.extras.TilingSprite(frontTexture, 800, 600);
        container.addChild(this.backLayer);
        container.addChild(this.frontLayer);
        this.timeUntilScrolling = this.defaultScrollTime;
        this.timeUntilForegroundScrolling = this.defaultForegroundScrollTime;
    }
    Update(delta) {
        this.UpdateBackLayer(delta);
        this.UpdateFrontLayer(delta);
    }
    UpdateBackLayer(delta) {
        this.timeUntilScrolling -= delta;
        if (this.timeUntilScrolling < 0) {
            this.timeUntilScrolling = this.defaultScrollTime + this.timeUntilScrolling;
            this.backLayer.tilePosition.x -= 1;
        }
    }
    UpdateFrontLayer(delta) {
        this.timeUntilForegroundScrolling -= delta;
        if (this.timeUntilForegroundScrolling < 0) {
            this.timeUntilForegroundScrolling = this.defaultForegroundScrollTime + this.timeUntilForegroundScrolling;
            this.frontLayer.tilePosition.x -= 1;
        }
    }
}
class Enemy {
    constructor(container) {
        this.randomBehavior = {
            slidesUp: false,
            slidesDown: false,
            slideDelay: 0, slideDuration: 0
        };
        this.sprite = PIXI.Sprite.fromImage("enemies");
        this.sprite.texture.frame = new PIXI.Rectangle(5, 7, 33, 43);
        this.alive = false;
        this.sprite.visible = false;
        container.addChild(this.sprite);
    }
    Spawn() {
        this.velocity = 50 + Math.random() * 40;
        this.sprite.visible = true;
        this.alive = true;
        this.sprite.y = Math.round(200 + Math.random() * 200);
        this.sprite.x = STAGE_BOUNDS.Right + 130;
        this.RandomizeBehavior();
        this.collisionRectangle = new PIXI.Rectangle(this.sprite.x, this.sprite.y, this.sprite.width, this.sprite.height);
    }
    RandomizeBehavior() {
        var doesSlide = Math.random();
        this.randomBehavior.slidesDown = false;
        this.randomBehavior.slidesUp = false;
        if (doesSlide > 0.5) {
            this.randomBehavior.slidesUp = true;
        }
        else
            this.randomBehavior.slidesDown = true;
        this.randomBehavior.slideDelay = 200 + Math.random() * 500;
        this.randomBehavior.slideDuration = 100 + Math.random() * 1800;
    }
    Deactivate() {
        this.alive = false;
        this.sprite.visible = false;
    }
    Update(delta) {
        if (this.randomBehavior.slideDelay >= 0) {
            this.randomBehavior.slideDelay -= delta;
        }
        this.sprite.x -= this.velocity / delta;
        if (this.randomBehavior.slidesDown || this.randomBehavior.slidesUp) {
            if (this.randomBehavior.slideDelay <= 0) {
                if (this.randomBehavior.slideDuration >= 0) {
                    this.randomBehavior.slideDuration -= delta;
                    if (this.randomBehavior.slidesDown) {
                        this.sprite.y += (this.velocity / delta) / 2;
                    }
                    if (this.randomBehavior.slidesUp) {
                        this.sprite.y -= (this.velocity / delta) / 2;
                    }
                }
                else {
                    this.RandomizeBehavior();
                }
            }
        }
        this.collisionRectangle.x = this.sprite.x;
        this.collisionRectangle.y = this.sprite.y;
        if (this.sprite.x <= STAGE_BOUNDS.Left - 40) {
            this.Deactivate();
        }
    }
}
class EnemyShipManager {
    constructor(container) {
        this.enemyships = [];
        this.defaultRespawnTime = 2000;
        this.respawnTime = this.defaultRespawnTime;
        for (var i = 0; i < 10; i++) {
            this.enemyships.push(new Enemy(container));
        }
        this.emitter = new Emitter(100, "right", container, ["fuelParticle"]);
    }
    Update(delta) {
        this.emitter.Update();
        for (let ship of this.enemyships) {
            if (ship.alive) {
                ship.Update(delta);
                var roll = Math.random();
                if (roll > 0.45 || ship.velocity > 120) {
                    this.emitter.Emit(ship.sprite.x + 26 + (roll * 12), ship.sprite.y + 9 + (roll * 16));
                }
            }
        }
        this.respawnTime -= delta;
        if (this.respawnTime <= 0) {
            this.respawnTime = this.defaultRespawnTime - this.respawnTime;
            this.SpawnEnemyShip();
        }
    }
    SpawnEnemyShip() {
        for (let ship of this.enemyships) {
            if (!ship.alive) {
                this.respawnTime = 2000;
                return ship.Spawn();
            }
        }
    }
}
class Missile extends PIXI.Sprite {
    constructor(texture, maxVelocity, container) {
        super(texture);
        this.maxVelocity = maxVelocity;
        this.velocity = 70;
        this.alive = false;
        this.visible = false;
        this.collisionRectangle = new PIXI.Rectangle(0, 0, this.width, this.height);
        container.addChild(this);
    }
    Update(delta) {
        if (!this.alive) {
            return;
        }
        if (this.velocity < this.maxVelocity) {
            this.velocity += 4;
        }
        this.position.x += this.velocity / delta;
        if (this.position.x > STAGE_BOUNDS.Right + 50) {
            this.Deactivate();
        }
        this.collisionRectangle.x = this.x;
        this.collisionRectangle.y = this.y;
    }
    Deactivate() {
        this.alive = false;
        this.visible = false;
    }
    ActivateAt(x, y) {
        this.alive = true;
        this.velocity = 70;
        this.x = x;
        this.y = y;
        this.visible = true;
        this.collisionRectangle.x = this.x;
        this.collisionRectangle.y = this.y;
    }
}
class Shooter {
    constructor(app) {
        this.app = app;
        this.Update = () => {
            this.CheckForCollisions();
            this.playerShip.Update(this.app.ticker.elapsedMS);
            this.background.Update(this.app.ticker.elapsedMS);
            this.enemyManager.Update(this.app.ticker.elapsedMS);
        };
        this.CleanUp = () => {
            window.onkeydown = null;
            window.onkeyup = null;
            this.app.stage.removeChild(this.sceneDisplay);
            this.sceneDisplay.destroy();
            var helpText = document.getElementById("helpText");
            if (helpText) {
                helpText.classList.add('hidden');
            }
        };
        this.SetupContainers();
        this.background = new ScrollingBackground(this.backgroundLayer);
        this.playerShip = new PlayerShip(this.shipLayer);
        this.enemyManager = new EnemyShipManager(this.shipLayer);
        this.explosionManager = new ExplosionManager(this.app, this.effectLayer);
        app.stage.addChild(this.sceneDisplay);
        this.CreateGameOverText();
        var EventHandler = (ev, boundHandler, boundShootingHandler) => {
            switch (ev.keyCode) {
                case 38:
                case 87:
                    {
                        boundHandler(DIRECTIONS.Up);
                    }
                    break;
                case 37:
                case 65:
                    {
                        boundHandler(DIRECTIONS.Left);
                    }
                    break;
                case 40:
                case 83:
                    {
                        boundHandler(DIRECTIONS.Down);
                    }
                    break;
                case 39:
                case 68:
                    {
                        boundHandler(DIRECTIONS.Right);
                    }
                    break;
                case 13:
                case 32:
                    {
                        boundShootingHandler();
                    }
                    break;
                default: return;
            }
        };
        var KeyDownEvent = (ev) => { EventHandler(ev, this.playerShip.AddForceFromDirection, this.playerShip.PullTrigger); };
        var KeyUpEvent = (ev) => { EventHandler(ev, this.playerShip.RemoveForceFromDirection, this.playerShip.ReleaseTrigger); };
        window.onkeydown = KeyDownEvent;
        window.onkeyup = KeyUpEvent;
        var helpText = document.getElementById("helpText");
        if (helpText) {
            helpText.classList.remove('hidden');
        }
    }
    CreateGameOverText() {
        var defaultStyle = { fontFamily: 'Segoe Ui', fontSize: 40, fill: 'whitesmoke', align: 'center' };
        var text = new PIXI.Text("GAME OVER", defaultStyle);
        text.x = 260;
        text.y = 200;
        this.gameOverDisplay = text;
        text.visible = false;
        this.effectLayer.addChild(text);
    }
    ShowGameOverText() {
        this.gameOverDisplay.visible = true;
    }
    IsOverlapping(a, b) {
        if (((b.x > a.x && a.x + a.width > b.x) || (b.x < a.x && b.x + b.width > a.x)) &&
            ((b.y > a.y && a.y + a.height > b.y) || (b.y < a.y && b.y + b.height > a.y))) {
            return true;
        }
        return false;
    }
    CheckForCollisions() {
        for (let missile of this.playerShip.missiles) {
            if (!missile.alive) {
                continue;
            }
            for (let ship of this.enemyManager.enemyships) {
                if (!ship.alive) {
                    continue;
                }
                if (this.IsOverlapping(missile.collisionRectangle, ship.collisionRectangle) === true) {
                    missile.Deactivate();
                    ship.Deactivate();
                    this.explosionManager.Explode(ship.sprite.x + 10, ship.sprite.y + 10);
                }
            }
        }
        for (let ship of this.enemyManager.enemyships) {
            if (!ship.alive) {
                continue;
            }
            if (this.IsOverlapping(this.playerShip.collisionRectangle, ship.collisionRectangle) === true) {
                this.explosionManager.Explode(ship.sprite.x + 10, ship.sprite.y + 10);
                ship.Deactivate();
                this.explosionManager.Explode(this.playerShip.sprite.x + 30, this.playerShip.sprite.y + 30, () => {
                    this.ShowGameOverText();
                    this.app.ticker.remove(this.Update);
                    setTimeout(() => {
                        this.CleanUp();
                        menu = new ShooterMenu(game);
                    }, 2000);
                });
                this.playerShip.sprite.visible = false;
                this.playerShip.alive = false;
                return;
            }
        }
    }
    SetupContainers() {
        this.sceneDisplay = new PIXI.Container();
        this.backgroundLayer = new PIXI.Container();
        this.shipLayer = new PIXI.Container();
        this.effectLayer = new PIXI.Container();
        this.sceneDisplay.addChild(this.backgroundLayer);
        this.sceneDisplay.addChild(this.shipLayer);
        this.sceneDisplay.addChild(this.effectLayer);
    }
}
class ExplosionManager {
    constructor(app, container) {
        this.app = app;
        this.container = container;
        this.explosions = [];
        this.directionGuide = [
            { x: 0, y: -1 }, { x: 0.33, y: -0.66 }, { x: 0.5, y: -0.5 },
            { x: 0.73, y: -0.33 }, { x: 1, y: 0 },
            { x: 0.66, y: 0.33 }, { x: 0.5, y: 0.5 },
            { x: 0.33, y: 0.66 }, { x: 0, y: 1 },
            { x: -0.66, y: 0.66 }, { x: -0.5, y: 0.33 }, { x: 0.33, y: 0.6 }
        ];
        for (var i = 0; i < 10; i++) {
            var explosion = new PIXI.particles.ParticleContainer(10);
            explosion.visible = false;
            for (var j = 0; j < 12; j++) {
                var sprite = PIXI.Sprite.fromImage('particle');
                sprite.visible = true;
                explosion.addChild(sprite);
            }
            this.container.addChild(explosion);
            this.explosions.push(explosion);
        }
    }
    Explode(originX, originY, callback) {
        for (let group of this.explosions) {
            if (!group.visible) {
                var duration = 500;
                group.x = originX;
                group.y = originY;
                for (let sprite of group.children) {
                    sprite.position.set(0, 0);
                    sprite.alpha = 1.0;
                }
                var affectedGroup = group;
                var ProgressExplosion = () => {
                    var delta = this.app.ticker.elapsedMS;
                    duration -= delta;
                    if (duration <= 0) {
                        this.app.ticker.remove(ProgressExplosion);
                        group.visible = false;
                        if (callback) {
                            callback();
                        }
                    }
                    else {
                        for (var i = 0; i < 12; i++) {
                            var item = affectedGroup.children[i];
                            if (item) {
                                item.x = this.directionGuide[i].x * ((500 - duration) / 2.1);
                                item.y = this.directionGuide[i].y * ((500 - duration) / 2.1);
                                item.alpha = item.alpha * 0.85;
                                item.rotation += 0.15;
                            }
                        }
                    }
                };
                this.app.ticker.add(ProgressExplosion);
                group.visible = true;
                return;
            }
        }
    }
}
function PickOne(names) {
    return names[Math.floor(Math.random() * names.length)];
}
class Emitter {
    constructor(poolsize, particleDirection, container, assetNames) {
        this.poolsize = poolsize;
        this.particleDirection = particleDirection;
        this.container = container;
        this.Update = () => {
            for (let piece of this.particles.children) {
                if (!piece.visible) {
                    continue;
                }
                else {
                    piece.alpha -= 0.033;
                    this.UpdateParticleByDirection(piece);
                    if (piece.alpha < 0) {
                        piece.alpha = 1.0;
                        piece.visible = false;
                    }
                }
            }
        };
        this.Emit = (originX, originY) => {
            var particle = this.particles.getChildAt(this.counter);
            particle.position.set(originX, originY);
            particle.visible = true;
            particle.scale.set(1.0 + Math.random() * 0.45);
            this.counter++;
            if (this.counter >= this.poolsize - 1) {
                this.counter = 0;
            }
        };
        this.Clear = () => {
            for (let particle of this.particles.children) {
                particle.visible = false;
                particle.alpha = 1.0;
            }
        };
        this.particles = new PIXI.Container();
        for (var i = 0; i < poolsize; i++) {
            var particle = PIXI.Sprite.fromImage(PickOne(assetNames));
            particle.visible = false;
            this.particles.addChild(particle);
        }
        container.addChild(this.particles);
        this.counter = 0;
        switch (particleDirection) {
            case "left":
                {
                    this.UpdateParticleByDirection = function (particle) {
                        particle.x -= 1.50;
                    };
                }
                break;
            case "right":
                {
                    this.UpdateParticleByDirection = function (particle) {
                        particle.x += 0.33;
                    };
                }
                break;
            case "up":
                {
                    this.UpdateParticleByDirection = function (particle) {
                        particle.y -= 0.33;
                    };
                }
                break;
            case "down": {
                this.UpdateParticleByDirection = function (particle) {
                    particle.y += 0.33;
                };
            }
        }
    }
}
class ShooterMenu {
    constructor(app) {
        this.app = app;
        this.CleanUp = () => {
            this.app.stage.removeChild(this.menuContainer);
            this.shipSpawner.StopShipSequence();
            this.shipSpawner.emitter.Clear();
            this.menuContainer.destroy();
        };
        this.StartGame = () => {
            this.CleanUp();
            var shooter = new Shooter(this.app);
            this.app.ticker.add(shooter.Update);
        };
        this.Update = () => {
        };
        this.menuContainer = new PIXI.Container();
        var bg = PIXI.Sprite.fromImage("tileBackground");
        this.menuContainer.addChild(bg);
        this.splashArt = PIXI.Sprite.fromImage('splashArt');
        var effectLayer = new PIXI.Container();
        this.menuContainer.addChild(effectLayer);
        var shipLayer = new PIXI.Container();
        this.menuContainer.addChild(shipLayer);
        this.shipSpawner = new MainmenuShipManager(shipLayer, effectLayer);
        var defaultStyle = { fontFamily: 'Segoe Ui', fontSize: 32, fill: 'lightblue', dropShadow: false,
            align: 'center' };
        var fancyStyle = { fontFamily: 'Segoe Ui', fontSize: 46, fill: 'whitesmoke', dropShadowDistance: 2,
            dropShadow: true, dropShadowColor: 'darkgray', stroke: true };
        this.CreateTextButtons(false, 'Fancy Shooter Deluxe', 10, 0, fancyStyle);
        this.CreateTextButtons(true, 'GAME1', 20, 100, defaultStyle, this.StartGame);
        this.CreateTextButtons(true, 'GAME2', 20, 160, defaultStyle, this.StartGame);
        this.CreateTextButtons(true, 'GAME3', 20, 220, defaultStyle, this.StartGame);
        this.CreateTextButtons(true, 'EXIT', 20, 280, defaultStyle, () => {
            document.location.href = 'http://www.playngo.com/';
        });
        var fadeInCounter = 0;
        var shipSpawnStarted = false;
        this.FadeInPlanet = () => {
            fadeInCounter += app.ticker.elapsedMS;
            bg.alpha = (fadeInCounter / 1500);
            if (bg.alpha >= 0.45 && !shipSpawnStarted) {
                this.shipSpawner.StartShipSequence();
                shipSpawnStarted = true;
            }
            if (bg.alpha >= 1.0) {
                app.ticker.remove(this.FadeInPlanet);
            }
        };
        var splashDuration = 2000;
        var fadeOutCounter = 500;
        this.FadeInSplashArt = () => {
            splashDuration -= app.ticker.elapsedMS;
            if (splashDuration < 0) {
                fadeOutCounter -= app.ticker.elapsedMS;
                this.splashArt.alpha = (fadeOutCounter / 1000);
            }
            if (this.splashArt.alpha <= 0) {
                app.stage.addChild(this.menuContainer);
                this.app.ticker.remove(this.FadeInSplashArt);
                this.app.ticker.add(this.FadeInPlanet);
            }
        };
        if (splashArtShownYet === false) {
            app.stage.addChild(this.splashArt);
            this.app.ticker.add(this.FadeInSplashArt);
            splashArtShownYet = true;
        }
        else {
            this.app.stage.addChild(this.menuContainer);
            this.app.ticker.add(this.FadeInPlanet);
        }
    }
    CreateTextButtons(coloredGraphics, content, x, y, style, clickhandler) {
        var textGroup = new PIXI.Container();
        var text = new PIXI.Text(content, style);
        var graphics = new PIXI.Graphics();
        text.x = x;
        text.y = y;
        textGroup.addChild(graphics);
        textGroup.addChild(text);
        var targetRect = text.getBounds();
        if (coloredGraphics) {
            graphics.beginFill(0x15295F, 1);
            graphics.drawRoundedRect(targetRect.x - 10, targetRect.y - 5, targetRect.width + 20, targetRect.height + 10, 15);
            graphics.endFill();
        }
        graphics.cacheAsBitmap = true;
        this.menuContainer.addChild(textGroup);
        if (clickhandler) {
            graphics.interactive = true;
            graphics.addListener('click', clickhandler);
            graphics.buttonMode = true;
            var originalStyle = style.fill;
            graphics.addListener('mouseover', () => {
                text.style.fill = 'whitesmoke';
            });
            graphics.addListener('mouseout', () => {
                text.style.fill = originalStyle;
            });
        }
    }
}
class MainmenuShipManager {
    constructor(container, emitterContainer) {
        this.ships = [];
        this.defaultRespawnTime = 600;
        this.StartShipSequence = () => {
            for (let ship of this.ships) {
                ship.visible = false;
                ship.y = 680;
            }
            game.ticker.add(this.Update);
        };
        this.StopShipSequence = () => {
            for (let ship of this.ships) {
                ship.visible = false;
                ship.y = -200;
            }
            game.ticker.remove(this.Update);
        };
        this.Update = () => {
            this.emitter.Update();
            this.respawnTime -= game.ticker.elapsedMS;
            if (this.respawnTime <= 0) {
                this.respawnTime = this.defaultRespawnTime;
                for (let ship of this.ships) {
                    if (!ship.visible && ship.y > 600) {
                        ship.visible = true;
                        return;
                    }
                }
            }
            for (let ship of this.ships) {
                if (!ship.visible) {
                    continue;
                }
                ship.y -= 30 / game.ticker.elapsedMS;
                if (ship.y < 400) {
                    ship.y -= 50 / game.ticker.elapsedMS;
                }
                if (ship.y < -2500) {
                    return this.StopShipSequence();
                }
                var roll = Math.random();
                if (roll > 0.8 || (ship.y < 400 && roll > 0.4)) {
                    this.emitter.Emit(ship.x + 15 + (roll * 15), ship.y + (roll * 10));
                    if (ship.y < 400) {
                        this.emitter.Emit(ship.x + 14 + (roll * 10), ship.y + 24 + (roll * 10));
                    }
                }
            }
        };
        this.respawnTime = 33;
        for (var i = 0; i < 8; i++) {
            var ship = PIXI.Sprite.fromImage("mainMenuEnemy");
            ship.x = 730 - (i * 80);
            ship.y = 680;
            ship.visible = false;
            this.ships.push(ship);
            container.addChild(ship);
        }
        this.emitter = new Emitter(320, "down", emitterContainer, ["fuelParticle"]);
    }
}
var menu;
var game = new PIXI.Application(800, 600);
var splashArtShownYet = false;
document.body.appendChild(game.view);
game.loader
    .add('playerShip', 'assets/ship.png')
    .add('splashArt', 'assets/splashart_without_any_art.png')
    .add('missile', 'assets/missile_darker.png')
    .add('tileDeepspace', 'assets/tile_deepspace.png')
    .add('tilePlanets', 'assets/tile_planetlayer_special.png')
    .add('enemies', 'assets/enemies.png')
    .add('particle', 'assets/particle.png')
    .add('fuelParticle', 'assets/fuel_particle.png')
    .add('tileBackground', 'assets/tile_background.png')
    .add('mainMenuEnemy', 'assets/main_menu_enemy.png')
    .add('fuelParticleBlue', 'assets/fuel_particle_blue.png')
    .add('fuelParticleBlueAlternate', 'assets/fuel_particle_blue_alternate.png');
game.loader.load(function () {
    var loading = document.getElementById('loading');
    loading.classList.add('hidden');
    menu = new ShooterMenu(game);
});
//# sourceMappingURL=game.js.map