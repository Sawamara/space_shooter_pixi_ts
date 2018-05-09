export class Emitter
{
    public static PickOne(names: string[]): string
    {
        return names[Math.floor(Math.random()*names.length)];
    }

    public counter: number;
    public particles: PIXI.Container;
    public UpdateParticleByDirection: (particle: PIXI.DisplayObject)=>void;

    constructor(private poolsize: number,private particleDirection: string, private container: PIXI.Container,assetNames: string[])
    {
        this.particles = new PIXI.Container();
        for (let i = 0; i<poolsize;i++)
        {
            const particle = PIXI.Sprite.fromImage(Emitter.PickOne(assetNames));
            particle.visible = false;
            this.particles.addChild(particle);
        }
        container.addChild(this.particles);
        this.counter = 0;

        switch (particleDirection)
        {
            case "left": {
                this.UpdateParticleByDirection = function(particle: PIXI.DisplayObject){
                    particle.x -= 1.50;
                };
                break;
            }

            case "right": {
                this.UpdateParticleByDirection = function(particle: PIXI.DisplayObject){
                    particle.x += 0.33;
                };
                break;
            }

            case "up": {
                this.UpdateParticleByDirection = function(particle: PIXI.DisplayObject){
                    particle.y -= 0.33;
                };
                break;
            }

            case "down":{
                this.UpdateParticleByDirection = function(particle: PIXI.DisplayObject){
                    particle.y += 0.33;
                };
                break;
            }
        }
    }

    public Update = ()=>
    {
        for (const piece of this.particles.children)
        {
            if (!piece.visible){ continue; }
            else {
                piece.alpha -= 0.033;
                this.UpdateParticleByDirection(piece);

                if (piece.alpha <0)
                {
                    piece.alpha = 1.0;
                    piece.visible = false;
                }
            }
        }
    }

    public Emit = (originX: number,originY: number)=>{
            const particle = this.particles.getChildAt(this.counter) as PIXI.Sprite;
            particle.position.set(originX,originY);
            particle.visible = true;
            particle.scale.set(1.0+Math.random()*0.45);
            this.counter++;
            if (this.counter >= this.poolsize-1){
                this.counter = 0;
            }
    }

    public Clear = ()=>{
        for (const particle of this.particles.children)
        {
            particle.visible = false;
            particle.alpha = 1.0;
        }
    }
}
