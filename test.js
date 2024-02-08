// test.js

royal = new Hand();
royal.push(new Card('A','h'));
royal.push(new Card('K','h'));
royal.push(new Card('Q','h'));
royal.push(new Card('J','h'));
royal.push(new Card('T','h'));
royal.eval();
if (royal.rank == "Royal Flush") console.log("eval Royal passed");

straightFlush = new Hand();
straightFlush.push(new Card('9','h'));
straightFlush.push(new Card('K','h'));
straightFlush.push(new Card('Q','h'));
straightFlush.push(new Card('J','h'));
straightFlush.push(new Card('T','h'));
straightFlush.eval();
if (straightFlush.rank == "Straight Flush") console.log("eval Straight Flush passed");

quads = new Hand();
quads.push(new Card('K','s'));
quads.push(new Card('K','d'));
quads.push(new Card('K','c'));
quads.push(new Card('K','h'));
quads.push(new Card('T','h'));
quads.eval();
if (quads.rank == "Four-of-a-Kind") console.log("eval Four-of-a-Kind passed");

fullHouse = new Hand();
fullHouse.push(new Card('A','h'));
fullHouse.push(new Card('A','c'));
fullHouse.push(new Card('5','h'));
fullHouse.push(new Card('5','c'));
fullHouse.push(new Card('5','d'));
fullHouse.eval();
if (fullHouse.rank == "Full House") console.log("eval Full House passed");

flush = new Hand();
flush.push(new Card('A','c'));
flush.push(new Card('K','c'));
flush.push(new Card('5','c'));
flush.push(new Card('4','c'));
flush.push(new Card('3','c'));
flush.eval();
if (flush.rank == "Flush") console.log("eval Flush passed");

straight = new Hand();
straight.push(new Card('6','c'));
straight.push(new Card('5','c'));
straight.push(new Card('4','c'));
straight.push(new Card('3','c'));
straight.push(new Card('2','d'));
straight.eval();
if (straight.rank == "Straight") console.log("eval Straight passed");

trips = new Hand();
trips.push(new Card('A','c'));
trips.push(new Card('K','c'));
trips.push(new Card('5','c'));
trips.push(new Card('4','c'));
trips.push(new Card('3','c'));
trips.eval();
if (trips.rank == "Three-of-a-Kind") console.log("eval Three-of-a-Kind passed");

twoPairs = new Hand();
twoPairs.push(new Card('K','d'));
twoPairs.push(new Card('K','c'));
twoPairs.push(new Card('5','c'));
twoPairs.push(new Card('5','s'));
twoPairs.push(new Card('3','c'));
twoPairs.eval();
if (twoPairs.rank == "Two Pairs") console.log("eval Two Pairs passed");

highPair = new Hand();
highPair.push(new Card('A','c'));
highPair.push(new Card('K','c'));
highPair.push(new Card('5','c'));
highPair.push(new Card('4','c'));
highPair.push(new Card('A','d'));
highPair.eval();
if (highPair.rank == "High Pair") console.log("eval High Pair passed");

midPair = new Hand();
midPair.push(new Card('A','c'));
midPair.push(new Card('K','c'));
midPair.push(new Card('5','c'));
midPair.push(new Card('4','c'));
midPair.push(new Card('3','c'));
midPair.eval();
if (midPair.rank == "Mid Pair") console.log("eval Mid Pair passed");

lowPair = new Hand();
lowPair.push(new Card('A','c'));
lowPair.push(new Card('K','c'));
lowPair.push(new Card('5','c'));
lowPair.push(new Card('4','c'));
lowPair.push(new Card('4','d'));
lowPair.eval();
if (lowPair.rank == "Low Pair") console.log("eval Low Pair passed");

nothing = new Hand();
nothing.push(new Card('A','c'));
nothing.push(new Card('K','c'));
nothing.push(new Card('5','c'));
nothing.push(new Card('4','c'));
nothing.push(new Card('3','d'));
nothing.eval();
if (nothing.rank == "Nothing") console.log("eval Nothing passed");
