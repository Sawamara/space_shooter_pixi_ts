
import * as PIXI from 'pixi.js';
import {ShooterMenu} from './shootermenu';

const game = new PIXI.Application(800,600);

interface IGameBundle extends Window
{
    splashArtShownYet: boolean;
    game: PIXI.Application;
    menu: ShooterMenu;
}

const bundle = window as IGameBundle;

bundle.splashArtShownYet = false;
bundle.game = game;
bundle.menu = undefined;

document.body.appendChild(game.view);

game.loader
    .add('playerShip','assets/ship.png')
    .add('splashArt','assets/splashart_without_any_art.png')
    .add('missile','assets/missile_darker.png')
    .add('tileDeepspace','assets/tile_deepspace.png')
    .add('tilePlanets','assets/tile_planetlayer_special.png')
    .add('enemies','assets/enemies.png')
    .add('particle','assets/particle.png')
    .add('fuelParticle','assets/fuel_particle.png')
    .add('tileBackground','assets/tile_background.png')
    .add('mainMenuEnemy','assets/main_menu_enemy.png')
    .add('fuelParticleBlue','assets/fuel_particle_blue.png')
    .add('fuelParticleBlueAlternate','assets/fuel_particle_blue_alternate.png');

game.loader.load(function()
{
    const loading = document.getElementById('loading');
    loading.classList.add('hidden');
    const menu = new ShooterMenu(game);
});
