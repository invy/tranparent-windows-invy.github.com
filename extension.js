
/*
 * gnome-shell-transparend-window-move extension: adds effect to a currently grabbed/moved window
 *
 * Copyright (c) 2012 Igor Ingultsov aka inv / invy

 * This program is free software: you can redistribute it and/or m odify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Author: Igor Ingultsov aka inv / invy
 *
 * Based on:
 *   focus-effects extension by Florian Mounier aka paradoxxxzero
 *       https://github.com/paradoxxxzero/gnome-shell-focus-effects-extension
 *   gnome-shell-wobbly-windows extension by Jasper St. Pierre aka magcius
 *       https://github.com/magcius/gnome-shell-wobbly-windows
 * 
 */

const Clutter = imports.gi.Clutter;
const Tweener = imports.ui.tweener;
const Shell = imports.gi.Shell;


let tracker, display, app_system, focus_connection, workspace_connection, animations;

let _beginGrabOpId;
let _endGrabOpId;

function onBeginGrabOp(display, op, window) {
    let actor = window.get_compositor_private();
    if(actor)
    {
         if(animations.desaturate) {
              let fx = actor.get_effect('desaturate');
              if (!fx) {
                  fx = new Clutter.DesaturateEffect();
                  actor.add_effect_with_name('desaturate', fx);
              }
              Tweener.addTween(fx, { factor: 1, time: 2});
         }
         let vertex = new Clutter.Vertex();
         actor.scale_center_x = vertex.x = actor.width / 2;
         actor.scale_center_y = vertex.y = actor.height / 2;
         actor.rotation_center_z = vertex;
         Tweener.addTween(actor, animations.blur);

    }
}

function onEndGrabOp(display, op, window) {
    let actor = window.get_compositor_private();
    if(actor)
    {
        if(animations.desaturate) {
            let fx = actor.get_effect('desaturate');
            Tweener.addTween(fx, { factor: 0, time: 2});
        }
        let vertex = new Clutter.Vertex();
        actor.scale_center_x = vertex.x = actor.width / 2;
        actor.scale_center_y = vertex.y = actor.height / 2;
        actor.rotation_center_z = vertex;
        Tweener.addTween(actor, animations.focus);

    }
}

function loadEffects() {
    animations = null;
    let file;
    try {
        file = Shell.get_file_contents_utf8_sync('.ffxrc.json');
    } catch (e) {
        log('.ffxrc.json not found setting defaults');
    }
    if(file) {
        try {
            animations = JSON.parse(file);
            if(!animations.focus || !animations.blur) {
                throw {
                    message: 'Invalid json, must constain at least a focus and a blur property'
                };
            }
        } catch (e) {
            log('.ffxrc.json has errors setting defaults');
            animations = null;
            Main.notifyError('Failed to parse ffxrc', e.message);
        }
    }
    // Default animations
    animations = animations || {
        desaturate: true,
        focus: {
            opacity: 255,
            time: 2
        },
        blur: {
            opacity: 200,
            time: 2
        }
    };
    Shell._ffx = { animations: animations };

}

function init() {
}

function enable() {
    loadEffects();
    _beginGrabOpId = global.display.connect('grab-op-begin', onBeginGrabOp);
    _endGrabOpId = global.display.connect('grab-op-end', onEndGrabOp);
}

function disable() {
    global.display.disconnect(_beginGrabOpId);
    global.display.disconnect(_endGrabOpId);
    let running = app_system.get_running();
    for(var i = 0; i < running.length; i++) {
        let windows = running[i].get_windows();
        for(var j = 0; j < windows.length; j++) {
            windows[j].get_compositor_private().remove_effect_by_name('desaturate');
        }
    }
}
