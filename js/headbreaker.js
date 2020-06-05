var headbreaker=function(t){var n={};function e(i){if(n[i])return n[i].exports;var o=n[i]={i:i,l:!1,exports:{}};return t[i].call(o.exports,o,o.exports,e),o.l=!0,o.exports}return e.m=t,e.c=n,e.d=function(t,n,i){e.o(t,n)||Object.defineProperty(t,n,{enumerable:!0,get:i})},e.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},e.t=function(t,n){if(1&n&&(t=e(t)),8&n)return t;if(4&n&&"object"==typeof t&&t&&t.__esModule)return t;var i=Object.create(null);if(e.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:t}),2&n&&"string"!=typeof t)for(var o in t)e.d(i,o,function(n){return t[n]}.bind(null,o));return i},e.n=function(t){var n=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(n,"a",n),n},e.o=function(t,n){return Object.prototype.hasOwnProperty.call(t,n)},e.p="",e(e.s=0)}([function(t,n){class e{constructor(t,n){this.x=t,this.y=n}equals(t){return t.x==this.x&&t.y==this.y}translated(t,n){return this.copy().translate(t,n)}translate(t,n){return this.x+=t,this.y+=n,this}closeTo(t,n){return i(this.x,t.x-n,t.x+n)&&i(this.y,t.y-n,t.y+n)}copy(){return new e(this.x,this.y)}}function i(t,n,e){return n<=t&&t<=e}class o{constructor({up:t=r,down:n=r,left:e=r,right:i=r}={}){this.up=t,this.down=n,this.left=e,this.right=i,this._initializeListeners()}_initializeListeners(){this.translateListeners=[],this.connectListeners=[],this.disconnectListeners=[]}belongsTo(t){this.puzzle=t}get connections(){return[this.upConnection,this.downConnection,this.leftConnection,this.rightConnection].filter(t=>t)}onTranslate(t){this.translateListeners.push(t)}onConnect(t){this.connectListeners.push(t)}onDisconnect(t){this.disconnectListeners.push(t)}fireOnTranslate(t,n){this.translateListeners.forEach(e=>e(t,n))}fireOnConnect(t){this.connectListeners.forEach(n=>n(t))}fireOnDisconnect(){this.disconnectListeners.forEach(t=>t())}connectVerticallyWith(t){if(!this.canConnectVerticallyWith(t))throw new Error("can not connect vertically!");this.translate(t.centralAnchor.x-this.centralAnchor.x,t.upAnchor.y-this.downAnchor.y),this.downConnection=t,t.upConnection=this,this.fireOnConnect(t)}connectHorizontallyWith(t){if(!this.canConnectHorizontallyWith(t))throw new Error("can not connect horizontally!");this.translate(t.leftAnchor.x-this.rightAnchor.x,t.centralAnchor.y-this.centralAnchor.y),this.rightConnection=t,t.leftConnection=this,this.fireOnConnect(t)}tryConnectHorizontallyWith(t){this.canConnectHorizontallyWith(t)&&this.connectHorizontallyWith(t)}tryConnectVerticallyWith(t){this.canConnectVerticallyWith(t)&&this.connectVerticallyWith(t)}disconnect(){this.connected&&this.fireOnDisconnect(),this.upConnection&&(this.upConnection.downConnection=null,this.upConnection=null),this.downConnection&&(this.downConnection.upConnection=null,this.downConnection=null),this.leftConnection&&(this.leftConnection.rightConnection=null,this.leftConnection=null),this.rightConnection&&(this.rightConnection.leftConnection=null,this.rightConnection=null)}placeAt(t){this.centralAnchor=t}translate(t,n,e=!1){s(t,n)||(this.centralAnchor.translate(t,n),e||this.fireOnTranslate(t,n))}push(t,n,e=!1,i=[]){const o=this.connections.filter(t=>-1===i.indexOf(t));this.translate(t,n,e),i.push(this),o.forEach(e=>e.push(t,n,!1,i))}drag(t,n,e=!1){s(t,n)||(this.horizontallyOpenMovement(t)&&this.vericallyOpenMovement(n)?(this.disconnect(),this.translate(t,n,e)):this.push(t,n,e))}drop(){this.puzzle.autoconnect(this)}dragAndDrop(t,n){this.drag(t,n),this.drop()}vericallyOpenMovement(t){return t>0&&!this.downConnection||t<0&&!this.upConnection||0==t}horizontallyOpenMovement(t){return t>0&&!this.rightConnection||t<0&&!this.leftConnection||0==t}canConnectHorizontallyWith(t){return this.horizontallyCloseTo(t)&&this.horizontallyMatch(t)}canConnectVerticallyWith(t){return this.verticallyCloseTo(t)&&this.verticallyMatch(t)}verticallyCloseTo(t){return this.downAnchor.closeTo(t.upAnchor,this.proximityTolerance)}horizontallyCloseTo(t){return this.rightAnchor.closeTo(t.leftAnchor,this.proximityTolerance)}verticallyMatch(t){return this.down.match(t.up)}horizontallyMatch(t){return this.right.match(t.left)}get connected(){return this.upConnection||this.rightConnection||this.leftConnection||this.rightConnection}get downAnchor(){return this.centralAnchor.translated(0,this.size)}get rightAnchor(){return this.centralAnchor.translated(this.size,0)}get upAnchor(){return this.centralAnchor.translated(0,-this.size)}get leftAnchor(){return this.centralAnchor.translated(-this.size,0)}get size(){return this.puzzle.pieceSize}get proximityTolerance(){return this.puzzle.proximityTolerance}}const r={isSlot:()=>!1,isTab:()=>!1,isNone:()=>!0,match:t=>!1};function s(t,n){return 0===t&&0===n}t.exports={isNullVector:s,anchor:function(t,n){return new e(t,n)},Anchor:e,None:r,Piece:o,Puzzle:class{constructor(t=2,n=1){this.pieceSize=t,this.proximityTolerance=n,this.pieces=[]}newPiece(t={}){const n=new o(t);return this.pieces.push(n),n.belongsTo(this),n}autoconnectAll(){this.pieces.forEach(t=>this.autoconnect(t))}autoconnect(t){this.pieces.filter(n=>n!==t).forEach(n=>{t.tryConnectHorizontallyWith(n),t.tryConnectVerticallyWith(n)})}},Slot:{isSlot:()=>!0,isTab:()=>!1,isNone:()=>!1,match:t=>t.isTab()},Tab:{isSlot:()=>!1,isTab:()=>!0,isNone:()=>!1,match:t=>t.isSlot()}}}]);
//# sourceMappingURL=headbreaker.js.map