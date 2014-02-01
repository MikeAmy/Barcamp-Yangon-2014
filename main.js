/*

    Copyright © Michael Stephen Amy, November 4th, 2009

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/



function main() {
    var air_viscosity = 0.02;

    var pow = Math.pow,
    sqrt = Math.sqrt,
    sin = Math.sin,
    cos = Math.cos,
    PI = Math.PI,
    random = Math.random,
    floor = Math.floor,
    round = Math.round;

    function NoiseBank(name, sound_url, channels) {
        this.bank = [];
        for (var channel_no = 0;
             channel_no < channels; 
             channel_no ++
        ) {
            this.bank[channel_no] = soundManager.createSound({
                id: name + channel_no,
                url: sound_url,
            });
        }
    }
    NoiseBank.prototype = {
        play: function () {
            // Play a random channel if it isn't playing.
            var noise = this.bank[floor(random()*this.bank.length)];
            if (!noise.playState) {
                noise.play();
            };            
        }
    }

    whumph = new NoiseBank('whumph', 'tro_bassPan.mp3', 4)
    whoosh = new NoiseBank('whoosh', 'ences_maraca1.mp3', 4)
    bang = new NoiseBank('bang', 'tritro', 4)
    pop = new NoiseBank('pop','tro_snare1.mp3',4)
    snap = new NoiseBank('snap','balonexplose1.mp3',10)
    scream = new NoiseBank('scream','xiulet.mp3',4)
    boom = new NoiseBank('boom', 'USAT_BOMB_processed.mp3', 4)

    var body = document.getElementById('id_body');
    
    var sky_height = 800;
    var sky_width = parseInt(getComputedStyle(body).getPropertyValue('width'));
    var canvas = document.createElement("canvas");
    canvas.setAttribute('height', sky_height);
    canvas.setAttribute('width', sky_width);
    body.insertBefore(canvas, document.getElementById('id_text'));
    
    var context = canvas.getContext("2d");

    
    var gravity_per_millisec = 9.8 / 1000;
    
    function move_according_to_gravity_and_air_resistance(
        time_diff_millis
    ) {
        with (this) {
            dy -= gravity_per_millisec * time_diff_millis;
            var air_slowdown = 1+(
                air_viscosity * (pow((dx*dx) + (dy*dy), 1.5)) / (size*size*size*8)
            )
            x += (dx /= air_slowdown);
            y += (dy /= air_slowdown);
        }
    }
    
    function Firework(type, sky, x, y, dx, dy, colour, size, fuse) {
        // Can launch, move and render itself
        this.launch = type.launch;
        this.move = type.move;
        this.explode = type.explode;
        this.sound = type.sound;
        
        this.sky = sky;
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.colour = colour;
        this.size = size;
        this.fuse = fuse;
    }    
    Firework.prototype = {
        iterate : function(
            time_diff_millis
        ) {
            // moves the firework according to type
            this.move(time_diff_millis);
            with (this) {
                // if firework went off screen, remove it
                if (y < 0 
                    || x < 0
                    || x > sky_width
                ) {
                    sky.remove();
                }

                // if fuse is expired, explode it
                if (fuse-- < 0) {
                    this.explode()
                }
            }
        },
        render : function () {
            with (this) {
                sky.draw(
                    colour,
                    x, y, 
                    size, size
                );
            }
        }
    }
    
    var Particle = {
        // Simply falls under gravity
        launch : function () {},
        explode : function () {
            this.sky.remove();
        },
        move : move_according_to_gravity_and_air_resistance
    }
    
    function random_brightness() {
        return floor(floor(random()*2) * (200 + random()*55))
    }
    
    function random_bright_colour() {
        var colour = [0,0,0];
        while (colour[0] == 0 
            & colour[1] == 0
            & colour[2] == 0
        ) {
            colour = [
                random_brightness(), 
                random_brightness(), 
                random_brightness()
            ];
        } 
        return colour;
    }
    
    function spray_particles(time_diff_millis) {
        var Class;
        var fuse;
        if (random() < 0.1) {
            Class = Shower;
            fuse = 30;
        }
        else {
            Class = Particle;
            fuse = 200;
        }
        this.sky.add_firework(
            new Firework(
                Class,
                this.sky,
                this.x, this.y, 
                -3+random()*6, 20, 
                this.colour, 
                4,
                fuse
            )
        );
    }
    var Fountain = {
        // sits on the ground shooting sparks in the air
        // sparks slowly change colour
        launch : function () {},
        move : spray_particles,
        explode : function () { 
            this.sky.remove(); 
        },
    }
    
    function explode_into_shower() {
        with (this) {
            var half_size = size/2;
            if (half_size > 0.5) {
                var no_fireworks = 5 + round(random() * 10);
                sky.add_cloud(
                    no_fireworks, 
                    x,y,
                    dx,dy,
                    size,
                    random_bright_colour(),
                    function () { return 2+random(); }
                )
            }
        }
        this.sky.remove();
        this.sound.play();
    }
        
    var Shower = {
        // shoots up and explodes, 
        // creating a cloud of exploding multicoloured particles 
        move : move_according_to_gravity_and_air_resistance,
        launch : function () {},
        explode : explode_into_shower,
        sound : pop
    }
    
    var Screamer = {
        // shoots up, firing out particles all the way up
        // white and yellow cloud of sparks, 
        move : function(time_diff_millis) {
            this.d = move_according_to_gravity_and_air_resistance
            this.d(time_diff_millis);
            with (this) {
                sky.add_cloud(
                    2, 
                    x,y,
                    dx,dy,
                    2,
                    random_bright_colour(),
                    function () { return 2+random(); }
                )
            }
        },
        launch : function () {
            scream.play()
        },
        explode : explode_into_shower,
        sound : snap
    }
    
    var Mortar = {
        // shoots up with a whumph, 
        // massive explosion and loud BOOM
        move : move_according_to_gravity_and_air_resistance,
        launch : function () {
            whumph.play();
        },
        explode : function () {
            with (this) {
                sky.add_cloud(
                    50, x, y, dx, dy, 4, random_bright_colour(),
                    function () {
                        return random()*15;
                    }
                )
                sky.remove();
                boom.play()
            }
        }
    }
    
    function spin(
        time_diff_millis
    ) {
        move_according_to_gravity_and_air_resistance.call(this, time_diff_millis)
        with (this) {
            x += sin(fuse / (0.5*PI)) * 10
            y += cos(fuse / (0.5*PI)) * 10
        }
    }

    var Spinner = {
        // flies up, spinning
        // want it to explode, forming a spiral pattern
        move : spin,
        launch : function () { whoosh.play(); },
        explode : explode_into_shower,
        sound : bang
    }
    
    var firework_types = [
        Screamer,
        Shower,
        Spinner,
        Mortar,
        Fountain
    ];
        
    function FireworksDisplay(
        initial_fireworks,
        max_fireworks,
        interval,
        time,
        millis_between_launches
    ) {
        this.top_firework = 0;
        this.max_fireworks = max_fireworks;
        this.no_fireworks = 0;
        this.millis_between_launches = millis_between_launches
        this.fireworks = {};
        for (var p = 0; p < initial_fireworks; p++) {
            this.launch_firework()
        }
        this.interval = interval;
        this.time = time;
    }
    function iterate_all_fireworks(time_diff_millis) {
        with (this) {
            clear();
            for (p in fireworks) {
                this.current_firework = p;
                var firework = fireworks[p];
                firework.render(this);
                firework.iterate(time_diff_millis);
            }
        }
        if (new Date().getTime() % this.millis_between_launches < 10) {
            this.launch_firework();
        }
        context.fillStyle = "white";
        context.fillText("Fireworks:"+this.no_fireworks, 10, 20)
    }
    FireworksDisplay.prototype = {
        launch_firework : function () {
            this.add_firework(
                new Firework(
                    firework_types[floor(random() * firework_types.length)],
                    this,
                    200+random()*(sky_width/2), 0, 
                    -3+random()*6, 15, 
                    random_bright_colour(), 
                    8, 
                    50 // 200 for fountain
                )
            );
        },
        add_firework : function (firework) {
            if (this.no_fireworks < this.max_fireworks) {
                this.fireworks[this.top_firework++] = firework;
                this.no_fireworks++;
                firework.launch();
            }
        },
        iterate : iterate_all_fireworks,
        remove : function () {
            delete this.fireworks[this.current_firework];
            this.no_fireworks--;
        },
        run : function () {
            var self = this;
            var display_interval_id = setInterval(
                function () {
                    self.iterate(self.interval);
                    //if (self.no_fireworks <= 0) {
                      //  self.launch_firework();
                    //}
                    self.time -= self.interval;
                    if ((self.time < 0)) {
                        self.iterate(self.interval);
                        clearInterval(display_interval_id);
                        self.clear();
                        context.fillStyle = "white";
                        context.fillText("Stopped", 10, 20);
                    }
                },
                10
            );
        },
        clear : function () {
            context.fillStyle = "rgba(0,0,0, 0.3)";
            context.fillRect(0, 0, sky_width, sky_height);
        },
        draw : function (colour, x,y, w,h) {
            context.fillStyle = "rgb("+colour.toString()+")";
            context.fillRect(x,sky_height-y, w,h);
        },
        add_cloud : function (no_fireworks, x,y, dx, dy, size, colour, speed_fn) {
            for (var firework_no = 0; 
                firework_no < no_fireworks;
                firework_no++
            ) {
                var direction = random()* PI *2;
                var speed = speed_fn();
                var particle_size = size/(1+random())
                
                var fuse;
                if (particle_size > 4) {
                    fuse = 20+(random()*20)
                }
                else {
                    fuse = 10000;
                }

                this.add_firework(
                    new Firework(
                        Shower,
                        this,
                        x, y,
                        dx + sin(direction) * speed,
                        dy + cos(direction) * speed,
                        colour,
                        particle_size, 
                        fuse
                    )
                );
            }
        }
    }

    user_code = document.getElementById('id_user_code');
    run = function () {
        eval(user_code.value).run();
    }
    run()
}

soundManager.waitForWindowLoad = true;
soundManager.onready(main);
