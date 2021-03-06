/* New Schema
        Sprite definitions
        ABCD - binary definition of map
        A == 1 allow movement
        A == 0 denied movement
        B == 0 item (items will only change score and sprite if allow movement)
                CD = 00 empty
                CD = 10 wall
                CD = 01 small dot
                CD = 11 big dot
        B == 1 entity (entities will be able to toggle movement)
                CD == 00 pacman spawn
                CD == 10 enemy spawn
                CD == 01 enemy door
                CD == 11 reserve
        Examples:
                Wall: 0010
                Empty with movement: 1000
                Dot: 1001
                Pacman spawn: 0100 when movement begins toggle to 1100, else entity will be locked in place
                Enemy spawn: 0110 read line above
                Enemy door: 0101 deny movement to keep door closed 1101 to open door
*/
var map = [
        '4444444444444444444444444444', // 28 x 30 map
        '4999999999999449999999999994',
        '4944449444449449444449444494',
        '4d400494000494494000494004d4',
        '4944449444449449444449444494',
        '4999999999999999999999999994',
        '4944449449444444449449444494',
        '4944449449444444449449444494',
        '4999999449999449999449999994',
        '4444449444441441444449444444',
        '0000049444441441444449400000',
        '0000049441111111111449400000',
        '0000049441444aa4441449400000',
        '4444449441477777741449444444',
        '1111119111477777741119111111',
        '4444449441477777741449444444',
        '0000049441444444441449400000',
        '0000049441111111111449400000',
        '0000049441444444441449400000',
        '4444449441444444441449444444',
        '4999999999999449999999999994',
        '4944449444449449444449444494',
        '4944449444449449444449444494',
        '4d994499999993399999994499d4',
        '4449449449444444449449449444',
        '4449449449444444449449449444',
        '4999999449999449999449999994',
        '4944444444449449444444444494',
        '4944444444449449444444444494',
        '4999999999999999999999999994',
        '4444444444444444444444444444'
] // 320 bytes

function smallDot(game, cube, x, y) {
        radius = parseInt(cube/3);
        moveX = (cube/2+x*cube)-(radius/2);
        moveY = (cube/2+y*cube)-(radius/2);
        return game
                .circle(radius)
                .move(moveX,moveY)
                .fill('#fff');
}
function bigDot(game, cube, x, y) {
        radius = parseInt(cube);
        moveX = (cube/2+x*cube)-(radius/2);
        moveY = (cube/2+y*cube)-(radius/2);
        return game
                .circle(radius)
                .move(moveX,moveY)
                .fill('#fff');
}
function emptySpace(game, cube, x, y) {
        return game
                .rect(cube,cube)
                .move(x*cube,y*cube)
                .fill('#000').hide();
}
var degree = [0, 90, 180, 90, 270, 90, 180, 90, 0, 0, 0, 0, 270, 90, 0, 90];
function blockWall(game, cube, x, y, path, override) {
        // 1100 0110 0011 1001
        // 1100 up right draw from top right corner, goto opposite corner, then right bottom
        // 0110 right down
        // 0011 down left
        // 1001 left up
        var group = game.group();
        degree[0] = (override-1)*90;
        if(path==0 || path==3 || path==6 || path==12 || path==9) {
                var sprite = group.add(game.path('M'+cube+','+cube/2+' L'+cube*(2/3)+','+cube*(2/3)+' L'+cube/2+','+cube)
                        .rotate(degree[path], cube/2, cube/2));
        } else {
                var sprite = group.add(game.path('M'+cube/2+' 0 L'+cube/2+' '+cube).rotate(degree[path]));
        }
        return sprite.move(x*cube,y*cube)
                .stroke({color:'#00d', width:3});
}
function pacmanSprite(game, cube) {
        radius = parseInt(cube); // for divisions if needed
        // <path xmlns="http://www.w3.org/2000/svg" d="M300,200 h-150 a150,150 0 1,0 150,-150 z" fill="red" stroke="blue" stroke-width="5"/>
        // <path xmlns="http://www.w3.org/2000/svg" d="M300,200 h-150 a150,150 0 1,0 75,-129 z" fill="red" stroke="blue" stroke-width="5"/>
        var halfRad = (radius/2)
        var negRad = (-radius*0.86);
        group = game.group();
        pacman = game.path('M'+radius+','+radius+' h-'+radius+' a'+radius+','+radius+' 0 1,0 '+halfRad+','+negRad+' z').rotate(-30).fill('#ff0'); // -0.87, 0.5 for second -0.5 for first
        group.animateMouth = function() {
            pacman.stop();
            pacman.animate(40, '-').attr({
                'd': 'M'+radius+','+radius+' h-'+radius+' a'+radius+','+radius+' 0 1,0 '+halfRad+','+negRad+' z'
            }).after(function() {
                pacman.animate(40, '-').attr({
                    'd':'M'+radius+','+radius+' h-'+radius+' a'+radius+','+radius+' 0 1,0 0,-1 z'
                })
            });
        }
        return group.add(pacman);
}
function enemyDoor(game, cube, x, y) {
        group = game.group();
        var sprite = group.add(game.path('M0 '+cube/2+' L'+cube+' '+cube/2));
        return sprite.move(x*cube,y*cube)
                .stroke({color:'#F0A', width:3});
}
function enemySpawn(game, cube, x, y) {
        return game
                .rect(cube,cube)
                .move(x*cube,y*cube)
                .fill('#333');
}
/* New Schema
        Sprite properties and definitions
        ABCD - binary definition of map
        A == 1 allow movement
        A == 0 denied movement
        B == 0 item (items will only change score and sprite if allow movement)
                CD = 00 empty
                CD = 10 wall
                CD = 01 small dot
                CD = 11 big dot
        B == 1 entity (entities will be able to toggle movement)
                CD == 00 pacman spawn
                CD == 10 enemy spawn
                CD == 01 enemy door
                CD == 11 reserve
*/
var Entities = function(matrix, game, cube) {
        cube = cube/2; 
        var Pacman = function() {
                var self = this;
                self.config = {
                        _x:0,
                        _y:0,
                        x:0, // x1 and x2
                        y:0, // y1 and y2
                        direction:3, // 0 == up, 1 == right, 2 == down, 3 == left
                        svg:null,
                        busy:false
                };
                self.getPath = function() {
                        pathX = (self.config.x) % 2;
                        if(self.config.direction == 1) {
                                pathX = -pathX;
                        }
                        pathY = (self.config.y) % 2;
                        if(self.config.direction == 2) {
                                pathY = -pathY;
                        }
                        pathX = (self.config.x+pathX)/2;
                        pathY = (self.config.y+pathY)/2;
                        return matrix.getPath(pathX, pathY);
                }

                var eventListeners = {
                        block:[]
                }
                self.handleEvent = function(e) {
                        if(eventListeners[e]) {
                                for(var i=0;i<eventListeners[e].length;i++) {
                                      eventListeners[e][i]();  
                                }
                        }
                }
                self.on = function(e, cb) {
                        eventListeners[e].push(cb);
                }
        }
        Pacman.prototype.setSpawn = function(x1, y1, x2, y2) {
                var self = this;
                if(self.config.busy) {
                        return;
                }
                if(x1==undefined || y1==undefined) {
                        console.error('Cannot spawn, no spawn blocks set: ', config);
                        return;
                }
                if(x2==undefined || y2==undefined) {
                        self.config._x = x1*2;
                        self.config._y = y1*2;
                        return;
                }
                self.config._x = (x1*2+x2*2)/2;
                self.config._y = (y1*2+y2*2)/2;
        }
        Pacman.prototype.spawn = function() {
                var self = this;
                if(self.config.busy) {
                        return;
                }
                if(!self.config._x || !self.config._y) {
                        console.error('Cannot spawn, no spawn blocks set: ', self.config);
                        return;
                }
                self.config.x = self.config._x;
                self.config.y = self.config._y;
                self.config.direction = 3;
                if(self.config.svg==null) {
                        self.config.svg = pacmanSprite(game, parseInt(cube*1.3));
                }

                moveX = self.config.x*cube;
                moveY = self.config.y*cube;

                self.config.svg.move(moveX-2, moveY-2);
                self.config.busy = true;
                // after render set busy to true
        }
        rotate = [90,180,-90,0];
        Pacman.prototype.direction = function(n) {
                var self = this;
                if((self.config.x % 2 || self.config.y % 2) && ((n & 1)!=(self.config.direction & 1))) {
                        return false;
                }
                path = self.getPath();
                if(n & 1) {
                        a = n & 2;
                        // left right
                        if( ( a && !(path & 8) ) || ( !a && !(path & 2) ) ) {
                                // Not a valid path not moving
                                return false;
                        }
                } else {
                        // up down
                        if((n && !(path & 4)) || (!n && !(path & 1))) {
                                // Not a valid path not moving
                                return false;
                        }
                } // 0 == up, 1 == right, 2 == down, 3 == left
                self.config.direction = n;
                self.config.svg.rotate(rotate[n]);
                return true;
        }
        Pacman.prototype.move = function() {
                var self = this;
                path = self.getPath();

                var width = matrix.width*2;
                var height = matrix.height*2;
                var moveNow = function() {
                    moveX = self.config.x*cube;
                    moveY = self.config.y*cube;
                    self.config.svg.move(moveX-2, moveY-2);
                };
                var inRange = true;
                if(self.config.direction & 1) {
                        a = self.config.direction & 2;
                        // left right
                        inRange = self.config.x<(width-2) && self.config.x>0;
                        if(inRange) {
                            if( ( a && !(path & 8) ) || ( !a && !(path & 2) ) ) {
                                    // Not a valid path not moving
                                    return;
                            }
                        }
                        if(self.config.x>(width+1) && !a) {
                            self.config.x = -3;
                            moveNow();
                            return;
                        }
                        if(self.config.x<-2 && a) {
                            self.config.x = width+1;
                            moveNow();
                            return;
                        }
                        a ? self.config.x-- : self.config.x++; // if 3 go left if 1 go right
                } else {
                        // up down
                        inRange = self.config.y<(height-2) && self.config.y>0;
                        if(inRange) {
                            if((self.config.direction && !(path & 4)) || (!self.config.direction && !(path & 1))) {
                                    // Not a valid path not moving
                                    return;
                            }
                        }
                        if(self.config.y>(height+1) && self.config.direction) {
                            self.config.y = -3;
                            moveNow();
                            return;
                        }
                        if(self.config.y<-2 && !self.config.direction) {
                            self.config.y = height+1;
                            moveNow();
                            return;
                        }
                        self.config.direction ? self.config.y++ : self.config.y--; // if 2 go up if 0 go down
                } // 0 == up, 1 == right, 2 == down, 3 == left
                if(inRange || (self.config.x>-2 && self.config.x<width+2 && self.config.y>-2 && self.config.x<height+2)) {
                    moveX = self.config.x*cube;
                    moveY = self.config.y*cube;
                    self.config.svg.animate(65, '-').move(moveX-2, moveY-2);
                    if(self.config.x % 2 || self.config.y % 2) {
                        self.config.svg.animateMouth();
                    } else {
                        self.handleEvent('block');
                    }
                } else {
                    moveNow();
                }

        }
        Pacman.prototype.die = function() {
                this.config.svg.remove();
                this.config.busy = false;
                // on end of die set busy to false
        }
        var Enemy = function() {
                var self = this;
                self.config = {
                        _x:0,
                        _y:0,
                        x:0, // x1 and x2
                        y:0, // y1 and y2
                        direction:3, // 0 == up, 1 == right, 2 == down, 3 == left
                        svg:null,
                        busy:false
                };
                self.getPath = function() {
                        pathX = (self.config.x) % 2;
                        if(self.config.direction == 1) {
                                pathX = -pathX;
                        }
                        pathY = (self.config.y) % 2;
                        if(self.config.direction == 2) {
                                pathY = -pathY;
                        }
                        pathX = (self.config.x+pathX)/2;
                        pathY = (self.config.y+pathY)/2;
                        return matrix.getPath(pathX, pathY);
                }

                var eventListeners = {
                        block:[]
                }
                self.atIntersection = function() {

                }
                self.handleEvent = function(e) {
                        if(eventListeners[e]) {
                                for(var i=0;i<eventListeners[e].length;i++) {
                                      eventListeners[e][i]();  
                                }
                        }
                }
                self.on = function(e, cb) {
                        eventListeners[e].push(cb);
                }
        }
        Enemy.prototype.setSpawn = function(x1, y1, x2, y2) {
                var self = this;
                if(self.config.busy) {
                        return;
                }
                if(x1==undefined || y1==undefined) {
                        console.error('Cannot spawn, no spawn blocks set: ', config);
                        return;
                }
                if(x2==undefined || y2==undefined) {
                        self.config._x = x1*2;
                        self.config._y = y1*2;
                        return;
                }
                self.config._x = (x1*2+x2*2)/2;
                self.config._y = (y1*2+y2*2)/2;
        }
        Enemy.prototype.spawn = function() {
                var self = this;
                if(self.config.busy) {
                        return;
                }
                if(!self.config._x || !self.config._y) {
                        console.error('Cannot spawn, no spawn blocks set: ', self.config);
                        return;
                }
                self.config.x = self.config._x;
                self.config.y = self.config._y;
                self.config.direction = 3;
                if(self.config.svg==null) {
                        self.config.svg = pacmanSprite(game, cube*2);
                }

                moveX = (cube/2+self.config.x*cube)-(cube/2);
                moveY = (cube/2+self.config.y*cube)-(cube/2);

                self.config.svg.move(moveX, moveY);
                self.config.busy = true;
                // after render set busy to true
        }
        Enemy.prototype.move = function(x, y) { // pacman x, y

                // if at intersection
                // Where is pacman x, y
                // Where is self x, y
                // subtract x-x and subtract y-y
                // make positive use greater of value for axis (example x will be greater)
                // take original number if negative direction left if positive right (for y negative is up positive is down)
                // if current direction is equal to quickest path OR quickest path is not available THEN use other axis and follow above
                // if second quickest route is current direction or wall


                var self = this;
                path = self.getPath();
                if(self.config.direction & 1) {
                        a = self.config.direction & 2;
                        // left right
                        if( ( a && !(path & 8) ) || ( !a && !(path & 2) ) ) {
                                // Not a valid path not moving
                                return;
                        }
                        a ? self.config.x-- : self.config.x++; // if 3 go left if 1 go right
                } else {
                        // up down
                        if((self.config.direction && !(path & 4)) || (!self.config.direction && !(path & 1))) {
                                // Not a valid path not moving
                                return;
                        }
                        self.config.direction ? self.config.y++ : self.config.y--; // if 2 go up if 0 go down
                } // 0 == up, 1 == right, 2 == down, 3 == left
                moveX = cube/2+self.config.x*cube;
                moveY = cube/2+self.config.y*cube;
                self.config.svg.move(moveX, moveY);
                if(!(self.config.x % 2 || self.config.y % 2)) {
                        self.handleEvent('block');
                }
        }
        Enemy.prototype.die = function() {
                this.config.svg.remove();
                this.config.busy = false;
                // on end of die set busy to false
        }
        var Door = function() {

        }
        return {
                Pacman: Pacman,
                Enemy: Enemy,
                Door: Door
        }
}
var Matrix = function(map, svg, cube) {
        var self = this;

        self.game = svg;
        self.cube = cube || 20; // must be factor of 2
        self.width = map[0].length;
        self.height = map.length;

        lines = map.filter(function(m) { return self.width!==m.length});
        if(lines.length>0) {
                console.error('Could not generate matrix, missing columns for:', lines);
                return false;
        }

        // Each block to render the map is 4 bits, the next 4 bits will be possible directions (up right down left)
        self.length = self.width*self.height;
        // in bytes 1 block will be 1 byte, first 4 bits rendering data, last 4 bits direction data
        // Event binder
        var eventListeners = {
                init:[]
        }
        self.handleEvent = function(e) {
                if(eventListeners[e]) {
                        for(var i=0;i<eventListeners[e].length;i++) {
                              eventListeners[e][i]();  
                        }
                }
        }
        self.on = function(e, cb) {
                eventListeners[e].push(cb);
        }

        var buffer = new ArrayBuffer(self.length);
        self._bufInt = new Uint8Array(buffer);

        self.spriteRenders = [
                emptySpace,
                emptySpace,
                blockWall,
                enemySpawn,
                smallDot,
                enemyDoor,
                bigDot
        ];
        self.pacman = {
                x:[],
                y:[]
        }
        var blocks = [];
        self.drawBlock = function(i, x, y, path, override) {
                if(blocks[y]==undefined) {
                        blocks[y] = [];
                } else if(blocks[y][x]) {
                        blocks[y][x].remove();
                }
                blocks[y][x] = self.spriteRenders[i](self.game, self.cube, x, y, path, override);
        }
        self.configEntity = function(i, x, y) {
                if(i==1 && self.pacman.x.length<2) {
                        self.pacman.x.push(x);
                        self.pacman.y.push(y);
                }
        }
}
Matrix.prototype.init = function() {
        var self = this;
        var buildBlock = function(i, x, y) {
                up = y > 0 &&
                        parseInt(map[y-1][x], 16) & 1;

                down = y < self.height-1 &&
                        parseInt(map[y+1][x], 16) & 1;

                left =  x > 0 &&
                        parseInt(map[y][x-1], 16) & 1;

                right = x < self.width-1 &&
                        parseInt(map[y][x+1], 16) & 1;

                properties = parseInt(map[y][x], 16);
                path = up+right*2+down*4+left*8 << 4;

                var override = 0;
                if(path==0) {
                        y < self.height-1 && x < self.width-1 &&
                                (override += (parseInt(map[y+1][x+1], 16) & 1) && 1); // 1
                        x > 0 && y < self.height-1 &&
                                (override += (parseInt(map[y+1][x-1], 16) & 1) && 2); // 2
                        y > 0 && x > 0 &&
                                (override += (parseInt(map[y-1][x-1], 16) & 1) && 3); // 3
                }

                self._bufInt[i] = properties ^ path; // Set 8 bit buffer
                self.drawBlock(properties >> 1, x, y, path >> 4, override); // Draw Block entities
                self.configEntity(properties >> 1, x, y);
        }

        var i = 0;
        for(var y=0;y<=map.length;y++) {
                if(y==map.length) {
                        self.handleEvent('init');
                        break;
                }
                for(var x=0;x<map[y].length;x++) {
                        buildBlock(i, x, y);
                        i++;
                }
        }
}
Matrix.prototype.getBlock = function(x, y) {
        var self = this;
        var byteOffset = y*self.width+x;
        return self._bufInt[byteOffset] & 15; // return first 4 bits
}
Matrix.prototype.setBlock = function(x, y, value) {
        var self = this;
        var byteOffset = y*self.width+x;

        self._bufInt[byteOffset] = self._bufInt[byteOffset] >> 4 << 4 ^ parseInt(value);
        self.drawBlock(value >> 1, x, y);
        return self._bufInt[byteOffset] & 15;
}
Matrix.prototype.getPath = function(x, y) {
        var self = this;
        var byteOffset = y*self.width+x;
        return self._bufInt[byteOffset] >> 4; // return last 4 bits using shift
}
Matrix.prototype.setPath = function(x, y, value) {
        var self = this;
        var byteOffset = y*self.width+x;

        self._bufInt[byteOffset] = value << 4 ^ (self._bufInt[byteOffset] & 15);
        return self._bufInt[byteOffset] >> 4;
}

var Loop = function() {

}

var UI = function() {

}

window.onload=function() {
        var svg = SVG('pacman');
        var cube = 20;
        var matrix = new Matrix(map, svg, cube);
        matrix.on('init', function() {
                var entities = Entities(matrix, svg, cube);
                var pacman = new entities.Pacman;
                pacman.on('block', function() {
                        var x = pacman.config.x/2;
                        var y = pacman.config.y/2;
                        path = matrix.getBlock(x, y);
                        if(!(path & 2) && path & 8) {
                                matrix.setBlock(x, y, path & 1);
                        }
                })
                x = matrix.pacman.x;
                y = matrix.pacman.y;
                pacman.setSpawn(x[0], y[0], x[1], y[1]);
                pacman.spawn();
                var key = -1;
                var keys = [87,68,83,65];
                window.onkeydown = function(e) {
                        var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
                        i = keys.indexOf(charCode);
                        if(i!==-1 && i!==pacman.config.direction) {
                                key = i;
                        }
                }
                window.onkeyup = function(e) {
                        var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
                        i = keys.indexOf(charCode);
                        // down 83 up 87 right 68 left 65
                        if(charCode!==keys[pacman.config.direction] && i==key) {
                                key=-1;
                        }
                }
                setInterval(function() {
                        if(key!==-1 && pacman.direction(key)) {
                                key = -1;
                        };
                        pacman.move();
                }, 65);
        });
        matrix.init();

}
