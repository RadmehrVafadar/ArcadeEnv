import Phaser from 'phaser';
import { exhibits } from './content.ts';
import { loadWorld, nearbyExhibit, nearRect, type MuseumMap, type Rect } from './model.ts';
import { HeldInput, bindInput, type Direction } from './input.ts';
import { MuseumUI, showError } from './ui.ts';
import mapUrl from './world/museum.tmj?url';
import walkUrl from '../assets/walk.png';

const images = import.meta.glob(['./world/*.png', '!./world/atlas-source.png'], { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const exitToMenu = () => { window.location.href = import.meta.env.BASE_URL; };

export class MuseumScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private world!: ReturnType<typeof loadWorld>;
  private inputState = new HeldInput();
  private ui = new MuseumUI();
  private facing: Direction = 'down';
  private moved = false;
  private debug?: Phaser.GameObjects.Graphics;
  private loadFailed = false;

  constructor() { super('museum'); }

  preload() {
    this.load.tilemapTiledJSON('museum', mapUrl);
    this.load.spritesheet('visitor', walkUrl, { frameWidth: 64, frameHeight: 64 });
    for (const [path, url] of Object.entries(images)) {
      if (!path.endsWith('atlas-source.png')) this.load.image(path.split('/').pop()!.replace('.png', ''), url);
    }
    this.load.on('loaderror', () => {
      this.loadFailed = true;
      showError(new Error('Museum asset failed to load'));
    });
  }

  create() {
    if (this.loadFailed) { this.scene.pause(); return; }
    try { this.createMuseum(); } catch (error) { showError(error); this.scene.pause(); }
  }

  private createMuseum() {
    this.world = loadWorld(this.cache.tilemap.get('museum').data as MuseumMap, exhibits);
    const map = this.make.tilemap({ key: 'museum' });
    const tiles = map.addTilesetImage('museum', 'tiles')!;
    map.createLayer('floor', tiles)!.setDepth(-1000);
    const walls = map.createLayer('walls', tiles)!;
    walls.setCollisionByProperty({ collides: true }).setDepth(-999);
    map.createLayer('foreground', tiles)!.setDepth(10000);
    this.physics.world.setBounds(0, 0, this.world.width, this.world.height);
    const obstacles = this.physics.add.staticGroup();
    for (const object of this.world.objects) {
      this.add.image(object.x, object.y, object.texture).setOrigin(0).setDisplaySize(object.width, object.height)
        .setDepth(object.texture === 'rug' ? -998 : object.y + object.height);
      for (const body of object.bodies) {
        const zone = this.add.zone(body.x + body.width / 2, body.y + body.height / 2, body.width, body.height);
        obstacles.add(zone);
      }
    }
    const { x, y } = this.world.spawn;
    this.player = this.physics.add.sprite(x, y, 'visitor', 18).setOrigin(0.5, 0.875).setScale(0.5);
    this.player.setSize(24, 16).setOffset(20, 48).setCollideWorldBounds(true);
    this.physics.add.collider(this.player, walls);
    this.physics.add.collider(this.player, obstacles);
    for (const [direction, row] of Object.entries({ up: 0, left: 1, down: 2, right: 3 })) {
      this.anims.create({ key: direction, frames: this.anims.generateFrameNumbers('visitor', { frames: [row * 9, row * 9 + 2, row * 9 + 4, row * 9 + 6] }), frameRate: 8, repeat: -1 });
    }
    const disposeInput = bindInput(document.querySelector('.frame')!, this.inputState, open => this.act(open), exitToMenu);
    const pause = () => { this.inputState.clear(); this.player.setVelocity(0); this.physics.world.pause(); };
    const resume = () => { if (!document.hidden) this.physics.world.resume(); };
    const visibility = () => document.hidden ? pause() : resume();
    window.addEventListener('blur', pause);
    window.addEventListener('focus', resume);
    document.addEventListener('visibilitychange', visibility);
    // Pointer entry can restore focus to an embedded game after a project tab closes.
    const focus = () => { window.focus(); resume(); };
    document.addEventListener('pointerdown', focus);
    this.events.once('shutdown', () => {
      disposeInput();
      window.removeEventListener('blur', pause);
      window.removeEventListener('focus', resume);
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('pointerdown', focus);
    });
    this.resize();
    this.scale.on('resize', this.resize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.resize, this));
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('debug')) {
      walls.renderDebug(this.add.graphics().setDepth(19999), { tileColor: null, collidingTileColor: new Phaser.Display.Color(255, 136, 119, 80), faceColor: new Phaser.Display.Color(255, 136, 119) });
      this.debug = this.add.graphics().setDepth(20000);
    }
    this.ui.ready();
    // Input must reach velocity before Arcade steps; publish state after it syncs the sprite.
    this.events.on(Phaser.Scenes.Events.PRE_UPDATE, this.movePlayer, this);
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.updateMuseum, this);
    this.events.once('shutdown', () => {
      this.events.off(Phaser.Scenes.Events.PRE_UPDATE, this.movePlayer, this);
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.updateMuseum, this);
    });
    this.game.canvas.setAttribute('aria-label', 'Pixel museum. Explore with WASD or arrow keys.');
  }

  private resize() {
    if (!this.world) return;
    const camera = this.cameras.main;
    // Frame the hallway width, then move 15% closer.
    const zoom = this.scale.width / (this.world.width - this.world.tileSize) * 1.15;
    camera.setZoom(zoom).setRoundPixels(true);
    const viewWidth = this.scale.width / zoom, viewHeight = this.scale.height / zoom;
    // Expand undersized bounds symmetrically so following cannot pin the room to one edge.
    camera.setBounds(Math.min(0, (this.world.width - viewWidth) / 2), Math.min(0, (this.world.height - viewHeight) / 2),
      Math.max(viewWidth, this.world.width), Math.max(viewHeight, this.world.height));
    camera.startFollow(this.player, true, 1, 1);
  }

  private act(open: boolean) {
    if (!this.player) return;
    if (nearRect(this.player.x, this.player.y, this.world.exit)) { exitToMenu(); return; }
    const object = nearbyExhibit(this.player.x, this.player.y, this.world.objects);
    if (!object?.exhibit) return;
    this.ui.show(object.exhibit);
    // Keep this synchronous with the user gesture so popup blockers permit it.
    if (open) { this.inputState.clear(); this.player.setVelocity(0); window.open(object.exhibit.url, '_blank', 'noopener,noreferrer'); }
  }

  private movePlayer() {
    if (!this.player) return;
    const direction = this.inputState.direction;
    const velocity = { up: [0, -120], down: [0, 120], left: [-120, 0], right: [120, 0] };
    const [vx, vy] = direction ? velocity[direction] : [0, 0];
    this.player.setVelocity(vx, vy).setDepth(this.player.y + 4);
    if (direction) { this.facing = direction; this.player.play(direction, true); }
    else { this.player.anims.stop(); this.player.setFrame({ up: 0, left: 9, down: 18, right: 27 }[this.facing]); }
  }

  private updateMuseum() {
    if (!this.player) return;
    const direction = this.inputState.direction;
    this.moved ||= Math.hypot(this.player.x - this.world.spawn.x, this.player.y - this.world.spawn.y) > 0.1;
    const object = nearbyExhibit(this.player.x, this.player.y, this.world.objects);
    this.ui.update(this.moved, object?.exhibit, nearRect(this.player.x, this.player.y, this.world.exit));
    // Read-only diagnostics let browser tests observe the real simulation without teleport hooks.
    Object.assign(this.game.canvas.dataset, {
      ready: 'true',
      playerX: String(this.player.x), playerY: String(this.player.y),
      facing: this.facing, walking: String(Boolean(direction)),
      worldWidth: String(this.world.width), worldHeight: String(this.world.height),
      cameraX: String(this.cameras.main.worldView.x), cameraY: String(this.cameras.main.worldView.y),
      zoom: String(this.cameras.main.zoom),
    });
    if (this.debug) {
      const draw = (rect: Rect, color: number) => this.debug!.lineStyle(1, color).strokeRect(rect.x, rect.y, rect.width, rect.height);
      this.debug.clear();
      draw(this.world.exit, 0x77ffcc);
      draw({ x: this.player.x - 6, y: this.player.y - 4, width: 12, height: 8 }, 0xffffff);
      draw({ x: this.world.spawn.x - 2, y: this.world.spawn.y - 2, width: 4, height: 4 }, 0x77ffcc);
      for (const item of this.world.objects) for (const body of item.bodies) {
        draw(body, 0xff8877);
        if (item.exhibit) this.debug.lineStyle(1, 0xffdd77).strokeRoundedRect(body.x - item.padding, body.y - item.padding, body.width + item.padding * 2, body.height + item.padding * 2, item.padding);
      }
    }
  }
}
