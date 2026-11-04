export function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * A deck draws cards without repeats. When it runs out it reshuffles,
 * making sure the next card is not the one that was just shown.
 */
export function createDeck(cards) {
  let pile = shuffle(cards);
  let last = null;

  return {
    draw() {
      if (cards.length === 0) return null;
      if (pile.length === 0) {
        pile = shuffle(cards);
        if (pile.length > 1 && pile[pile.length - 1] === last) {
          [pile[0], pile[pile.length - 1]] = [pile[pile.length - 1], pile[0]];
        }
      }
      last = pile.pop();
      return last;
    },
    remaining() {
      return pile.length;
    },
  };
}

/** Picks a random index in [0, n), avoiding `exclude` when possible. */
export function randomIndex(n, exclude = -1) {
  if (n <= 1) return 0;
  let i = Math.floor(Math.random() * n);
  if (i === exclude) i = (i + 1 + Math.floor(Math.random() * (n - 1))) % n;
  return i;
}
