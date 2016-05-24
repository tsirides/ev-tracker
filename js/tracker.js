var Tracker = (function (self) {

    'use strict';

    // define default state of tracker
    self.mode = true;
    self.log = [];
    self.stats = {
        hp: 0,
        atk: 0,
        def: 0,
        spatk: 0,
        spdef: 0,
        speed: 0
    };
    self.modifiers = {
        pokerus: false,
        hordes: false,
        brace: false,
        power: false
    };
    
    // references for elements that need listeners
    self.inputs = document.getElementsByClassName('ev-input');
    self.buttons = document.getElementsByClassName('ev-button');
    self.toggles = document.getElementsByClassName('multiplier-toggle');
    self.tools = document.getElementById('help-buttons').children;
    
    // callback for changing EVs (buttons, inputs, and undo)
    self.updateValues = function (event, undo) {
        
        // get event information
        var id = event.currentTarget.parentNode.id,
            request = +event.currentTarget.innerHTML ||
                (-self.stats[id] + (+event.currentTarget.value)),
            total = 0,
            
            // check total EV limits (n <= 510)
            oLimits = function (request) {
                
                Object.keys(self.stats).forEach(function (k) { total += self.stats[k]; });
                
                return (total + request <= 510) ? request : (510 - total);
                
            },
            
            // check single EV limits (0 - 252)
            sLimits = function (request) {
                
                var oRequest = oLimits(request),
                    net = self.stats[id] + oRequest;
                
                //alert(oLimits(request));
                
                return (net < 0) ? -self.stats[id] :
                        ((net > 252) ? (252 - self.stats[id]) : oRequest);
                
            },
            
            validRequest = (request % 1 === 0) ? sLimits(request) : 0;
        
        // update logs and visuals
        self.stats[id] += validRequest;
        document.getElementById(id + '-bar').style.height = ((self.stats[id] / 252) * 95 + 5) + 'px';
        document.getElementById(id + '-input').value = self.stats[id];
        document.getElementById('ev-total').innerHTML =
            'EVs Remaining: ' + (510 - (total + validRequest)) + '/510';
        
        if (!undo && validRequest !== 0) {
            self.log.push({
                currentTarget: {
                    parentNode: {
                        id: id
                    },
                    innerHTML: -validRequest
                }
            });
        }

    };
    
    // update html buttons based on current state - called by updateModifier and updateState
    self.updateButtons = function () {
        
        var pokerus = (self.modifiers.pokerus) ? 2 : 1,
            hordes = (self.modifiers.hordes) ? 5 : 1,
            brace = (self.modifiers.brace) ? 2 : 1,
            power = (self.modifiers.power) ? 4 : 0,
            
            battleUpdater = function (value) {
                return '+' + (value + power) * pokerus * hordes * brace;
            },
            
            superUpdater = function (value) {
                return '+' + (value * 4);
            };
        
        Object.keys(self.buttons).forEach(function (k) {
            var v = +self.buttons[k].getAttribute('data-value');
            if (v !== 10) {
                self.buttons[k].innerHTML = (self.mode) ? battleUpdater(v) : superUpdater(v);
            }
        });
        
    };
    
    // callback for multiplier toggle switches
    self.updateModifier = function (event) {
        
        var id = event.currentTarget.id,
            
            // check for id and prevent mutually exclusive modifiers from overlapping 
            check = function (identifier) {
                
                switch (identifier) {
                case 'pokerus':
                    break;
                case 'brace':
                    self.modifiers.power = false;
                    document.getElementById('power').className = 'multiplier-toggle';
                    break;
                case 'power':
                    self.modifiers.brace = false;
                    document.getElementById('brace').className = 'multiplier-toggle';
                    break;
                case 'hordes':
                    break;
                default:
                    return false;
                }
                
                return true;
                
            };
            
        if (check(id)) {
            
            self.modifiers[id] = !self.modifiers[id];
            this.className =
                (self.modifiers[id]) ? 'multiplier-toggle on' : 'multiplier-toggle';
            
            return self.updateButtons();
            
        }
        
    };
    
    // callback for helper buttons - mode switch, undo, and reset
    self.updateState = function (event) {
        
        var id = event.currentTarget.id;
        
        switch (id) {
        case 'mode':
            self.mode = !self.mode;
            self.updateButtons();
            break;
        case 'reset':
            Object.keys(self.stats).forEach(function (k) {
                self.stats[k] = 0;
                document.getElementById(k + '-input').value = 0;
                document.getElementById(k + '-bar').style.height = 0;
                document.getElementById('ev-total').innerHTML = 'EVs Remaining: 510/510';
            });
            break;
        case 'undo':
            if (self.log.length) { self.updateValues(self.log.pop(), true); }
            break;
        default:
            return false;
        }
        
    };

    // intializes the tracker with event listeners
    self.build = function () {
        
        var addListeners = function (elements, type, handler) {
            Object.keys(elements).forEach(function (k) {
                elements[k].addEventListener(type, handler);
            });
        };
        
        addListeners(self.inputs, 'keyup', self.updateValues);
        addListeners(self.buttons, 'click', self.updateValues);
        addListeners(self.toggles, 'click', self.updateModifier);
        addListeners(self.tools, 'click', self.updateState);

    };

    return {
        build: self.build
    };

}(this));

document.addEventListener('DOMContentLoaded', Tracker.build);