/**
 * English Words Exploration Tool
 * Click on word cards to hear their pronunciation
 */

console.log("English Words Explorer - Jalen Banks");

// Current words displayed
let currentWords = [];

// Track if any audio is currently playing
let audioPlaying = false;

// All available words (from audio/english_words folder)
const allWords = [
    "dad",
    "friend",
    "goodbye",
    "hello",
    "love",
    "mom",
    "no",
    "please",
    "thank_you",
    "yes"
];

// DOM elements
const randomizeBtn = document.querySelector("#randomizeBtn");
const wordCards = document.querySelectorAll(".word-card");

// Audio elements for word pronunciation (one per word)
let wordAudios = {};

// Initialize
function init() {
    console.log("Initializing English Words Explorer");
    randomizeWords();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    randomizeBtn.addEventListener("click", randomizeWords);
    
    // Add click listeners to word cards - click to hear pronunciation
    wordCards.forEach(card => {
        card.addEventListener("click", function() {
            const clickedWord = this.getAttribute("data-word");
            if (clickedWord) {
                playWordAudio(clickedWord, this);
            }
        });
    });
}

// Randomize the words displayed
function randomizeWords() {
    console.log("Randomizing words");
    
    // Stop any currently playing audio and reset all
    Object.values(wordAudios).forEach(audio => {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            audio.src = "";
        }
    });
    audioPlaying = false;
    
    // Clear previous audio objects
    for (let key in wordAudios) {
        delete wordAudios[key];
    }
    
    // Select 5 random words from the available words
    currentWords = getRandomWords(5);
    
    console.log("Current words:", currentWords);
    
    // Display word cards with new words
    displayWordCards();
    
    // Reset word card styles
    resetWordCardStyles();
}

// Get random words (no duplicates)
function getRandomWords(count) {
    let shuffled = [...allWords];
    
    // Shuffle array using Fisher-Yates algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    
    return shuffled.slice(0, count);
}

// Display word cards with current words
function displayWordCards() {
    for (let i = 0; i < wordCards.length; i++) {
        let card = wordCards[i];
        let word = currentWords[i];
        
        if (!word) continue;
        
        // Set data attribute and display text
        card.setAttribute("data-word", word);
        const wordText = card.querySelector(".word-text");
        
        // Format the word for display (replace underscores with spaces, capitalize)
        const displayText = word.replace(/_/g, " ").split(" ").map(w => 
            w.charAt(0).toUpperCase() + w.slice(1)
        ).join(" ");
        
        wordText.textContent = displayText;
        
        // Preload audio for this word
        if (!wordAudios[word]) {
            // Try both .mp3 and .wav extensions
            const audioPath = `audio/english_words/${word}.mp3`;
            const audio = new Audio(audioPath);
            audio.preload = "auto";
            
            // Handle audio loading errors
            audio.addEventListener("error", function(e) {
                console.error(`Audio file for ${word} failed to load:`, e);
                // Try .wav extension as fallback
                const wavAudio = new Audio(`audio/english_words/${word}.wav`);
                wavAudio.preload = "auto";
                wavAudio.addEventListener("error", function() {
                    console.error(`WAV audio file for ${word} also failed to load`);
                    delete wordAudios[word];
                });
                wavAudio.addEventListener("canplaythrough", function() {
                    wordAudios[word] = wavAudio;
                }, { once: true });
                wavAudio.load();
            });
            
            // Explicitly load the audio
            audio.load();
            wordAudios[word] = audio;
        }
    }
}

// Play word audio for a specific word card
function playWordAudio(word, cardElement) {
    // Validate word
    if (!word) {
        console.error("No word specified");
        return;
    }
    
    // Stop any currently playing audio
    Object.values(wordAudios).forEach(audio => {
        if (audio && !audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
    
    // Reset flag when stopping previous audio
    audioPlaying = false;
    
    // Get or create audio for this word
    let audio = wordAudios[word];
    
    if (!audio) {
        // Create audio on the fly if not preloaded
        const audioPath = `audio/english_words/${word}.mp3`;
        audio = new Audio(audioPath);
        audio.preload = "auto";
        wordAudios[word] = audio;
        
        // Handle errors - try .wav as fallback
        audio.addEventListener("error", function(e) {
            console.error(`Audio file for ${word} failed to load:`, e);
            const wavAudio = new Audio(`audio/english_words/${word}.wav`);
            wavAudio.preload = "auto";
            wavAudio.addEventListener("error", function() {
                console.error(`WAV audio file for ${word} also failed to load`);
                audioPlaying = false;
            });
            wavAudio.addEventListener("canplaythrough", function() {
                wordAudios[word] = wavAudio;
            }, { once: true });
            wavAudio.load();
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
                    console.log(`Playing audio for: ${word}`);
                })
                .catch(err => {
                    // Play failed - might need to load first
                    console.error(`Error playing audio for ${word}:`, err);
                    
                    // If audio isn't loaded (readyState 0 = HAVE_NOTHING), try loading first
                    if (audio.readyState === 0) {
                        audio.load().then(() => {
                            return audio.play();
                        }).then(() => {
                            console.log(`Audio loaded and playing for: ${word}`);
                        }).catch(loadErr => {
                            console.error(`Failed to load/play audio for ${word}:`, loadErr);
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
                    console.error(`Audio for ${word} did not start playing`);
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

// Reset word card styles
function resetWordCardStyles() {
    wordCards.forEach(card => {
        card.style.transform = "";
        card.style.filter = "";
        card.style.borderColor = "";
    });
}

// Initialize when page loads
window.addEventListener("load", function() {
    console.log("Page loaded, starting English words explorer");
    init();
});

// Keyboard support
document.addEventListener("keydown", function(event) {
    // Number keys 1-5 to click word cards
    if (event.key >= "1" && event.key <= "5") {
        let index = parseInt(event.key) - 1;
        if (wordCards[index]) {
            wordCards[index].click();
        }
    }
    
    // Spacebar to randomize
    if (event.key === " ") {
        randomizeBtn.click();
    }
});

console.log("English words explorer script loaded successfully!");

