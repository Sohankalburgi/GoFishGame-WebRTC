"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeck = getDeck;
const suit = ['H', 'D', 'S', 'C'];
const comb = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const deck = [];
for (let i = 0; i < suit.length; i++) {
    for (let j = 0; j < comb.length; j++) {
        deck.push(suit[i] + comb[j]);
    }
}
function random(range, indexing) {
    return Math.floor(Math.random() * range) + indexing;
}
function shuffleDeck() {
    for (let i = 0; i < random(100, 1); i++) {
        let randomIdx1 = random(deck.length, 0);
        let randomIdx2 = random(deck.length, 0);
        let temp = deck[randomIdx1];
        deck[randomIdx1] = deck[randomIdx2];
        deck[randomIdx2] = temp;
    }
}
function getDeck() {
    shuffleDeck();
    return deck;
}
