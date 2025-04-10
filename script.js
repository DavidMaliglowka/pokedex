document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const pokemonListElement = document.getElementById('pokemon-list');
    const mainScreenElement = document.getElementById('main-screen');
    const placeholderElement = mainScreenElement.querySelector('.placeholder');
    // Use the new wrapper ID for content display
    const detailsContentElement = document.getElementById('details-wrapper');
    const pokemonSpriteElement = document.getElementById('pokemon-sprite');
    const pokemonNameElement = document.getElementById('pokemon-name');
    const pokemonIdElement = document.getElementById('pokemon-id');
    const pokemonTypesElement = document.getElementById('pokemon-types');
    const pokemonStatsElement = document.getElementById('pokemon-stats');
    const flavorTextElement = document.getElementById('flavor-text');

    // D-Pad Buttons
    const dPadUp = document.getElementById('d-pad-up');
    const dPadDown = document.getElementById('d-pad-down');
    const dPadLeft = document.getElementById('d-pad-left'); // Added for potential future use
    const dPadRight = document.getElementById('d-pad-right'); // Added for potential future use

    // Audio Elements
    const audioSelect = document.getElementById('audio-select');
    const audioConfirm = document.getElementById('audio-confirm');
    const audioCry = document.getElementById('audio-cry'); // Added cry audio element

    const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/pokemon';
    const MAX_POKEMON = 151;

    // === Add this to the Pokedex's JavaScript (e.g., script.js) ===

    // --- iframe Controls Configuration ---
    const PARENT_SITE_ORIGIN = 'https://www.davidmaliglowka.com';

    // --- Escape Key Listener ---
    window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        // Check if running inside an iframe (optional but good practice)
        if (window.self !== window.top) {
            console.log('Escape pressed inside Pokedex iframe, sending message to parent:', PARENT_SITE_ORIGIN);
            window.parent.postMessage('escapePressed', PARENT_SITE_ORIGIN);
        }
    }
    });

    let pokemonListCache = [];
    let currentPokemonIndex = -1; // Track the currently selected index (-1 means none)

    // --- Sound Playback Helper ---
    function playSound(audioElement) {
        if (audioElement) {
            audioElement.currentTime = 0; // Rewind to start
            audioElement.play().catch(error => {
                // Autoplay policies might prevent playback without user interaction
                // We might need a "click anywhere to enable sound" button initially
                // For now, just log the error
                console.warn("Audio playback failed:", error);
            });
        }
    }

    // --- Fetch and Display Pokémon List ---
    async function fetchPokemonList() {
        const cacheKey = 'pokemonListCache';
        const cachedData = localStorage.getItem(cacheKey); // Use localStorage

        if (cachedData) {
            console.log('Loading Pokémon list from cache...');
            pokemonListCache = JSON.parse(cachedData);
            displayPokemonList(pokemonListCache);
            return; // Exit function, data loaded from cache
        }

        console.log('Fetching Pokémon list from API...');
        try {
            const response = await fetch(`${POKEAPI_BASE_URL}?limit=${MAX_POKEMON}&offset=0`);
             if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
             const data = await response.json();
             pokemonListCache = data.results;
            localStorage.setItem(cacheKey, JSON.stringify(pokemonListCache)); // Cache using localStorage
            displayPokemonList(pokemonListCache);
        } catch (error) {
            console.error("Could not fetch Pokémon list:", error);
            pokemonListElement.innerHTML = '<li class="error">Failed to load list.</li>';
        }
    }

    function displayPokemonList(pokemonList) {
        pokemonListElement.innerHTML = ''; // Clear loading/error message
        pokemonList.forEach((pokemon, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${pokemon.name}`;
            listItem.dataset.url = pokemon.url;
            listItem.dataset.id = index + 1; // Use 1-based ID for dataset

            listItem.addEventListener('click', () => {
                // playSound(audioSelect); // Play select sound on click
                selectPokemon(index); // Use helper function to select
            });
            pokemonListElement.appendChild(listItem);
        });
    }

    // --- Select Pokémon Helper Function ---
    function selectPokemon(index) {
        if (index < 0 || index >= pokemonListCache.length) {
            console.warn("Index out of bounds:", index);
            return; // Invalid index
        }

        currentPokemonIndex = index; // Update current index

        // Remove active class from previously selected item
        const currentActive = pokemonListElement.querySelector('.active');
        if (currentActive) {
            currentActive.classList.remove('active');
        }

        // Find the new list item and add active class
        const newItem = pokemonListElement.querySelector(`li[data-id='${index + 1}']`);
        if (newItem) {
            newItem.classList.add('active');
            // Scroll the list item into view
            newItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            // Fetch details using the URL from the cache and pass the ID
            const pokemonId = index + 1;
            fetchPokemonDetails(pokemonListCache[index].url, pokemonListCache[index].name, pokemonId);
        } else {
             console.error("Could not find list item for index:", index);
        }
    }


    // --- Fetch and Display Pokémon Details --- Updated signature
    async function fetchPokemonDetails(url, name, pokemonId) {
        const cacheKey = `pokemonDetails_${pokemonId}`;
        const cachedData = localStorage.getItem(cacheKey); // Use localStorage

        placeholderElement.textContent = 'Loading...';
        placeholderElement.style.display = 'block';
        detailsContentElement.style.display = 'none'; // Hide wrapper
        pokemonTypesElement.innerHTML = '';
        pokemonStatsElement.innerHTML = '<li class="loading">Loading stats...</li>';

        if (cachedData) {
            console.log(`Loading details for ${name} (ID: ${pokemonId}) from cache...`);
            const pokemon = JSON.parse(cachedData);
            displayPokemonDetails(pokemon); // Display the cached (smaller) object
            fetchFlavorText(pokemonId); // Still fetch flavor text (or check its cache)
            // playSound(audioConfirm);
            return; // Exit function, data loaded from cache
        }

        console.log(`Fetching details for ${name} (ID: ${pokemonId}) from API...`);
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const fullPokemonData = await response.json(); // Get the full data

            // Create a smaller object for caching
            const pokemonToCache = {
                id: fullPokemonData.id,
                name: fullPokemonData.name,
                sprites: {
                    front_default: fullPokemonData.sprites.front_default,
                    versions: {
                        'generation-v': {
                            'black-white': {
                                animated: {
                                    front_default: fullPokemonData.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default
                                }
                            }
                        }
                    }
                },
                types: fullPokemonData.types.map(t => ({ type: { name: t.type.name } })), // Only keep type names
                stats: fullPokemonData.stats.map(s => ({ base_stat: s.base_stat, stat: { name: s.stat.name } })), // Only keep stat names and base_stat
                cries: { // Add cries to cache
                    latest: fullPokemonData.cries?.latest,
                    legacy: fullPokemonData.cries?.legacy
                }
            };

            // Cache the smaller object using localStorage
            localStorage.setItem(cacheKey, JSON.stringify(pokemonToCache));

            displayPokemonDetails(pokemonToCache); // Display the smaller object
            fetchFlavorText(pokemonId);
            // playSound(audioConfirm); // Play confirm sound after successful load
        } catch (error) {
            // Handle potential quota errors during setItem as well
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                 console.warn(`Could not cache details for ${name}: LocalStorage quota exceeded.`);
                 // If caching fails, try to display the full data fetched before the error
                 if (typeof fullPokemonData !== 'undefined') {
                    displayPokemonDetails(fullPokemonData);
                    fetchFlavorText(pokemonId);
                    // playSound(audioConfirm);
                    return; // Continue without caching if display worked
                 }
            } else {
                 console.error(`Could not fetch details for ${name}:`, error);
            }

            placeholderElement.textContent = 'Load failed!';
            placeholderElement.style.display = 'block';
            detailsContentElement.style.display = 'none'; // Keep wrapper hidden
            pokemonStatsElement.innerHTML = '<li class="error">Stats unavailable</li>';
        }
    }

    // --- Display Pokémon Details (minor update for wrapper) ---
    function displayPokemonDetails(pokemon) {
        placeholderElement.style.display = 'none';
        detailsContentElement.style.display = 'flex'; // Show wrapper (use flex for centering)

        // --- Main Screen ---
        pokemonNameElement.textContent = pokemon.name;
        pokemonIdElement.textContent = `#${String(pokemon.id).padStart(3, '0')}`;

        // Sprite Loading (no major changes needed here)
        const animatedSprite = pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default;
        const defaultSprite = pokemon.sprites.front_default;
        const spriteSrc = animatedSprite || defaultSprite || 'placeholder.png';
        const img = new Image();
        img.onload = () => {
            pokemonSpriteElement.src = spriteSrc;
            pokemonSpriteElement.alt = pokemon.name;
            playPokemonCry(pokemon); // Play cry when sprite loads
            pokemonSpriteElement.style.display = 'none'; // Hide briefly to reset gif
             setTimeout(() => { pokemonSpriteElement.style.display = 'block'; }, 10);
        };
        img.onerror = () => {
            pokemonSpriteElement.src = 'placeholder.png';
            pokemonSpriteElement.alt = "Sprite not found";
            playPokemonCry(pokemon); // Attempt to play cry even if sprite fails
            pokemonSpriteElement.style.display = 'block';
        }
        img.src = spriteSrc;

        // --- Info Screen (Types & Stats - no changes needed here) ---
        // Types
        pokemonTypesElement.innerHTML = '';
        pokemon.types.forEach(typeInfo => {
             const typeBadge = document.createElement('span');
             typeBadge.textContent = typeInfo.type.name;
             typeBadge.className = `type-badge type-${typeInfo.type.name}`;
             pokemonTypesElement.appendChild(typeBadge);
        });

        // Stats
        pokemonStatsElement.innerHTML = '';
        const maxStatValue = 255;
        pokemon.stats.forEach(statInfo => {
            const statItem = document.createElement('li');
            const statName = statInfo.stat.name;
            const statValue = statInfo.base_stat;
            const formattedStatName = statName.replace('special-attack','Sp. Atk').replace('special-defense','Sp. Def').replace('-', ' ');
            const statNameElement = document.createElement('span');
            statNameElement.className = 'stat-name';
            statNameElement.textContent = formattedStatName;
            const statBarContainer = document.createElement('div');
            statBarContainer.className = 'stat-bar-container';
            const statBar = document.createElement('div');
            const percentage = (statValue / maxStatValue) * 100;
            statBar.className = `stat-bar ${statName}`; // Use full statName for class
            statBar.style.width = `0%`;
            statBar.textContent = statValue;
            statBarContainer.appendChild(statBar);
            statItem.appendChild(statNameElement);
            statItem.appendChild(statBarContainer);
            pokemonStatsElement.appendChild(statItem);
            requestAnimationFrame(() => {
                setTimeout(() => { statBar.style.width = `${Math.min(percentage, 100)}%`; }, 50);
            });
        });
    }

    // --- Play Pokemon Cry --- Added this function
    function playPokemonCry(pokemon) {
        const cryUrl = pokemon.cries?.latest || pokemon.cries?.legacy;
        if (cryUrl && audioCry) {
            audioCry.src = cryUrl;
            playSound(audioCry); // Use existing helper
        } else {
            console.warn('No cry audio found for this Pokemon.');
            // Optionally play a default sound or do nothing
        }
    }

    // --- Fetch and Display Flavor Text ---
    async function fetchFlavorText(pokemonId) {
        const cacheKey = `pokemonSpecies_${pokemonId}`;
        const cachedData = localStorage.getItem(cacheKey); // Use localStorage
        let speciesFlavorEntries = null; // Store only the entries array

        flavorTextElement.textContent = 'Loading description...'; // Placeholder

        if (cachedData) {
            console.log(`Loading species data for ID ${pokemonId} from cache...`);
            // Directly parse the stored array
            speciesFlavorEntries = JSON.parse(cachedData);
        } else {
            console.log(`Fetching species data for ID ${pokemonId} from API...`);
            try {
                const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}/`;
                const response = await fetch(speciesUrl);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const speciesData = await response.json(); // Fetch full data
                speciesFlavorEntries = speciesData.flavor_text_entries; // Extract only the entries
                // Cache only the flavor text entries array
                localStorage.setItem(cacheKey, JSON.stringify(speciesFlavorEntries));
            } catch (error) {
                // Handle potential quota errors during setItem as well
                if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                     console.warn(`Could not cache species data for ID ${pokemonId}: LocalStorage quota exceeded.`);
                     // If caching fails, just proceed without caching if fetch was successful
                     // Need to ensure speciesFlavorEntries is populated if speciesData was fetched
                     if (typeof speciesData !== 'undefined') {
                         speciesFlavorEntries = speciesData.flavor_text_entries;
                     }
                } else {
                    console.error(`Could not fetch flavor text for ID ${pokemonId}:`, error);
                    flavorTextElement.textContent = 'Description unavailable.';
                    return; // Exit if fetch failed
                }
            }
        }

        // Process the speciesFlavorEntries (either from cache or fresh fetch)
        if (speciesFlavorEntries) {
             // Find the English flavor text for the 'red' version
            const flavorEntry = speciesFlavorEntries.find(entry =>
                entry.language.name === 'en' && entry.version.name === 'red'
            );

            if (flavorEntry) {
                // Clean up the flavor text (remove form feed/newlines)
                const cleanedText = flavorEntry.flavor_text.replace(/\f|\n/g, ' ');
                flavorTextElement.textContent = cleanedText;
            } else {
                // Fallback if specific entry not found
                const fallbackEntry = speciesFlavorEntries.find(entry => entry.language.name === 'en');
                 flavorTextElement.textContent = fallbackEntry ? fallbackEntry.flavor_text.replace(/\f|\n/g, ' ') : 'No description available.';
            }
        } else {
             // This case might occur if fetch failed AND caching failed
             flavorTextElement.textContent = 'Description unavailable.';
        }
    }

    // --- D-Pad Navigation ---
    function navigateList(direction) {
        if (pokemonListCache.length === 0) return; // No list loaded yet

        // playSound(audioSelect); // Play sound on D-pad press

        let targetIndex = currentPokemonIndex;

        if (direction === 'up') {
            targetIndex--;
        } else if (direction === 'down') {
            targetIndex++;
        } else if (direction === 'left') {
            targetIndex -= 10; // Jump back 10
        } else if (direction === 'right') {
            targetIndex += 10; // Jump forward 10
        }

        // Handle boundaries (stay within 0 to MAX_POKEMON-1)
        if (targetIndex < 0) {
            // targetIndex = 0; // Stop at the first item
            targetIndex = pokemonListCache.length - 1; // Wrap around to the last item
        } else if (targetIndex >= pokemonListCache.length) {
            // targetIndex = pokemonListCache.length - 1; // Stop at the last item
            targetIndex = 0; // Wrap around to the first item
        }

        // Only select if the index actually changed
        if (targetIndex !== currentPokemonIndex) {
             selectPokemon(targetIndex);
        }
    }

    // Add Event Listeners for D-Pad
    dPadUp.addEventListener('click', () => navigateList('up'));
    dPadDown.addEventListener('click', () => navigateList('down'));
    // Optionally use left/right as well (they do the same as up/down here)
    dPadLeft.addEventListener('click', () => navigateList('left'));
    dPadRight.addEventListener('click', () => navigateList('right'));


    // --- Initial Load ---
    fetchPokemonList();
});