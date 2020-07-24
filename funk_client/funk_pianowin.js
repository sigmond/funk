/*
    The FUNK Midi Sequencer

    Copyright (C) 2020  Per Sigmond, per@sigmond.no

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
*/

class pianowin extends eventwin
{
    constructor(prefix, menu_frame, rulers_frame, info_frame, tracks_frame, song)
    {
        super(prefix, menu_frame, rulers_frame, info_frame, tracks_frame, song);

        this._pixels_per_tick = 0.4;

        this.set_note_snap(16);

        this._line_height = 14;

        this._white_notes = [0, 2, 4, 5, 7, 9, 11];
        this._white_note_height = (this._line_height * 12) / this._white_notes.length;

        this._num_notes = 128;

        this._mouse_button_1_down = false;
        this._note_mouse_button_down = -1;
        this._event_mouse_button_down = -1;

        this._mouse_at_tick = 0;
        this._mouse_at_tick_snap = 0;
        this._mouse_at_x = 0;
        this._mouse_at_line = 0;
        this._mouse_at_y = 0;

        this._white_key_color = "white";
        this._black_key_color = "black";        
        this._white_key_highlight_color = "grey";
        this._black_key_highlight_color = "grey"; 
        this._note_color = "red";  
        this._note_highlight_color = "yellow";  
        this._playhead_color = "darkred";
        this._menu_bg_color = "black";
        
        this._menu_frame = menu_frame;
        this._rulers_frame = rulers_frame;
        this._info_frame = info_frame;
        this._tracks_frame = tracks_frame;
        
        this._tracks_canvas.addEventListener('contextmenu', function(ev) {
                                                 ev.preventDefault();
                                                 trackwin_object.tracks_mousedownhandler(ev);
                                                 return false;
                                             }, false);
        this._tracks_canvas.addEventListener('click', this.tracks_clickhandler);
        this._tracks_canvas.addEventListener('mousedown', this.tracks_mousedownhandler);
        this._tracks_canvas.addEventListener('mouseup', this.tracks_mouseuphandler);
        this._tracks_canvas.addEventListener('mousemove', this.tracks_mousemovehandler);
        this._tracks_canvas.addEventListener('mouseover', this.tracks_mouseoverhandler);
        this._tracks_canvas.addEventListener('mouseout', this.tracks_mouseouthandler);
        this._tracks_canvas.addEventListener('wheel', function(ev) {
                                                 if (global_ctrl_down || global_shift_down)
                                                 {
                                                     ev.preventDefault();
                                                     pianowin_object.tracks_wheelhandler(ev);
                                                     return false;
                                                 }
                                             }, false);
        
        
        this._info_canvas.addEventListener('wheel', function(ev) {
                                                 if (global_ctrl_down || global_shift_down)
                                                 {
                                                     ev.preventDefault();
                                                     if (global_shift_down)
                                                     {
                                                         pianowin_object.info_wheelhandler(ev);
                                                     }
                                                     return false;
                                                 }
                                           }, false);
        this._info_canvas.addEventListener('click', this.info_clickhandler);
        this._info_canvas.addEventListener('mousemove', this.info_mousemovehandler);
        this._info_canvas.addEventListener('contextmenu', function(ev) {
                                               ev.preventDefault();
                                               //pianowin_object.tracks_clickhandler(ev);
                                               return false;
                                           }, false);
        

        rulers_frame.addEventListener('scroll', this.rulers_scrollhandler);        
        this._rulers_canvas.addEventListener('wheel', function(ev) {
                                                 if (global_ctrl_down || global_shift_down)
                                                 {
                                                     ev.preventDefault();
                                                     if (global_ctrl_down)
                                                     {
                                                         pianowin_object.rulers_wheelhandler(ev);
                                                     }
                                                     return false;
                                                 }
                                             }, false);
        this._rulers_canvas.addEventListener('click', this.rulers_clickhandler);
        this._rulers_canvas.addEventListener('mousemove', this.rulers_mousemovehandler);


        this._track_event_elements = {};
        
        this._xgrid_highlight_element = null;
        this._key_highlight_element = null;
        this._key_highlight_type = null;

        this._selected_notes = [];
        this._selected_events = [];

        this._event_length_adjust_id = -1;
        this._event_length_adjust_element = null;
        this._event_velocity_adjust_id = -1;
        this._event_velocity_adjust_element = null;
        this._event_velocity_adjust_value = 0;        
        this._velocity_add_per_line_small = -1;
        this._velocity_add_per_line_big = -10;
        this._event_highlight_text_element = null;
        
        if (this._song.tracks.length > 1)
        {
            this._track_index = 1;
        }
        else
        {
            this._track_index = 0;
        }

        this.create_track();
        this._ruler_elements = [];
        this.create_rulers();
        this.fill_track_info();
        this.fill_channel_info();
        this.fill_patch_info();
        this.create_menu();

        var wh = this._tracks_canvas.getClientRects()[0];
        this._height = wh.height;
        this._tracks_width = wh.width;
        
        this._tracks_canvas.setAttribute("preserveAspectRatio", "none");
        this._tracks_canvas.setAttribute("viewBox", "0 0 " + this._tracks_width.toString() + ' ' + this._height.toString());
        this._rulers_canvas.setAttribute("preserveAspectRatio", "none");
        this._rulers_canvas.setAttribute("viewBox", "0 0 " + this._tracks_width.toString() + ' ' + this._ruler_height.toString());
        this._info_canvas.setAttribute("preserveAspectRatio", "none");
        this._info_canvas.setAttribute("viewBox", "0 0 " + this._info_width.toString() + ' ' + this._height.toString());
    }

    set_note_snap(note_snap)
    {
        this._note_snap = note_snap;
        this._tick_snap_width = (this._song.ticks_per_beat * 4) / this._note_snap;
    }
    
    update_track(track_index)
    {
        this._track_index = track_index;
        this.create_rulers();
        this.fill_note_events();
        this.fill_track_info();
        this.fill_channel_info();
        this.fill_patch_info();
        this.create_menu();
        this.fill_note_info();
    }
    
    select_events(track_index, event_ids)
    {
        for (const note of this._selected_notes)
        {
            this.event_highlight(note.element, false);
        }

        this._selected_notes = [];
        
        for (const id of event_ids)
        {
            var element = this._track_event_elements[id];
            this.event_highlight(element, true);
            this._selected_notes.push({'id': id, 'element' : element});
        }
    }

    event_highlight(element, on)
    {
        element.style.fill = on ? this._note_highlight_color : this._note_color;
    }


    tracks_clickhandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        output("click: " + x + " " + y);
        
        pianowin_object.tracks_handle_click(x, y, event.button);
    }
    
    tracks_mousedownhandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        pianowin_object.tracks_handle_mouse_down(x, y, event.button);
    }

    tracks_mouseuphandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        pianowin_object.tracks_handle_mouse_up(x, y, event.button);
    }

    tracks_mousemovehandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        pianowin_object.tracks_handle_mouse_move(x, y);
    }
    
    tracks_mouseoverhandler(event)
    {
//         output("mouseover");
        pianowin_object._mouse_over_tracks = true;
    }

    tracks_mouseouthandler(event)
    {
//         output("mouseout");
        pianowin_object._mouse_over_tracks = false;
    }

    tracks_wheelhandler(event)
    {
        if (global_ctrl_down || global_shift_down)
        {
            let svg = event.currentTarget;
            let bound = svg.getBoundingClientRect();
            
            let x = event.clientX - bound.left - svg.clientLeft;
            let y = event.clientY - bound.top - svg.clientTop;
        
            pianowin_object.tracks_handle_wheel(x, y, event.deltaY);
        }
    }

    track_menu_clickhandler(event)
    {
        let svg = event.currentTarget;
        output('track_menu_clickhandler (pianowin)');
        edit_note_snap(pianowin_object._note_snap);
    }


    rulers_scrollhandler()
    {
        var tracks_element = document.getElementById("pianowin_tracks_container");
        var rulers_element = document.getElementById("pianowin_rulers_rulers_container");
        
        tracks_element.scrollLeft = rulers_element.scrollLeft;

//        output('left ' + rulers_element.scrollLeft);
    }
    
    rulers_clickhandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        output("click: " + x + " " + y);
        output("button: " + event.button);
        
        pianowin_object.rulers_handle_click(x, y, event.button);
    }
    
    rulers_mousedownhandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        output("mousedown: " + x + " " + y);
        output("button: " + event.button);
        
        pianowin_object.rulers_handle_mousedown(x, y, event.button);
    }
    
    rulers_mouseuphandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        output("mouseup: " + x + " " + y);
        output("button: " + event.button);
        
        pianowin_object.rulers_handle_mouseup(x, y, event.button);
    }
    
    rulers_mousemovehandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        pianowin_object.rulers_handle_mouse_move(x, y);
    }
    
    rulers_wheelhandler(event)
    {
        if (global_ctrl_down)
        {
            let svg = event.currentTarget;
            let bound = svg.getBoundingClientRect();
            
            let x = event.clientX - bound.left - svg.clientLeft;
            let y = event.clientY - bound.top - svg.clientTop;
        
            pianowin_object.rulers_handle_wheel(x, y, event.deltaY);
        }
    }


    
    line2note(line)
    {
        return this._num_notes - line - 1;
    }
    
    note2line(note)
    {
        return this._num_notes - note - 1;
    }    


    tracks_handle_click(x, y, button)
    {
    }
    
    tracks_handle_mouse_down(x, y, button)
    {
        output("tracks handle mouse down x " + x + " y " + y + " button " + button);
        output('this._event_mouse_button_down = ' + this._event_mouse_button_down);
        if (button == 0)
        {
            if (this._select_element || this._selected_events)
            {
                if (global_shift_down)
                {
                    if (this._event_mouse_button_down != 0)
                    {
                        this.adjust_select_area(x, y, true, false);
                    }
                }
                else
                {
                    if (!global_ctrl_down)
                    {
                        if (this._select_element)
                        {
                            this._select_element.remove();
                            this._select_element = null;
                        }
                        this._selected_events = [];
                        this.handle_select_area();
                    }
                }
            }
            this._mouse_button_1_down = true;
        }
        else if (button == 1)
        {
            if (this._event_mouse_button_down != 1)
            {
                // mouse down not handled by event handler
                // paste at mouse
                this.handle_paste_at_mouse(this._mouse_at_tick_snap, this.line2note(this._mouse_at_line));
                this._song.play_track_notes(this._track_index, [this.line2note(this._mouse_at_line)], 100);
            }
        }
    }

    tracks_handle_mouse_up(x, y, button)
    {
        output("mouse up x " + x + " y " + y + " button " + button);
        
        if (button == 0)
        {
            this._mouse_button_1_down = false;

            if (this._event_highlight_text_element != null)
            {
                this._event_highlight_text_element.remove();
            }


            if ((this._event_velocity_adjust_id >= 0) && this._event_velocity_adjust_element)
            {
                this.handle_note_adjust_velocity(this._event_velocity_adjust_element, this._event_velocity_adjust_id, true);
                this._event_velocity_adjust_id = -1;
                this._event_velocity_adjust_element = null;
            }
            else
            {
                this.handle_select_area();
            }
        }
        else if (button == 2)
        {
            if ((this._event_length_adjust_id >= 0) && this._event_length_adjust_element)
            {
                this.handle_note_adjust_length(this._event_length_adjust_element, this._event_length_adjust_id, true);
            }
            
            this._event_length_adjust_id = -1;
            this._event_length_adjust_element = null;
        }

        this._note_mouse_button_down = -1;
        this._event_mouse_button_down = -1;
    }

    tracks_handle_mouse_move(x, y)
    {
        //output("handle_mouse_over " + x + " " + y);
        var tick = this.x2tick_zoomed(x);
        var is_drum_channel = this._song.is_drum_channel(this._track_index);
        
        if (this._xgrid_highlight_element)
        {
            this._xgrid_highlight_element.remove();
            this._xgrid_highlight_element = null;
        }
        
        var line_index = this.y2line_zoomed(y);
        if (line_index < 0)
        {
            line_index = 0;
        }
        else if (line_index >= (this._num_notes))
        {
            line_index = this._num_notes - 1;
        }

        this._mouse_at_line = line_index;
        this._mouse_at_y = this.line2y_zoomed(line_index);
        
        if (this._key_highlight_element)
        {
            if ((this._key_highlight_type == 'white_key') || is_drum_channel)
            {
                this._key_highlight_element.style.fill = this._white_key_color;
            }
            else if (this._key_highlight_type == 'black_key')
            {
                this._key_highlight_element.style.fill = this._black_key_color;
            }
        }
        
        var note = this.line2note(line_index);
        var is_white_key = this._white_notes.includes(note % 12);
        
        this._key_highlight_element = document.getElementById("note_info_" + this.line2note(line_index));
        if (is_white_key || is_drum_channel)
        {
            this._key_highlight_element.style.fill = this._white_key_highlight_color;
            this._key_highlight_type = 'white_key';
        }
        else
        {
            this._key_highlight_element.style.fill = this._black_key_highlight_color;
            this._key_highlight_type = 'black_key';
        }

        this._mouse_at_tick = tick;
        this._mouse_at_tick_snap = this.tick2snap(tick);
        this._mouse_at_x = this.tick2x_zoomed(tick);

        if (this._mouse_button_1_down)
        {
            if ((this._event_velocity_adjust_id >= 0) && this._event_velocity_adjust_element)
            {
                this.handle_note_adjust_velocity(this._event_velocity_adjust_element, this._event_velocity_adjust_id);
            }
            else
            {
                this.adjust_select_area(x, y, false, false);
            }
        }

        if ((this._event_length_adjust_id >= 0) && this._event_length_adjust_element)
        {
            this.handle_note_adjust_length(this._event_length_adjust_element, this._event_length_adjust_id);
        }

    }

    handle_note_adjust_length(svg, note_id, set_length = false)
    {
        var start_tick = this.x2tick(svg.getAttribute("x"));
        var length = this.x2tick(svg.getAttribute("width"));

        if (this._mouse_at_tick > (start_tick + (this._tick_snap_width / 2)))
        {
            svg.style.width = this.tick2x(this._mouse_at_tick - start_tick);
        }

        if (set_length)
        {
            if (this._mouse_at_tick >= (start_tick + (this._tick_snap_width / 2)))
            {
                this.handle_set_note_end(note_id, this._mouse_at_tick);
            }
            else
            {
                this.handle_set_note_end(note_id, start_tick + (this._tick_snap_width / 2));
            }
        }
    }

    handle_note_adjust_velocity(svg, note_id, set_velocity = false)
    {
        if (set_velocity)
        {
            this.handle_set_note_velocity(note_id, this._event_velocity_adjust_value);
            return;
        }

        var start_line = this.y2line(svg.getAttribute("y"));
        var line_diff = this._mouse_at_line - start_line;
        var add_per_line = global_shift_down ? this._velocity_add_per_line_small : this._velocity_add_per_line_big;

        if (this._event_highlight_text_element)
        {
            var new_velocity = parseInt(svg.dataset.velocity) + (line_diff * add_per_line);

            if (new_velocity > 127)
            {
                new_velocity = 127;
            }

            if (new_velocity < 0)
            {
                new_velocity = 0;
            }

            this._event_highlight_text_element.textContent = 'note: ' + svg.dataset.note + ' velocity: ' + new_velocity.toString() + ' tick: ' + svg.dataset.tick;
            this._event_velocity_adjust_value = new_velocity;
        }
    }

    adjust_select_area(x, y, extend, key)
    {
        
        if (key && !this._select_element)
        {
            return;
        }
        
        var pos;

        if (!key)
        {
            pos = { "tick" : this.tick2snap(this.x2tick_zoomed(x)), "line" : this.y2line_zoomed(y) };
        }
        else
        {
            pos = this.tick_line_from_key(key, this.x2tick(this._tracks_width), this._num_notes);
            pos.tick = this.tick2snap(pos.tick);

            if ((key == key_left) && (pos.tick > 0))
            {
                pos.tick -= this._tick_snap_width;
            }
            else if (
                     (key == key_right) && 
                     (this._select_x2 < this._select_x1) && 
                     (pos.tick < (this._song.length_ticks - this._tick_snap_width))
                    )
            {
                pos.tick += this._tick_snap_width;
            }

            if (pos.tick > this.x2tick(this._tracks_width))
            {
                return;
            }
        }

        var xpos = this.tick2x(pos.tick);
        var grid_width = parseInt(this.tick2x(this._tick_snap_width));
        var ypos = this._track_y + (pos.line * this._line_height);
        var note = this.line2note(pos.line);

        if (!this._select_element)
        {
            var width = grid_width;
            var height = this._line_height;
            
            this._select_element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            this._select_element.id = 'pw_notes_select';
            this._select_element.setAttribute("height", height);
            this._select_element.setAttribute("width", width);
            this._select_element.setAttribute("x", xpos);
            this._select_element.setAttribute("y", ypos);
            this._select_element.setAttribute("style", "fill:" + this._bg_color + ";stroke:black;stroke-width:0;fill-opacity:0.2;stroke-opacity:0.0");
            this._tracks_canvas.appendChild(this._select_element);
            
            this._select_x1 = xpos;
            this._select_y1 = ypos;
            this._select_width = width;
            this._select_height = height;
            this._select_x2 = xpos + width;
            this._select_y2 = ypos + height;
            this._select_tick_start = pos.tick;
            this._select_tick_stop = pos.tick + this._tick_snap_width;
            this._select_line_start = pos.line;
            this._select_line_stop = pos.line + 1;
        }
        else
        {
            this.change_select_area(xpos, ypos, pos, pos.tick, pos.tick + this._tick_snap_width);
        }

        if (key != undefined)
        {
            this.handle_select_area();
        }
    }
    

    
    rulers_handle_click(x, y, button)
    {
        if (trackwin_object._playing)
        {
            stop();
            trackwin_object._playing = false;
            return;
        }
        
        var tick = this.x2tick_zoomed(x);
        var tick_snapped = this.tick2snap(tick);
        
        output("play: start = " + tick_snapped);
        trackwin_object._playing = true;
        play_midi_file(tick_snapped, false);
    }

    tick2snap(tick)
    {
        return (tick - parseInt(tick % this._tick_snap_width));
    }

    rulers_handle_mouse_move(x, y)
    {
        // output("handle_mouse_over " + x + " " + y);
        var tick = this.x2tick_zoomed(x);
        var is_drum_channel = this._song.is_drum_channel(this._track_index);

        if (this._xgrid_highlight_element)
        {
            this._xgrid_highlight_element.remove();
        }

        var xpos = this.tick2x(this.tick2snap(tick));
        var width = this.tick2x(this._tick_snap_width);
        this._xgrid_highlight_element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this._xgrid_highlight_element.id = "pw_xgrid_highlight";
        this._xgrid_highlight_element.setAttribute("height", this._line_height * this._num_notes);
        this._xgrid_highlight_element.setAttribute("width", width);
        this._xgrid_highlight_element.setAttribute("x", xpos);
        this._xgrid_highlight_element.setAttribute("y", this._track_y);
        this._xgrid_highlight_element.setAttribute("style", "fill:" + this._bg_color + ";stroke:black;stroke-width:0;fill-opacity:0.2;stroke-opacity:0.0");
        this._tracks_canvas.appendChild(this._xgrid_highlight_element);
        
        if (this._key_highlight_element)
        {
            if ((this._key_highlight_type == 'white_key') || is_drum_channel)
            {
                this._key_highlight_element.style.fill = this._white_key_color;
            }
            else if (this._key_highlight_type == 'black_key')
            {
                this._key_highlight_element.style.fill = this._black_key_color;
            }
            this._key_highlight_element = null;
        }
    }




    info_clickhandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        output("click: " + x + " " + y);
        
        pianowin_object.info_handle_click(x, y, event.button);
    }
    
    info_mouseuphandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        output("up: " + x + " " + y);
        
        pianowin_object.info_handle_mouse_up(x, y, event.button);
    }
    
    info_mousemovehandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        pianowin_object.info_handle_mouse_move(x, y);
    }

    info_wheelhandler(event)
    {
        if (global_shift_down)
        {
            let svg = event.currentTarget;
            let bound = svg.getBoundingClientRect();
            
            let x = event.clientX - bound.left - svg.clientLeft;
            let y = event.clientY - bound.top - svg.clientTop;
        
            pianowin_object.info_handle_wheel(x, y, event.deltaY);
        }
    }




    info_handle_click(x, y, button)
    {
    }
    
    info_handle_mouse_up(x, y, button)
    {
    }
    

    info_handle_mouse_move(x, y)
    {
        // output("handle_mouse_over " + x + " " + y);

        var is_drum_channel = this._song.is_drum_channel(this._track_index);
        
        if (y < this._ruler_height)
        {
            if (this._key_highlight_element)
            {
                if ((this._key_highlight_type == 'white_key') || is_drum_channel)
                {
                    this._key_highlight_element.style.fill = this._white_key_color;
                }
                else if (this._key_highlight_type == 'black_key')
                {
                    this._key_highlight_element.style.fill = this._black_key_color;
                }
                this._key_highlight_element = null;
            }
        }
        else if (y >= this._ruler_height)
        {
            if (this._xgrid_highlight_element)
            {
                this._xgrid_highlight_element.remove();
                this._xgrid_highlight_element = null;
            }

            var line_index = this.y2line_zoomed(y);
            if (line_index < 0)
            {
                line_index = 0;
            }
            else if (line_index >= (this._num_notes))
            {
                line_index = this._num_notes - 1;
            }
            
            if (this._key_highlight_element)
            {
                if ((this._key_highlight_type == 'white_key') || is_drum_channel)
                {
                    this._key_highlight_element.style.fill = this._white_key_color;
                }
                else if (this._key_highlight_type == 'black_key')
                {
                    this._key_highlight_element.style.fill = this._black_key_color;
                }
            }
            
            var note = this.line2note(line_index);
            var is_white_key = this._white_notes.includes(note % 12);

            this._key_highlight_element = document.getElementById("note_info_" + this.line2note(line_index));
            if ((is_white_key) || is_drum_channel)
            {
                this._key_highlight_element.style.fill = this._white_key_highlight_color;
                this._key_highlight_type = 'white_key';
            }
            else
            {
                this._key_highlight_element.style.fill = this._black_key_highlight_color;
                this._key_highlight_type = 'black_key';
            }
        }
    }


    note_mousedownhandler(event)
    {
        let svg = event.currentTarget;
        let note = parseInt(svg.id.slice(svg.id.lastIndexOf('_') + 1));

        pianowin_object._note_mouse_button_down = event.button;
        pianowin_object.handle_note_down(svg, note);
    }

    note_mouseuphandler(event)
    {
        let svg = event.currentTarget;
        let note = parseInt(svg.id.slice(svg.id.lastIndexOf('_') + 1));
        pianowin_object._note_mouse_button_down = -1;
        pianowin_object.handle_note_up(svg, note, true);
    }

    note_mouseoverhandler(event)
    {
        let svg = event.currentTarget;
        let note = parseInt(svg.id.slice(svg.id.lastIndexOf('_') + 1));
        pianowin_object.handle_note_down(svg, note);
    }

    note_mouseouthandler(event)
    {
        let svg = event.currentTarget;
        let note = parseInt(svg.id.slice(svg.id.lastIndexOf('_') + 1));
        pianowin_object.handle_note_up(svg, note, false);
    }


    handle_note_down(svg, note)
    {
        if (this._note_mouse_button_down >= 0)
        {
            svg.style.strokeWidth = 3 + this._note_mouse_button_down;
            this._song.play_track_notes(this._track_index, [note], 47 + (40 * this._note_mouse_button_down), 0);
        }
    }

    handle_note_up(svg, note, force)
    {
        if (force || (this._note_mouse_button_down >= 0))
        {
            svg.style.strokeWidth = 1;
            this._song.play_track_notes(this._track_index, [note], 0, 0);
        }
    }


    event_mousedownhandler(event)
    {
        let svg = event.currentTarget;
        let id = parseInt(svg.id.slice(svg.id.lastIndexOf('_') + 1));

        pianowin_object._event_mouse_button_down = event.button;
        pianowin_object.handle_event_down(svg, id);
    }

    event_mouseuphandler(event)
    {
        let svg = event.currentTarget;
        let id = parseInt(svg.id.slice(svg.id.lastIndexOf('_') + 1));
        pianowin_object._event_mouse_button_down = -1;
        pianowin_object.handle_event_up(svg, id);
    }

    event_mouseoverhandler(event)
    {
        let svg = event.currentTarget;
        let id = parseInt(svg.id.slice(svg.id.lastIndexOf('_') + 1));
        pianowin_object.handle_event_over(svg, id);
    }

    event_mouseouthandler(event)
    {
        let svg = event.currentTarget;
        let id = parseInt(svg.id.slice(svg.id.lastIndexOf('_') + 1));
        pianowin_object.handle_event_out(svg, id);
    }

    event_mousemovehandler(event)
    {
        let svg = event.currentTarget;
        let id = parseInt(svg.id.slice(svg.id.lastIndexOf('_') + 1));
        pianowin_object.handle_event_move(svg, id);
    }


    handle_event_down(svg, id)
    {
        if (this._event_mouse_button_down == 0)
        {
            if (global_ctrl_down)
            {
                if (this._selected_events.includes(id))
                {
                    const index = this._selected_events.indexOf(id);
                    if (index > -1)
                    {
                        this._selected_events.splice(index, 1);
                    }
                }
                else
                {
                    this._selected_events.push(id);
                }
                this.handle_select_area();
            }
            else
            {
                this._event_velocity_adjust_id = id;
                this._event_velocity_adjust_element = svg;
                this._event_velocity_adjust_value = 0;
            }
        }
        else if (this._event_mouse_button_down == 1)
        {
            output('event mouse 1 down');
            if (global_ctrl_down)
            {
                this.handle_copy_notes([id]);
                this._song.play_track_notes(this._track_index, [this.line2note(this._mouse_at_line)], 100);
            }
            else
            {
                this.handle_cut_notes([id]);
                this._song.play_track_notes(this._track_index, [this.line2note(this._mouse_at_line)], 100);
                if (this._event_highlight_text_element != null)
                {
                    this._event_highlight_text_element.remove();
                }
            }
        }
        else if (this._event_mouse_button_down == 2)
        {
            output('event mouse 2 down. id = ' + id);
            this._event_length_adjust_id = id;
            this._event_length_adjust_element = svg;
        }
    }

    handle_event_move(svg, id)
    {
        output('event move, id = ' + id);
    }

    handle_event_up(svg, id)
    {
        output('event up, id = ' + id);
    }

    handle_event_over(svg, id)
    {
        svg.style.strokeWidth = 2;

        if (this._event_highlight_text_element != null)
        {
            this._event_highlight_text_element.remove();
        }

        var event_text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        event_text.id = 'event_highlight_text';
        event_text.setAttribute("x", (this._mouse_at_x / this._tracks_zoom_x) + 10);
        event_text.setAttribute("y", (this._mouse_at_y / this._tracks_zoom_y) - 2);
        event_text.setAttribute("style", "fill:black;font-size:12px;font-weight:bold;");
        event_text.textContent = 'note: ' + svg.dataset.note + ' velocity: ' + svg.dataset.velocity + ' tick: ' + svg.dataset.tick;
        this._event_highlight_text_element = event_text;
        this._tracks_canvas.appendChild(event_text);
    }

    handle_event_out(svg, id)
    {
        svg.style.strokeWidth = 1;

        if (!this._mouse_button_1_down && this._event_highlight_text_element != null)
        {
            this._event_highlight_text_element.remove();
        }
    }

    remove_ruler_elements()
    {
        var ruler_element;
        
        while ((ruler_element = this._ruler_elements.pop()))
        {
            ruler_element.remove();
        }
    }

    create_rulers()
    {
        if (this._rulers_box_element)
        {
            this._rulers_box_element.remove();
        }
        
        this.remove_ruler_elements();

        var tick;
        var next_seconds = 0;
        
        for (tick = 0; tick < this._song.ticks; tick++)
        {
            var seconds = this._song.tick2second(tick);

            if (seconds > next_seconds)
            {
                var width = 1;
                var xpos = this.tick2x(tick);
                var ruler_line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                ruler_line.id = 'seconds_ruler_' + tick.toString();
                ruler_line.setAttribute("x1", xpos);
                ruler_line.setAttribute("x2", xpos);
                ruler_line.setAttribute("y1", 1);
                ruler_line.setAttribute("y2", (this._ruler_height / 2) - 1);
                if ((seconds % 5) == 0)
                {
                    ruler_line.setAttribute("style", "stroke:black;stroke-width:1;stroke-opacity:1.0");
                }
                else
                {
                    ruler_line.setAttribute("style", "stroke:black;stroke-width:1;stroke-opacity:0.5");
                }
                this._ruler_elements.push(ruler_line);
                this._rulers_canvas.appendChild(ruler_line);
                                        
                var ruler_text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                ruler_text.id = 'seconds_text_' + tick.toString();
                ruler_text.setAttribute("x", xpos + 2);
                ruler_text.setAttribute("y", 12);
                ruler_text.setAttribute("style", "fill:black;font-size:12px");
                var mins = parseInt(seconds / 60);
                var secs = parseInt(seconds) % 60;
                var secs_string = secs.toString();
                if (secs < 10)
                {
                    secs_string = "0" + secs_string;
                }
                
                ruler_text.textContent = mins.toString() + ':' + secs_string;
                this._ruler_elements.push(ruler_text);
                this._rulers_canvas.appendChild(ruler_text);

                next_seconds += 1;
            }
            
        }


        var bar_index = 0;
        for (const bar of this._song.bars)
        {
            var width = 1;
            var x = this.tick2x(bar.start);
            var ruler_line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            ruler_line.id = 'bars_ruler_' + bar_index.toString() + '_1';
            ruler_line.setAttribute("x1", x);
            ruler_line.setAttribute("x2", x);
            ruler_line.setAttribute("y1", (this._ruler_height / 2) + 1);
            ruler_line.setAttribute("y2", (this._ruler_height) - 2);
            ruler_line.setAttribute("style", "stroke:black;stroke-width:1;");
            this._ruler_elements.push(ruler_line);
            this._rulers_canvas.appendChild(ruler_line);

            var i;
            for (i = 1; i < bar.beats; i++)
            {
                var x_beat = this.tick2x(bar.start + (i * this._song.ticks_per_beat));
                var ruler_line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                ruler_line.id = 'bars_ruler_' + bar_index.toString() + '_' + (i + 1).toString();
                ruler_line.setAttribute("x1", x_beat);
                ruler_line.setAttribute("x2", x_beat);
                ruler_line.setAttribute("y1", (this._ruler_height / 2) + 1);
                ruler_line.setAttribute("y2", (this._ruler_height) - 2);
                ruler_line.setAttribute("style", "stroke:black;stroke-width:1;stroke-opacity:0.5");
                this._ruler_elements.push(ruler_line);
                this._rulers_canvas.appendChild(ruler_line);
            }

            var ruler_text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            ruler_text.id = 'bars_text' + bar_index.toString();
            ruler_text.setAttribute("x", x + 2);
            ruler_text.setAttribute("y", 24);
            ruler_text.setAttribute("style", "fill:black;font-size:12px");
            ruler_text.textContent = (bar_index + 1).toString();
            this._ruler_elements.push(ruler_text);
            this._rulers_canvas.appendChild(ruler_text);

            bar_index++;
        }

        var width_style = "width:" + this._notes_width.toString() + ";";
        var height_style = "height:" + this._ruler_height.toString() + ";";

        this._rulers_canvas.setAttribute("style", width_style + height_style);

        this._rulers_box_element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this._rulers_box_element.id = "pw_rulers_box";
        this._rulers_box_element.setAttribute("height", this._ruler_height);
        this._rulers_box_element.setAttribute("width", this._notes_width);
        this._rulers_box_element.setAttribute("x", 0);
        this._rulers_box_element.setAttribute("y", 0);
        this._rulers_box_element.setAttribute("style", "fill:" + this._menu_bg_color + ";stroke:black;stroke-width:1;fill-opacity:0.1;stroke-opacity:1.0");
        this._rulers_canvas.appendChild(this._rulers_box_element);        

        return this._tracks_width;
    }

    create_menu()
    {
        if (this._menu_box_element)
        {
            this._menu_box_element.remove();
        }

        var width_style = "width:" + this._info_width.toString() + ";";
        var height_style = "height:" + (this._ruler_height + 10).toString() + ";";

        this._menu_canvas.setAttribute("style", width_style + height_style);

        this._menu_box_element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this._menu_box_element.id = "pw_menu_box";
        this._menu_box_element.setAttribute("height", this._ruler_height + 10);
        this._menu_box_element.setAttribute("width", this._info_width);
        this._menu_box_element.setAttribute("x", 0);
        this._menu_box_element.setAttribute("y", 0);
        this._menu_box_element.setAttribute("style", "fill:" + this._menu_bg_color + ";stroke:black;stroke-width:1;fill-opacity:0.2;stroke-opacity:1.0");
        this._menu_box_element.addEventListener('click', this.track_menu_clickhandler);
        this._menu_canvas.appendChild(this._menu_box_element);        
    }
    
    
    fill_track_info()
    {
        var track_info_element = document.getElementById("pw_track_info");
        if (track_info_element != undefined)
        {
            track_info_element.remove();
        }

        var trackname;
        
        if (this._track_index == 0)
        {
            trackname = 'T0: Master';
        }
        else
        {
            trackname = 'T' + this._track_index.toString() + ': ' + this._song.tracknames[this._track_index];
        }

        track_info_element = document.createElementNS("http://www.w3.org/2000/svg", "text");
        track_info_element.id = 'pw_track_info';
        track_info_element.setAttribute("x", 2);
        track_info_element.setAttribute("y", 12);
        track_info_element.setAttribute("style", "fill:black;font-size:14px;font-weight:bold");
        track_info_element.textContent = trackname;
        this._menu_canvas.appendChild(track_info_element);        
    }
    
    fill_channel_info()
    {
        var channel_info_element = document.getElementById("pw_channel_info");
        if (channel_info_element != undefined)
        {
            channel_info_element.remove();
        }

        channel_info_element = document.createElementNS("http://www.w3.org/2000/svg", "text");
        channel_info_element.id = 'pw_channel_info';
        channel_info_element.setAttribute("x", 2);
        channel_info_element.setAttribute("y", 12 + 12);
        channel_info_element.setAttribute("style", "fill:black;font-size:12px;font-weight:normal");
        channel_info_element.textContent = 'Ch: ' + (this._song.channels[this._track_index] + 1);
        this._menu_canvas.appendChild(channel_info_element);        
    }
    
    
    fill_patch_info()
    {
        var patch_info_element = document.getElementById("pw_patch_info");
        if (patch_info_element != undefined)
        {
            patch_info_element.remove();
        }
        
        var is_drum_channel = this._song.is_drum_channel(this._track_index);
        var patch = this._song.patch(this._track_index);
        var patchname;

        if (!is_drum_channel)
        {
            patchname = synth_object.patchname(patch);
        }
        else
        {
            patchname = synth_object.drumsetname(patch);
        }

        patch_info_element = document.createElementNS("http://www.w3.org/2000/svg", "text");
        patch_info_element.id = 'pw_patch_info';
        patch_info_element.setAttribute("x", 2);
        patch_info_element.setAttribute("y", 12 + 12 + 12);
        patch_info_element.setAttribute("style", "fill:black;font-size:12px;font-weight:bold");
        patch_info_element.textContent = patchname;
        this._menu_canvas.appendChild(patch_info_element);        
    }

    
    remove_track_events()
    {
        for (var id in this._track_event_elements)
        {
            this._track_event_elements[id].remove();
        }
        this._track_event_elements = {};
    }
    
    create_track()
    {
        var notes_width = 0;
        var notes_width_tmp;
        var note;
        var track;
        var track_index = this._track_index;
        var info_width = this._info_width;

        track = this._song.tracks[track_index];

        notes_width = this.create_bars(this._song.bars);
        
        var width_style = "width:" + (notes_width + 100).toString() + ";";
        var height_style = "height:" + ((this._line_height * this._num_notes) + this._track_y).toString() + ";";

        this._tracks_canvas.setAttribute("style", width_style + height_style);

        var wh = this._tracks_canvas.getClientRects()[0];
        this._height = wh.height;
        this._notes_width = wh.width;

        var middle_note = this.fill_note_events(track_index);

        this.fill_note_info();


        width_style = "width:" + (info_width).toString() + ";";

        this._info_canvas.setAttribute("style", width_style);

        this.create_note_lines();

        this.create_playhead();

        var middle_y = this._track_y + ((this.note2line(middle_note) * this._line_height) * this._tracks_zoom_y);
        var pianowin_frame = document.getElementById("pianowin_frame");
        pianowin_frame.scrollTop = middle_y - (pianowin_frame.clientHeight / 2);
    }


    fill_note_info()
    {
        var info_width = this._info_width;
        var info_width_tmp;
        var num_white = 0;
        var i;
        var note;
        var track;
        var is_drum_channel = this._song.is_drum_channel(this._track_index);
        
        track = this._song.tracks[this._track_index];

        for (i = 0; i < this._num_notes; i++)
        {
            if (this._white_notes.includes(i % 12))
            {
                num_white++;
            }
        }

        i = num_white - 1;
        for (note = 0; note < this._num_notes; note++)
        {
            if (this._white_notes.includes(note % 12))
            {
                info_width_tmp = this.create_note_info(note, true, i, track, is_drum_channel);
                if (info_width_tmp > info_width)
                {
                    info_width = info_width_tmp;
                }
                i--;
            }
        }

        for (note = 0; note < this._num_notes; note++)
        {
            if (!this._white_notes.includes(note % 12))
            {
                info_width_tmp = this.create_note_info(note, false, 0, track, is_drum_channel);
                if (info_width_tmp > info_width)
                {
                    info_width = info_width_tmp;
                }
            }
        }
    }
    

    fill_note_events()
    {
        var highest_note = 0;
        var lowest_note = this._num_notes;
        var track;
        var track_index = this._track_index;

        this.remove_track_events();

        track = this._song.tracks[track_index];

        for (const event of track.events)
        {
            if (event.type != 'note')
            {
                continue;
            }
            
            var note = event.note;
            var opacity = (event.velocity / 128).toString();

            highest_note = parseInt(Math.max(highest_note, note));
            lowest_note = parseInt(Math.min(lowest_note, note));
            
            var width = this.tick2x(event.end - event.start);
            var height = this._line_height - 6;
            var y = this._track_y + (this.note2line(note) * this._line_height) + 3;
            var x = this.tick2x(event.start);
            var event_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            event_rect.id = 'pwe_' + event.id.toString();
            event_rect.setAttribute("x", x);
            event_rect.setAttribute("y", y);
            event_rect.setAttribute("width", width);
            event_rect.setAttribute("height", height);
            event_rect.setAttribute("style", "fill:" + this._note_color + ";stroke:black;stroke-width:1;fill-opacity:" + opacity + ";stroke-opacity:1.0");
            event_rect.addEventListener('mousedown', this.event_mousedownhandler);
            event_rect.addEventListener('mouseup', this.event_mouseuphandler);
            event_rect.addEventListener('mouseover', this.event_mouseoverhandler);
            event_rect.addEventListener('mouseout', this.event_mouseouthandler);
            event_rect.addEventListener('mousemove', this.event_mousemovehandler);
            event_rect.dataset.note = event.note;
            event_rect.dataset.velocity = event.velocity;
            event_rect.dataset.tick = event.start;
            this._tracks_canvas.appendChild(event_rect);
            this._track_event_elements[event.id] = event_rect;
        }
        
        return parseInt((highest_note + lowest_note) / 2);
    }


    find_note_center(track_index, tick_start, tick_end)
    {
        var highest_note = 0;
        var lowest_note = this._num_notes;
        var track = this._song.tracks[track_index];
        
        for (const event of track.events)
        {
            if (event.type != 'note')
            {
                continue;
            }
            
            var note = event.note;
            highest_note = parseInt(Math.max(highest_note, note));
            lowest_note = parseInt(Math.min(lowest_note, note));
        }
        
        return parseInt((highest_note + lowest_note) / 2);
    }
    
    note2line(note)
    {
        return this._num_notes - (note + 1);
    }
    
    line2note(line)
    {
        return this._num_notes - (line + 1);
    }
    
    
    create_bars(bars)
    {
        var bar_index = 0;
        var height = this._line_height * this._num_notes;
        for (const bar of bars)
        {
            var x = this.tick2x(bar.start);
            var bar_line = document.createElementNS("http://www.w3.org/2000/svg", "line");

            bar_line.id = 'pianowin_bar_' + bar_index.toString() + '_0';
            bar_line.setAttribute("x1", x);
            bar_line.setAttribute("x2", x);
            bar_line.setAttribute("y1", 0);
            bar_line.setAttribute("y2", height);
            bar_line.setAttribute("style", "stroke:black;stroke-width:1;stroke-opacity:1.0");
            this._tracks_canvas.appendChild(bar_line);

            var i;
            for (i = 1; i < bar.beats; i++)
            {
                var x_beat = this.tick2x(bar.start + (i * this._song.ticks_per_beat));
                var bar_line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                
                bar_line.id = 'pianowin_bar_' + bar_index.toString() + '_' + (i + 1).toString();
                bar_line.setAttribute("x1", x_beat);
                bar_line.setAttribute("x2", x_beat);
                bar_line.setAttribute("y1", 0);
                bar_line.setAttribute("y2", height);
                bar_line.setAttribute("style", "stroke:black;stroke-width:1;stroke-opacity:0.5");
                this._tracks_canvas.appendChild(bar_line);
            }

            bar_index++;
        }

        return x;
    }


    create_note_lines()
    {
        var i;
        for (i = 0; i < this._num_notes + 1; i++)
        {
            var y = i * this._line_height;
            var note_line = document.createElementNS("http://www.w3.org/2000/svg", "line");

            note_line.id = 'tw_noteline_' + i.toString();
            note_line.setAttribute("x1", 0);
            note_line.setAttribute("x2", this._notes_width);
            note_line.setAttribute("y1", y);
            note_line.setAttribute("y2", y);
            note_line.setAttribute("style", "stroke:black;stroke-width:1;");
            this._tracks_canvas.appendChild(note_line);
        }

        return y;
    }


    create_note_info(note, is_white, white_key_num, track, is_drum_channel)
    {
        var create_note_text = is_drum_channel;

        var info_text = document.getElementById('note_text_' + note.toString());
        if (info_text != undefined)
        {
            info_text.remove();
        }

        if (create_note_text)
        {
            var info_text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        }

        var info_rect = document.getElementById('note_info_' + note.toString());
        if (info_rect != undefined)
        {
            info_rect.remove();
        }

        info_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        var height;
        var width;
        var y;
        var fill_color;

        if (is_white && !is_drum_channel)
        {
            width = this._info_width;
            height = this._white_note_height;
            y = this._track_y + (white_key_num * this._white_note_height) - parseInt(this._white_note_height * 1 / 3);
            fill_color = this._white_key_color;

            if (note == 127)
            {
                height = parseInt(this._white_note_height * 2 / 3);
                y = this._track_y;
            }
        }
        else
        {
            height = this._line_height;
            y = this._track_y + (this.note2line(note) * this._line_height);
            if (is_drum_channel)
            {
                width = this._info_width;
                fill_color = this._white_key_color;
            }
            else
            {
                width = parseInt(this._info_width * 2 / 3);
                fill_color = this._black_key_color;
            }
        }


        var fill_opacity = '1.0';
        
        if (create_note_text)
        {
            info_text.id = 'note_text_' + note.toString();
            info_text.setAttribute("x", 10);
            info_text.setAttribute("y", y + height - 2);
            info_text.setAttribute("style", "fill:black;font-size:12px;font-weight:bold;");
            if (is_drum_channel)
            {
                info_text.textContent = synth_object.drumname(note);
                fill_opacity = 0.3;
            }

            this._info_canvas.appendChild(info_text);
        }

        info_rect.id = 'note_info_' + note.toString();
        info_rect.setAttribute("height", height);
        info_rect.setAttribute("width", width);
        info_rect.setAttribute("x", 0);
        info_rect.setAttribute("y", y);
        info_rect.setAttribute("style", "fill:" + fill_color + ";stroke:black;stroke-width:1;fill-opacity:" + fill_opacity + ";stroke-opacity:1.0");
        info_rect.addEventListener('mousedown', this.note_mousedownhandler);
        info_rect.addEventListener('mouseup', this.note_mouseuphandler);
        info_rect.addEventListener('mouseover', this.note_mouseoverhandler);
        info_rect.addEventListener('mouseout', this.note_mouseouthandler);
        this._info_canvas.appendChild(info_rect);
        
        return width;
    }



    scroll_to_tick(tick, exact)
    {
        var xpos = this.tick2x_zoomed(tick);

        if (exact)
        {
            this._rulers_frame.scrollLeft = xpos;
            this._tracks_frame.scrollLeft = xpos;
        }
        else
        {
            if (xpos > (this._tracks_frame.clientWidth + this._tracks_frame.scrollLeft - (this._tracks_frame.clientWidth / 10)))
            {
                this._rulers_frame.scrollLeft = xpos - 100;
                this._tracks_frame.scrollLeft = xpos - 100;
            }
            else if (xpos < this._tracks_frame.scrollLeft)
            {
                this._rulers_frame.scrollLeft = xpos - this._tracks_frame.clientWidth;
                this._tracks_frame.scrollLeft = xpos - this._tracks_frame.clientWidth;
            }
        }
    }
    
    scroll_to_notes(start_tick, track_index)
    {
        var end_tick = start_tick + this.x2tick(this._tracks_frame.clientWidth);
        var middle_note = this.find_note_center(track_index, start_tick, end_tick);
        var middle_y = this._track_y + ((this.note2line(middle_note) * this._line_height) * this._tracks_zoom_y);
        var pianowin_frame = document.getElementById("pianowin_frame");
        pianowin_frame.scrollTop = middle_y - (pianowin_frame.clientHeight / 2);
    }
    
    create_playhead()
    {
        var xpos = this.tick2x(this._playhead_ticks);
        var playhead_line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        playhead_line.id = 'pw_playhead';
        playhead_line.setAttribute("x1", xpos);
        playhead_line.setAttribute("x2", xpos);
        playhead_line.setAttribute("y1", this._track_y);
        playhead_line.setAttribute("y2", this._height);
        playhead_line.setAttribute("style", "stroke:" + this._playhead_color + ";stroke-width:3;");
        this._playhead_element = playhead_line;
        this._tracks_canvas.appendChild(playhead_line);
    }
    

    select_tick_notes_area()
    {
        return {'tick_start' : this._select_tick_start,
                'tick_stop' : this._select_tick_stop,
                'note_start' : this.line2note(this._select_line_stop) + 1,
                'note_stop' : this.line2note(this._select_line_start) + 1
                };
    }


    handle_select_area()
    {
        if (this._select_element)
        {
            this._notes_copy_buffer = this.select_tick_notes_area();
        }
        else
        {
            this._notes_copy_buffer = {};
        }
        
        this._notes_copy_buffer_type = 'select';
        select_notes_area(this._notes_copy_buffer, this._selected_events, this._track_index);
    }
    
    handle_cut(tick, do_remove_space)
    {
        if (!this._selected_notes)
        {
            return;
        }

        this._copied_notes = [];
        for (const note of this._selected_notes)
        {
            this._copied_notes.push(note.id);
        }
        this._notes_copy_buffer_type = 'cut';
        cut_notes(this._copied_notes, this._track_index);

        if (this._select_element)
        {
            this._select_element.remove();
            this._select_element = null;
        }
    }
    
    handle_cut_notes(ids)
    {
        this._copied_notes = ids;
        this._notes_copy_buffer_type = 'cut';
        cut_notes(this._copied_notes, this._track_index);

        if (this._select_element)
        {
            this._select_element.remove();
            this._select_element = null;
        }
    }
    
    handle_copy(tick)
    {
        if (!this._selected_notes)
        {
            return;
        }

        this._copied_notes = [];
        for (const note of this._selected_notes)
        {
            this._copied_notes.push(note.id);
        }
        this._notes_copy_buffer_type = 'copy';

        if (this._select_element)
        {
            this._select_element.remove();
            this._select_element = null;
        }
    }
    
    handle_copy_notes(ids)
    {
        this._copied_notes = ids;
        this._notes_copy_buffer_type = 'copy';

        if (this._select_element)
        {
            this._select_element.remove();
            this._select_element = null;
        }
    }
    
    handle_paste_insert_merge(tick, do_insert, do_merge)
    {
        if (!this._selected_notes)
        {
            return;
        }

        // paste at playhead
        paste_notes(
                    this._copied_notes,
                    this._playhead_ticks,
                    this._notes_copy_buffer_type,
                    this._track_index
                   ); // paste copy buffer at playhead
        
        if (this._select_element)
        {
            this._select_element.remove();
            this._select_element = null;
        }
    }    
    
    handle_paste_at_mouse(tick, to_note)
    {
        if (!this._selected_notes)
        {
            return;
        }

        // paste at playhead
        paste_notes_at_mouse(
                             this._copied_notes,
                             tick,
                             to_note,
                             this._notes_copy_buffer_type,
                             this._track_index
                            ); // paste copy buffer at mouse

        if (this._select_element)
        {
            this._select_element.remove();
            this._select_element = null;
        }
    } 

    handle_quantize(tick)
    {
        if (!this._selected_notes)
        {
            return;
        }

        var notes = [];
        for (const note of this._selected_notes)
        {
            notes.push(note.id);
        }

        quantize_notes(
                       notes,
                       this._track_index,
                       this._tick_snap_width
                      );
        
        if (this._select_element)
        {
            this._select_element.remove();
            this._select_element = null;
        }
    }
    
    handle_nudge_notes(key)
    {
        if (!this._selected_notes)
        {
            return;
        }

        var notes = [];
        for (const note of this._selected_notes)
        {
            notes.push(note.id);
        }

        var direction;
        switch (key)
        {
            case key_left:
                direction = "left";
                break;
            case key_right:
                direction = "right";
                break;
            case key_up:
                direction = "up";
                break;
            case key_down:
                direction = "down";
                break;                
        }

        nudge_notes(
                    notes,
                    this._track_index,
                    this._tick_snap_width,
                    direction
                   );        
    }
    
    handle_set_note_end(note_id, end_tick)
    {
        set_note_end(this._track_index, note_id, end_tick);
    }
    
    handle_set_note_velocity(note_id, value)
    {
        set_note_velocity(this._track_index, note_id, value);
    }
    
    handle_undo(tick)
    {
        undo_last_notes_edit();
    }
    
    handle_redo(tick)
    {
        redo_last_notes_edit();
    }
    
}
    
