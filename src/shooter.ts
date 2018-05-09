import {Emitter} from './emitter';
import {ShooterMenu} from './shootermenu';

declare var game: PIXI.Application;
declare var menu: ShooterMenu;

const DIRECTIONS = {
    Left: "left", Right: "right", Up: "up", Down: "down",
};

const STAGE_BOUNDS ={
    Left: 0, Right: 720, Up: 0, Down: 520,
};

interface ICollidable
{
    collisionRectangle: PIXI.Rectangle;
    alive: boolean;
}

interface IBullet extends ICollidable{
    velocity: number;
}

class PlayerShip implements ICollidable {

    public position: PIXI.Point;
    public collisionRectangle: PIXI.Rectangle;
    public alive = true;
    public sprite: PIXI.Sprite;
    public missiles = [] as Missile[];
    private missileCooldown: number;
    private defaultMissileCooldown = 166;
    private emitter: Emitter;
    private activeDirections: { [direction: string]: boolean };
    private velocity = 100;

    private triggerHeld: boolean;

    constructor(container: PIXI.Container)
    {
        const shipTexture = PIXI.Sprite.fromImage('playerShip');
        const missileTexture = PIXI.Texture.fromImage('missile');
        this.sprite = shipTexture;
        this.collisionRectangle = new PIXI.Rectangle(this.sprite.x+5,this.sprite.y+3,this.sprite.width,this.sprite.height);
        this.SpawnAt(40,300);
        this.activeDirections = {};
        this.missileCooldown = 0;
        this.emitter = new Emitter(60,"left",container,["fuelParticleBlue","fuelParticleBlueAlternate"]);

        for (const key in DIRECTIONS)
        {
            if (DIRECTIONS.hasOwnProperty(key)){
            this.activeDirections[key] = false;
            }
        }

        for (let i = 0; i<25;i++)
        {
            this.missiles.push(new Missile(missileTexture,180,container));
        }

        container.addChild(shipTexture);
    }

    public SpawnAt(x: number, y: number)
    {
        this.sprite.position.set(x,y);
        this.collisionRectangle.x = this.sprite.position.x;
        this.collisionRectangle.y = this.sprite.position.y;
    }

    public PullTrigger = ()=>{ this.triggerHeld = true; if (this.missileCooldown <= 0 ){ this.TryToSpawnMissile(); }};

    public ReleaseTrigger = ()=>{
         this.triggerHeld = false;
    }

    public AddForceFromDirection = (direction: string)=>{
        this.activeDirections[direction] = true;
    }

    public RemoveForceFromDirection = (direction: string)=>{
        this.activeDirections[direction] = false;
    }

    public TryToSpawnMissile =()=>{
        if (!this.alive) { return; }
        for (const missile of this.missiles)
        {
            if (!missile.alive){
                missile.ActivateAt(this.sprite.x+5,this.sprite.y+30);
                this.missileCooldown = this.defaultMissileCooldown;
                return;
            }
        }
    }

    public Update = (deltaTime: number)=>
    {
        this.emitter.Update();
        this.missileCooldown -= deltaTime;
        if (this.missileCooldown <= 0 && this.triggerHeld === true){
            this.TryToSpawnMissile();
        }

        for (const missile of this.missiles){
            missile.Update(deltaTime);
        }

        if (!this.alive) { return; }
        const amountMoved = this.velocity/deltaTime;
        let burningFuel = false;

        if (this.activeDirections[DIRECTIONS.Right] === true){
            burningFuel = true;
            if (this.sprite.position.x < STAGE_BOUNDS.Right) {this.sprite.position.x += amountMoved; }
         }

        else if (this.activeDirections[DIRECTIONS.Left] === true){
            // Mert nem néz ki jól, ha visszafelé megyünk, és akkor is égetjük az üzemanyagot
            if (this.sprite.position.x > STAGE_BOUNDS.Left) { this.sprite.position.x -= amountMoved; }
        }

        if (this.activeDirections[DIRECTIONS.Up] === true)
        {
            burningFuel = true;
            if (this.sprite.position.y > STAGE_BOUNDS.Up) { this.sprite.position.y -= amountMoved; }
        }

        else if (this.activeDirections[DIRECTIONS.Down] === true){
            burningFuel = true;
            if (this.sprite.position.y < STAGE_BOUNDS.Down) { this.sprite.position.y += amountMoved; }
        }

        this.collisionRectangle = this.sprite.getBounds();
        this.collisionRectangle.width += -15;

        const roll = Math.random();
        if (roll > 0.7)
        {
            this.emitter.Emit(this.sprite.x-6-(roll*6),this.sprite.y+15+(roll*20));
        }
        if (burningFuel && roll > 0.2){
            this.emitter.Emit(this.sprite.x-10-(roll*6),this.sprite.y+12+(roll*30));
        }
    }
}

class ScrollingBackground{

    private backLayer: PIXI.extras.TilingSprite;
    private frontLayer: PIXI.extras.TilingSprite;
    private timeUntilScrolling: number;
    private defaultScrollTime = 33;
    private defaultForegroundScrollTime = 16;
    private timeUntilForegroundScrolling: number;

    constructor(private container: PIXI.Container)
    {
        const backTexture = PIXI.Texture.fromImage('tileDeepspace');
        const frontTexture = PIXI.Texture.fromImage('tilePlanets');
        this.backLayer = new PIXI.extras.TilingSprite(backTexture,800,600);
        this.frontLayer = new PIXI.extras.TilingSprite(frontTexture,800,600);
        container.addChild(this.backLayer);
        container.addChild(this.frontLayer);
        this.timeUntilScrolling = this.defaultScrollTime;
        this.timeUntilForegroundScrolling = this.defaultForegroundScrollTime;
    }

    public Update(delta: number)
    {
        this.UpdateBackLayer(delta);
        this.UpdateFrontLayer(delta);
    }

    private UpdateBackLayer(delta: number){
        this.timeUntilScrolling -= delta;
        if (this.timeUntilScrolling < 0)
        {
            this.timeUntilScrolling = this.defaultScrollTime+this.timeUntilScrolling;
            this.backLayer.tilePosition.x -= 1;
        }
    }

    private UpdateFrontLayer(delta){
        this.timeUntilForegroundScrolling -= delta;
        if (this.timeUntilForegroundScrolling < 0)
        {
            this.timeUntilForegroundScrolling = this.defaultForegroundScrollTime+this.timeUntilForegroundScrolling;
            this.frontLayer.tilePosition.x -= 1;
        }
    }
}

class Enemy implements ICollidable
{
    public collisionRectangle: PIXI.Rectangle;
    public alive: boolean;
    public sprite: PIXI.Sprite;
    public velocity: number;
    private randomBehavior = {
        slidesUp:false,
        slidesDown: false,
        slideDelay: 0, slideDuration: 0,
    };

    constructor( container: PIXI.Container )
    {
        this.sprite = PIXI.Sprite.fromImage("enemies");
        this.sprite.texture.frame = new PIXI.Rectangle(5,7,33,43);
        this.alive = false;
        this.sprite.visible = false;
        container.addChild(this.sprite);
    }

    public Spawn(){
        this.velocity = 50+Math.random()*40;
        this.sprite.visible = true;
        this.alive = true;
        this.sprite.y = Math.round(200+Math.random()*200);
        this.sprite.x = STAGE_BOUNDS.Right+130;
        this.RandomizeBehavior();
        this.collisionRectangle = new PIXI.Rectangle(this.sprite.x,this.sprite.y,
        this.sprite.width,this.sprite.height);
    }

    public RandomizeBehavior(){
        const doesSlide = Math.random();
        this.randomBehavior.slidesDown = false;
        this.randomBehavior.slidesUp = false;

        if (doesSlide > 0.5){
                this.randomBehavior.slidesUp = true;
        }
        else {
            this.randomBehavior.slidesDown = true;
        }
        this.randomBehavior.slideDelay = 200+Math.random()*500;
        this.randomBehavior.slideDuration = 100+Math.random()*1800;
    }

    public Deactivate(){
        this.alive = false;
        this.sprite.visible = false;
    }

    public Update(delta: number){
        if (this.randomBehavior.slideDelay >= 0 ){
            this.randomBehavior.slideDelay -= delta;
        }

        this.sprite.x -= this.velocity/delta;

        if (this.randomBehavior.slidesDown || this.randomBehavior.slidesUp){
            if (this.randomBehavior.slideDelay <= 0){
                if (this.randomBehavior.slideDuration >= 0)
                {
                    this.randomBehavior.slideDuration -= delta;

                    if (this.randomBehavior.slidesDown){ this.sprite.y += (this.velocity/delta)/2;}
                    if (this.randomBehavior.slidesUp){ this.sprite.y -= (this.velocity/delta)/2;}
                }
                else { this.RandomizeBehavior(); }
            }
        }

        this.collisionRectangle.x = this.sprite.x;
        this.collisionRectangle.y = this.sprite.y;
        if (this.sprite.x <= STAGE_BOUNDS.Left-40){
            this.Deactivate();
        }
    }
}

class EnemyShipManager
{
    public enemyships = [] as Enemy[];
    private defaultRespawnTime = 2000;
    private respawnTime: number;
    private spawnUpwards: boolean;
    private emitter: Emitter;

    constructor(container: PIXI.Container){

        this.respawnTime = this.defaultRespawnTime;
        for (let i = 0; i<10; i++){
            this.enemyships.push(new Enemy(container));
        }
        this.emitter = new Emitter(100,"right",container,["fuelParticle"]);
    }

    public Update(delta: number)
    {
        this.emitter.Update();

        for (const ship of this.enemyships){
            if (ship.alive){
                ship.Update(delta);
                const roll = Math.random();
                if (roll > 0.45 || ship.velocity > 120)
                {
                    this.emitter.Emit(ship.sprite.x+26+(roll*12),ship.sprite.y+9+(roll*16));
                }
            }
        }

        this.respawnTime -= delta;
        if (this.respawnTime <= 0)
        {
            this.respawnTime = this.defaultRespawnTime-this.respawnTime;
            this.SpawnEnemyShip();
        }

    }

    private SpawnEnemyShip()
    {
        for (const ship of this.enemyships)
        {
            if (!ship.alive){
                this.respawnTime = 2000;
                return ship.Spawn();
            }
        }
    }
}

class Missile extends PIXI.Sprite implements IBullet
{
    public maxVelocity: number;
    public velocity: number;
    public alive: boolean;
    public collisionRectangle: PIXI.Rectangle;

    constructor(texture: PIXI.Texture, maxVelocity: number, container: PIXI.Container){
        super(texture);
        this.maxVelocity = maxVelocity;
        this.velocity = 70;
        this.alive = false;
        this.visible = false;
        this.collisionRectangle = new PIXI.Rectangle(0,0,this.width,this.height);
        container.addChild(this);
    }

    public Update(delta: number)
    {
        if (! this.alive) { return; }

        if (this.velocity < this.maxVelocity)
        {
            this.velocity += 4;
        }
        this.position.x += this.velocity/delta;
        if (this.position.x > STAGE_BOUNDS.Right+50){
            this.Deactivate();
        }
        this.collisionRectangle.x = this.x; this.collisionRectangle.y = this.y;
    }

    public Deactivate()
    {
        this.alive = false; this.visible = false;
    }

    public ActivateAt(x: number,y: number)
    {
        this.alive = true;
        this.velocity = 70;
        this.x = x;
        this.y = y;
        this.visible = true;
        this.collisionRectangle.x = this.x; this.collisionRectangle.y = this.y;
    }
}

export class Shooter
{
    public playerShip: PlayerShip;
    public background: ScrollingBackground;
    public enemyManager: EnemyShipManager;
    public explosionManager: ExplosionManager;
    public sceneDisplay: PIXI.Container;
    public backgroundLayer: PIXI.Container;
    public shipLayer: PIXI.Container;
    public effectLayer: PIXI.Container;
    public gameOverDisplay: PIXI.Text;

    constructor( private app: PIXI.Application )
    {
        this.SetupContainers();
        this.background = new ScrollingBackground(this.backgroundLayer);
        this.playerShip = new PlayerShip(this.shipLayer);
        this.enemyManager = new EnemyShipManager(this.shipLayer);
        this.explosionManager = new ExplosionManager(this.app,this.effectLayer);
        app.stage.addChild(this.sceneDisplay);
        this.CreateGameOverText();
        const EventHandler = (ev: KeyboardEvent, boundHandler: (direction: string)=>void,boundShootingHandler: ()=>void)=>
        {
            switch (ev.keyCode)
            {
                case 38: case 87:  { boundHandler(DIRECTIONS.Up); } break;
                case 37: case 65:  { boundHandler(DIRECTIONS.Left);} break;
                case 40: case 83:  { boundHandler(DIRECTIONS.Down);} break;
                case 39: case 68:  { boundHandler(DIRECTIONS.Right);} break;
                case 13: case 32:  { boundShootingHandler();} break;
                default: return;
            }
        };

        const KeyDownEvent = (ev: KeyboardEvent)=>{ EventHandler(ev,this.playerShip.AddForceFromDirection,this.playerShip.PullTrigger);};
        const KeyUpEvent = (ev: KeyboardEvent)=> { EventHandler(ev,this.playerShip.RemoveForceFromDirection,this.playerShip.ReleaseTrigger);};
        window.onkeydown = KeyDownEvent;
        window.onkeyup = KeyUpEvent;

        const helpText = document.getElementById("helpText") as HTMLElement;
        if (helpText){
            helpText.classList.remove('hidden');
        }
    }

    public Update = ()=>
    {
        this.CheckForCollisions();
        this.playerShip.Update(this.app.ticker.elapsedMS);
        this.background.Update(this.app.ticker.elapsedMS);
        this.enemyManager.Update(this.app.ticker.elapsedMS);
    }

    public CreateGameOverText()
    {
        const defaultStyle = {fontFamily : 'Segoe Ui', fontSize: 40, fill : 'whitesmoke', align: 'center'};
        const text = new PIXI.Text("GAME OVER",defaultStyle);
        text.x = 260;
        text.y = 200;
        this.gameOverDisplay = text;
        text.visible = false;
        this.effectLayer.addChild(text);
    }

    public ShowGameOverText()
    {
        this.gameOverDisplay.visible = true;
    }

    public IsOverlapping(a: PIXI.Rectangle,b: PIXI.Rectangle): boolean
    {
        if (
            ((b.x > a.x && a.x+a.width > b.x) || (b.x < a.x && b.x+b.width > a.x)) &&
            ((b.y > a.y && a.y+a.height > b.y) || (b.y < a.y && b.y+b.height > a.y))
        ){
             return true;
        }
        return false;
    }

    private CheckForCollisions()
    {

        for (const missile of this.playerShip.missiles)
        {
            if (!missile.alive) { continue; }
            for (const ship of this.enemyManager.enemyships)
            {
                if (!ship.alive) { continue; }

                if (this.IsOverlapping(missile.collisionRectangle,ship.collisionRectangle) === true)
                {
                    missile.Deactivate();
                    ship.Deactivate();
                    this.explosionManager.Explode(ship.sprite.x+10,ship.sprite.y+10);
                }
            }
        }

        for (const ship of this.enemyManager.enemyships)
        {
            if (!ship.alive) { continue; }

            if (this.IsOverlapping(this.playerShip.collisionRectangle,ship.collisionRectangle) === true)
            {
                this.explosionManager.Explode(ship.sprite.x+10,ship.sprite.y+10);
                ship.Deactivate();
                this.explosionManager.Explode(this.playerShip.sprite.x+30,this.playerShip.sprite.y+30,()=>{
                    this.ShowGameOverText();
                    this.app.ticker.remove(this.Update);
                    setTimeout(()=>{
                        this.CleanUp();
                        menu = new ShooterMenu(game);
                        },2000);
                    });
                this.playerShip.sprite.visible = false;
                this.playerShip.alive = false;
                return;
            }
        }
    }

    private CleanUp = ()=>
    {
        window.onkeydown = null;
        window.onkeyup = null;
        this.app.stage.removeChild(this.sceneDisplay);
        this.sceneDisplay.destroy();

        const helpText = document.getElementById("helpText") as HTMLElement;
        if (helpText){
            helpText.classList.add('hidden');
        }
    }

    private SetupContainers()
    {
        this.sceneDisplay = new PIXI.Container();
        this.backgroundLayer = new PIXI.Container();
        this.shipLayer = new PIXI.Container();
        this.effectLayer = new PIXI.Container();

        this.sceneDisplay.addChild(this.backgroundLayer);
        this.sceneDisplay.addChild(this.shipLayer);
        this.sceneDisplay.addChild(this.effectLayer);
    }
}

class ExplosionManager
{
    public explosions = [] as PIXI.particles.ParticleContainer[];

    // Ezekbe az irányokba robbannak szét a részecskék
    public directionGuide = [
        {x: 0, y: -1}, {x: 0.33, y: -0.66}, { x: 0.5, y: -0.5},
        {x: 0.73, y: -0.33}, {x: 1, y: 0},
        {x: 0.66, y: 0.33}, {x: 0.5, y: 0.5},
        {x: 0.33, y: 0.66}, {x: 0, y: 1},
        {x: -0.66, y: 0.66}, {x: -0.5, y: 0.33 }, {x: 0.33, y: 0.6},
    ];

    constructor(private app: PIXI.Application, private container: PIXI.Container)
    {
        for (let i = 0; i<10; i++)
        {
            const explosion = new PIXI.particles.ParticleContainer(10);
            explosion.visible = false;
            for (let j = 0; j<12;j++)
            {
                const sprite = PIXI.Sprite.fromImage('particle');
                sprite.visible = true;
                explosion.addChild(sprite);
            }
            this.container.addChild(explosion);
            this.explosions.push(explosion);
        }
    }

    public Explode(originX: number,originY: number,callback?: ()=>any)
    {
        for (const group of this.explosions)
        {
            // Megkeressük az első épp nem használt explosion-csomagot
            if (!group.visible)
            {
                let duration = 500;
                group.x = originX;
                group.y = originY;
                for (const sprite of group.children)
                {
                    sprite.position.set(0,0);
                    sprite.alpha = 1.0;
                }

                const affectedGroup = group;
                const ProgressExplosion = ()=>
                {
                    const delta = this.app.ticker.elapsedMS;
                    duration -= delta;
                    if (duration<= 0){
                        this.app.ticker.remove(ProgressExplosion);
                        group.visible = false;
                        if (callback){
                            callback();
                        }
                    } else
                    {
                        for (let i = 0; i<12;i++)
                        {
                            const item = affectedGroup.children[i];
                            if (item)
                            {
                                item.x = this.directionGuide[i].x*((500-duration)/2.1);
                                item.y = this.directionGuide[i].y*((500-duration)/2.1);
                                item.alpha = item.alpha*0.85;
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
