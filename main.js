let field,simBtn;
const PUYOLIST = ["blue","red","green","yellow"]
const REN_BONUS = [0, 8, 16, 32, 64, 96, 128, 160, 192,224,256,288,320,352,384,416,448,480,512] // 連鎖ボーナス
const CON_BONUS = [0, 2, 3, 4, 5, 6, 7, 10] // 連結ボーナス
const COL_BONUS = [0,3,6,12,24] // 色ボーナス
const COLOR_BACK = 220

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
    background(COLOR_BACK);
    field.draw();
    puyoSelector.draw();

    if (mouseIsPressed) {
        if (!field.simulating) {
            if (field.isLeftClicked()) {
                field.place(field.posToGrid(mouseX),field.posToGrid(mouseY,1),PUYOLIST[puyoSelector.selected])
            }
            if (field.isRightClicked()) {
                field.erase(field.posToGrid(mouseX),field.posToGrid(mouseY))
            }
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
        return (mouseButton === LEFT) && (mouseX > this.x && mouseX < this.gridToPos(this.w) && mouseY > this.y && mouseY < this.gridToPos(this.h))
    }
    isRightClicked() {
        return (mouseButton === RIGHT) && (mouseX > this.x && mouseX < this.gridToPos(this.w) && mouseY > this.y && mouseY < this.gridToPos(this.h))
    }
}

class Field extends UIGrid{
    constructor(w,h,gridSize,x=0,y=0) {
        super(x,y,w,h,gridSize)
        this.eraseInfo = []
        this.rensa = 0;
        this.rensaInfo = []
        this.point = 0;
        this.simulating = false;
    }

    draw() {
        for (let xx=0; xx<this.w; xx++){
            for (let yy=0; yy<this.h; yy++){
                rect(xx*this.gridSize,yy*this.gridSize,this.gridSize,this.gridSize)
                if (!this.isEmpty(xx,yy)) {
                    fill(color(this.cell[xx][yy]))
                    ellipse(xx*this.gridSize+0.5*this.gridSize,yy*this.gridSize+0.5*this.gridSize,this.gridSize)
                    fill(COLOR_BACK)
                }
            }
        }
        textSize(32);
        fill("black")
        text(this.point, this.x+this.gridSize, this.gridSize*(this.h+1));
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
            this.eraseInfo=[]
        } else {
            this.rensaInfo.push({connection : this.eraseInfo.length, color : this.eraseInfo[0].color})
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
            this.checkConnection(x+1,y,color,start);
            this.checkConnection(x,y+1,color,start);
            this.checkConnection(x-1,y,color,start);
            this.checkConnection(x,y-1,color,start);
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
    canFall() {
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
    async simulate() {
        const saveCell = this.copyMatrix(this.cell); 
        this.simulating = true;
        this.rensa = 0;
        this.point = 0;
        this.rensaInfo=[]
        if (!this.canFall()) {
            this.rensa += 1;
            this.checkAll();
            if (this.rensaInfo.length != 0) this.calc_point();
            await this.wait();
        }

        while(this.fall()) {
            await this.wait();
            this.rensa += 1;
            this.checkAll();
            if (this.rensaInfo.length != 0) this.calc_point();
            await this.wait();
        }
        this.simulating = false;
        this.cell = this.copyMatrix(saveCell)
    }
    calc_point() {
        let connection_total=0, connection_b=0, used_color = [], bonus=0
        this.rensaInfo.forEach(rensa => {
            if (!(used_color.includes(rensa.color))) {
                used_color.push(rensa.color)
            }
            connection_total += rensa.connection
            if (rensa.connection >= CON_BONUS.length+3) {
                connection_b += CON_BONUS[CON_BONUS.length-1]
            } else {
                connection_b += CON_BONUS[rensa.connection-4]
            }
        })
        bonus = connection_b + COL_BONUS[used_color.length-1] + REN_BONUS[this.rensa-1]
        if (bonus === 0) bonus = 1;
        this.point += connection_total * 10 * (bonus)
        this.rensaInfo=[]
    }
    wait() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 700);
        })
    }
    copyMatrix(base) {
        const result = [];
        for (const line of base) {
          result.push(line.slice());
        }
        return result;
      }
}

class PuyoSelector extends UIGrid {
    constructor(w,h,gridSize,x=0,y=0) {
        super(x,y,w,h,gridSize);
        this.selected = 0;
    }
    draw() {
        fill(COLOR_BACK)
        stroke("grey")
        strokeWeight(3);
        rect(this.x+(this.selected*this.gridSize),this.y,this.gridSize,this.gridSize)
        stroke("black")
        strokeWeight(1);
        for (let i=0;i<PUYOLIST.length;i++){
            fill(color(PUYOLIST[i]))
            ellipse(this.x+i*this.gridSize+0.5*this.gridSize,this.y+0.5*this.gridSize,this.gridSize)
            fill(COLOR_BACK)
        }
    }
    select(n) {
        this.selected = n
    }
}