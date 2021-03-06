import {Emitter} from './emitter';
import {Shooter} from './shooter';

declare var splashArtShownYet;
declare var game: PIXI.Application;

export class ShooterMenu
{
    public menuContainer: PIXI.Container;
    public shipSpawner: MainmenuShipManager;
    public splashArt: PIXI.Sprite;

    public FadeInPlanet: ()=>void;
    public FadeInSplashArt: ()=>void;

    constructor(public app: PIXI.Application)
    {
        this.menuContainer = new PIXI.Container();
        const bg = PIXI.Sprite.fromImage("tileBackground");
        this.menuContainer.addChild(bg);
        this.splashArt = PIXI.Sprite.fromImage('splashArt');
        const effectLayer = new PIXI.Container();
        this.menuContainer.addChild(effectLayer);

        const shipLayer = new PIXI.Container();
        this.menuContainer.addChild(shipLayer);
        this.shipSpawner = new MainmenuShipManager(shipLayer,effectLayer);

        const defaultStyle = {fontFamily : 'Segoe Ui', fontSize: 32, fill : 'lightblue', dropShadow: false,
        align: 'center' };
        const fancyStyle = {fontFamily : 'Segoe Ui', fontSize: 46, fill : 'whitesmoke', dropShadowDistance: 2,
        dropShadow: true, dropShadowColor: 'darkgray', stroke: true };

        this.CreateTextButtons(false,'Fancy Shooter Deluxe',10,0,fancyStyle);
        this.CreateTextButtons(true,'GAME1',20,100,defaultStyle,this.StartGame);
        this.CreateTextButtons(true,'GAME2',20,160,defaultStyle,this.StartGame);
        this.CreateTextButtons(true,'GAME3',20,220,defaultStyle,this.StartGame);
        this.CreateTextButtons(true, 'EXIT',20,280,defaultStyle,()=>{
            document.location.href = 'http://www.playngo.com/';
        });

        let fadeInCounter = 0;
        let shipSpawnStarted = false;
        this.FadeInPlanet = ()=>{
            fadeInCounter += app.ticker.elapsedMS;
            bg.alpha = (fadeInCounter/1500);
            if (bg.alpha >= 0.45 && !shipSpawnStarted){
                this.shipSpawner.StartShipSequence();
                shipSpawnStarted = true;
            }
            if (bg.alpha >= 1.0){
                app.ticker.remove(this.FadeInPlanet);
            }
        };

        let splashDuration = 2000;
        let fadeOutCounter = 500;
        this.FadeInSplashArt = ()=>
        {
            splashDuration -= app.ticker.elapsedMS;
            if (splashDuration <0){
                fadeOutCounter -= app.ticker.elapsedMS;
                this.splashArt.alpha = (fadeOutCounter/1000);
            }

            if (this.splashArt.alpha <= 0)
            {
                app.stage.addChild(this.menuContainer);
                this.app.ticker.remove(this.FadeInSplashArt);
                this.app.ticker.add(this.FadeInPlanet);
            }
        };

        if (splashArtShownYet === false ){
            app.stage.addChild(this.splashArt);
            this.app.ticker.add(this.FadeInSplashArt);
            splashArtShownYet = true;
        } else {
            this.app.stage.addChild(this.menuContainer);
            this.app.ticker.add(this.FadeInPlanet);
        }
    }

    public CleanUp = ()=>
    {
        this.app.stage.removeChild(this.menuContainer);
        this.shipSpawner.StopShipSequence();
        this.shipSpawner.emitter.Clear();
        this.menuContainer.destroy();
    }

    public CreateTextButtons(coloredGraphics: boolean, content: string, x: number,y: number,style,clickhandler?: ()=>any)
    {

        const textGroup = new PIXI.Container();
        const text = new PIXI.Text(content, style);
        const graphics = new PIXI.Graphics();
        text.x = x; text.y = y;

        textGroup.addChild(graphics);
        textGroup.addChild(text);
        const targetRect = text.getBounds();
        if (coloredGraphics)
        {
            graphics.beginFill(0x15295F,1);
            graphics.drawRoundedRect(targetRect.x-10,targetRect.y-5,targetRect.width+20,targetRect.height+10,15);
            graphics.endFill();
        }
        graphics.cacheAsBitmap = true;
        this.menuContainer.addChild(textGroup);

        if (clickhandler){
            graphics.interactive = true;
            graphics.addListener('click',clickhandler);
            graphics.buttonMode = true;

            const originalStyle = style.fill;
            graphics.addListener('mouseover',()=>{
                text.style.fill = 'whitesmoke';
            });
            graphics.addListener('mouseout',()=>{
                text.style.fill = originalStyle;

            });
        }
    }

    public StartGame =()=>
    {
        this.CleanUp();
        const shooter = new Shooter(this.app);
        this.app.ticker.add(shooter.Update);
    }
}

class MainmenuShipManager
{
    public emitter: Emitter;
    public ships = [] as PIXI.Sprite[];
    private defaultRespawnTime = 600;
    private respawnTime: number;

    constructor(container: PIXI.Container,emitterContainer: PIXI.Container)
    {
        this.respawnTime = 33;
        for (let i = 0; i<8; i++)
        {
            const ship = PIXI.Sprite.fromImage("mainMenuEnemy");
            ship.x = 730-(i*80);
            ship.y = 680;
            ship.visible = false;
            this.ships.push(ship);
            container.addChild(ship);
        }
        this.emitter = new Emitter(320,"down",emitterContainer,["fuelParticle"]);
    }

    public StartShipSequence = ()=>
    {
        for (const ship of this.ships)
        {
            ship.visible = false;
            ship.y = 680;
        }
        game.ticker.add(this.Update);
    }

    public StopShipSequence = ()=>
    {
        for (const ship of this.ships)
        {
            ship.visible = false;
            ship.y = -200;
        }
        game.ticker.remove(this.Update);
    }

    public Update = ()=>
    {
        this.emitter.Update();
        this.respawnTime -= game.ticker.elapsedMS;

        if (this.respawnTime <= 0)
        {
            this.respawnTime = this.defaultRespawnTime;
            for (const ship of this.ships){
                if (!ship.visible && ship.y > 600)
                {
                    ship.visible = true; return;
                }
            }
        }

        for (const ship of this.ships)
        {
            if (!ship.visible) { continue; }
            ship.y -= 30/game.ticker.elapsedMS;
            if (ship.y < 400) { ship.y -= 50/game.ticker.elapsedMS; }
            if (ship.y < -2500){
                return this.StopShipSequence();
            }
            const roll = Math.random();
            if (roll > 0.8 || (ship.y < 400 && roll > 0.4))
            {
                this.emitter.Emit(ship.x+15+(roll*15),ship.y+(roll*10));
                if (ship.y < 400){
                    this.emitter.Emit(ship.x+14+(roll*10),ship.y+24+(roll*10));
                }
            }
        }
    }
}
