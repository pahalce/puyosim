let field,simBtn;
document.oncontextmenu = function() {
    if (mouseX < width && mouseY < height) return false;
}

function setup() {
    createCanvas(800, 800);
    field = new Field();
    simBtn = createButton('シミュレート');
    simBtn.position(320, 20);
    simBtn.mousePressed(() => field.checkAll());

    fallBtn = createButton('落とす');
    fallBtn.position(320, 50);
    fallBtn.mousePressed(() => field.checkFall());
}

function draw() {
    background(220);
    field.draw();
}


function mousePressed() {
    if (mouseButton === LEFT) {
        if (mouseX >= 0 && mouseX <= field.gridToPos(field.w) && mouseY >=0 && mouseY <= field.gridToPos(field.h)) {
            field.place(field.posToGrid(mouseX),field.posToGrid(mouseY),"green")
        }
    }
    if (mouseButton === RIGHT) {
        if (mouseX >= 0 && mouseX <= field.gridToPos(field.w) && mouseY >=0 && mouseY <= field.gridToPos(field.h)) {
            field.erase(field.posToGrid(mouseX),field.posToGrid(mouseY))
        }
    }
}

class Field {
    constructor() {
        this.w = 6
        this.h = 12
        this.gridSize=40
        this.cell = Array.from(new Array(this.w), () => new Array(this.h).fill(""));
        this.eraseInfo = []
        this.cell[1][0]="blue"
        this.cell[2][0]="blue"
        this.cell[2][1]="blue"
        this.cell[3][1]="blue"
        this.cell[4][1]="blue"
        this.cell[2][1]="blue"
        this.cell[2][2]="blue"
        this.cell[2][5]="blue"
        this.cell[3][2]="blue"
        this.cell[4][2]="blue"
    }

    draw() {
        for (let x=0; x<this.w; x++){
            for (let y=0; y<this.h; y++){
                rect(x*this.gridSize,y*this.gridSize,this.gridSize,this.gridSize)
                if (!this.isEmpty(x,y)) {
                    fill(color(this.cell[x][y]))
                    ellipse(x*this.gridSize+0.5*this.gridSize,y*this.gridSize+0.5*this.gridSize,this.gridSize)
                    fill(220)
                }
            }
        }
    }

    isEmpty(x, y) {
        return this.cell[x][y] == ""
    }
    check(x,y,color,start=[0,0]) {
        this.eraseInfo=[]
        this.checkConnection(x,y,color,start)
        
        if (this.eraseInfo.length < 4) {
            this.eraseInfo.forEach(info => {
                this.cell[info.x][info.y] = info.color
            })
        } 
    }
    checkAll() {
        for (let x=0; x<this.w; x++){
            for (let y=0; y<this.h; y++){
                if (!this.isEmpty(x,y)) {
                    this.check(x,y,this.cell[x][y],[x,y])
                }
            }
        }
    }
    checkConnection(x,y,color,start=[0,0]) {
        if (x<0 || x>=this.w || y<0 || y>=this.h) return;
        if (this.cell[x][y] == "") return;
        if (this.cell[x][y] === color) {
            this.cell[x][y]=""
            this.eraseInfo.push({
                start:start,
                x:x,
                y:y,
                color:color
            })
            this.checkConnection(x+1,y,color);
            this.checkConnection(x,y+1,color);
            this.checkConnection(x-1,y,color);
            this.checkConnection(x,y-1,color);
        }
    }
    posToGrid(pos) {
        return floor(pos/this.gridSize)
    }
    gridToPos(pos) {
        return pos*this.gridSize
    }
    place(x,y,color) {
        this.cell[x][y] = color
    }
    erase (x,y) {
        this.cell[x][y] = ""
    }
    checkFall() {
        for (let x=this.w-1; x>=0; x--){
            for (let y=this.h-2; y>=0; y--){
                if (!this.isEmpty(x,y)) {
                    this.fall(x,y);
                }
            }
        }
    }
    fall(x,y) {
        if (!this.isEmpty(x,y+1)) return

        let i=y
        while (this.isEmpty(x,i+1)) {
            i+=1
        }
        this.cell[x][i] = this.cell[x][y]
        this.cell[x][y] = ""
    }
}