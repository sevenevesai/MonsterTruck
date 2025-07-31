// main.js
document.addEventListener('DOMContentLoaded', function() {
  const { Engine, World, Bodies, Body, Events } = Matter;

  // Canvas setup
  const canvas = document.getElementById('gameCanvas');
  const ctx    = canvas.getContext('2d');
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Physics engine
  const engine = Engine.create();
  const world  = engine.world;
  world.gravity.y = 1;

  // Level setup
  const groundHeight = 40;
  const levelWidth   = 5000;
  let groundY        = canvas.height - groundHeight/2;

  const ground = Bodies.rectangle(
    levelWidth/2, groundY,
    levelWidth, groundHeight,
    { isStatic: true, friction: 0.8, restitution: 0 }
  );
  World.add(world, ground);

  // Truck setup
  const truckWidth  = 200;
  const truckHeight = 100;
  const startX      = 200;
  const startY      = groundY - truckHeight;

  const truck = Bodies.rectangle(
    startX, startY,
    truckWidth, truckHeight,
    { friction: 0.2, restitution: 0, frictionAir: 0.05 }
  );
  World.add(world, truck);

  // Obstacles
  const obstacles = [];
  function createObstacle(x) {
    const size = 40 + Math.random()*40;
    const obs  = Bodies.rectangle(
      x,
      groundY - size/2,
      size, size,
      { isStatic: true, friction: 0.8, restitution: 0 }
    );
    World.add(world, obs);
    obstacles.push(obs);
  }
  // initial
  for (let i=0; i<5; i++) {
    createObstacle(600 + i*400 + Math.random()*200);
  }
  // spawn ahead
  setInterval(() => {
    createObstacle(truck.position.x + canvas.width + 200);
  }, 2000);
  // cleanup behind
  Events.on(engine, 'afterUpdate', () => {
    for (let i=obstacles.length-1; i>=0; i--) {
      if (obstacles[i].position.x < truck.position.x - canvas.width) {
        World.remove(world, obstacles[i]);
        obstacles.splice(i, 1);
      }
    }
  });

  // Input handling
  const keys = { left:false, right:false, jump:false };
  document.addEventListener('keydown', e => {
    if (e.code==='ArrowLeft'||e.code==='KeyA')   keys.left  = true;
    if (e.code==='ArrowRight'||e.code==='KeyD')  keys.right = true;
    if (e.code==='Space')                       keys.jump  = true;
  });
  document.addEventListener('keyup', e => {
    if (e.code==='ArrowLeft'||e.code==='KeyA')   keys.left  = false;
    if (e.code==='ArrowRight'||e.code==='KeyD')  keys.right = false;
    if (e.code==='Space')                       keys.jump  = false;
  });
  ['leftBtn','rightBtn','jumpBtn'].forEach(id => {
    const btn = document.getElementById(id);
    const key = id==='leftBtn'?'left': id==='rightBtn'?'right':'jump';
    btn.addEventListener('mousedown',  () => keys[key] = true);
    btn.addEventListener('mouseup',    () => keys[key] = false);
    btn.addEventListener('touchstart', e => { e.preventDefault(); keys[key] = true; });
    btn.addEventListener('touchend',   e => { e.preventDefault(); keys[key] = false; });
  });

  // Main loop
  let lastTime = performance.now();
  function gameLoop(time) {
    const delta = time - lastTime;
    lastTime = time;

    // Controls: apply force
    const force = 0.0005;
    if (keys.left)  Body.applyForce(truck, truck.position, { x:-force, y:0 });
    if (keys.right) Body.applyForce(truck, truck.position, { x: force, y:0 });

    // Jump
    const onGround = Math.abs(truck.position.y - (groundY - truckHeight/2)) < 5;
    if (keys.jump && onGround) {
      Body.setVelocity(truck, { x: truck.velocity.x, y: -10 });
    }

    Engine.update(engine, delta);

    // Draw
    // recalc groundY in case of resize
    groundY = canvas.height - groundHeight/2;
    const offsetX = Math.max(truck.position.x - canvas.width/3, 0);

    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.translate(-offsetX, 0);

    // Sky
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(offsetX, 0, canvas.width, canvas.height);

    // Ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, groundY, levelWidth, groundHeight);

    // Obstacles
    ctx.fillStyle = '#8B0000';
    obstacles.forEach(o => {
      const w = o.bounds.max.x - o.bounds.min.x;
      const h = o.bounds.max.y - o.bounds.min.y;
      ctx.save();
      ctx.translate(o.position.x, o.position.y);
      ctx.rotate(o.angle);
      ctx.fillRect(-w/2, -h/2, w, h);
      ctx.restore();
    });

    // Truck (simple black rect for now)
    ctx.save();
    ctx.translate(truck.position.x, truck.position.y);
    ctx.rotate(truck.angle);
    ctx.fillStyle = '#000';
    ctx.fillRect(-truckWidth/2, -truckHeight/2, truckWidth, truckHeight);
    ctx.restore();

    requestAnimationFrame(gameLoop);
  }
  gameLoop(performance.now());
});
