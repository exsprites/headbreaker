require('mocha');
const assert = require('assert');
const PuzzleCanvas = require('../src/canvas');
const {Slot, Tab, None} = require('../src/structure');
const NullPainter = require('../src/dummy-painter');
const {flipflop} = require('../src/sequence');

describe("PuzzleCanvas", () => {
  const painter = new NullPainter();

  it("can create a single-piece puzzle", () => {
    const canvas = new PuzzleCanvas('canvas', {
      width: 800, height: 800,
      pieceSize: 100, proximity: 20,
      borderFill: 10, strokeWidth: 2,
      lineSoftness: 0.12, strokeColor: 'black',
      image: null, painter: painter
    })

    canvas.withPiece({
      structure: {right: Tab, down: Tab, left: Slot},
      metadata: {
        id: 'a',
        currentPosition: {x: 50, y: 50},
        color: 'red'
      }
    });

    canvas.draw();

    assert.equal(canvas['__nullLayer__'].figures, 1);
    assert.equal(canvas['__nullLayer__'].drawn, true);

    assert.equal(!!canvas.figures[1], false);
    assert.equal(!!canvas.figures['a'], true);

    assert.equal(canvas.puzzle.pieces.length, 1);
    assert.deepEqual(canvas.puzzle.pieces[0].centralAnchor, {x: 50, y: 50});

  })

  it("can create a single-piece puzzle with strings", () => {
    const canvas = new PuzzleCanvas('canvas', {
      width: 800, height: 800,
      pieceSize: 100, proximity: 20,
      borderFill: 10, strokeWidth: 2,
      lineSoftness: 0.12, strokeColor: 'black',
      image: null, painter: painter
    })

    canvas.withPiece({
      structure: "STS-",
      metadata: {
        id: 'a',
        currentPosition: {x: 50, y: 50},
        color: 'red'
      }
    });

    canvas.draw();

    assert.equal(canvas['__nullLayer__'].figures, 1);
    assert.equal(canvas['__nullLayer__'].drawn, true);

    assert.equal(!!canvas.figures[1], false);
    assert.equal(!!canvas.figures['a'], true);

    const [piece] = canvas.puzzle.pieces;

    assert.equal(piece.right, Slot);
    assert.equal(piece.down, Tab);
    assert.equal(piece.left, Slot);
    assert.equal(piece.up, None);

  })


  it("can create an autogenerated puzzle", () => {
    const canvas = new PuzzleCanvas('canvas', {
      width: 800, height: 800,
      pieceSize: 100, proximity: 20,
      borderFill: 10, strokeWidth: 2,
      lineSoftness: 0.12, strokeColor: 'red',
      image: null, painter: painter
    });

    canvas.withPuzzle({
      verticalPiecesCount: 4,
      horizontalPiecesCount: 4,
      insertsGenerator: flipflop,
    });
    canvas.shuffle(0.7);
    canvas.draw();

    assert.equal(canvas['__nullLayer__'].figures, 16);
    assert.equal(canvas['__nullLayer__'].drawn, true);

    assert.equal(!!canvas.figures[0], false);
    assert.equal(!!canvas.figures[1], true);
    assert.equal(!!canvas.figures[16], true);
    assert.equal(!!canvas.figures[17], false);

    assert.equal(canvas.puzzle.pieces.length, 16);
  })

  it("can listen to connect events with figures", (done) => {
    const canvas = new PuzzleCanvas('canvas', {
      width: 800, height: 800,
      pieceSize: 100, proximity: 20,
      borderFill: 10, strokeWidth: 2,
      lineSoftness: 0.12, strokeColor: 'red',
      painter: painter
    });

    canvas.withPuzzle({
      verticalPiecesCount: 2,
      horizontalPiecesCount: 2,
      insertsGenerator: flipflop
    });
    canvas.draw();

    assert.equal(canvas['__nullLayer__'].figures, 4);
    assert.equal(canvas['__nullLayer__'].drawn, true);

    const [first, second] = canvas.puzzle.pieces;

    canvas.onConnect((piece, figure, target, targetFigure) => {
      assert.equal(canvas.getFigure(piece), figure);
      assert.equal(first, piece);

      assert.equal(canvas.getFigure(target), targetFigure);
      assert.equal(second, target);
      done();
    })

    first.connectHorizontallyWith(second);
  })

  it("can listen to disconnect events with figures", (done) => {
    const canvas = new PuzzleCanvas('canvas', {
      width: 800, height: 800,
      pieceSize: 100, proximity: 20,
      borderFill: 10, strokeWidth: 2,
      lineSoftness: 0.12, strokeColor: 'red',
      image: null, painter: painter
    });

    canvas.withPuzzle({
      verticalPiecesCount: 1,
      horizontalPiecesCount: 2,
      insertsGenerator: flipflop
    });
    canvas.draw();

    assert.equal(canvas['__nullLayer__'].figures, 2);
    assert.equal(canvas['__nullLayer__'].drawn, true);

    const [first, second] = canvas.puzzle.pieces;

    canvas.onDisconnect((piece, figure) => {
      assert.equal(canvas.getFigure(piece), figure);
      assert.equal(first, piece);
      done();
    })

    first.connectHorizontallyWith(second);
    first.disconnect();
  })

  it("can listen to multiple disconnect events with figures", (done) => {
    const canvas = new PuzzleCanvas('canvas', {
      width: 800, height: 800,
      pieceSize: 100, proximity: 20,
      borderFill: 10, strokeWidth: 2,
      lineSoftness: 0.12, strokeColor: 'red',
      image: null, painter: painter
    });

    canvas.withPuzzle({
      verticalPiecesCount: 3,
      horizontalPiecesCount: 3,
      insertsGenerator: flipflop
    });
    canvas.draw();

    assert.equal(canvas['__nullLayer__'].figures, 9);
    assert.equal(canvas['__nullLayer__'].drawn, true);

    const center = canvas.puzzle.pieces[4];

    let count = 0;
    canvas.onDisconnect(() => {
      count++;
      if (count === 4) {
        done();
      }
    })
    center.disconnect();
  })
});
