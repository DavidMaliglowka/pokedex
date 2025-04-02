document.addEventListener('DOMContentLoaded', () => {
    // --- Keep existing variable declarations ---
    const pokemonListElement = document.getElementById('pokemon-list');
    // Display elements (get references to the new structure)
    const mainScreenElement = document.getElementById('main-screen');
    const placeholderElement = mainScreenElement.querySelector('.placeholder');
    const detailsContentElement = mainScreenElement.querySelector('.details-content');
    const pokemonSpriteElement = document.getElementById('pokemon-sprite');
    const pokemonNameElement = document.getElementById('pokemon-name'); // Now a span
    const pokemonIdElement = document.getElementById('pokemon-id');   // Now a span

    const pokemonTypesElement = document.getElementById('pokemon-types');
    const pokemonStatsElement = document.getElementById('pokemon-stats');
    const infoScreenElement = document.querySelector('.info-screen'); // Get the right panel screen


    const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/pokemon';
    const MAX_POKEMON = 50;

    let pokemonListCache = [];

    // --- fetchPokemonList function remains the same ---
    async function fetchPokemonList() {
        try {
            const response = await fetch(`${POKEAPI_BASE_URL}?limit=${MAX_POKEMON}&offset=0`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            pokemonListCache = data.results;
            displayPokemonList(pokemonListCache);
        } catch (error) {
            console.error("Could not fetch Pokémon list:", error);
            pokemonListElement.innerHTML = '<li class="error">Failed to load list.</li>';
        }
    }

     // --- displayPokemonList function remains the same ---
     function displayPokemonList(pokemonList) {
        pokemonListElement.innerHTML = ''; // Clear loading/error message
        pokemonList.forEach((pokemon, index) => {
            const listItem = document.createElement('li');
            // Display only name in the list now
            listItem.textContent = `${pokemon.name}`;
            listItem.dataset.url = pokemon.url;
            listItem.dataset.id = index + 1;
            listItem.addEventListener('click', () => {
                const currentActive = pokemonListElement.querySelector('.active');
                if (currentActive) {
                    currentActive.classList.remove('active');
                }
                listItem.classList.add('active');
                // Pass the name as well for potential future use
                fetchPokemonDetails(pokemon.url, pokemon.name);
            });
            pokemonListElement.appendChild(listItem);
        });
    }


    // --- fetchPokemonDetails function remains mostly the same ---
    async function fetchPokemonDetails(url, name) {
        // Show loading state - update targets
        placeholderElement.textContent = 'Loading...';
        placeholderElement.style.display = 'block';
        detailsContentElement.style.display = 'none';
        // Clear right panel content while loading
        pokemonTypesElement.innerHTML = '';
        pokemonStatsElement.innerHTML = '<li class="loading">Loading stats...</li>'; // Indicate loading stats


        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const pokemon = await response.json();
            displayPokemonDetails(pokemon);
        } catch (error) {
            console.error(`Could not fetch details for ${name}:`, error);
             // Update error display
             placeholderElement.textContent = 'Load failed!';
             placeholderElement.style.display = 'block';
             detailsContentElement.style.display = 'none';
             pokemonStatsElement.innerHTML = '<li class="error">Stats unavailable</li>';
        }
    }

    // --- displayPokemonDetails function UPDATED ---
    function displayPokemonDetails(pokemon) {
        // --- Main Screen (Left Panel) ---
        placeholderElement.style.display = 'none'; // Hide placeholder
        detailsContentElement.style.display = 'block'; // Show details container

        pokemonNameElement.textContent = pokemon.name;
        pokemonIdElement.textContent = `#${String(pokemon.id).padStart(3, '0')}`;

        const animatedSprite = pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default;
        const defaultSprite = pokemon.sprites.front_default;
        const spriteSrc = animatedSprite || defaultSprite || 'placeholder.png'; // Add a placeholder image path if needed

        // Preload sprite to reduce flicker on reset
        const img = new Image();
        img.onload = () => {
            pokemonSpriteElement.src = spriteSrc;
            // Force reflow/restart GIF animation
            pokemonSpriteElement.style.display = 'none';
            setTimeout(() => { pokemonSpriteElement.style.display = 'block'; }, 10);
        };
        img.onerror = () => { // Handle sprite loading error
             pokemonSpriteElement.src = 'placeholder.png'; // Fallback image
             pokemonSpriteElement.alt = "Sprite not found";
             pokemonSpriteElement.style.display = 'block';
        }
        img.src = spriteSrc;


        // --- Info Screen (Right Panel) ---
        // Types
        pokemonTypesElement.innerHTML = ''; // Clear previous types
        pokemon.types.forEach(typeInfo => {
            const typeBadge = document.createElement('span');
            typeBadge.textContent = typeInfo.type.name;
            typeBadge.className = `type-badge type-${typeInfo.type.name}`;
            pokemonTypesElement.appendChild(typeBadge);
        });

        // Stats
        pokemonStatsElement.innerHTML = ''; // Clear loading/previous stats
        const maxStatValue = 255; // Max possible base stat for scaling bars

        pokemon.stats.forEach(statInfo => {
            const statItem = document.createElement('li');
            const statName = statInfo.stat.name;
            const statValue = statInfo.base_stat;

            const formattedStatName = statName
                .replace('special-attack', 'Sp. Atk')
                .replace('special-defense', 'Sp. Def')
                .replace('-', ' ');

            const statNameElement = document.createElement('span');
            statNameElement.className = 'stat-name';
            statNameElement.textContent = formattedStatName;

            const statBarContainer = document.createElement('div');
            statBarContainer.className = 'stat-bar-container';

            const statBar = document.createElement('div');
            const percentage = (statValue / maxStatValue) * 100;
            // Use simple name for class (hp, attack, defense, speed, etc.)
            const simpleStatName = statName.match(/^[a-z]+/)[0];
            statBar.className = `stat-bar ${simpleStatName}`;
            statBar.style.width = `0%`; // Start at 0 for animation
            statBar.textContent = statValue;

            statBarContainer.appendChild(statBar);
            statItem.appendChild(statNameElement);
            statItem.appendChild(statBarContainer);
            pokemonStatsElement.appendChild(statItem);

             // Animate the bar width after a short delay - ENSURE THIS IS INSIDE THE LOOP
             // Use requestAnimationFrame for smoother animation start
            requestAnimationFrame(() => {
                setTimeout(() => {
                    statBar.style.width = `${Math.min(percentage, 100)}%`;
                }, 50); // Small delay before starting animation
            });
        });
    }

    // --- Initial Load ---
    fetchPokemonList();
});