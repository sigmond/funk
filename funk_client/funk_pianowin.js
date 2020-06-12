/*
    The FUNK Midi Sequencer

    Copyright (C) 2020  Per Sigmond, per@sigmond.no

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
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

        this._pixels_per_tick = 0.3;

        this._note_snap = 16;
        this._tick_snap_width = (this._song.ticks_per_beat * 4) / this._note_snap;

        this._note_height = 12;

        this._white_notes = [0, 2, 4, 5, 7, 9, 11];
        this._white_note_height = (this._note_height * 12) / this._white_notes.length;

        this._num_notes = 128;

        this._mouse_button_1_down = false;
        this._note_mouse_button_down = -1;

        this._mouse_at_tick = 0;
        this._mouse_at_x = 0;
        this._mouse_at_line = 0;
        this._mouse_at_y = 0;

        this._white_key_color = "white";
        this._black_key_color = "black";        
        this._white_key_highlight_color = "grey";
        this._black_key_highlight_color = "grey"; 
        this._note_color = "red";  
        this._playhead_color = "darkred";
        this._menu_bg_color = "black";
        
        this._menu_frame = menu_frame;
        this._rulers_frame = rulers_frame;
        this._info_frame = info_frame;
        this._tracks_frame = tracks_frame;
        
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


        this._track_event_elements = [];
        
        this._xgrid_highlight_element = null;
        this._key_highlight_element = null;
        this._key_highlight_type = null;

        this._track_index = 1;

        this.create_track();
        this.create_rulers();
        this.create_menu();
        this.fill_track_info();
        this.fill_channel_info();

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

    update_track(track_index)
    {
        this._track_index = track_index;
        this.fill_note_events();
        this.fill_track_info();
        this.fill_channel_info();
        this.fill_note_info();
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


    
    y2line(y)
    {
        return parseInt((y - this._track_y) / this._note_height);
    }
    
    y2note(y)
    {
        return this._num_notes - this.y2line(y);
    }
    
    y2line_zoomed(y)
    {
        return parseInt((y - this._track_y) / (this._note_height * this._tracks_zoom_y));
    }

    line2y(line)
    {
        return parseInt(line * this._note_height);
    }
    
    line2y_zoomed(line)
    {
        return parseInt(line * this._note_height * this._tracks_zoom_y);
    }


    tracks_handle_click(x, y, button)
    {
    }
    
    tracks_handle_mouse_down(x, y, button)
    {
        output("mouse down x " + x + " y " + y + " button " + button);
        
        if (button == 0)
        {
            if (this._notes_select_element)
            {
                if (global_shift_down)
                {
                    this.adjust_select_area(x, y, true);
                }
                else
                {
                    this._notes_select_element.remove();
                    this._notes_select_element = null;
                }
            }
            this._mouse_button_1_down = true;
        }
    }

    tracks_handle_mouse_up(x, y, button)
    {
        output("mouse up x " + x + " y " + y + " button " + button);
        
        if (button == 0)
        {
            this._mouse_button_1_down = false;
        }

        this._note_mouse_button_down = -1;
    }

    tracks_handle_mouse_move(x, y)
    {
        //output("handle_mouse_over " + x + " " + y);
        var tick = this.x2tick_zoomed(x);
        
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
            if (this._key_highlight_type == 'white_key')
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
        if (is_white_key)
        {
            this._key_highlight_element.style.fill = this._white_key_highlight_color;
            this._key_highlight_type = 'white_key';
        }
        else
        {
            this._key_highlight_element.style.fill = this._black_key_highlight_color;
            this._key_highlight_type = 'black_key';
        }

        this._mouse_at_tick = this.tick2snap(tick);
        this._mouse_at_x = this.tick2x_zoomed(this._mouse_at_tick);

        if (this._mouse_button_1_down)
        {
            this.adjust_select_area(x, y, false);
        }
    }


    adjust_select_area(x, y, extend)
    {
        var tick = this.tick2snap(this.x2tick_zoomed(x));
        
        var grid_width = this.tick2x(this._tick_snap_width);

        var note = this.y2line_zoomed(y);
        var xpos = this.tick2x(tick);
        var ypos = this._track_y + (note * this._note_height);
                
        if (!this._notes_select_element)
        {
            var width = parseInt(grid_width);
            var height = this._note_height;
            
            this._notes_select_element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            this._notes_select_element.id = 'pw_notes_select';
            this._notes_select_element.setAttribute("height", height);
            this._notes_select_element.setAttribute("width", width);
            this._notes_select_element.setAttribute("x", xpos);
            this._notes_select_element.setAttribute("y", ypos);
            this._notes_select_element.setAttribute("style", "fill:" + this._bg_color + ";stroke:black;stroke-width:0;fill-opacity:0.2;stroke-opacity:0.0");
            this._tracks_canvas.appendChild(this._notes_select_element);
            this._notes_select_x1 = xpos;
            this._notes_select_y1 = ypos;
            this._notes_select_width = width;
            this._notes_select_height = height;

            this._notes_select_tick_start = tick;
            this._notes_select_tick_stop = tick + this._tick_snap_width;
            this._notes_select_note_start = note;
            this._notes_select_note_stop = note - 1;
        }
        else
        {
            if (ypos > this._notes_select_y1)
            {
                this._notes_select_height = ypos - this._notes_select_y1 + this._note_height;
                this._notes_select_element.setAttribute("height", this._notes_select_height);
                this._notes_select_note_stop = this.y2note(this._notes_select_y1 + this._notes_select_height);
            }
            else
            {
                if (extend)
                {
                    this._notes_select_element.setAttribute("y", ypos);
                    this._notes_select_height += this._notes_select_y1 - ypos;
                    this._notes_select_y1 = ypos;
                    this._notes_select_element.setAttribute("height", this._notes_select_height);
                    this._notes_select_note_start = this.y2note(ypos);
                }
                else
                {
                    this._notes_select_height = this._notes_select_y1 - ypos + this._note_height;
                    this._notes_select_element.setAttribute("y", ypos);
                    this._notes_select_element.setAttribute("height", this._notes_select_height);
                    this._notes_select_note_stop = this.y2note(this._notes_select_y1 + this._notes_select_height);
                }
            }
            
            if (xpos > this._notes_select_x1)
            {
                this._notes_select_width = xpos - this._notes_select_x1 + parseInt(grid_width);
                this._notes_select_tick_stop = this.x2tick(xpos + this._notes_select_width);
                this._notes_select_element.setAttribute("width", this._notes_select_width); 
            }
            else
            {
                if (extend)
                {
                    this._notes_select_element.setAttribute("x", xpos);
                    this._notes_select_width += this._notes_select_x1 - xpos;
                    this._notes_select_x1 = xpos;
                    this._notes_select_tick_start = this.x2tick(xpos);
                    this._notes_select_element.setAttribute("width", this._notes_select_width); 
                }
                else
                {
                    this._notes_select_width = this._notes_select_x1 - xpos + parseInt(grid_width);
                    this._notes_select_element.setAttribute("x", xpos);
                    this._notes_select_tick_start = this.x2tick(xpos);
                    this._notes_select_element.setAttribute("width", this._notes_select_width); 
                }
            }
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
        play_midi_file(tick_snapped);
    }

    tick2snap(tick)
    {
        return (tick - parseInt(tick % this._tick_snap_width));
    }

    rulers_handle_mouse_move(x, y)
    {
        // output("handle_mouse_over " + x + " " + y);
        var tick = this.x2tick_zoomed(x);

        if (this._xgrid_highlight_element)
        {
            this._xgrid_highlight_element.remove();
        }

        var xpos = this.tick2x(this.tick2snap(tick));
        var width = this.tick2x(this._tick_snap_width);
        this._xgrid_highlight_element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this._xgrid_highlight_element.id = "pw_xgrid_highlight";
        this._xgrid_highlight_element.setAttribute("height", this._note_height * this._num_notes);
        this._xgrid_highlight_element.setAttribute("width", width);
        this._xgrid_highlight_element.setAttribute("x", xpos);
        this._xgrid_highlight_element.setAttribute("y", this._track_y);
        this._xgrid_highlight_element.setAttribute("style", "fill:" + this._bg_color + ";stroke:black;stroke-width:0;fill-opacity:0.2;stroke-opacity:0.0");
        this._tracks_canvas.appendChild(this._xgrid_highlight_element);
        
        if (this._key_highlight_element)
        {
            if (this._key_highlight_type == 'white_key')
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
        
        if (y < this._ruler_height)
        {
            if (this._key_highlight_element)
            {
                if (this._key_highlight_type == 'white_key')
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
                if (this._key_highlight_type == 'white_key')
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
            if (is_white_key)
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
            this._song.play_note(this._track_index, note, 47 + (40 * this._note_mouse_button_down));
        }
    }

    handle_note_up(svg, note, force)
    {
        if (force || (this._note_mouse_button_down >= 0))
        {
            svg.style.strokeWidth = 1;
            this._song.play_note(this._track_index, note, 0);
        }
    }


    create_rulers()
    {
        var tick;
        var next_seconds = 0;
        
        this._rulers_box_element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this._rulers_box_element.id = "pw_rulers_box";
        this._rulers_box_element.setAttribute("height", this._ruler_height);
        this._rulers_box_element.setAttribute("width", this._notes_width);
        this._rulers_box_element.setAttribute("x", 0);
        this._rulers_box_element.setAttribute("y", 0);
        this._rulers_box_element.setAttribute("style", "fill:" + this._menu_bg_color + ";stroke:black;stroke-width:1;fill-opacity:0.1;stroke-opacity:1.0");
        this._rulers_canvas.appendChild(this._rulers_box_element);        

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
                this._rulers_canvas.appendChild(ruler_line);
            }

            var ruler_text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            ruler_text.id = 'bars_text' + bar_index.toString();
            ruler_text.setAttribute("x", x + 2);
            ruler_text.setAttribute("y", 24);
            ruler_text.setAttribute("style", "fill:black;font-size:12px");
            ruler_text.textContent = (bar_index + 1).toString();
            this._rulers_canvas.appendChild(ruler_text);

            bar_index++;
        }

        var width_style = "width:" + this._notes_width.toString() + ";";
        var height_style = "height:" + this._ruler_height.toString() + ";";

        this._rulers_canvas.setAttribute("style", width_style + height_style);

        return this._tracks_width;
    }

    create_menu()
    {
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
        this._menu_canvas.appendChild(this._menu_box_element);        
    }
    
    
    fill_track_info()
    {
        var track_info_element = document.getElementById("pw_track_info");
        if (track_info_element != undefined)
        {
            track_info_element.remove();
        }

        track_info_element = document.createElementNS("http://www.w3.org/2000/svg", "text");
        track_info_element.id = 'pw_track_info';
        track_info_element.setAttribute("x", 2);
        track_info_element.setAttribute("y", 14);
        track_info_element.setAttribute("style", "fill:black;font-size:14px;font-weight:bold");
        track_info_element.textContent = this._track_index.toString() + ' ' + this._song.tracknames[this._track_index];
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
        channel_info_element.setAttribute("y", 14 + 12);
        channel_info_element.setAttribute("style", "fill:black;font-size:12px;font-weight:normal");
        channel_info_element.textContent = 'Channel ' + (this._song.channels[this._track_index] + 1);
        this._menu_canvas.appendChild(channel_info_element);        
    }
    
    
    remove_track_events()
    {
        var event;
        
        while ((event = this._track_event_elements.pop()))
        {
            event.remove();
        }
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
        var height_style = "height:" + ((this._note_height * this._num_notes) + this._track_y).toString() + ";";

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

        var middle_y = this._track_y + ((this.note2line(middle_note) * this._note_height) * this._tracks_zoom_y);
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
                info_width_tmp = this.create_note_info(note, true, i, track);
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
                info_width_tmp = this.create_note_info(note, false, 0, track);
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
            var opacity = (event.velocity / this._num_notes).toString();

            highest_note = parseInt(Math.max(highest_note, note));
            lowest_note = parseInt(Math.min(lowest_note, note));
            
            var width = this.tick2x(event.end - event.start);
            var height = this._note_height - 6;
            var y = this._track_y + (this.note2line(note) * this._note_height) + 3;
            var x = this.tick2x(event.start);
            var event_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            event_rect.id = 'pw_event_' + track_index.toString() + '_' + note.toString() + '_' + event.start.toString();
            event_rect.setAttribute("x", x);
            event_rect.setAttribute("y", y);
            event_rect.setAttribute("width", width);
            event_rect.setAttribute("height", height);
            event_rect.setAttribute("style", "fill:" + this._note_color + ";stroke:black;stroke-width:1;fill-opacity:" + opacity + ";stroke-opacity:1.0");
            this._tracks_canvas.appendChild(event_rect);
            this._track_event_elements.push(event_rect);
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
        var height = this._note_height * this._num_notes;
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
            var y = i * this._note_height;
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


    create_note_info(note, is_white, white_key_num, track)
    {
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

        if (is_white)
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
            width = parseInt(this._info_width * 2 / 3);
            height = this._note_height;
            y = this._track_y + (this.note2line(note) * this._note_height);
            fill_color = this._black_key_color;
        }

        info_rect.id = 'note_info_' + note.toString();
        info_rect.setAttribute("height", height);
        info_rect.setAttribute("width", width);
        info_rect.setAttribute("x", 0);
        info_rect.setAttribute("y", y);
        info_rect.setAttribute("style", "fill:" + fill_color + ";stroke:black;stroke-width:1;fill-opacity:1.0;stroke-opacity:1.0");
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
        var middle_y = this._track_y + ((this.note2line(middle_note) * this._note_height) * this._tracks_zoom_y);
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
        return {'tick_start' : this._notes_select_tick_start,
                'tick_stop' : this._notes_select_tick_stop,
                'note_start' : this._notes_select_note_start,
                'note_stop' : this._notes_select_note_stop
                };
    }


    handle_cut(tick, do_remove_space)
    {
        if (!this._notes_select_element)
        {
            return;
        }

        this._notes_copy_buffer = this.select_tick_notes_area();
        this._notes_copy_buffer_type = 'cut';
        cut_notes_area(this._notes_copy_buffer, this._track_index);

        this._notes_select_element.remove();
        this._notes_select_element = null;
    }
    
    handle_copy(tick)
    {
        if (!this._notes_select_element)
        {
            return;
        }

        this._notes_copy_buffer = this.select_tick_notes_area();
        this._notes_copy_buffer_type = 'copy'

        this._notes_select_element.remove();
        this._notes_select_element = null;
    }
    
    handle_paste_insert_merge(tick, do_insert, do_merge)
    {
        if (!this._notes_copy_buffer)
        {
            return;
        }

        // paste at playhead
        paste_notes_area(
                         this._notes_copy_buffer, 
                         {'tick_start' : this._playhead_ticks,
                                 'tick_stop' : this._playhead_ticks + (this._notes_copy_buffer['tick_stop'] - this._notes_copy_buffer['tick_start']),
                                 'note_start' : this._notes_copy_buffer['note_start'],
                                 'note_stop' : this._notes_copy_buffer['note_stop']
                                 },
                         this._area_copy_buffer_type,
                         this._track_index
                        ); // paste copy buffer at playhead
        
        this._notes_select_element.remove();
        this._notes_select_element = null;
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
    
