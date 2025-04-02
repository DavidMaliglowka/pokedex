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

    // D-Pad Buttons
    const dPadUp = document.getElementById('d-pad-up');
    const dPadDown = document.getElementById('d-pad-down');
    const dPadLeft = document.getElementById('d-pad-left'); // Added for potential future use
    const dPadRight = document.getElementById('d-pad-right'); // Added for potential future use

    // Audio Elements
    const audioSelect = document.getElementById('audio-select');
    const audioConfirm = document.getElementById('audio-confirm');

    const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/pokemon';
    const MAX_POKEMON = 50;

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
        try {
            // ... (fetch logic remains the same)
            const response = await fetch(`${POKEAPI_BASE_URL}?limit=${MAX_POKEMON}&offset=0`);
             if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
             const data = await response.json();
             pokemonListCache = data.results;
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
                playSound(audioSelect); // Play select sound on click
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
            // Fetch details using the URL from the cache
            fetchPokemonDetails(pokemonListCache[index].url, pokemonListCache[index].name);
        } else {
             console.error("Could not find list item for index:", index);
        }
    }


    // --- Fetch and Display Pokémon Details ---
    async function fetchPokemonDetails(url, name) {
        placeholderElement.textContent = 'Loading...';
        placeholderElement.style.display = 'block';
        detailsContentElement.style.display = 'none'; // Hide wrapper
        pokemonTypesElement.innerHTML = '';
        pokemonStatsElement.innerHTML = '<li class="loading">Loading stats...</li>';

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const pokemon = await response.json();
            displayPokemonDetails(pokemon);
            playSound(audioConfirm); // Play confirm sound after successful load
        } catch (error) {
            console.error(`Could not fetch details for ${name}:`, error);
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
            pokemonSpriteElement.style.display = 'none'; // Hide briefly to reset gif
             setTimeout(() => { pokemonSpriteElement.style.display = 'block'; }, 10);
        };
        img.onerror = () => {
            pokemonSpriteElement.src = 'placeholder.png';
            pokemonSpriteElement.alt = "Sprite not found";
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
            const simpleStatName = statName.match(/^[a-z]+/)[0];
            statBar.className = `stat-bar ${simpleStatName}`;
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

    // --- D-Pad Navigation ---
    function navigateList(direction) {
        if (pokemonListCache.length === 0) return; // No list loaded yet

        playSound(audioSelect); // Play sound on D-pad press

        let targetIndex = currentPokemonIndex;

        if (direction === 'up' || direction === 'left') {
            targetIndex--;
        } else if (direction === 'down' || direction === 'right') {
            targetIndex++;
        }

        // Handle boundaries (stay within 0 to MAX_POKEMON-1)
        if (targetIndex < 0) {
            targetIndex = 0; // Stop at the first item
            // Optional: Wrap around
            // targetIndex = pokemonListCache.length - 1;
        } else if (targetIndex >= pokemonListCache.length) {
            targetIndex = pokemonListCache.length - 1; // Stop at the last item
            // Optional: Wrap around
            // targetIndex = 0;
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