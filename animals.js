/**
 * Animals Exploration Tool
 * Click on animal cards to hear their sounds
 */

console.log("Animals Explorer - Jalen Banks");

// Current animals displayed
let currentAnimals = [];

// Track if any audio is currently playing
let audioPlaying = false;

// All available animals (only animals with both sound and image files)
const allAnimals = [
    "chicken",
    "cow",
    "dog",
    "donkey",
    "duck",
    "horse",
    "lion",
    "monkey",
    "sheep"
];

// DOM elements
const randomizeBtn = document.querySelector("#randomizeBtn");
const animalCards = document.querySelectorAll(".animal-card");

// Audio elements for animal sounds (one per animal)
let animalAudios = {};

// Initialize
function init() {
    console.log("Initializing Animals Explorer");
    randomizeAnimals();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    randomizeBtn.addEventListener("click", randomizeAnimals);
    
    // Add click listeners to animal cards - click to hear sound
    animalCards.forEach(card => {
        card.addEventListener("click", function() {
            const clickedAnimal = this.getAttribute("data-animal");
            if (clickedAnimal) {
                playAnimalAudio(clickedAnimal, this);
            }
        });
    });
}

// Randomize the animals displayed
function randomizeAnimals() {
    console.log("Randomizing animals");
    
    // Stop any currently playing audio and reset all
    Object.values(animalAudios).forEach(audio => {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            audio.src = "";
        }
    });
    audioPlaying = false;
    
    // Clear previous audio objects
    for (let key in animalAudios) {
        delete animalAudios[key];
    }
    
    // Select 5 random animals from the available animals
    currentAnimals = getRandomAnimals(5);
    
    console.log("Current animals:", currentAnimals);
    
    // Display animal cards with new animals
    displayAnimalCards();
    
    // Reset animal card styles
    resetAnimalCardStyles();
}

// Get random animals (no duplicates)
function getRandomAnimals(count) {
    let shuffled = [...allAnimals];
    
    // Shuffle array using Fisher-Yates algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    
    return shuffled.slice(0, count);
}

// Display animal cards with current animals
function displayAnimalCards() {
    for (let i = 0; i < animalCards.length; i++) {
        let card = animalCards[i];
        let animal = currentAnimals[i];
        
        if (!animal) continue;
        
        // Set data attribute for CSS styling
        card.setAttribute("data-animal", animal);
        
        // Preload audio for this animal
        if (!animalAudios[animal]) {
            const audioPath = `audio/animals/${animal}.mp3`;
            const audio = new Audio(audioPath);
            audio.preload = "auto";
            
            // Handle audio loading errors
            audio.addEventListener("error", function(e) {
                console.error(`Audio file for ${animal} failed to load:`, e);
            });
            
            // Explicitly load the audio
            audio.load();
            animalAudios[animal] = audio;
        }
    }
}

// Play animal audio for a specific animal card
function playAnimalAudio(animal, cardElement) {
    // Validate animal
    if (!animal) {
        console.error("No animal specified");
        return;
    }
    
    // Stop any currently playing audio
    Object.values(animalAudios).forEach(audio => {
        if (audio && !audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
    
    // Reset flag when stopping previous audio
    audioPlaying = false;
    
    // Get or create audio for this animal
    let audio = animalAudios[animal];
    
    if (!audio) {
        // Create audio on the fly if not preloaded
        const audioPath = `audio/animals/${animal}.mp3`;
        audio = new Audio(audioPath);
        audio.preload = "auto";
        animalAudios[animal] = audio;
        
        // Handle errors
        audio.addEventListener("error", function(e) {
            console.error(`Audio file for ${animal} failed to load:`, e);
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
                    console.log(`Playing audio for: ${animal}`);
                })
                .catch(err => {
                    // Play failed - might need to load first
                    console.error(`Error playing audio for ${animal}:`, err);
                    
                    // If audio isn't loaded (readyState 0 = HAVE_NOTHING), try loading first
                    if (audio.readyState === 0) {
                        audio.load().then(() => {
                            return audio.play();
                        }).then(() => {
                            console.log(`Audio loaded and playing for: ${animal}`);
                        }).catch(loadErr => {
                            console.error(`Failed to load/play audio for ${animal}:`, loadErr);
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
                    console.error(`Audio for ${animal} did not start playing`);
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

// Reset animal card styles
function resetAnimalCardStyles() {
    animalCards.forEach(card => {
        card.style.transform = "";
        card.style.filter = "";
        card.style.borderColor = "";
    });
}

// Initialize when page loads
window.addEventListener("load", function() {
    console.log("Page loaded, starting animals explorer");
    init();
});

// Keyboard support
document.addEventListener("keydown", function(event) {
    // Number keys 1-5 to click animal cards
    if (event.key >= "1" && event.key <= "5") {
        let index = parseInt(event.key) - 1;
        if (animalCards[index]) {
            animalCards[index].click();
        }
    }
    
    // Spacebar to randomize
    if (event.key === " ") {
        randomizeBtn.click();
    }
});

console.log("Animals explorer script loaded successfully!");

