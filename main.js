let field,simBtn;
const PUYOLIST = ["blue","red","green"]


document.oncontextmenu = function() {
    if (mouseX < width && mouseY < height) return false;
}

function setup() {
    createCanvas(800, 800);
    field = new Field(6,12,40);
    puyoSelector = new PuyoSelector(PUYOLIST.length,1,40,field.w*field.gridSize+20,field.gridSize*2);
    simBtn = createButton('シミュレート');
    simBtn.position(320, 20);
    simBtn.mousePressed(() => field.simulate());
}

function draw() {
    background(220);
    field.draw();
    puyoSelector.draw();

    if (mouseIsPressed) {
        if (field.isLeftClicked()) {
            field.place(field.posToGrid(mouseX),field.posToGrid(mouseY),PUYOLIST[puyoSelector.selected])
        }
        if (field.isRightClicked()) {
            field.erase(field.posToGrid(mouseX),field.posToGrid(mouseY))
        }
        if (puyoSelector.isLeftClicked()) {
            puyoSelector.select(puyoSelector.posToGrid(mouseX))
        }
    }
}

class UIGrid {
    constructor(x,y,w,h,gridSize) {
        this.x=x;
        this.y=y;
        this.w = w
        this.h = h
        this.gridSize = gridSize
        this.cell = Array.from(new Array(this.w), () => new Array(this.h).fill(""));
    }
    draw() {
        for (let xx=0; xx<this.w; xx++){
            for (let yy=0; yy<this.h; yy++){
                rect(xx*this.gridSize+this.x,yy*this.gridSize+this.y,this.gridSize,this.gridSize)
            }
        }
    }
    posToGrid(pos, mode=0) { // 0:x 1:y
        return (mode==0) ? floor((pos-this.x)/this.gridSize) : floor((pos-this.y)/this.gridSize)
    }
    gridToPos(pos, mode=0) { // 0:x 1:y
        return (mode==0) ? pos*this.gridSize+this.x : pos*this.gridSize+this.y
    }
    isLeftClicked() {
        return (mouseButton === LEFT) && (mouseX >= this.x && mouseX <= this.gridToPos(this.w) && mouseY >=this.y && mouseY <= this.gridToPos(this.h))
    }
    isRightClicked() {
        return (mouseButton === RIGHT) && (mouseX >= this.x && mouseX <= this.gridToPos(this.w) && mouseY >=this.y && mouseY <= this.gridToPos(this.h))
    }
}

class Field extends UIGrid{
    constructor(w,h,gridSize,x=0,y=0) {
        super(x,y,w,h,gridSize)
        this.eraseInfo = []
    }

    draw() {
        for (let xx=0; xx<this.w; xx++){
            for (let yy=0; yy<this.h; yy++){
                rect(xx*this.gridSize,yy*this.gridSize,this.gridSize,this.gridSize)
                if (!this.isEmpty(xx,yy)) {
                    fill(color(this.cell[xx][yy]))
                    ellipse(xx*this.gridSize+0.5*this.gridSize,yy*this.gridSize+0.5*this.gridSize,this.gridSize)
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
    place(x,y,color) {
        this.cell[x][y] = color
    }
    erase (x,y) {
        this.cell[x][y] = ""
    }
    fall() {
        let found = false
        for (let x=this.w-1; x>=0; x--){
            for (let y=this.h-2; y>=0; y--){                
                if (!this.isEmpty(x,y) && this.isEmpty(x,y+1)) {
                    this.fallPuyo(x,y);
                    found=true
                }
            }
        }
        return found
    }
    canFall() { // not in use
        let found = false
        for (let x=this.w-1; x>=0; x--){
            for (let y=this.h-2; y>=0; y--){
                if (!this.isEmpty(x,y) && this.isEmpty(x,y+1)) {
                    found = true
                }
            }
        }
        return found
    }
    fallPuyo(x,y) {
        let i=y
        while (this.isEmpty(x,i+1)) {
            i+=1
        }
        this.cell[x][i] = this.cell[x][y]
        this.cell[x][y] = ""
    }
    async simulate() { // isfall関数を作る(落ちれるかどうか確認するだけで実際に落とす処理はやらない関数)
        while(this.fall()) {
            
            await this.wait();
            this.checkAll();
            await this.wait();
        }
        
    }
    wait() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 700);
        })
    }
}

class PuyoSelector extends UIGrid {
    constructor(w,h,gridSize,x=0,y=0) {
        super(x,y,w,h,gridSize);
        this.selected = 0;
    }
    draw() {
        stroke("grey")
        strokeWeight(3);
        rect(this.x+(this.selected*this.gridSize),this.y,this.gridSize,this.gridSize)
        stroke("black")
        strokeWeight(1);
        for (let i=0;i<PUYOLIST.length;i++){
            fill(color(PUYOLIST[i]))
            ellipse(this.x+i*this.gridSize+0.5*this.gridSize,this.y+0.5*this.gridSize,this.gridSize)
            fill(220)
        }
    }
    select(n) {
        this.selected = n
    }
}