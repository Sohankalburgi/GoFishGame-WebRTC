export function checkSet(cards) {
    const map = new Map();

    // Populate the map with ranks as keys and arrays of cards as values
    cards.forEach((card) => {
        const rank = card.charAt(1); // Extract rank
        if (!map.has(rank)) {
            map.set(rank, []);
        }
        // Add card to the appropriate rank
        map.get(rank).push(card);
    });

    console.log("Card map:", map);

    // Check for a complete set of 4 cards with the same rank
    for (const [key, value] of map) {
        if (value.length === 4) {
            console.log("Found a set of 4 for rank:", key);
            return value; // Return the set of 4 cards
        }
    }

    return []; // Default return if no set of 4 found
}
