document.addEventListener('DOMContentLoaded', () => {
    const pokemonListElement = document.getElementById('pokemon-list');
    const pokemonDetailsElement = document.getElementById('pokemon-details');
    const placeholderElement = pokemonDetailsElement.querySelector('.placeholder');
    const detailsContentElement = pokemonDetailsElement.querySelector('.details-content');

    const pokemonNameElement = document.getElementById('pokemon-name');
    const pokemonIdElement = document.getElementById('pokemon-id');
    const pokemonSpriteElement = document.getElementById('pokemon-sprite');
    const pokemonTypesElement = document.getElementById('pokemon-types');
    const pokemonStatsElement = document.getElementById('pokemon-stats');

    const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/pokemon';
    const MAX_POKEMON = 50; // Fetch the first 50 Pokémon

    let pokemonListCache = []; // Simple cache for list items

    // --- Fetch and Display Pokémon List ---
    async function fetchPokemonList() {
        try {
            const response = await fetch(`${POKEAPI_BASE_URL}?limit=${MAX_POKEMON}&offset=0`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            pokemonListCache = data.results; // Store fetched list
            displayPokemonList(pokemonListCache);
        } catch (error) {
            console.error("Could not fetch Pokémon list:", error);
            pokemonListElement.innerHTML = '<li class="error">Failed to load Pokémon list. Please try again later.</li>';
        }
    }

    function displayPokemonList(pokemonList) {
        pokemonListElement.innerHTML = ''; // Clear loading/error message
        pokemonList.forEach((pokemon, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${index + 1}. ${pokemon.name}`;
            listItem.dataset.url = pokemon.url; // Store the detail URL
            listItem.dataset.id = index + 1; // Store the ID for easier lookup later
            listItem.addEventListener('click', () => {
                 // Remove active class from any previously selected item
                const currentActive = pokemonListElement.querySelector('.active');
                if (currentActive) {
                    currentActive.classList.remove('active');
                }
                 // Add active class to the clicked item
                listItem.classList.add('active');
                fetchPokemonDetails(pokemon.url);
            });
            pokemonListElement.appendChild(listItem);
        });
    }

    // --- Fetch and Display Pokémon Details ---
    async function fetchPokemonDetails(url) {
        // Show loading state in details view
        placeholderElement.style.display = 'none';
        detailsContentElement.style.display = 'none'; // Hide old content
        pokemonDetailsElement.classList.add('loading'); // Add a class for potential spinner later
         // Add a temporary loading message inside details
        if (!pokemonDetailsElement.querySelector('.temp-loading')) {
            const tempLoading = document.createElement('div');
            tempLoading.textContent = 'Loading details...';
            tempLoading.className = 'placeholder temp-loading'; // Reuse placeholder style
            pokemonDetailsElement.appendChild(tempLoading);
        }


        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const pokemon = await response.json();
            displayPokemonDetails(pokemon);
        } catch (error) {
            console.error("Could not fetch Pokémon details:", error);
             // Show error in details view
            const tempLoading = pokemonDetailsElement.querySelector('.temp-loading');
            if (tempLoading) tempLoading.remove();
            placeholderElement.textContent = 'Failed to load details.';
            placeholderElement.style.display = 'block';
            detailsContentElement.style.display = 'none';
        } finally {
             // Remove loading state regardless of success/failure
             pokemonDetailsElement.classList.remove('loading');
              const tempLoading = pokemonDetailsElement.querySelector('.temp-loading');
              if (tempLoading) tempLoading.remove();
        }
    }

    function displayPokemonDetails(pokemon) {
        placeholderElement.style.display = 'none'; // Hide placeholder
        detailsContentElement.style.display = 'block'; // Show details container

        // --- Basic Info ---
        pokemonNameElement.textContent = pokemon.name;
        pokemonIdElement.textContent = `#${String(pokemon.id).padStart(3, '0')}`; // Pad ID (e.g., #001)

        // --- Sprite / Animation ---
        // Prefer animated sprite, fallback to default if not available
        const animatedSprite = pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default;
        const defaultSprite = pokemon.sprites.front_default;
        pokemonSpriteElement.src = animatedSprite || defaultSprite || 'placeholder.png'; // Add a placeholder image if none found
        pokemonSpriteElement.alt = pokemon.name;
        // Reset animation by briefly setting src to empty
        pokemonSpriteElement.style.display = 'none'; // Hide briefly
        setTimeout(() => {
             pokemonSpriteElement.style.display = 'block'; // Show again to restart GIF
        }, 10);


        // --- Types ---
        pokemonTypesElement.innerHTML = ''; // Clear previous types
        pokemon.types.forEach(typeInfo => {
            const typeBadge = document.createElement('span');
            typeBadge.textContent = typeInfo.type.name;
            typeBadge.className = `type-badge type-${typeInfo.type.name}`; // Class for general styling and specific type color
            pokemonTypesElement.appendChild(typeBadge);
        });

        // --- Stats ---
        pokemonStatsElement.innerHTML = ''; // Clear previous stats
        const maxStatValue = 255; // Max possible base stat for scaling bars

        pokemon.stats.forEach(statInfo => {
            const statItem = document.createElement('li');
            const statName = statInfo.stat.name;
            const statValue = statInfo.base_stat;

            // Clean up stat names (e.g., 'special-attack' -> 'Sp. Atk')
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
            statBar.className = `stat-bar ${statName.split('-')[0]}`; // Use first part for class (hp, attack, etc.)
            statBar.style.width = `0%`; // Start at 0 for animation
            statBar.textContent = statValue; // Show value inside bar

             // Animate the bar width after a short delay
            setTimeout(() => {
                statBar.style.width = `${Math.min(percentage, 100)}%`; // Set actual width (cap at 100%)
            }, 100); // Delay ensures transition works

            statBarContainer.appendChild(statBar);
            statItem.appendChild(statNameElement);
            statItem.appendChild(statBarContainer);
            pokemonStatsElement.appendChild(statItem);
        });
    }

    // --- Initial Load ---
    fetchPokemonList();
});