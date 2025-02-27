const Pair = require('./pair');
const {anchor, Anchor} = require('./anchor');
const {None} = require('./insert')
const connector = require('./connector')
const Structure = require('./structure');
const {itself, orthogonalTransform} = require('./prelude');

/**
 * @callback TranslationListener
 * @param {Piece} piece
 * @param {number} dx
 * @param {number} dy
 */

/**
 * @callback ConnectionListener
 * @param {Piece} piece
 * @param {Piece} target
 */

 /**
  * @typedef {Object} PieceConfig
  * @property {import('./vector').Vector} [centralAnchor]
  * @property {import('./size').Size} [size]
  * @property {any} [metadata]
  */

/**
 * A piece primitive representation that can be easily stringified, exchanged and persisted
 *
 * @typedef {object} PieceDump
 * @property {import('./vector').Vector} centralAnchor
 * @property {import('./size').Size} [size]
 * @property {any} metadata
 * @property {import('./prelude').Orthogonal<object>} [connections]
 * @property {string} structure
 */

 /**
  * A jigsaw piece
  */
 class Piece {

   /**
    * @param {import('./structure').Structure} [structure]
    * @param {PieceConfig} [config]
    */
   constructor({up = None, down = None, left = None, right = None} = {}, config = {}) {
      this.up = up;
      this.down = down;
      this.left = left;
      this.right = right;
      /** @type {any} */
      this.metadata = {};
      /** @type {Anchor} */
      this.centralAnchor = null;
      /** @type {import('./size').Size} */
      this._size = null;
      this._initializeListeners();
      this.configure(config);
    }

  _initializeListeners() {
    /** @type {TranslationListener[]} */
    this.translateListeners = [];
    /** @type {ConnectionListener[]} */
    this.connectListeners = [];
    /** @type {ConnectionListener[]} */
    this.disconnectListeners = [];
  }

  /**
   * Runs positining, sizing and metadata configurations
   * in a single step
   *
   * @param {PieceConfig} config
   */
  configure(config) {
    if (config.centralAnchor) {
      this.centerAround(Anchor.import(config.centralAnchor));
    }

    if (config.metadata) {
      this.annotate(config.metadata);
    }

    if (config.size) {
      this.resize(config.size)
    }
  }


  /**
   * Adds unestructured user-defined metadata on this piece.
   *
   * @param {object} metadata
   */
  annotate(metadata) {
    Object.assign(this.metadata, metadata);
  }

  /**
   * Sets unestructured user-defined metadata on this piece.
   *
   * This object has no strong requirement, but it is recommended to have an
   * id property.
   *
   * @param {object} metadata
   */
  reannotate(metadata) {
    this.metadata = metadata;
  }

  /**
   * @param {import('./puzzle')} puzzle
   */
  belongTo(puzzle) {
    this.puzzle = puzzle;
  }

  /**
   * @type {Piece[]}
   */
  get presentConnections() {
    return this.connections.filter(itself);
  }

  /**
   * @type {Piece[]}
   */
  get connections() {
    return [
      this.rightConnection,
      this.downConnection,
      this.leftConnection,
      this.upConnection
    ];
  }

  /**
   * @type {import('./insert').Insert[]}
   */
  get inserts() {
    return [
      this.right,
      this.down,
      this.left,
      this.up
    ];
  }

  /**
   * @param {TranslationListener} f the callback
   */
  onTranslate(f) {
    this.translateListeners.push(f);
  }

  /**
   * @param {ConnectionListener} f the callback
   */
  onConnect(f) {
    this.connectListeners.push(f);
  }

  /**
   * @param {ConnectionListener} f the callback
   */
  onDisconnect(f) {
    this.disconnectListeners.push(f);
  }

  /**
   * @param {number} dx
   * @param {number} dy
   */
  fireTranslate(dx, dy) {
    this.translateListeners.forEach(it => it(this, dx, dy));
  }

  /**
   * @param {Piece} other
   */
  fireConnect(other) {
    this.connectListeners.forEach(it => it(this, other));
  }

    /**
   * @param {Piece[]} others
   */
  fireDisconnect(others) {
    others.forEach(other => {
      this.disconnectListeners.forEach(it => it(this, other));
    });
  }

  /**
   *
   * @param {Piece} other
   * @param {boolean} [back]
   */
  connectVerticallyWith(other, back = false) {
    connector.vertical.connectWith(this, other, this.proximity, back);
  }

  /**
   * @param {Piece} other
   */
  attractVertically(other, back = false) {
    connector.vertical.attract(this, other, back);
  }

  /**
   * @param {Piece} other
   * @param {boolean} [back]
   */
  connectHorizontallyWith(other, back = false) {
    connector.horizontal.connectWith(this, other, this.proximity, back);
  }

  /**
   * @param {Piece} other
   */
  attractHorizontally(other, back = false) {
    connector.horizontal.attract(this, other, back);
  }

  /**
   * @param {Piece} other
   * @param {boolean} [back]
   */
  tryConnectWith(other, back = false) {
    this.tryConnectHorizontallyWith(other, back);
    this.tryConnectVerticallyWith(other, back);
  }

  /**
   *
   * @param {Piece} other
   * @param {boolean} [back]
   */
  tryConnectHorizontallyWith(other, back = false) {
    if (this.canConnectHorizontallyWith(other)) {
      this.connectHorizontallyWith(other, back);
    }
  }
  /**
   *
   * @param {Piece} other
   * @param {boolean} [back]
   */
  tryConnectVerticallyWith(other, back = false) {
    if (this.canConnectVerticallyWith(other)) {
      this.connectVerticallyWith(other, back);
    }
  }

  disconnect() {
    if (!this.connected) {
      return;
    }
    const connections = this.presentConnections;

    if (this.upConnection) {
      this.upConnection.downConnection = null;
      /** @type {Piece} */
      this.upConnection = null;
    }

    if (this.downConnection) {
      this.downConnection.upConnection = null;
      this.downConnection = null;
    }

    if (this.leftConnection) {
      this.leftConnection.rightConnection = null;
      /** @type {Piece} */
      this.leftConnection = null;
    }

    if (this.rightConnection) {
      this.rightConnection.leftConnection = null;
      this.rightConnection = null;
    }

    this.fireDisconnect(connections);
  }

  /**
   * Sets the centralAnchor for this piece.
   *
   * @param {Anchor} anchor
   */
  centerAround(anchor) {
    if (this.centralAnchor) {
      throw new Error("this pieces has already being centered. Use recenterAround instead");
    }
    this.centralAnchor = anchor;
  }


  /**
   * Sets the initial position of this piece. This method is similar to {@link Piece#centerAround},
   * but takes a pair instead of an anchor.
   *
   * @param {number} x
   * @param {number} y
   */
  locateAt(x, y) {
    this.centerAround(anchor(x, y));
  }

  /**
   * Tells whether this piece central anchor is at given point
   *
   * @param {number} x
   * @param {number} y
   * @return {boolean}
   */
  isAt(x, y) {
    return this.centralAnchor.isAt(x, y);
  }

  /**
   * Moves this piece to the given position, firing translation events.
   * Piece must be already centered.
   *
   * @param {Anchor} anchor the new central anchor
   * @param {boolean} [quiet] indicates whether events should be suppressed
   */
  recenterAround(anchor, quiet = false) {
    const [dx, dy] = anchor.diff(this.centralAnchor);
    this.translate(dx, dy, quiet);
  }

  /**
   * Moves this piece to the given position, firing translation events.
   * Piece must be already centered. This method is similar to {@link Piece#recenterAround},
   * but takes a pair instead of an anchor.
   *
   * @param {number} x the final x position
   * @param {number} y the final y position
   * @param {boolean} [quiet] indicates whether events should be suppressed
   */
  relocateTo(x, y, quiet = false) {
    this.recenterAround(anchor(x, y), quiet);
  }

  /**
   * Move this piece a given distance, firing translation events
   *
   * @param {number} dx the x distance
   * @param {number} dy the y distance
   * @param {boolean} [quiet] indicates whether events should be suppressed
   */
  translate(dx, dy, quiet = false) {
    if (!Pair.isNull(dx, dy)) {
      this.centralAnchor.translate(dx, dy);
      if (!quiet) {
        this.fireTranslate(dx, dy);
      }
    }
  }

  /**
   *
   * @param {number} dx
   * @param {number} dy
   * @param {boolean} [quiet]
   * @param {Piece[]} [pushedPieces]
   */
  push(dx, dy, quiet = false, pushedPieces = [this]) {
    this.translate(dx, dy, quiet);

    const stationaries = this.presentConnections.filter(it => !it.metadata.fixed && pushedPieces.indexOf(it) === -1);
    pushedPieces.push(...stationaries);
    stationaries.forEach(it => it.push(dx, dy, false, pushedPieces));
  }

  /**
   *
   * @param {number} dx
   * @param {number} dy
   */
  drag(dx, dy, quiet = false) {
    if (Pair.isNull(dx, dy)) return;

    if (this.horizontallyOpenMovement(dx) && this.vericallyOpenMovement(dy)) {
      this.disconnect();
      this.translate(dx, dy, quiet);
    } else {
      this.push(dx, dy, quiet);
    }
  }

  drop() {
    this.puzzle.autoconnectWith(this);
  }

  dragAndDrop(dx, dy) {
    this.drag(dx, dy);
    this.drop();
  }

  /**
   *
   * @param {number} dy
   * @returns {boolean}
   */
  vericallyOpenMovement(dy) {
    return this.metadata.permanentVerticallyConnected === true
      ? false
      : (this.metadata.openMovement
        ? true 
        : connector.vertical.openMovement(this, dy));
  }

  /**
   *
   * @param {number} dx
   * @returns {boolean}
   */
  horizontallyOpenMovement(dx) {
    return this.metadata.permanentHorizontallyConnected === true
      ? false
      : (this.metadata.openMovement
        ? true
        : connector.horizontal.openMovement(this, dx))
  }

  /**
   *
   * @param {Piece} other
   * @returns {boolean}
   */
  canConnectHorizontallyWith(other) {
    return connector.horizontal.canConnectWith(this, other, this.proximity);
  }

  /**
   *
   * @param {Piece} other
   * @returns {boolean}
   */
  canConnectVerticallyWith(other) {
    return connector.vertical.canConnectWith(this, other, this.proximity);
  }

  /**
   *
   * @param {Piece} other
   * @returns {boolean}
   */
  verticallyCloseTo(other) {
    return connector.vertical.closeTo(this, other, this.proximity);
  }

  /**
   *
   * @param {Piece} other
   * @returns {boolean}
   */
  horizontallyCloseTo(other) {
    return connector.horizontal.closeTo(this, other, this.proximity);
  }


  /**
   *
   * @param {Piece} other
   * @returns {boolean}
   */
  verticallyMatch(other) {
    return connector.vertical.match(this, other);
  }

  /**
   *
   * @param {Piece} other
   * @returns {boolean}
   */
  horizontallyMatch(other) {
    return connector.horizontal.match(this, other);
  }

  get connected() {
    return !!(this.upConnection || this.downConnection || this.leftConnection || this.rightConnection);
  }

  /**
   *@type {Anchor}
   */
  get downAnchor() {
    return this.centralAnchor.translated(0, this.radio.y);
  }

  /**
   *@type {Anchor}
   */
  get rightAnchor() {
    return this.centralAnchor.translated(this.radio.x, 0);
  }

  /**
   *@type {Anchor}
   */
  get upAnchor() {
    return this.centralAnchor.translated(0, -this.radio.y);
  }

  /**
   *@type {Anchor}
   */
  get leftAnchor() {
    return this.centralAnchor.translated(-this.radio.x, 0);
  }

  /**
   * Defines this piece's own dimmension, overriding puzzle's
   * default dimmension
   *
   * @param {import('./size').Size} size
   */
  resize(size) {
    this._size = size;
  }

  /**
   * @type {import('./vector').Vector}
   */
  get radio() {
    return this.size.radio;
  }

  /**
   * The double of the radio
   *
   * @type {import('./vector').Vector}
   */
  get diameter() {
    return this.size.diameter;
  }

  get size() {
    return this._size || this.puzzle.pieceSize;
  }

  /**
   * @type {number}
   */
  get proximity() {
    return this.puzzle.proximity;
  }

  /**
   * This piece id. It is extracted from metadata
   *
   * @type {string}
   */
  get id() {
    return this.metadata.id;
  }

  /**
   * Converts this piece into a plain, stringify-ready object.
   * Connections should have ids
   *
   * @param {object} options
   * @param {boolean} [options.compact]
   * @returns {PieceDump}
   */
  export({compact = false} = {}) {
    const base = {
      centralAnchor: this.centralAnchor && this.centralAnchor.export(),
      structure: Structure.serialize(this),
      metadata: this.metadata
    };
    if (this._size) {
      base.size = {radio: this._size.radio };
    }
    return compact ? base : Object.assign(base, {
      connections: orthogonalTransform(this.connections, it => ({id: it.id}))
    })
  }

  /**
   * Converts this piece back from a dump. Connections are not restored. {@link Puzzle#autoconnect} method should be used
   * after importing all them
   *
   * @param {PieceDump} dump
   * @returns {Piece}
   */
  static import(dump) {
    return new Piece(
      Structure.deserialize(dump.structure),
      {centralAnchor: dump.centralAnchor, metadata: dump.metadata, size: dump.size});
  }
}

module.exports = Piece;
