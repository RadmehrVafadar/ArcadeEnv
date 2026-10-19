var character = document.querySelector(".character");
var map = document.querySelector(".map");
var previousInteract = false;
var interact = false

// Get current pixel size for scaling calculations
function getCurrentPixelSize() {
   return parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--pixel-size')
   );
}

//start in the middle of the map
var x = 100;
var y = 120;
var held_directions = []; //State of which directions we are holding down
var speed = 2; //How fast the character moves in pixels per frame

// Track if player has moved from spawn position
var hasPlayerMoved = false;
var initialX = x;
var initialY = y;
var openedLinkThisPress = false;





// Statue system configuration
// Each statue defines a collision rectangle (player cannot enter)
// and an optional interaction padding to allow interacting slightly around it.
var STATUE_DEFAULT_INTERACT_PADDING = 10;

var statues = [
   // Example statue. Duplicate and edit for more statues.
   { 
      id: "Mirror", 
      rect: { x1: 0, y1: 110, x2: 30, y2: 160 }, 
      text: "Hey a mirror! Maybe I can see what I look like in it.", 
      url: 'https://www.linkedin.com/in/radmehr-vafadar-3b89391a1/',
      interactPadding: 10 },

   { 
      id: "Boids-Algorithm", 
      rect: { x1: 204, y1: 108, x2: 154, y2: 154 }, 
      text: "A bird simulation? Maybe I can learn something from it.", 
      url: 'https://radmehrvafadar.github.io/Boids-algorithm-demo/',
      interactPadding: 10 },


   { 
      id: "Fake News", 
      rect: { x1: 0, y1: 320, x2: 40, y2: 362}, 
      text: "An AI fake news detector? I wonder how it works.", 
      url: 'https://github.com/RadmehrVafadar/AI-fake-news-detector',
      interactPadding: 10 },

   { 
      id: "Music Ord", 
      rect: { x1: 204, y1: 320, x2: 158, y2: 368}, 
      text: "A magical orb that visualises my favourite songs.", 
      url: 'https://github.com/RadmehrVafadar/voiceEmotionVisualizer',
      interactPadding: 10 },

   { 
      id: "Distributed-Video-Player", 
      rect: { x1: 0, y1: 512, x2: 54, y2: 572}, 
      text: "A distributed video player that can play videos from multiple sources.", 
      url: 'https://github.com/RadmehrVafadar/Distributed-Video-Streaming',
      interactPadding: 10 },
   
   { 
      id: "MineSweeper", 
      rect: { x1: 204, y1: 522, x2: 160, y2: 556}, 
      text: "A recreation of the classic game Minesweeper from scratch in python using pygame.", 
      url: 'https://github.com/RadmehrVafadar/mine-sweeper',
      interactPadding: 10 },
   
];

function pointInRect(px, py, rect) {
   var xMin = Math.min(rect.x1, rect.x2);
   var xMax = Math.max(rect.x1, rect.x2);
   var yMin = Math.min(rect.y1, rect.y2);
   var yMax = Math.max(rect.y1, rect.y2);
   return px >= xMin && px <= xMax && py >= yMin && py <= yMax;
}

function inflateRect(rect, padding) {
   var xMin = Math.min(rect.x1, rect.x2) - padding;
   var xMax = Math.max(rect.x1, rect.x2) + padding;
   var yMin = Math.min(rect.y1, rect.y2) - padding;
   var yMax = Math.max(rect.y1, rect.y2) + padding;
   return { x1: xMin, y1: yMin, x2: xMax, y2: yMax };
}

function isCollidingWithAnyStatue(nextX, nextY) {
   for (var i = 0; i < statues.length; i++) {
      var s = statues[i];
      if (pointInRect(nextX, nextY, s.rect)) {
         return true;
      }
   }
   return false;
}

function getNearbyStatue(px, py) {
   for (var i = 0; i < statues.length; i++) {
      var s = statues[i];
      var padding = (typeof s.interactPadding === 'number') ? s.interactPadding : STATUE_DEFAULT_INTERACT_PADDING;
      var interactRect = inflateRect(s.rect, padding);
      if (pointInRect(px, py, interactRect)) {
         return s;
      }
   }
   return null;
}

const placeCharacter = () => {
   
   var pixelSize = getCurrentPixelSize();
   
   const held_direction = held_directions[0];
   if (held_direction) {
      var dx = 0;
      var dy = 0;
      if (held_direction === directions.left) { dx += speed; }
      if (held_direction === directions.right) { dx -= speed; }
      if (held_direction === directions.up) { dy += speed; }
      if (held_direction === directions.down) { dy -= speed; }

      // Attempt horizontal move if not colliding with any statue
      if (dx !== 0) {
         var nextX = x + dx;
         if (!isCollidingWithAnyStatue(nextX, y)) {
            x = nextX;
         }
      }

      // Attempt vertical move if not colliding with any statue
      if (dy !== 0) {
         var nextY = y + dy;
         if (!isCollidingWithAnyStatue(x, nextY)) {
            y = nextY;
         }
      }

      character.setAttribute("facing", held_direction);

      // Check if player has moved from initial position
      if (!hasPlayerMoved && (x !== initialX || y !== initialY)) {
         hasPlayerMoved = true;
      }
   }
   character.setAttribute("walking", held_direction ? "true" : "false");


   //Limits (gives the illusion of walls) - now scale with pixel size
   var leftLimit = 0;
   var rightLimit = (16 * 12) + 12;
   var topLimit = 90;
   var bottomLimit = (16 * 36.7);
   if (x < leftLimit) { x = leftLimit; }
   if (x > rightLimit) { x = rightLimit; }
   if (y < topLimit) { y = topLimit; }
   if (y > bottomLimit) { y = bottomLimit; }



   var dialogueBox = document.querySelector('.dialogueBox');
   var actionPrompt = document.querySelector('.actionPrompt');
   
   // Show welcome message automatically at spawn, hide when player moves
   if (!hasPlayerMoved) {
      dialogueBox.innerHTML = "Welcome to my portfolio showcase game! Navigate with the arrow keys or WASD. Press Spacebar or E to interact. To exit, interact with the door.";
      dialogueBox.style.display = 'block';
      if (actionPrompt) { actionPrompt.style.display = 'none'; }
   } else {
      // Handle other interactions after player has moved
      var nearbyStatue = getNearbyStatue(x, y);
      if (nearbyStatue && interact && !previousInteract) {
         dialogueBox.innerHTML = nearbyStatue.text || "";
         dialogueBox.style.display = 'block';
      } else if (!nearbyStatue) {
         dialogueBox.style.display = 'none';
      }

      // Action prompt guidance
      if (actionPrompt) {
         var promptShown = false;
         if (nearbyStatue) {
            var msg = 'Press Space to read';
            if (nearbyStatue.url) { msg += ' or Press E to open'; }
            actionPrompt.textContent = msg;
            actionPrompt.style.display = 'block';
            promptShown = true;
         }
         // Exit area prompt
         if (!promptShown && x > 70 && x < 130 && y < 100) {
            actionPrompt.textContent = 'Press Space or E to exit';
            actionPrompt.style.display = 'block';
            promptShown = true;
         }
         if (!promptShown) {
            actionPrompt.style.display = 'none';
         }
      }
   }
      previousInteract = interact;

      
      var camera_left = pixelSize * 66;
      var camera_top = pixelSize * 42;
      
      map.style.transform = `translate3d( ${-x*pixelSize+camera_left}px, ${-y*pixelSize+camera_top}px, 0 )`;
      character.style.transform = `translate3d( ${x*pixelSize}px, ${y*pixelSize}px, 0 )`;  
};


//Set up the game loop
const step = () => {
   placeCharacter();
   window.requestAnimationFrame(() => {
      step();
   })
}
step(); //kick off the first step!



/* Direction key state */
const directions = {
   up: "up",
   down: "down",
   left: "left",
   right: "right",
}
const keys = {
   40: directions.up,
   39: directions.left,
   37: directions.right,
   38: directions.down,
   87: directions.down,
   65: directions.right,
   83: directions.up,
   68: directions.left,
}
const held_keys = new Set();
document.addEventListener("keydown", (e) => {
   var dir = keys[e.which];
   if (dir) { held_keys.add(e.which); }

   // Exit area interaction (top of the map)
   if ((e.key === ' ' || (typeof e.key === 'string' && e.key.toLowerCase() === 'e')) && x > 70 && x < 130 && y < 100) {
    window.location.href = import.meta.env.BASE_URL
   }

   // If pressing 'e' near a statue with a URL, open it
   if (typeof e.key === 'string' && e.key.toLowerCase() === 'e') {
      var nearbyForOpen = getNearbyStatue(x, y);
      if (nearbyForOpen && nearbyForOpen.url && !openedLinkThisPress) {
         window.open(nearbyForOpen.url, '_blank', 'noopener');
         openedLinkThisPress = true;
      }
   }

   if (dir && held_directions.indexOf(dir) === -1) {
      held_directions.unshift(dir)
   }

   if (e.key === ' ' || (typeof e.key === 'string' && e.key.toLowerCase() === 'e')) { interact = true }
})

document.addEventListener("keyup", (e) => {
   var dir = keys[e.which];
   held_keys.delete(e.which);
   var index = held_directions.indexOf(dir);
   if (index > -1 && !Array.from(held_keys).some(key => keys[key] === dir)) {
      held_directions.splice(index, 1)
   }

   if (e.key === ' ' || (typeof e.key === 'string' && e.key.toLowerCase() === 'e')) { interact = false }
   if (typeof e.key === 'string' && e.key.toLowerCase() === 'e') { openedLinkThisPress = false }
});



/* BONUS! Dpad functionality for mouse and touch */
var isPressed = false;
const removePressedAll = () => {
   document.querySelectorAll(".dpad-button").forEach(d => {
      d.classList.remove("pressed")
   })
}
document.body.addEventListener("mousedown", () => {
   isPressed = true;
})
document.body.addEventListener("mouseup", () => {
   isPressed = false;
   held_directions = [];
   removePressedAll();
})
const handleDpadPress = (direction, click) => {   
   if (click) {
      isPressed = true;
   }
   held_directions = (isPressed) ? [direction] : []
   
   if (isPressed) {
      removePressedAll();
      document.querySelector(".dpad-"+ direction).classList.add("pressed");
   }
}



//Bind a ton of events for the dpad
document.querySelector(".dpad-left").addEventListener("touchstart", () => handleDpadPress(directions.left, true));
document.querySelector(".dpad-up").addEventListener("touchstart", () => handleDpadPress(directions.up, true));
document.querySelector(".dpad-right").addEventListener("touchstart", () => handleDpadPress(directions.right, true));
document.querySelector(".dpad-down").addEventListener("touchstart", () => handleDpadPress(directions.down, true));

document.querySelector(".dpad-left").addEventListener("mousedown", () => handleDpadPress(directions.left, true));
document.querySelector(".dpad-up").addEventListener("mousedown", () => handleDpadPress(directions.up, true));
document.querySelector(".dpad-right").addEventListener("mousedown", () => handleDpadPress(directions.right, true));
document.querySelector(".dpad-down").addEventListener("mousedown", () => handleDpadPress(directions.down, true));

document.querySelector(".dpad-left").addEventListener("mouseover", () => handleDpadPress(directions.left));
document.querySelector(".dpad-up").addEventListener("mouseover", () => handleDpadPress(directions.up));
document.querySelector(".dpad-right").addEventListener("mouseover", () => handleDpadPress(directions.right));
document.querySelector(".dpad-down").addEventListener("mouseover", () => handleDpadPress(directions.down));

// Handle window resize to maintain proper scaling
window.addEventListener('resize', () => {
   // Force a recalculation on the next frame
   window.requestAnimationFrame(() => {
      placeCharacter();
   });
});
