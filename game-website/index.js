const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d')



//canvas size
canvas.width = 1024
canvas.height = 576

//collisions array taken from Tiled in /data, arrange array into rows of 70 (map width)
const collisionsMap = []
for (let i = 0; i < collisions.length; i += 70) {
    collisionsMap.push(collisions.slice(i, 70 + i))
}

//battleZones array taken from Tiled in /data, arrange array into rows of 70 (map width)
const battleZonesMap = []
for (let i = 0; i < battleZonesData.length; i += 70) {
    battleZonesMap.push(battleZonesData.slice(i, 70 + i))
}


//offset to position map, player, boundary into center
const offset = {
    x: -300,
    y: -550
}


//iterate through collisionsMap array, if collision found (1025), then place in array
const boundaries = []
collisionsMap.forEach((row, i) => {
    row.forEach((symbol, j) => {
        if (symbol === 1025)
            boundaries.push(
                //give size and position to Boundary class with offset to adjust position
                new Boundary({
                    position: {
                        x: j * Boundary.width + offset.x,
                        y: i * Boundary.height + offset.y
                    }
                }))
    })
})

//iterate through collisionsMap array, if collision found (1025), then place in array
const battleZones = []
battleZonesMap.forEach((row, i) => {
    row.forEach((symbol, j) => {
        if (symbol === 1025)
            battleZones.push(
                //give size and position to Boundary class with offset to adjust position
                new Boundary({
                    position: {
                        x: j * Boundary.width + offset.x,
                        y: i * Boundary.height + offset.y
                    }
                }))
    })
})

//create image objects to use
const image = new Image()
image.src = './img/Cube Town.png'

const foregroundImage = new Image()
foregroundImage.src = './img/foreground.png'

const playerDownImage = new Image()
playerDownImage.src = './img/playerDown.png'

const playerUpImage = new Image()
playerUpImage.src = './img/playerUp.png'

const playerLeftImage = new Image()
playerLeftImage.src = './img/playerLeft.png'

const playerRightImage = new Image()
playerRightImage.src = './img/playerRight.png'




//create player object from Sprite class
//starting position, image, frames, sprites
const player = new Sprite({
    position: {
        x: canvas.width / 2 - 192 / 4 / 2,
        y: canvas.height / 2 - 68 / 2
    },
    image: playerDownImage,
    frames: {
        max: 4,
        hold: 20
    },
    sprites: {
        up: playerUpImage,
        left: playerLeftImage,
        right: playerRightImage,
        down: playerDownImage
    }
})

//create background object from Sprite class
//starting position (using offset), image
const background = new Sprite({
    position: {
        x: offset.x,
        y: offset.y
    },
    image: image
})

//create foreground object from Sprite class
//starting position (using offset), image
const foreground = new Sprite({
    position: {
        x: offset.x,
        y: offset.y
    },
    image: foregroundImage
})




//set keys used for moving, initial set to false
const keys = {
    w: {
        pressed: false
    },
    a: {
        pressed: false
    },
    s: {
        pressed: false
    },
    d: {
        pressed: false
    }
}


//objects grouped together to move in unison
const movables = [background, ...boundaries, foreground, ...battleZones]


//create a collision function to compare two objects, if they collide (positions are equal accounting for size), return true
function rectangularCollision({ rectangle1, rectangle2 }) {
    return (
        rectangle1.position.x + rectangle1.width >= rectangle2.position.x &&
        rectangle1.position.x <= rectangle2.position.x + rectangle2.width &&
        rectangle1.position.y <= rectangle2.position.y + rectangle2.height &&
        rectangle1.position.y + rectangle1.height >= rectangle2.position.y
    )
}


const battle = {
    initiated: false
}


//main function
function animate() {
    //method tells the browser that you wish to perform an animation and requests that the browser calls a specified function to update an animation before the next repaint.
    //creating a const allows specific frames
    const animationId = window.requestAnimationFrame(animate)
    //draw function used to display objects
    background.draw()
    //loop through boundaries and display each
    boundaries.forEach(boundary => {
        boundary.draw()
    })
    battleZones.forEach(battleZones => {
        battleZones.draw()
    })
    //draw function used to display player
    player.draw()
    //draw function used to display foreground last, overrides player + background
    foreground.draw()

    //create var moving
    let moving = true
    //set player initial moving
    player.animate = false

    //set speed to move objects
    const speed = 4


    if (battle.initiated)
        return

    //if moving in battle zone
    if (keys.w.pressed || keys.a.pressed || keys.s.pressed || keys.d.pressed) {
        //check every battleZone position, if player direction causes collision, set moving to false
        for (let i = 0; i < battleZones.length; i++) {
            const battleZone = battleZones[i]
            //return max
            const overlappingArea =
                (Math.min(player.position.x + player.width, battleZone.position.x + battleZone.width) - Math.max(player.position.x, battleZone.position.x)) *
                (Math.min(player.position.y + player.height, battleZone.position.y + battleZone.height) - Math.max(player.position.y, battleZone.position.y))
            if (rectangularCollision({
                rectangle1: player,
                rectangle2: battleZone
            }) &&
                //ensures player doesn't initiate battle from small overlap
                //dividing by 2 gives us the half of the player sprite
                overlappingArea > (player.width * player.height) / 2
                && Math.random() < 0.005
            ) {
                console.log("danger zone")
                //deactivate current animation loop
                window.cancelAnimationFrame(animationId)
                battle.initiated = true
                //# is used to reference ID of HTML var
                gsap.to('#overlappingDiv', {
                    //fades opacity to 1 over an animation
                    opacity: 1,
                    repeat: 3,
                    //returns back to 0 by going backwards
                    yoyo: true,
                    duration: 0.4,
                    onComplete() {
                        gsap.to('#overlappingDiv', {
                            opacity: 1,
                            duration: 0.4,
                            onComplete() {
                                initBattle()
                                animateBattle()
                                gsap.to('#overlappingDiv', {
                                    opacity: 0,
                                    duration: 0.4
                                })
                            }
                        })
                    }
                })
                break
            }
        }
    }

    //key pressed and if lastkey used (to change direction)
    if (keys.w.pressed && lastKey === 'w') {
        //set moving and change sprite
        player.animate = true
        player.image = player.sprites.up

        //check every boundary position, if player direction causes collision, set moving to false
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i]
            if (rectangularCollision({
                rectangle1: player,
                rectangle2: {
                    ...boundary, position: {
                        x: boundary.position.x,
                        y: boundary.position.y + speed
                    }
                }
            })) {
                console.log('collide')
                moving = false
                break
            }
        }

        //move each movable object
        if (moving)
            movables.forEach((movable) => {
                movable.position.y += speed
            })
    }
    else if (keys.a.pressed && lastKey === 'a') {
        player.animate = true
        player.image = player.sprites.left
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i]
            if (rectangularCollision({
                rectangle1: player,
                rectangle2: {
                    ...boundary, position: {
                        x: boundary.position.x + speed,
                        y: boundary.position.y
                    }
                }
            })) {
                console.log('collide')
                moving = false
                break
            }
        }
        if (moving)
            movables.forEach((movable) => {
                movable.position.x += speed
            })
    }
    else if (keys.s.pressed && lastKey === 's') {
        player.animate = true
        player.image = player.sprites.down
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i]
            if (rectangularCollision({
                rectangle1: player,
                rectangle2: {
                    ...boundary, position: {
                        x: boundary.position.x,
                        y: boundary.position.y - speed
                    }
                }
            })) {
                console.log('collide')
                moving = false
                break
            }
        }
        if (moving)
            movables.forEach((movable) => {
                movable.position.y -= speed
            })
    }
    else if (keys.d.pressed && lastKey === 'd') {
        player.animate = true
        player.image = player.sprites.right
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i]
            if (rectangularCollision({
                rectangle1: player,
                rectangle2: {
                    ...boundary, position: {
                        x: boundary.position.x - speed,
                        y: boundary.position.y
                    }
                }
            })) {
                console.log('collide')
                moving = false
                break
            }
        }
        if (moving)
            movables.forEach((movable) => {
                movable.position.x -= speed
            })
    }
}

//run animate function
animate()




//create empty var to be used for turning player on double input
let lastKey = ''

//create function for keydown, create cases for WASD, set lastkey and pressed.
window.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'w':
            keys.w.pressed = true
            lastKey = 'w'
            break
        case 'a':
            keys.a.pressed = true
            lastKey = 'a'
            break
        case 's':
            keys.s.pressed = true
            lastKey = 's'
            break
        case 'd':
            keys.d.pressed = true
            lastKey = 'd'
            break
    }
})

//create function for keyup, to change pressed flags to stop moving
window.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'w':
            keys.w.pressed = false
            break
        case 'a':
            keys.a.pressed = false
            break
        case 's':
            keys.s.pressed = false
            break
        case 'd':
            keys.d.pressed = false
            break
    }
})