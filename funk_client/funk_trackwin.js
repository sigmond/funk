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

class trackwin extends eventwin
{
    constructor(prefix, menu_frame, rulers_frame, info_frame, tracks_frame, song)
    {
        super(prefix, menu_frame, rulers_frame, info_frame, tracks_frame, song);

        this._pixels_per_tick = 0.04;
        this._line_height = 20;
        
        this._button_padding = 4;
        this._button_width = this._line_height - (2 * this._button_padding);
        this._button_height = this._line_height - (2 * this._button_padding);
        this._button_width_space = this._button_width + (2 * this._button_padding);
        this._solo_button_left = this._info_width - (2 * this._button_width_space) + this._button_padding;
        this._solo_button_right = this._solo_button_left + this._button_width;
        this._mute_button_left = this._info_width - this._button_width_space + this._button_padding;
        this._mute_button_right = this._mute_button_left + this._button_width;

        this._button_opacity = "1.0";

        this._bg_color = "blue";
        this._solo_color = "lawngreen";
        this._solo_engaged_color = "lawngreen";
        this._mute_color = "lightsalmon";
        this._mute_engaged_color = "lightsalmon";
        this._playhead_color = "darkred";
        this._menu_bg_color = "black";

        this._solo_state = [];
        this._mute_state = [];
        
        this._allSoloTimerFunction = null;
        this._all_solo_highlighted = false;
        
        this._playing = false;
        
        this._mouse_button_1_down = false;

        this._mouse_at_tick = 0;
        this._mouse_at_x = 0;
        this._mouse_at_track = 0;
        this._mouse_at_y = 0;

        this._mouse_over_tracks = false;
        
        this._tracks_canvas.addEventListener('contextmenu', function(ev) {
                                                 ev.preventDefault();
                                                 trackwin_object.tracks_clickhandler(ev);
                                                 return false;
                                             }, false);
        this._tracks_canvas.addEventListener('wheel', function(ev) {
                                                 if (global_ctrl_down || global_shift_down)
                                                 {
                                                     ev.preventDefault();
                                                     trackwin_object.tracks_wheelhandler(ev);
                                                     return false;
                                                 }
                                             }, false);
        this._tracks_canvas.addEventListener('click', this.tracks_clickhandler);
        this._tracks_canvas.addEventListener('auxclick', this.tracks_clickhandler);
        this._tracks_canvas.addEventListener('mousedown', this.tracks_mousedownhandler);
        this._tracks_canvas.addEventListener('mouseup', this.tracks_mouseuphandler);
        this._tracks_canvas.addEventListener('mousemove', this.tracks_mousemovehandler);
        this._tracks_canvas.addEventListener('mouseover', this.tracks_mouseoverhandler);
        this._tracks_canvas.addEventListener('mouseout', this.tracks_mouseouthandler);
        
        

        this._info_canvas.addEventListener('wheel', function(ev) {
                                               if (global_ctrl_down || global_shift_down)
                                               {
                                                   ev.preventDefault();
                                                   if (global_shift_down)
                                                   {
                                                       trackwin_object.info_wheelhandler(ev);
                                                   }
                                                   return false;
                                               }    
                                           }, false);
        this._info_canvas.addEventListener('click', this.info_clickhandler);
        this._info_canvas.addEventListener('mousemove', this.info_mousemovehandler);
        
        rulers_frame.addEventListener('scroll', this.rulers_scrollhandler);        
        this._rulers_canvas.addEventListener('wheel', function(ev) {
                                                 if (global_ctrl_down || global_shift_down)
                                                 {
                                                     ev.preventDefault();
                                                     if (global_ctrl_down)
                                                     {
                                                         trackwin_object.rulers_wheelhandler(ev);
                                                     }
                                                     return false;
                                                 }
                                             }, false);
        this._rulers_canvas.addEventListener('click', this.rulers_clickhandler);
        this._rulers_canvas.addEventListener('mousedown', this.rulers_mousedownhandler);
        this._rulers_canvas.addEventListener('mouseup', this.rulers_mouseuphandler);
        this._rulers_canvas.addEventListener('mousemove', this.rulers_mousemovehandler);        
        
        this._bar_highlight_element = null;
        this._track_highlight_element = null;
        this._select_element = null;

        this._track_event_elements = []

        this.create_tracks();
        this.create_rulers();
        this.create_menu();
        this.fill_song_info();
        this.fill_tempo_info();

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
        var track = this._song.tracks[track_index];
        this.fill_track_events(track_index, track);
        this.create_track_info(track_index, track, this._song.tracknames[track_index]);
    }

    go_to_start()
    {
        if (!this._playing)
        {
            this.handle_time(0);
            pianowin_object.handle_time(0);
        }
    }
    
    
    go_to_end()
    {
        if (!this._playing)
        {
            this.handle_time(this._song.length_ticks);
            pianowin_object.handle_time(this._song.length_ticks);
        }
    }

    play_at_playhead()
    {
        if (!this._playing)
        {
            this._playing = true;
            play_midi_file(this._playhead_ticks);
        }
        else
        {
            stop();
            this._playing = false;
        }
    }


    tracks_clickhandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        output("click: " + x + " " + y);
        output("button: " + event.button);
        
        trackwin_object.tracks_handle_click(x, y, event.button);
    }
    
    tracks_mousedownhandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        trackwin_object.tracks_handle_mouse_down(x, y, event.button);
    }

    tracks_mouseuphandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        trackwin_object.tracks_handle_mouse_up(x, y, event.button);
    }

    tracks_mousemovehandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        trackwin_object.tracks_handle_mouse_move(x, y);
    }

    tracks_mouseoverhandler(event)
    {
//         output("mouseover");
        trackwin_object._mouse_over_tracks = true;
    }

    tracks_mouseouthandler(event)
    {
//         output("mouseout");
        trackwin_object._mouse_over_tracks = false;
    }

    tracks_wheelhandler(event)
    {
        if (global_ctrl_down || global_shift_down)
        {
            let svg = event.currentTarget;
            let bound = svg.getBoundingClientRect();
            
            let x = event.clientX - bound.left - svg.clientLeft;
            let y = event.clientY - bound.top - svg.clientTop;

            trackwin_object.tracks_handle_wheel(x, y, event.deltaY);
        }
    }

    rulers_scrollhandler()
    {
        var tracks_element = document.getElementById("trackwin_tracks_container");
        var rulers_element = document.getElementById("trackwin_rulers_rulers_container");
        
        tracks_element.scrollLeft = rulers_element.scrollLeft;
    }
    
    rulers_clickhandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        output("click: " + x + " " + y);
        output("button: " + event.button);
        
        trackwin_object.rulers_handle_click(x, y, event.button);
    }
    
    rulers_mousedownhandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        output("mousedown: " + x + " " + y);
        output("button: " + event.button);
        
        trackwin_object.rulers_handle_mousedown(x, y, event.button);
    }
    
    rulers_mouseuphandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        output("mouseup: " + x + " " + y);
        output("button: " + event.button);
        
        trackwin_object.rulers_handle_mouseup(x, y, event.button);
    }
    
    rulers_mousemovehandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        trackwin_object.rulers_handle_mouse_move(x, y);
    }
    
    rulers_wheelhandler(event)
    {
        if (global_ctrl_down)
        {
            let svg = event.currentTarget;
            let bound = svg.getBoundingClientRect();
            
            let x = event.clientX - bound.left - svg.clientLeft;
            let y = event.clientY - bound.top - svg.clientTop;
        
            trackwin_object.rulers_handle_wheel(x, y, event.deltaY);
        }
    }

    solo_mouseoverhandler(event)
    {
        let svg = event.currentTarget;
        svg.style.fillOpacity = 0.05;
    }

    solo_mouseouthandler(event)
    {
        let svg = event.currentTarget;
        svg.style.fillOpacity = 1.0;
    }

    solo_clickhandler(event)
    {
        let svg = event.currentTarget;

        let track_index = parseInt(svg.id.slice(svg.id.lastIndexOf('_') + 1));
        
        trackwin_object.handle_solo_click(svg, track_index);
    }

    mute_mouseoverhandler(event)
    {
        let svg = event.currentTarget;
        svg.style.fillOpacity = 0.05;
    }

    mute_mouseouthandler(event)
    {
        let svg = event.currentTarget;
        svg.style.fillOpacity = 1.0;
    }

    mute_clickhandler(event)
    {
        let svg = event.currentTarget;

        let track_index = parseInt(svg.id.slice(svg.id.lastIndexOf('_') + 1));
        
        trackwin_object.handle_mute_click(svg, track_index);
    }


    tracks_handle_click(x, y, button)
    {
        if (button == 2)
        {
            // right click
            var track_index = this.y2line_zoomed(y);
            if (track_index < 0)
            {
                track_index = 0;
            }
            else if (track_index >= (this._song.tracks.length))
            {
                track_index = this._song.tracks.length - 1;
            }
            
            pianowin_object.update_track(track_index);
            
            var tick = this.x2tick_zoomed(x);
            for (const bar of this._song.bars)
            {
                if ((tick >= bar.start) && (tick < bar.end))
                {
                    tick = bar.start;
                    break;
                }
            }
            
            pianowin_object.scroll_to_tick(tick - this._song.ticks_per_beat, true);
            pianowin_object.scroll_to_notes(tick, track_index);
        }
        else if (button == 0)
        {
        }
    }

    tracks_handle_mouse_down(x, y, button)
    {
        output("mouse down x " + x + " y " + y + " button " + button);
        
        if (button == 0)
        {
            if (this._select_element)
            {
                if (global_shift_down)
                {
                    this.adjust_select_area(x, y, true, false);
                }
                else
                {
                    this._select_element.remove();
                    this._select_element = null;
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
    }

    tracks_handle_mouse_move(x, y)
    {
        // output("handle_mouse_over " + x + " " + y);
        var tick = this.x2tick_zoomed(x);
        
        if (this._bar_highlight_element)
        {
            this._bar_highlight_element.remove();
            this._bar_highlight_element = null;
        }

        var track_index = this.y2line_zoomed(y);
        if (track_index < 0)
        {
            track_index = 0;
        }
        else if (track_index >= (this._song.tracks.length))
        {
            track_index = this._song.tracks.length - 1;
        }
            
        this._mouse_at_track = track_index;
        this._mouse_at_y = this.line2y_zoomed(track_index);

        if (this._track_highlight_element)
        {
            this._track_highlight_element.remove();
        }
            
        this._track_highlight_element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        var width = this._info_width;
            
        this._track_highlight_element.id = 'tw_track_highlight';
        this._track_highlight_element.setAttribute("height", this._line_height);
        this._track_highlight_element.setAttribute("width", width);
        this._track_highlight_element.setAttribute("x", 0);
        this._track_highlight_element.setAttribute("y", this._track_y + (track_index * this._line_height));
        this._track_highlight_element.setAttribute("style", "fill:" + this._bg_color + ";stroke:black;stroke-width:0;fill-opacity:0.1;stroke-opacity:0.0");
        this._info_canvas.appendChild(this._track_highlight_element);

        for (const bar of this._song.bars)
        {
            if ((tick >= bar.start) && (tick < bar.end))
            {
                this._mouse_at_tick = bar.start;
                this._mouse_at_x = this.tick2x_zoomed(bar.start);
                break;
            }
        }
        
        if (this._mouse_button_1_down)
        {
            this.adjust_select_area(x, y, false, false);
        }
    }

    

    
    adjust_select_area(x, y, extend, key)
    {
        var pos;
        
        if (key && !this._select_element)
        {
            return;
        }
        
        if (!key)
        {
            pos = {"tick" : this.x2tick_zoomed(x), "line" : this.y2line_zoomed(y) };
        }
        else
        {
            pos = this.tick_line_from_key(key, this._song.length_ticks, this._song.tracks.length);            
        }
        
        var i;
        var bar;
        
        for (i = 0; i < this._song.bars.length; i++)
        {
            bar = this._song.bars[i];
            if ((pos.tick >= bar.start) && (pos.tick < bar.end))
            {                
                if ((key == key_left) && (i > 0))
                {
                    bar = this._song.bars[i - 1];
                }
                else if (
                         (key == key_right) && 
                         (this._select_x2 < this._select_x1) && 
                         (i < (this._song.bars.length - 1))
                        )
                {
                    bar = this._song.bars[i + 1];
                }
                var xpos = parseInt(this.tick2x(bar.start));
                var ypos = this._track_y + (pos.line * this._line_height);
                
                if (!this._select_element)
                {
                    var width = parseInt(this.tick2x(bar.ticks));
                    var height = this._line_height;
                    
                    this._select_element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    this._select_element.id = 'tw_track_select';
                    this._select_element.setAttribute("height", height);
                    this._select_element.setAttribute("width", width);
                    this._select_element.setAttribute("x", xpos);
                    this._select_element.setAttribute("y", ypos);
                    this._select_element.setAttribute("style", "fill:" + this._bg_color + ";stroke:black;stroke-width:0;fill-opacity:0.2;stroke-opacity:0.0");
                    this._tracks_canvas.appendChild(this._select_element);
                    this._select_x1 = xpos;
                    this._select_y1 = ypos;
                    this._select_width = width;
                    this._select_height = this._line_height;
                    this._select_x2 = xpos + width;
                    this._select_y2 = ypos + height;
                    this._select_tick_start = bar.start;
                    this._select_tick_stop = bar.end;
                    this._select_line_start = pos.line;
                    this._select_line_stop = pos.line + 1;
                }
                else
                {
                    this.change_select_area(xpos, ypos, pos, bar.start, bar.end);                    
                }
                break;
            }
        }
    }
    

    rulers_handle_click(x, y, button)
    {
        if (this._playing)
        {
            stop();
            this._playing = false;
            return;
        }
        
        var tick = this.x2tick_zoomed(x);
        
        for (const bar of this._song.bars)
        {
            if ((tick >= bar.start) && (tick < bar.end))
            {
                output("play: start = " + bar.start);
                this._playing = true;
                play_midi_file(bar.start);
                break;
            }
        }
    }
    
    rulers_handle_mousedown(x, y, button)
    {
    }
    
    rulers_handle_mouseup(x, y, button)
    {
    }
    
    rulers_handle_mouse_move(x, y)
    {
//         output("handle_mouse_move " + x + " " + y);
//         output("pixels_per_tick: " + this._pixels_per_tick);
        var tick = this.x2tick_zoomed(x);
        
        for (const bar of this._song.bars)
        {
            if ((tick >= bar.start) && (tick < bar.end))
            {
                if (this._bar_highlight_element)
                {
                    this._bar_highlight_element.remove();
                }
                
                var xpos = parseInt(this.tick2x(bar.start));
                var width = parseInt(this.tick2x(bar.ticks));
                this._bar_highlight_element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                this._bar_highlight_element.id = "tw_bar_highlight";
                this._bar_highlight_element.setAttribute("height", this._line_height * this._song.tracks.length);
                this._bar_highlight_element.setAttribute("width", width);
                this._bar_highlight_element.setAttribute("x", xpos);
                this._bar_highlight_element.setAttribute("y", this._track_y);
                this._bar_highlight_element.setAttribute("style", "fill:" + this._bg_color + ";stroke:black;stroke-width:0;fill-opacity:0.1;stroke-opacity:0.0");
                this._tracks_canvas.appendChild(this._bar_highlight_element);

                break;
            }
        }
        
        if (this._track_highlight_element)
        {
            this._track_highlight_element.remove();
            this._track_highlight_element = null;
        }
    }
   

    
    
    info_clickhandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        output("click: " + x + " " + y);
        
        trackwin_object.info_handle_click(x, y);
    }
    
    info_mousemovehandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        trackwin_object.info_handle_mouse_move(x, y);
    }
    
    info_wheelhandler(event)
    {
        if (global_shift_down)
        {
            let svg = event.currentTarget;
            let bound = svg.getBoundingClientRect();
            
            let x = event.clientX - bound.left - svg.clientLeft;
            let y = event.clientY - bound.top - svg.clientTop;
        
            trackwin_object.info_handle_wheel(x, y, event.deltaY);
        }
    }

    
    info_handle_click(x, y)
    {
        if (y < this._ruler_height)
        {
        }
    }
    
    info_handle_mouse_move(x, y)
    {
        // output("handle_mouse_over " + x + " " + y);
        if (this._bar_highlight_element)
        {
            this._bar_highlight_element.remove();
            this._bar_highlight_element = null;
        }

        if (this._track_highlight_element)
        {
            this._track_highlight_element.remove();
            this._track_highlight_element = null;
        }
    }
    



    track_info_mouseoverhandler(event)
    {
        let svg = event.currentTarget;
        svg.style.fillOpacity = 0.2;
    }

    track_info_mouseouthandler(event)
    {
        let svg = event.currentTarget;
        svg.style.fillOpacity = 0.1;
    }


    startAllSoloAnimation() {
        if(this._allSoloTimerFunction == null) {
            this._allSoloTimerFunction = setInterval(this.allSoloAnimate, 250);
        }
    }
    
    stopAllSoloAnimation() {
        var all_solo = document.getElementById("track_solo_0");
        if(this._allSoloTimerFunction != null){
            clearInterval(this._allSoloTimerFunction);
            this._allSoloTimerFunction = null;
        }
        all_solo.style.strokeWidth = 1;
        this._all_solo_highlighted = false;
    }
    
    allSoloAnimate() {
        var all_solo = document.getElementById("track_solo_0");
        if (this._all_solo_highlighted)
        {
            all_solo.style.strokeWidth = 1;
            this._all_solo_highlighted = false;
        }
        else
        {
            all_solo.style.strokeWidth = 0;
            this._all_solo_highlighted = true;
        }
    }
    

    handle_solo_click(svg, track_index)
    {
        
        if (track_index == 0)
        {
            if (this._solo_state.includes(1))
            {
                var i;
                for (i = 0; i < this._song.tracks.length; i++)
                {
                    var svg = document.getElementById("track_solo_" + i.toString());
                    svg.style.strokeWidth = 1;
                    svg.style.fill = this._solo_color;
                    this._solo_state[i] = 0;
                }                
                this.stopAllSoloAnimation();
            }
        }
        else
        {
            if (!this._solo_state[track_index])
            {
                var all_solo = document.getElementById("track_solo_0");
                all_solo.style.strokeWidth = 0;
                this.startAllSoloAnimation();

                svg.style.strokeWidth = 0;
                svg.style.fill = this._solo_engaged_color;
                this._solo_state[track_index] = 1;
            }
            else
            {
                svg.style.strokeWidth = 1;
                svg.style.fill = this._solo_color;
                this._solo_state[track_index] = 0;
                if (!this._solo_state.includes(1))
                {
                    var all_solo = document.getElementById("track_solo_0");
                    all_solo.style.fill = this._solo_color;
                    this.stopAllSoloAnimation();
                }
            }
        }

        this.handle_solo_mute_state_changed();
    }

    handle_mute_click(svg, track_index)
    {
        if (!this._mute_state[track_index])
        {
            svg.style.strokeWidth = 0;
            svg.style.fill = this._mute_engaged_color;
            this._mute_state[track_index] = 1;
        }
        else
        {
            svg.style.strokeWidth = 1;
            svg.style.fill = this._mute_color;
            this._mute_state[track_index] = 0;
        }

        this.handle_solo_mute_state_changed();
    }


    handle_solo_mute_state_changed()
    {
        var muted = [];
        var i;
        var solo_on = this._solo_state.includes(1);
        
        for (i = 0; i < this._song.tracks.length; i++)
        {
            if (solo_on && (this._solo_state[i] == 0))
            {
                muted.push(i);
            }
            else if (this._mute_state[i] == 1)
            {
                muted.push(i);
            }
        }

        send_mute_state(muted);
    }





    get playing()
    {
        return this._playing;
    }
    

    create_tracks()
    {
        var track_index = 0;
        var track_width = 0;

        track_width = this.create_track_bars(this._song.bars);
        
        var width_style = "width:" + (track_width + 100).toString() + ";";
        var height_style = "height:" + ((this._line_height * (this._song.tracks.length + 1)) + this._track_y).toString() + ";";

        this._tracks_canvas.setAttribute("style", width_style + height_style);

        var wh = this._tracks_canvas.getClientRects()[0];
        this._height = wh.height;
        this._tracks_width = wh.width;


        track_index = 0;
        for (const track of this._song.tracks)
        {
            this.fill_track_events(track_index, track);
            this._solo_state.push(0);
            this._mute_state.push(0);
            track_index++;
        }


        track_index = 0;
        var info_width = 0;
        var info_width_tmp;

        for (const track of this._song.tracks)
        {
            info_width_tmp = this.create_track_info(track_index, track, this._song.tracknames[track_index]);
            if (info_width_tmp > info_width)
            {
                info_width = info_width_tmp;
            }
            track_index++;
        }

        width_style = "width:" + (info_width).toString() + ";";

        this._info_canvas.setAttribute("style", width_style);

        this.create_track_lines();

        this.create_playhead();
    }

    create_rulers()
    {
        var tick;
        var next_seconds = 0;

        this._rulers_box_element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this._rulers_box_element.id = "tw_rulers_box";
        this._rulers_box_element.setAttribute("height", this._ruler_height);
        this._rulers_box_element.setAttribute("width", this._tracks_width);
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
                ruler_line.setAttribute("style", "stroke:black;stroke-width:1;");
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

                next_seconds += 5;
            }
            
        }


        var bar_index = 0;
        for (const bar of this._song.bars)
        {
            var width = 1;
            var x = this.tick2x(bar.start);
            var ruler_line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            ruler_line.id = 'bars_ruler_' + bar_index.toString();
            ruler_line.setAttribute("x1", x);
            ruler_line.setAttribute("x2", x);
            ruler_line.setAttribute("y1", (this._ruler_height / 2) + 1);
            ruler_line.setAttribute("y2", (this._ruler_height) - 2);
            ruler_line.setAttribute("style", "stroke:black;stroke-width:1;");
            this._rulers_canvas.appendChild(ruler_line);

            var ruler_text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            ruler_text.id = 'bars_text' + bar_index.toString();
            ruler_text.setAttribute("x", x + 2);
            ruler_text.setAttribute("y", 24);
            ruler_text.setAttribute("style", "fill:black;font-size:12px");
            ruler_text.textContent = (bar_index + 1).toString();
            this._rulers_canvas.appendChild(ruler_text);

            bar_index++;
        }
        
        var width_style = "width:" + this._tracks_width.toString() + ";";
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
        this._menu_box_element.id = "tw_menu_box";
        this._menu_box_element.setAttribute("height", this._ruler_height + 10);
        this._menu_box_element.setAttribute("width", this._info_width);
        this._menu_box_element.setAttribute("x", 0);
        this._menu_box_element.setAttribute("y", 0);
        this._menu_box_element.setAttribute("style", "fill:" + this._menu_bg_color + ";stroke:black;stroke-width:1;fill-opacity:0.2;stroke-opacity:1.0");
        this._menu_canvas.appendChild(this._menu_box_element);
    }

    fill_song_info()
    {
        var song_info_element = document.getElementById("tw_song_info");
        if (song_info_element != undefined)
        {
            song_info_element.remove();
        }

        var songname = first_letter_uppercase(base_name(this._song.filename));

        song_info_element = document.createElementNS("http://www.w3.org/2000/svg", "text");
        song_info_element.id = 'tw_song_info';
        song_info_element.setAttribute("x", 2);
        song_info_element.setAttribute("y", 14);
        song_info_element.setAttribute("style", "fill:black;font-size:14px;font-weight:bold");
        song_info_element.textContent = songname;
        this._menu_canvas.appendChild(song_info_element);        
    }
    
    fill_tempo_info()
    {
        var tempo_info_element = document.getElementById("tw_tempo_info");
        if (tempo_info_element != undefined)
        {
            tempo_info_element.remove();
        }

        var bpm = this._song.bpm();

        tempo_info_element = document.createElementNS("http://www.w3.org/2000/svg", "text");
        tempo_info_element.id = 'tw_tempo_info';
        tempo_info_element.setAttribute("x", 2);
        tempo_info_element.setAttribute("y", 14 + 12);
        tempo_info_element.setAttribute("style", "fill:black;font-size:12px;font-weight:normal");
        tempo_info_element.textContent = bpm + ' bpm';
        this._menu_canvas.appendChild(tempo_info_element);        
    }
    
    create_track_bars(bars)
    {
        var height = this._line_height * this._song.tracks.length;
        var bar_index = 0;
        for (const bar of this._song.bars)
        {
            var x = this.tick2x(bar.start);
            var bar_line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            bar_line.id = 'trackwin_bar_' + bar_index.toString();
            bar_line.setAttribute("x1", x);
            bar_line.setAttribute("x2", x);
            bar_line.setAttribute("y1", this._track_y);
            bar_line.setAttribute("y2", height);
            bar_line.setAttribute("style", "stroke:black;stroke-width:1;");
            this._tracks_canvas.appendChild(bar_line);

            bar_index++;
        }

        return x;
    }


    create_track_lines()
    {
        var i;
        
        for (i = 0; i < this._song.tracks.length + 1; i++)
        {
            var y = this._line_height * i;
            var track_line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            track_line.id = 'trackwin_track_line_' + i.toString();
            track_line.setAttribute("x1", 0);
            track_line.setAttribute("x2", this._tracks_width);
            track_line.setAttribute("y1", y);
            track_line.setAttribute("y2", y);
            track_line.setAttribute("style", "stroke:black;stroke-width:1;");
            this._tracks_canvas.appendChild(track_line);
        }

        return y;
    }


    create_solo_button(track_index)
    {
        var solo_rect = document.getElementById("track_solo_" + track_index.toString());
        if (solo_rect != undefined)
        {
            solo_rect.remove();
        }
        
        solo_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        var x1 = this._solo_button_left;
        var y1 = this._track_y + (track_index * this._line_height) + this._button_padding;
        var x2 = x1 + this._button_width;
        var y2 = y1 + this._button_height;
        var id = "track_solo_" + track_index.toString()
        solo_rect.id = id;
        solo_rect.setAttribute("height", this._button_height);
        solo_rect.setAttribute("width", this._button_width);
        solo_rect.setAttribute("x", x1);
        solo_rect.setAttribute("y", y1);
        solo_rect.setAttribute("rx", 2);
        solo_rect.setAttribute("ry", 2);
        solo_rect.addEventListener('mouseover', this.solo_mouseoverhandler);
        solo_rect.addEventListener('mouseout', this.solo_mouseouthandler);
        solo_rect.addEventListener('click', this.solo_clickhandler);
        solo_rect.setAttribute("style", "fill:" + this._solo_color + ";stroke:black;stroke-width:1;fill-opacity:" + this._button_opacity + ";stroke-opacity:1.0");

        return solo_rect;
    }

    create_mute_button(track_index)
    {
        var mute_rect = document.getElementById("track_mute_" + track_index.toString());
        if (mute_rect != undefined)
        {
            mute_rect.remove();
        }

        mute_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        
        var x1 = this._mute_button_left;
        var y1 = this._track_y + (track_index * this._line_height) + this._button_padding;
        var x2 = x1 + this._button_width;
        var y2 = y1 + this._button_height;
        
        var id = "track_mute_" + track_index.toString()

        mute_rect.id = id;
        mute_rect.setAttribute("height", this._button_height);
        mute_rect.setAttribute("width", this._button_width);
        mute_rect.setAttribute("x", x1);
        mute_rect.setAttribute("y", y1);
        mute_rect.setAttribute("rx", 2);
        mute_rect.setAttribute("ry", 2);
        mute_rect.addEventListener('mouseover', this.mute_mouseoverhandler);
        mute_rect.addEventListener('mouseout', this.mute_mouseouthandler);
        mute_rect.addEventListener('click', this.mute_clickhandler);
        mute_rect.setAttribute("style", "fill:" + this._mute_color + ";stroke:black;stroke-width:1;fill-opacity:" + this._button_opacity + ";stroke-opacity:1.0");

        return mute_rect;
    }


    create_track_info(track_index, track, trackname)
    {
        var info_rect = document.getElementById('track_info_' + track_index.toString());
        if (info_rect != undefined)
        {
            info_rect.remove();
        }

        info_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        var width = this._info_width;
        
        info_rect.id = 'track_info_' + track_index.toString();
        info_rect.setAttribute("height", this._line_height);
        info_rect.setAttribute("width", width);
        info_rect.setAttribute("x", 0);
        info_rect.setAttribute("y", this._track_y + (track_index * this._line_height));
        info_rect.setAttribute("style", "fill:" + this._bg_color + ";stroke:black;stroke-width:1;fill-opacity:0.1;stroke-opacity:1.0");
        info_rect.addEventListener('mouseover', this.track_info_mouseoverhandler);
        info_rect.addEventListener('mouseout', this.track_info_mouseouthandler);
        this._info_canvas.appendChild(info_rect);

        this._info_canvas.appendChild(this.create_solo_button(track_index));
        if (track_index > 0)
        {
            this._info_canvas.appendChild(this.create_mute_button(track_index));
        }

        var info_name_text = document.getElementById('track_name_' + track_index.toString());
        if (info_name_text != undefined)
        {
            info_name_text.remove();
        }
        
        info_name_text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        info_name_text.id = 'track_name_' + track_index.toString();
        info_name_text.setAttribute("x", 2);
        info_name_text.setAttribute("y", this._track_y + (track_index * this._line_height) + 12);
        info_name_text.setAttribute("style", "fill:black;font-size:12px;font-weight:bold");
        if (track_index == 0)
        {
            info_name_text.textContent = track_index.toString() + ' Master';
        }
        else
        {
            info_name_text.textContent = track_index.toString() + ' ' + trackname;
        }
        
        this._info_canvas.appendChild(info_name_text);
        
        return width;
    }


    fill_track_events(track_index, track)
    {
        var width = 1;
        var last_painted_tick = -1;
        
        var y = this._track_y + (track_index * this._line_height) + 4;
        var height = this._line_height - 8;

        if (this._track_event_elements.length <= track_index)
        {
            this._track_event_elements.push([]);
        }
        
        var event_element;
        
        while ((event_element = this._track_event_elements[track_index].pop()))
        {
            event_element.remove();
        }

        for (const event of track.events)
        {
            if (event.start > last_painted_tick)
            {
                var xpos = this.tick2x(event.start);
                var width = this.tick2x(event.end - event.start);
                if (width < 1)
                {
                    width = 1;
                }
                var event_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                event_rect.id = 'tw_event_' + track_index.toString() + '_' + event.start.toString();
                event_rect.setAttribute("x", xpos);
                event_rect.setAttribute("y", y);
                event_rect.setAttribute("width", width);
                event_rect.setAttribute("height", height);
                event_rect.setAttribute("style", "fill:black;stroke:black;stroke-width:0;fill-opacity:0.8;stroke-opacity:1.0");
                this._tracks_canvas.appendChild(event_rect);
                last_painted_tick = event.start;
                this._track_event_elements[track_index].push(event_rect);
            }
        }
        
    }

    create_playhead()
    {
        var xpos = this.tick2x(this._playhead_ticks);
        var playhead_line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        playhead_line.id = 'tw_playhead';
        playhead_line.setAttribute("x1", xpos);
        playhead_line.setAttribute("x2", xpos);
        playhead_line.setAttribute("y1", this._track_y);
        playhead_line.setAttribute("y2", this._song.tracks.length * this._line_height);
        playhead_line.setAttribute("style", "stroke:" + this._playhead_color + ";stroke-width:3;");
        this._playhead_element = playhead_line;
        this._tracks_canvas.appendChild(playhead_line);
    }




    select_tick_track_area()
    {
        return {'tick_start' : this._select_tick_start,
                'tick_stop' : this._select_tick_stop,
                'track_start' : this._select_line_start,
                'track_stop' : this._select_line_stop
                };
    }


    handle_cut(tick, do_remove_space)
    {
        if (!this._select_element)
        {
            return;
        }

        this._area_copy_buffer = this.select_tick_track_area();
        this._area_copy_buffer_type = 'cut'
        cut_tracks_area(this._area_copy_buffer, do_remove_space);

        this._select_element.remove();
        this._select_element = null;
    }
    
    handle_copy(tick)
    {
        if (!this._select_element)
        {
            return;
        }

        this._area_copy_buffer = this.select_tick_track_area();
        this._area_copy_buffer_type = 'copy'

        this._select_element.remove();
        this._select_element = null;
    }
    
    handle_paste_insert_merge(tick, do_insert, do_merge)
    {
        if (!this._area_copy_buffer)
        {
            return;
        }

        if (!this._select_element)
        {
            // paste at playhead, same tracks as copy buffer
            paste_tracks_area(
                              this._area_copy_buffer, 
                              {'tick_start' : this._playhead_ticks,
                                      'tick_stop' : this._playhead_ticks + (this._area_copy_buffer['tick_stop'] - this._area_copy_buffer['tick_start']),
                                      'track_start' : this._area_copy_buffer['track_start'],
                                      'track_stop' : this._area_copy_buffer['track_stop']
                                      }, 
                              do_insert, 
                              do_merge,
                              this._area_copy_buffer_type
                             ); // paste copy buffer at playhead (same tracks), maybe insert space, maybe merge
        }
        else
        {
            paste_tracks_area(this._area_copy_buffer, this.select_tick_track_area(), do_insert, do_merge, this._area_copy_buffer_type); // paste copy buffer to selected area, maybe insert space, maybe merge
        }

        this._select_element.remove();
        this._select_element = null;
    }    
    
    handle_undo(tick)
    {
        undo_last_tracks_edit();
    }
    
    handle_redo(tick)
    {
        redo_last_tracks_edit();
    }
    
}
    


