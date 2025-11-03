/**
 * Shapes Exploration Tool
 * Click on shape cards to hear their names
 */

console.log("Shapes Explorer - Jalen Banks");

// Current shapes displayed
let currentShapes = [];

// Track if any audio is currently playing
let audioPlaying = false;

// All available shapes (from audio/shapes folder)
const allShapes = [
    "circle",
    "diamond",
    "hearts",
    "hexagone",
    "oval",
    "pentagon",
    "rectangle",
    "square",
    "star",
    "triangle"
];

// DOM elements
const randomizeBtn = document.querySelector("#randomizeBtn");
const shapeCards = document.querySelectorAll(".shape-card");

// Audio elements for shape names (one per shape)
let shapeAudios = {};

// Initialize
function init() {
    console.log("Initializing Shapes Explorer");
    randomizeShapes();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    randomizeBtn.addEventListener("click", randomizeShapes);
    
    // Add click listeners to shape cards - click to hear name
    shapeCards.forEach(card => {
        card.addEventListener("click", function() {
            const clickedShape = this.getAttribute("data-shape");
            if (clickedShape) {
                playShapeAudio(clickedShape, this);
            }
        });
    });
}

// Randomize the shapes displayed
function randomizeShapes() {
    console.log("Randomizing shapes");
    
    // Stop any currently playing audio and reset all
    Object.values(shapeAudios).forEach(audio => {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            audio.src = "";
        }
    });
    audioPlaying = false;
    
    // Clear previous audio objects
    for (let key in shapeAudios) {
        delete shapeAudios[key];
    }
    
    // Select 5 random shapes from the available shapes
    currentShapes = getRandomShapes(5);
    
    console.log("Current shapes:", currentShapes);
    
    // Display shape cards with new shapes
    displayShapeCards();
    
    // Reset shape card styles
    resetShapeCardStyles();
}

// Get random shapes (no duplicates)
function getRandomShapes(count) {
    let shuffled = [...allShapes];
    
    // Shuffle array using Fisher-Yates algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    
    return shuffled.slice(0, count);
}

// Display shape cards with current shapes
function displayShapeCards() {
    for (let i = 0; i < shapeCards.length; i++) {
        let card = shapeCards[i];
        let shape = currentShapes[i];
        
        if (!shape) continue;
        
        // Set data attribute for CSS styling
        card.setAttribute("data-shape", shape);
        
        // Preload audio for this shape
        if (!shapeAudios[shape]) {
            const audioPath = `audio/shapes/${shape}.mp3`;
            const audio = new Audio(audioPath);
            audio.preload = "auto";
            
            // Handle audio loading errors
            audio.addEventListener("error", function(e) {
                console.error(`Audio file for ${shape} failed to load:`, e);
            });
            
            // Explicitly load the audio
            audio.load();
            shapeAudios[shape] = audio;
        }
    }
}

// Play shape audio for a specific shape card
function playShapeAudio(shape, cardElement) {
    // Validate shape
    if (!shape) {
        console.error("No shape specified");
        return;
    }
    
    // Stop any currently playing audio
    Object.values(shapeAudios).forEach(audio => {
        if (audio && !audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
    
    // Reset flag when stopping previous audio
    audioPlaying = false;
    
    // Get or create audio for this shape
    let audio = shapeAudios[shape];
    
    if (!audio) {
        // Create audio on the fly if not preloaded
        const audioPath = `audio/shapes/${shape}.mp3`;
        audio = new Audio(audioPath);
        audio.preload = "auto";
        shapeAudios[shape] = audio;
        
        // Handle errors
        audio.addEventListener("error", function(e) {
            console.error(`Audio file for ${shape} failed to load:`, e);
            audioPlaying = false;
        }, { once: true });
        
        audio.load();
    }
    
    // Reset audio to beginning
    audio.currentTime = 0;
    
    // Set up event listeners (using once: true so they auto-remove)
    audio.addEventListener("ended", function() {
        audioPlaying = false;
    }, { once: true });
    
    // Function to attempt playing audio
    const playAudio = () => {
        audioPlaying = true;
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    // Audio is playing successfully
                    console.log(`Playing audio for: ${shape}`);
                })
                .catch(err => {
                    // Play failed - might need to load first
                    console.error(`Error playing audio for ${shape}:`, err);
                    
                    // If audio isn't loaded (readyState 0 = HAVE_NOTHING), try loading first
                    if (audio.readyState === 0) {
                        audio.load().then(() => {
                            return audio.play();
                        }).then(() => {
                            console.log(`Audio loaded and playing for: ${shape}`);
                        }).catch(loadErr => {
                            console.error(`Failed to load/play audio for ${shape}:`, loadErr);
                            audioPlaying = false;
                        });
                    } else {
                        // Audio was loaded but play failed for another reason
                        audioPlaying = false;
                    }
                });
        } else {
            // Browser doesn't return a promise (very old browsers)
            setTimeout(() => {
                if (audio.paused && audioPlaying) {
                    audioPlaying = false;
                    console.error(`Audio for ${shape} did not start playing`);
                }
            }, 100);
        }
    };
    
    // Check if audio is ready to play (readyState >= 2 means we have data)
    if (audio.readyState >= 2) {
        // Audio has enough data to play immediately
        playAudio();
    } else {
        // Audio isn't ready yet - wait for it to load
        const canPlayHandler = function() {
            playAudio();
        };
        
        audio.addEventListener("canplaythrough", canPlayHandler, { once: true });
        
        // Ensure we trigger loading if not already started
        if (audio.readyState === 0) {
            audio.load();
        }
        
        // Fallback: if loading takes too long, try playing anyway
        setTimeout(() => {
            if (!audioPlaying) {
                audio.removeEventListener("canplaythrough", canPlayHandler);
                playAudio();
            }
        }, 1000);
    }
    
    // Visual feedback for clicking
    cardElement.style.transform = "translateY(-10px) scale(1.05)";
    setTimeout(() => {
        cardElement.style.transform = "";
    }, 200);
}

// Reset shape card styles
function resetShapeCardStyles() {
    shapeCards.forEach(card => {
        card.style.transform = "";
        card.style.filter = "";
        card.style.borderColor = "";
    });
}

// Initialize when page loads
window.addEventListener("load", function() {
    console.log("Page loaded, starting shapes explorer");
    init();
});

// Keyboard support
document.addEventListener("keydown", function(event) {
    // Number keys 1-5 to click shape cards
    if (event.key >= "1" && event.key <= "5") {
        let index = parseInt(event.key) - 1;
        if (shapeCards[index]) {
            shapeCards[index].click();
        }
    }
    
    // Spacebar to randomize
    if (event.key === " ") {
        randomizeBtn.click();
    }
});

console.log("Shapes explorer script loaded successfully!");

