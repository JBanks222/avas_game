/**
 * Colors Exploration Tool
 * Click on surfboards to hear their colors
 */

console.log("Colors Explorer - Jalen Banks");

// Current colors displayed
let currentColors = [];

// Track if any audio is currently playing
let audioPlaying = false;

// All available colors (10 total)
const allColors = [
    "black", "blue", "brown", "green", "orange", 
    "pink", "purple", "red", "white", "yellow"
];

// DOM elements
const randomizeBtn = document.querySelector("#randomizeBtn");
const surfboards = document.querySelectorAll(".surfboard");

// Audio elements for color pronunciation (one per surfboard)
let colorAudios = {};

// Initialize
function init() {
    console.log("Initializing Colors Explorer");
    randomizeColors();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    randomizeBtn.addEventListener("click", randomizeColors);
    
    // Add click listeners to surfboards - click to hear color
    surfboards.forEach(surfboard => {
        surfboard.addEventListener("click", function() {
            const clickedColor = this.getAttribute("data-color");
            playSurfboardColor(clickedColor, this);
        });
    });
}

// Randomize the colors on the surfboards
function randomizeColors() {
    console.log("Randomizing colors");
    
    // Stop any currently playing audio and reset all
    Object.values(colorAudios).forEach(audio => {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            // Remove all event listeners by cloning the audio element
            audio.src = "";
        }
    });
    audioPlaying = false;
    
    // Clear previous audio objects (but keep structure for reuse)
    // We'll keep the object structure but clear references
    for (let key in colorAudios) {
        delete colorAudios[key];
    }
    
    // Select 5 random colors from the 10 available
    currentColors = getRandomColors(5);
    
    console.log("Current colors:", currentColors);
    
    // Display surfboards with new colors
    displaySurfboards();
    
    // Reset surfboard styles
    resetSurfboardStyles();
}

// Get random colors (no duplicates)
function getRandomColors(count) {
    let shuffled = [...allColors];
    
    // Shuffle array using Fisher-Yates algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    
    return shuffled.slice(0, count);
}

// Display surfboards with current colors
function displaySurfboards() {
    for (let i = 0; i < surfboards.length; i++) {
        let surfboard = surfboards[i];
        let color = currentColors[i];
        
        // Set data attribute and image source
        surfboard.setAttribute("data-color", color);
        let img = surfboard.querySelector(".surfboard-img");
        img.src = `assets/surfboards/${color}.svg`;
        img.alt = `${color} surfboard`;
        
        // Preload audio for this color
        if (!colorAudios[color]) {
            const audio = new Audio(`audio/colors/${color}.mp3`);
            audio.preload = "auto";
            
            // Handle audio loading errors
            audio.addEventListener("error", function(e) {
                console.error(`Audio file for ${color} failed to load:`, e);
                // Remove from cache so we can retry
                delete colorAudios[color];
            });
            
            // Explicitly load the audio
            audio.load();
            colorAudios[color] = audio;
        }
    }
}

// Play color audio for a specific surfboard
function playSurfboardColor(color, surfboardElement) {
    // Validate color
    if (!color) {
        console.error("No color specified");
        return;
    }
    
    // Stop any currently playing audio
    Object.values(colorAudios).forEach(audio => {
        if (audio && !audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
    
    // Reset flag when stopping previous audio
    audioPlaying = false;
    
    // Get or create audio for this color
    let audio = colorAudios[color];
    
    if (!audio) {
        // Create audio on the fly if not preloaded
        audio = new Audio(`audio/colors/${color}.mp3`);
        audio.preload = "auto";
        colorAudios[color] = audio;
        
        // Handle errors
        audio.addEventListener("error", function(e) {
            console.error(`Audio file for ${color} failed to load:`, e);
            audioPlaying = false;
            // Fallback alert
            alert(`Color: ${color.toUpperCase()}`);
        }, { once: true });
    }
    
    // Reset audio to beginning
    audio.currentTime = 0;
    
    // Set up event listeners
    const handleEnded = function() {
        audioPlaying = false;
        // Using once: true so removeEventListener not needed
    };
    
    const handleError = function(e) {
        console.error(`Error playing audio for ${color}:`, e);
        audioPlaying = false;
        // Using once: true so removeEventListener not needed
    };
    
    audio.addEventListener("ended", handleEnded, { once: true });
    audio.addEventListener("error", handleError, { once: true });
    
    // Function to attempt playing audio
    const playAudio = () => {
        audioPlaying = true;
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    // Audio is playing successfully
                    console.log(`Playing audio for: ${color}`);
                })
                .catch(err => {
                    // Play failed - might need to load first
                    console.error(`Error playing audio for ${color}:`, err);
                    
                    // If audio isn't loaded (readyState 0 = HAVE_NOTHING), try loading first
                    if (audio.readyState === 0) {
                        audio.load().then(() => {
                            return audio.play();
                        }).then(() => {
                            console.log(`Audio loaded and playing for: ${color}`);
                        }).catch(loadErr => {
                            console.error(`Failed to load/play audio for ${color}:`, loadErr);
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
                    console.error(`Audio for ${color} did not start playing`);
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
    surfboardElement.style.transform = "translateY(-10px) scale(1.05)";
    setTimeout(() => {
        surfboardElement.style.transform = "";
    }, 200);
}

// Reset surfboard styles
function resetSurfboardStyles() {
    surfboards.forEach(surfboard => {
        surfboard.style.transform = "";
        surfboard.style.filter = "";
    });
}

// Initialize when page loads
window.addEventListener("load", function() {
    console.log("Page loaded, starting colors explorer");
    init();
});

// Keyboard support
document.addEventListener("keydown", function(event) {
    // Number keys 1-5 to click surfboards
    if (event.key >= "1" && event.key <= "5") {
        let index = parseInt(event.key) - 1;
        if (surfboards[index]) {
            surfboards[index].click();
        }
    }
    
    // Spacebar to randomize
    if (event.key === " ") {
        randomizeBtn.click();
    }
});

console.log("Colors explorer script loaded successfully!");
