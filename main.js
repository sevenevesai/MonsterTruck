// main.js
document.addEventListener('DOMContentLoaded', function() {
  const { Engine, World, Bodies, Body, Events, Constraint, Composite } = Matter;

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
  const truckHeight = 80;
  const wheelRadius = 35;
  const startX      = 200;
  const startY      = groundY - truckHeight - wheelRadius;

  const chassis = Bodies.rectangle(
    startX, startY,
    truckWidth, truckHeight,
    { friction: 0.2, restitution: 0, frictionAir: 0.05 }
  );
  const leftWheel = Bodies.circle(
    startX - truckWidth * 0.35,
    startY + truckHeight / 2 + wheelRadius,
    wheelRadius,
    { friction: 1 }
  );
  const rightWheel = Bodies.circle(
    startX + truckWidth * 0.35,
    startY + truckHeight / 2 + wheelRadius,
    wheelRadius,
    { friction: 1 }
  );

  const axleLeft = Constraint.create({
    bodyA: chassis,
    pointA: { x: -truckWidth * 0.35, y: truckHeight / 2 },
    bodyB: leftWheel,
    stiffness: 1,
    length: 0
  });
  const axleRight = Constraint.create({
    bodyA: chassis,
    pointA: { x: truckWidth * 0.35, y: truckHeight / 2 },
    bodyB: rightWheel,
    stiffness: 1,
    length: 0
  });

  const truck = Composite.create();
  Composite.add(truck, [chassis, leftWheel, rightWheel, axleLeft, axleRight]);
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
    createObstacle(chassis.position.x + canvas.width + 200);
  }, 2000);
  // cleanup behind
  Events.on(engine, 'afterUpdate', () => {
    for (let i=obstacles.length-1; i>=0; i--) {
      if (obstacles[i].position.x < chassis.position.x - canvas.width) {
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
    if (keys.left)  Body.applyForce(chassis, chassis.position, { x:-force, y:0 });
    if (keys.right) Body.applyForce(chassis, chassis.position, { x: force, y:0 });

    // Jump
    const onGround = Math.abs(chassis.position.y - (groundY - truckHeight/2)) < 5;
    if (keys.jump && onGround) {
      Body.setVelocity(chassis, { x: chassis.velocity.x, y: -10 });
    }

    Engine.update(engine, delta);

    // Draw
    // recalc groundY in case of resize
    groundY = canvas.height - groundHeight/2;
    const offsetX = Math.max(chassis.position.x - canvas.width/3, 0);

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

    // Truck chassis
    ctx.save();
    ctx.translate(chassis.position.x, chassis.position.y);
    ctx.rotate(chassis.angle);
    ctx.fillStyle = '#000';
    ctx.fillRect(-truckWidth/2, -truckHeight/2, truckWidth, truckHeight);
    ctx.restore();

    // Wheels
    ctx.fillStyle = '#333';
    [leftWheel, rightWheel].forEach(w => {
      ctx.beginPath();
      ctx.arc(w.position.x, w.position.y, wheelRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(gameLoop);
  }
  gameLoop(performance.now());
});
