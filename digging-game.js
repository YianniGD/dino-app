
// Graphics buffers for the different layers
let dirtLayer, stoneLayer, bedrockLayer, fossilLayer, rockLayer;

// Arrays to hold rock objects for each layer
let dirtRocks = [], stoneRocks = [], bedrockRocks = [];

// The size of our digging brush
const brushSize = 60;

// Game state variables
const NUM_FOSSILS = 3; 
let fossilLocations = []; 
let totalFossilPixels = 0, winThreshold = 0.85;
let gameWon = false, gameStarted = false;
let brushPowerLevel = 0; 
let progress = 0;

// -- Variables for cursor and interaction state --
let isBrushing = false;
let mouseDownTime = 0;
const BRUSH_ACTIVATION_DELAY = 150; 
let pickaxeSwing = 0; 
let brushShapeVertices = []; 

// -- Variables for screen shake and particles --
let particles = [];
let shakeAmount = 0;
let shakeDuration = 0;

// Popover variables
let popovers = [];
let lastPopoverTime = 0;
const popoverCooldown = 2500;
const encouragementPhrases = [
  "Keep going!", "You've got this!", "Almost there!", "Nice work!", "That's it!",
  "I see something!", "Careful now...", "Deeper!", "Solid rock..."
];

// Rock breaking variables
let lastClickTime = 0, quickClickCounter = 0, lastClickedRock = null;
const quickClickThreshold = 300; 
const clicksToBreak = 3;

// Define colors for each layer's hard rocks
let dirtRockColor, stoneRockColor, bedrockRockColor;
let dirtBaseColor, stoneBaseColor, bedrockBaseColor;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  noCursor(); 
  initializeLayers();
  textAlign(CENTER, CENTER);
  textFont('Georgia');
}

function draw() {
  if (!gameStarted) {
    background(102, 69, 44); fill(255); textSize(24);
    text("Fossils are buried deep within the earth.", width / 2, height / 2 - 30);
    textSize(16);
    text("Dig through dirt, stone, and bedrock to find them.", width / 2, height / 2);
    text("Uncover large rocks, then tap them quickly to break them.", width / 2, height / 2 + 20);
    drawPickaxeCursor(mouseX, mouseY); 
    return;
  }

  background(61, 40, 26);

  push(); 
  if (shakeDuration > 0) {
    translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
    shakeAmount *= 0.9; 
    shakeDuration--;
  }
  
  image(fossilLayer, 0, 0); 
  image(rockLayer, 0, 0);
  image(bedrockLayer, 0, 0); 
  image(stoneLayer, 0, 0); 
  image(dirtLayer, 0, 0);
  manageParticles(); 
  pop(); 

  managePopovers();

  if (gameWon) {
    cursor(ARROW); 
    fill(255, 223, 100, 200); rect(0, 0, width, height);
    fill(0); textSize(64); text("You discovered the fossils!", width / 2, height / 2);
  } else {
    noCursor(); 
    pickaxeSwing = max(0, pickaxeSwing * 0.92);

    if (isBrushing) {
        drawBrushCursor(mouseX, mouseY);
    } else {
        drawPickaxeCursor(mouseX, mouseY);
    }
  }
}

function mousePressed() {
  if (!gameStarted) { gameStarted = true; return; }
  if (gameWon) return;

  mouseDownTime = millis();
  isBrushing = false;
  
  let dirtAlpha = dirtLayer.get(mouseX, mouseY)[3];
  if (dirtAlpha > 10) {
    smackLayer(dirtLayer, 1.2);
    pickaxeSwing = 1.0;
    triggerPopover();
    return;
  }

  let stoneAlpha = stoneLayer.get(mouseX, mouseY)[3];
  if (stoneAlpha > 10) {
    smackLayer(stoneLayer, 0.7);
    pickaxeSwing = 1.0;
    triggerPopover();
    return;
  }

  let bedrockAlpha = bedrockLayer.get(mouseX, mouseY)[3];
  if (bedrockAlpha > 10) {
    smackLayer(bedrockLayer, 0.4);
    pickaxeSwing = 1.0;
    triggerPopover();
    return;
  }

  let rock = getRockAt(mouseX, mouseY);
  if (rock && !rock.isBroken) {
    let timeSinceLastClick = millis() - lastClickTime;
    if (timeSinceLastClick < quickClickThreshold && rock === lastClickedRock) {
      quickClickCounter++;
    } else {
      quickClickCounter = 1;
    }
    lastClickTime = millis();
    lastClickedRock = rock;

    if (quickClickCounter >= clicksToBreak) {
      breakRock(rock);
    } else {
      smackLayer(bedrockLayer, 0.2); 
    }
    pickaxeSwing = 1.0;
  } else {
    lastClickedRock = null;
  }
}


function mouseDragged() {
  if (gameWon || !gameStarted) return;
  
  if (!isBrushing && millis() - mouseDownTime > BRUSH_ACTIVATION_DELAY) {
    isBrushing = true;
    brushShapeVertices = createBrushShape(brushSize * 0.35, 12); 
  }

  if (isBrushing) {
    let power = 1;
    if (brushPowerLevel === 1) power = 2.5;
    else if (brushPowerLevel === 2) power = 4.0;
    
    let dirtAlpha = dirtLayer.get(mouseX, mouseY)[3];
    if (dirtAlpha > 10) {
        brushLayer(dirtLayer, 10 * power, 30 * power);
    } else {
        let stoneAlpha = stoneLayer.get(mouseX, mouseY)[3];
        if (stoneAlpha > 10) {
            brushLayer(stoneLayer, 5 * power, 15 * power);
        } else {
            let bedrockAlpha = bedrockLayer.get(mouseX, mouseY)[3];
            if (bedrockAlpha > 10) {
              brushLayer(bedrockLayer, 3 * power, 8 * power);
            }
        }
    }
    triggerPopover();
  }
  return false;
}

function mouseReleased() {
  isBrushing = false;
  if (gameStarted && !gameWon) {
    cleanupLooseMaterial(dirtLayer, dirtBaseColor);
    cleanupLooseMaterial(stoneLayer, stoneBaseColor);
    cleanupLooseMaterial(bedrockLayer, bedrockBaseColor);

    checkProgress();
    checkRockProgress();
  }
}

function cleanupLooseMaterial(targetLayer, particleColor) {
    const samples = 20000;
    const neighborThreshold = 3;
    let toRemove = [];

    targetLayer.loadPixels();
    const pixels = targetLayer.pixels;
    const w = targetLayer.width;
    const h = targetLayer.height;

    for (let i = 0; i < samples; i++) {
        const x = floor(random(w));
        const y = floor(random(h));
        const idx = (x + y * w) * 4;

        if (pixels[idx + 3] > 200) {
            let neighborCount = 0;
            for (let nx = -1; nx <= 1; nx++) {
                for (let ny = -1; ny <= 1; ny++) {
                    if (nx === 0 && ny === 0) continue;
                    const checkX = x + nx;
                    const checkY = y + ny;
                    if (checkX >= 0 && checkX < w && checkY >= 0 && checkY < h) {
                        const neighborIdx = (checkX + checkY * w) * 4;
                        if (pixels[neighborIdx + 3] > 200) {
                            neighborCount++;
                        }
                    }
                }
            }
            if (neighborCount < neighborThreshold) {
                toRemove.push({ x, y });
            }
        }
    }

    if (toRemove.length > 0) {
        targetLayer.erase();
        for (const p of toRemove) {
            targetLayer.ellipse(p.x, p.y, 10, 10);
            if (random() < 0.5) { 
                particles.push({
                    x: p.x, y: p.y,
                    vx: random(-1, 1), vy: random(-2, 0),
                    lifespan: 150,
                    c: particleColor,
                    size: random(2, 4)
                });
            }
        }
        targetLayer.noErase();
    }
}


// --- UI & Cursors ---
function drawPickaxeCursor(x, y) {
  push();
  const maxSwing = -PI / 8; 
  let currentRotation = sin(pickaxeSwing * PI) * maxSwing; 
  let pivotX = 28, pivotY = 20; 
  translate(x, y); scale(0.8); translate(0, -5); 
  translate(pivotX, pivotY); rotate(currentRotation); translate(-pivotX, -pivotY);
  noStroke();
  fill(180, 123, 65);
  beginShape(); vertex(35.44, 17.99); vertex(12.32, 83.53); vertex(2.72, 78.62); vertex(26.50, 13.96); endShape(CLOSE);
  fill(238, 238, 238);
  beginShape(); vertex(29.22, 1.74); vertex(25.51, 10.25); vertex(1.30, 9.81); vertex(0, 5.02); endShape(CLOSE);
  beginShape(); vertex(42.96, 7.09); vertex(66.73, 25.08); vertex(62.70, 29.22); vertex(38.82, 17.01); endShape(CLOSE);
  fill(247, 247, 247);
  beginShape(); vertex(29.22, 1.74); vertex(29.87, 0); vertex(43.94, 4.69); vertex(43.07, 6.98); vertex(38.82, 16.79); vertex(37.95, 18.97); vertex(35.55, 17.88); vertex(26.61, 13.85); vertex(24.43, 12.87); vertex(25.63, 10.14); endShape(CLOSE);
  pop();
}

function drawBrushCursor(x, y) {
  push();
  const swaySpeed = 0.005;
  const swayAmount = PI / 24;
  let currentRotation = sin(millis() * swaySpeed) * swayAmount;
  let pivotX = 15, pivotY = 45; 
  translate(x, y); scale(0.9); translate(-15, -55); 
  translate(pivotX, pivotY); rotate(currentRotation); translate(-pivotX, -pivotY);
  noStroke();
  fill(236, 220, 182);
  beginShape(); vertex(28.65, 45.46); vertex(25.27, 62.03); vertex(5.10, 57.57); vertex(9.50, 42.50); endShape(CLOSE);
  beginShape(); vertex(3.49, 57.17); vertex(0.0, 55.41); vertex(4.97, 41.79); vertex(9.52, 42.60); endShape(CLOSE);
  fill(238, 238, 238);
  beginShape(); vertex(28.65, 45.46); vertex(9.52, 42.60); vertex(4.97, 41.79); vertex(8.00, 34.56); vertex(30.41, 37.88); endShape(CLOSE);
  fill(255, 204, 0);
  beginShape(); vertex(8.10, 34.55); vertex(11.26, 27.51); vertex(17.44, 24.74); vertex(25.57, 0); vertex(32.23, 1.57); vertex(27.76, 27.04); vertex(32.33, 31.38); vertex(30.42, 37.99); endShape(CLOSE);
  pop();
}

// --- Rock & Particle Functions ---

function manageParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.lifespan -= 2;
    if (p.lifespan <= 0) {
      particles.splice(i, 1);
    } else {
      let particleColor = color(p.c.levels[0], p.c.levels[1], p.c.levels[2], p.lifespan);
      fill(particleColor); noStroke(); ellipse(p.x, p.y, p.size);
    }
  }
}

function getRockAt(x, y) {
  for (const rock of bedrockRocks) if (!rock.isBroken && isPointInPolygon(x, y, rock.vertices)) return rock;
  for (const rock of stoneRocks) if (!rock.isBroken && isPointInPolygon(x, y, rock.vertices)) return rock;
  for (const rock of dirtRocks) if (!rock.isBroken && isPointInPolygon(x, y, rock.vertices)) return rock;
  return null;
}

function breakRock(rock) {
  if (rock.isBroken) return;
  rock.isBroken = true;
  shakeAmount = 12; shakeDuration = 20;
  
  let { centerX, centerY } = getPolygonBounds(rock.vertices);

  for (let i = 0; i < 50; i++) {
    let angle = random(TWO_PI); let speed = random(1, 6);
    particles.push({x: centerX, y: centerY, vx: cos(angle) * speed, vy: sin(angle) * speed, lifespan: 255, c: rock.color, size: random(3, 8)});
  }
  
  rockLayer.erase();
  rockLayer.beginShape();
  for (const v of rock.vertices) rockLayer.vertex(v.x, v.y);
  rockLayer.endShape(CLOSE);
  rockLayer.noErase();

  quickClickCounter = 0;
  lastClickedRock = null;
  triggerSpecialPopover("Rock shattered!", mouseX, mouseY);
}

function checkRockProgress() {
  checkRocksOnLayer(dirtRocks, [dirtLayer]);
  checkRocksOnLayer(stoneRocks, [dirtLayer, stoneLayer]);
  checkRocksOnLayer(bedrockRocks, [dirtLayer, stoneLayer, bedrockLayer]);
}

function checkRocksOnLayer(rocks, layersAbove) {
  for(const layer of layersAbove) { layer.loadPixels(); }

  for (const rock of rocks) {
    if (rock.isBroken || rock.becameVulnerable) continue;
    
    let totalRockPixels = 0, uncoveredRockPixels = 0;
    let {minX, maxX, minY, maxY} = getPolygonBounds(rock.vertices);

    for (let y = floor(minY); y < ceil(maxY); y++) {
      for (let x = floor(minX); x < ceil(maxX); x++) {
        if (isPointInPolygon(x, y, rock.vertices)) {
          totalRockPixels++;
          let i = (x + y * width) * 4;
          let isCovered = false;
          for(const layer of layersAbove) {
            if (layer.pixels[i + 3] > 50) { isCovered = true; break; }
          }
          if (!isCovered) { uncoveredRockPixels++; }
        }
      }
    }
    if (totalRockPixels > 0) rock.uncoveredPercent = uncoveredRockPixels / totalRockPixels;
    if (rock.uncoveredPercent > 0.5 && !rock.becameVulnerable) {
        rock.becameVulnerable = true;
        popovers.push({text: "This rock looks weak!", x: rock.vertices[0].x, y: rock.vertices[0].y, lifespan: 120, initialLife: 120});
    }
  }
}

// --- Popover Functions ---
function getOutskirtPosition() {
  let edge = floor(random(4)), paddingX = width*0.15, paddingY = height*0.15;
  let pos = { x: 0, y: 0 };
  switch (edge) {
    case 0: pos.x=random(paddingX,width-paddingX); pos.y=random(paddingY*0.5,paddingY); break;
    case 1: pos.x=random(width-paddingX,width-paddingX*0.5); pos.y=random(paddingY,height-paddingY); break;
    case 2: pos.x=random(paddingX,width-paddingX); pos.y=random(height-paddingY,height-paddingY*0.5); break;
    case 3: pos.x=random(paddingX*0.5,paddingX); pos.y=random(paddingY,height-paddingY); break;
  }
  return pos;
}
function triggerPopover() {
  if (millis() - lastPopoverTime > popoverCooldown) {
    let pos = getOutskirtPosition();
    popovers.push({text: random(encouragementPhrases), x: pos.x, y: pos.y, lifespan: 120, initialLife: 120});
    lastPopoverTime = millis();
  }
}
function triggerSpecialPopover(message, x = null, y = null) {
   let pos = (x !== null && y !== null) ? { x, y } : getOutskirtPosition();
   popovers.push({text: message, x: pos.x, y: pos.y, lifespan: 180, initialLife: 180});
}
function managePopovers() {
  for (let i = popovers.length - 1; i >= 0; i--) {
    let p = popovers[i];
    p.lifespan--; p.y -= 0.5;
    let alpha = map(p.lifespan, 0, p.initialLife / 2, 0, 255);
    textSize(16); stroke(0, alpha); strokeWeight(3); fill(255, 255, 220, alpha);
    text(p.text, p.x, p.y);
    noStroke();
    if (p.lifespan <= 0) popovers.splice(i, 1);
  }
}

// --- Digging & Layer Functions ---
function createBrushShape(radius, detail) {
  let vertices = [];
  for (let j = 0; j < detail; j++) {
    let angle = map(j, 0, detail, 0, TWO_PI);
    let r = radius * (1 + random(-0.4, 0.4));
    let x = cos(angle) * r; let y = sin(angle) * r;
    vertices.push(createVector(x, y));
  }
  return vertices;
}
function smackLayer(targetLayer, radiusMultiplier) {
  let impactShape = createBrushShape(brushSize * radiusMultiplier, 10);
  targetLayer.erase();
  targetLayer.push();
  targetLayer.translate(mouseX, mouseY);
  targetLayer.beginShape();
  for(const v of impactShape) targetLayer.vertex(v.x, v.y);
  targetLayer.endShape(CLOSE);
  targetLayer.pop();
  targetLayer.noErase();
}
function brushLayer(targetLayer, minFringeSize, maxFringeSize) {
  targetLayer.erase();
  targetLayer.push();
  targetLayer.translate(mouseX, mouseY);
  targetLayer.beginShape();
  for (const v of brushShapeVertices) targetLayer.vertex(v.x, v.y);
  targetLayer.endShape(CLOSE);
  targetLayer.pop();
  for (let i = 0; i < 10; i++) {
    let offsetX = random(-brushSize*0.8, brushSize*0.8); let offsetY = random(-brushSize*0.8, brushSize*0.8);
    let grainSize = random(minFringeSize, maxFringeSize);
    targetLayer.ellipse(mouseX + offsetX, mouseY + offsetY, grainSize);
  }
  targetLayer.noErase();
}

// --- Layer Drawing Functions ---
function initializeLayers() {
  fossilLocations = [];
  const padding = 0.2;
  for (let i = 0; i < NUM_FOSSILS; i++) {
    fossilLocations.push({x: random(width * padding, width * (1-padding)), y: random(height * padding, height * (1-padding))});
  }

  dirtRocks = []; stoneRocks = []; bedrockRocks = [];
  fossilLayer = createGraphics(width, height); drawFossil(fossilLayer);
  totalFossilPixels = countFossilPixels(fossilLayer);
  
  dirtRockColor = color(87,57,28); stoneRockColor = color(85,80,75); bedrockRockColor = color(40,42,45);
  dirtBaseColor = color(139, 90, 43); stoneBaseColor = color(120, 110, 100); bedrockBaseColor = color(55, 58, 64);
  
  dirtLayer = createGraphics(width,height); drawDirt(dirtLayer);
  stoneLayer = createGraphics(width,height); drawStone(stoneLayer);
  bedrockLayer = createGraphics(width,height); drawBedrock(bedrockLayer);
  
  rockLayer = createGraphics(width, height);
  drawHardRocks(rockLayer, dirtRockColor, 10, 0.8, dirtRocks);
  drawHardRocks(rockLayer, stoneRockColor, 12, 1.0, stoneRocks);
  drawHardRocks(rockLayer, bedrockRockColor, 15, 1.2, bedrockRocks);
}

function drawDirt(pg) {
  pg.background(dirtBaseColor); pg.noStroke();
  for (let i=0; i<300000; i++) { let x=random(pg.width), y=random(pg.height), n=noise(x*0.01,y*0.01); pg.fill(101+n*40,67+n*20,33+n*20,200); pg.ellipse(x,y,n*3,n*3); }
}
function drawStone(pg) {
  pg.background(stoneBaseColor); pg.noStroke();
  for (let i=0; i<200000; i++) { let x=random(pg.width), y=random(pg.height), n=noise(x*0.005,y*0.005); pg.fill(100+n*40,90+n*30,80+n*30); pg.ellipse(x,y,n*5,n*5); }
}
function drawBedrock(pg) {
  pg.background(bedrockBaseColor);
}

function drawHardRocks(pg, rockColor, numRocks, sizeMultiplier, rockArray) {
  for (let i=0; i<numRocks; i++) {
    let rockX=random(width), rockY=random(height);
    let rockW=random(width*0.1,width*0.25)*sizeMultiplier, rockH=random(height*0.1,height*0.25)*sizeMultiplier;
    let vertices = [], detail = 10;
    for (let j=0; j<detail; j++) {
      let angle = map(j,0,detail,0,TWO_PI);
      let r = (rockW/2)+random(-30*sizeMultiplier, 30*sizeMultiplier);
      let x = rockX+cos(angle)*r, y = rockY+sin(angle)*(r*(rockH/rockW));
      vertices.push(createVector(x,y));
    }
    
    rockArray.push({vertices: vertices, color: rockColor, isBroken: false, uncoveredPercent: 0, becameVulnerable: false});
    
    pg.push();
    let strokeCol = color(red(rockColor)*0.5, green(rockColor)*0.5, blue(rockColor)*0.5, 180);
    pg.stroke(strokeCol); pg.strokeWeight(3 * sizeMultiplier); pg.fill(rockColor);
    pg.beginShape(); for(const v of vertices) pg.vertex(v.x, v.y); pg.endShape(CLOSE);
    pg.drawingContext.save();
    pg.beginShape(); for(const v of vertices) pg.vertex(v.x, v.y); pg.endShape(CLOSE);
    pg.drawingContext.clip();
    pg.noStroke();
    let lightSpeckle = color(red(rockColor)*1.2,green(rockColor)*1.2,blue(rockColor)*1.2,200);
    let darkSpeckle = color(red(rockColor)*0.8,green(rockColor)*0.8,blue(rockColor)*0.8,200);
    let numSpeckles = (rockW*rockH)/60;
    let {minX, maxX, minY, maxY} = getPolygonBounds(vertices);
    for (let j=0; j<numSpeckles; j++) {
      let x=random(minX,maxX); let y=random(minY,maxY);
      pg.fill(random()>0.5 ? lightSpeckle : darkSpeckle);
      pg.ellipse(x,y,random(1,4)*sizeMultiplier,random(1,4)*sizeMultiplier);
    }
    pg.drawingContext.restore();
    pg.pop();
  }
}

function drawFossil(pg) {
  pg.clear();
  for (const loc of fossilLocations) {
    pg.push(); pg.translate(loc.x, loc.y); pg.scale(0.7); 
    pg.noFill(); pg.stroke(240,235,220); pg.strokeWeight(18); pg.strokeCap(ROUND); pg.strokeJoin(ROUND);
    pg.beginShape(); pg.vertex(-150,20); pg.bezierVertex(-50,90,80,80,160,40); pg.endShape();
    pg.beginShape(); pg.vertex(-160,10); pg.bezierVertex(-80,-100,100,-90,150,-20); pg.endShape();
    pg.fill(0,0,0,0); pg.strokeWeight(12); pg.circle(80,-25,35);
    pg.strokeWeight(5); pg.line(150,38,155,55); pg.line(120,61,125,75); pg.line(90,69,95,83);
    pg.pop();
  }
}

// --- Win Condition & Utility ---
function countFossilPixels(pg) {
  pg.loadPixels(); let count = 0;
  for (let i=0; i<pg.pixels.length; i+=4) { if (pg.pixels[i+3]>0) count++; }
  return count;
}
function checkProgress() {
  dirtLayer.loadPixels(); stoneLayer.loadPixels(); bedrockLayer.loadPixels(); fossilLayer.loadPixels();
  let revealedCount = 0;
  for (let i=0; i<dirtLayer.pixels.length; i+=4) {
    if (dirtLayer.pixels[i+3]<50 && stoneLayer.pixels[i+3]<50 && bedrockLayer.pixels[i+3]<50 && fossilLayer.pixels[i+3]>50) revealedCount++;
  }
  progress = revealedCount / totalFossilPixels;
  
  if (progress >= 0.25 && brushPowerLevel === 0) {
    brushPowerLevel = 1; triggerSpecialPopover("My brush feels more effective now!");
  }
  if (progress >= 0.5 && brushPowerLevel === 1) {
    brushPowerLevel = 2; triggerSpecialPopover("Even stronger! Nothing can stop me!");
  }
  if (progress >= winThreshold) gameWon = true;
}
function isPointInPolygon(px, py, vertices) {
  let collision = false, next = 0;
  for (let current=0; current<vertices.length; current++) {
    next = current + 1; if (next==vertices.length) next=0;
    let vc = vertices[current], vn = vertices[next];
    if (((vc.y>py && vn.y<py)||(vc.y<py && vn.y>py)) && (px<(vn.x-vc.x)*(py-vc.y)/(vn.y-vc.y)+vc.x)) {
      collision = !collision;
    }
  }
  return collision;
}
function getPolygonBounds(vertices) {
    let minX=width, maxX=0, minY=height, maxY=0;
    for(const v of vertices) { 
        minX=min(minX, v.x); maxX=max(maxX, v.x);
        minY=min(minY, v.y); maxY=max(maxY, v.y);
    }
    return { minX, maxX, minY, maxY, centerX: minX + (maxX-minX)/2, centerY: minY + (maxY-minY)/2 };
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initializeLayers();
  gameWon = false; gameStarted = false; brushPowerLevel = 0; popovers = [];
  lastClickTime = 0; quickClickCounter = 0; lastClickedRock = null;
  noCursor(); 
}
