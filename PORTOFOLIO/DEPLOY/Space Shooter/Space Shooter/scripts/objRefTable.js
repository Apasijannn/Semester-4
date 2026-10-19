const C3 = self.C3;
self.C3_GetObjectRefTable = function () {
	return [
		C3.Plugins.Sprite,
		C3.Behaviors.EightDir,
		C3.Behaviors.bound,
		C3.Behaviors.Bullet,
		C3.Plugins.Keyboard,
		C3.Plugins.Mouse,
		C3.Behaviors.Rotate,
		C3.Plugins.Particles,
		C3.Plugins.Spritefont2,
		C3.Plugins.Keyboard.Cnds.OnKey,
		C3.Plugins.System.Cnds.Every,
		C3.Plugins.Sprite.Acts.Spawn,
		C3.Plugins.Sprite.Acts.SetAngle,
		C3.Plugins.Sprite.Cnds.IsOutsideLayout,
		C3.Plugins.Sprite.Acts.Destroy,
		C3.Plugins.Sprite.Cnds.OnCollision,
		C3.Plugins.Sprite.Acts.SubInstanceVar,
		C3.Plugins.Sprite.Cnds.CompareInstanceVar,
		C3.Plugins.System.Cnds.PickRandom,
		C3.Plugins.Sprite.Acts.SetAnimFrame,
		C3.Plugins.System.Exps.int,
		C3.Plugins.System.Exps.random
	];
};
self.C3_JsPropNameTable = [
	{"8Direction": 0},
	{BoundTo: 0},
	{Player: 0},
	{Bullet: 0},
	{Laser: 0},
	{Keyboard: 0},
	{Mouse: 0},
	{Health: 0},
	{Rotate: 0},
	{Rock: 0},
	{Particles: 0},
	{Spawner: 0},
	{Background: 0},
	{Explosion: 0},
	{Stars: 0},
	{SpriteFont: 0}
];

self.InstanceType = {
	Player: class extends self.ISpriteInstance {},
	Laser: class extends self.ISpriteInstance {},
	Keyboard: class extends self.IInstance {},
	Mouse: class extends self.IInstance {},
	Rock: class extends self.ISpriteInstance {},
	Particles: class extends self.IParticlesInstance {},
	Spawner: class extends self.ISpriteInstance {},
	Background: class extends self.ISpriteInstance {},
	Explosion: class extends self.ISpriteInstance {},
	Stars: class extends self.ISpriteInstance {},
	SpriteFont: class extends self.ISpriteFontInstance {}
}