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

        this._pixels_per_tick = 0.05;
        this._track_height = 20;
        
        this._button_padding = 4;
        this._button_width = this._track_height - (2 * this._button_padding);
        this._button_height = this._track_height - (2 * this._button_padding);
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

        this._solo_state = [];
        this._mute_state = [];
        
        this._allSoloTimerFunction = null;
        this._all_solo_highlighted = false;
        
        this._playing = false;
        
        
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
        this._tracks_canvas.addEventListener('mousemove', this.tracks_mousemovehandler);
        
        

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

        this.create_tracks();
        this.create_rulers();
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
    
    
    y2track(y)
    {
        return parseInt((y - this._track_y) / this._track_height);
    }
    
    y2track_zoomed(y)
    {
        return parseInt((y - this._track_y) / (this._track_height * this._tracks_zoom_y));
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
    
    tracks_mousemovehandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        trackwin_object.tracks_handle_mouse_move(x, y);
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
            var track_index = this.y2track_zoomed(y);
            if (track_index < 0)
            {
                track_index = 0;
            }
            else if (track_index >= (this._song.tracks.length))
            {
                track_index = this._song.tracks.length - 1;
            }
            
            pianowin_object.remove_track_events();
            pianowin_object.fill_note_events(track_index);
            
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

    tracks_handle_mouse_move(x, y)
    {
        // output("handle_mouse_over " + x + " " + y);
        var tick = this.x2tick_zoomed(x);
        
        if (this._bar_highlight_element)
        {
            this._bar_highlight_element.remove();
            this._bar_highlight_element = null;
        }

        var track_index = this.y2track_zoomed(y);
        if (track_index < 0)
        {
            track_index = 0;
        }
        else if (track_index >= (this._song.tracks.length))
        {
            track_index = this._song.tracks.length - 1;
        }
            
        if (this._track_highlight_element)
        {
            this._track_highlight_element.remove();
        }
            
        this._track_highlight_element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        var width = this._info_width;
            
        this._track_highlight_element.id = 'tw_track_highlight';
        this._track_highlight_element.setAttribute("height", this._track_height);
        this._track_highlight_element.setAttribute("width", width);
        this._track_highlight_element.setAttribute("x", 0);
        this._track_highlight_element.setAttribute("y", this._track_y + (track_index * this._track_height));
        this._track_highlight_element.setAttribute("style", "fill:" + this._bg_color + ";stroke:black;stroke-width:0;fill-opacity:0.1;stroke-opacity:0.0");
        this._info_canvas.appendChild(this._track_highlight_element);
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
                this._bar_highlight_element.setAttribute("height", this._track_height * this._song.tracks.length);
                this._bar_highlight_element.setAttribute("width", width);
                this._bar_highlight_element.setAttribute("x", xpos);
                this._bar_highlight_element.setAttribute("y", this._track_y);
                this._bar_highlight_element.setAttribute("style", "fill:" + this._bg_color + ";stroke:black;stroke-width:0;fill-opacity:0.1;stroke-opacity:0.0");
                this._tracks_canvas.appendChild(this._bar_highlight_element);
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
        var height_style = "height:" + ((this._track_height * this._song.tracks.length) + this._track_y).toString() + ";";

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
        var height_style = "height:" + this._ruler_height.toString() + ";";

        this._menu_canvas.setAttribute("style", width_style + height_style);
    }
    
    create_track_bars(bars)
    {
        var height = this._track_height * this._song.tracks.length;
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
            var y = this._track_height * i;
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


    create_solo_button(track_index, highlight)
    {
        var solo_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        var x1 = this._solo_button_left;
        var y1 = this._track_y + (track_index * this._track_height) + this._button_padding;
        var x2 = x1 + this._button_width;
        var y2 = y1 + this._button_height;
        var id = highlight ? "track_solo_highlight_" + track_index.toString() : "track_solo_" + track_index.toString()
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

    create_mute_button(track_index, highlight)
    {
        var mute_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        
        var x1 = this._mute_button_left;
        var y1 = this._track_y + (track_index * this._track_height) + this._button_padding;
        var x2 = x1 + this._button_width;
        var y2 = y1 + this._button_height;
        
        var id = highlight ? "track_mute_highlight_" + track_index.toString() : "track_mute_" + track_index.toString()

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
        var info_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        var width = this._info_width;
        
        info_rect.id = 'track_info_' + track_index.toString();
        info_rect.setAttribute("height", this._track_height);
        info_rect.setAttribute("width", width);
        info_rect.setAttribute("x", 0);
        info_rect.setAttribute("y", this._track_y + (track_index * this._track_height));
        info_rect.setAttribute("style", "fill:" + this._bg_color + ";stroke:black;stroke-width:1;fill-opacity:0.1;stroke-opacity:1.0");
        info_rect.addEventListener('mouseover', this.track_info_mouseoverhandler);
        info_rect.addEventListener('mouseout', this.track_info_mouseouthandler);
        this._info_canvas.appendChild(info_rect);

        this._info_canvas.appendChild(this.create_solo_button(track_index, false));
        if (track_index > 0)
        {
            this._info_canvas.appendChild(this.create_mute_button(track_index, false));
        }

        var info_name_text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        info_name_text.id = 'track_name_' + track_index.toString();
        info_name_text.setAttribute("x", 2);
        info_name_text.setAttribute("y", this._track_y + (track_index * this._track_height) + 12);
        info_name_text.setAttribute("style", "fill:black;font-size:12px");
        info_name_text.textContent = trackname;
        this._info_canvas.appendChild(info_name_text);
        
        return width;
    }


    fill_track_events(track_index, track)
    {
        var width = 1;
        var last_painted_tick = -1;
        
        var y1 = this._track_y + (track_index * this._track_height) + 2;
        var y2 = this._track_y + ((track_index + 1) * this._track_height - 2);

        for (const event of track.events)
        {
            if (event.start > last_painted_tick)
            {
                var xpos = this.tick2x(event.start);
                var event_line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                event_line.id = 'tw_event_' + track_index.toString() + '_' + event.start.toString();
                event_line.setAttribute("x1", xpos);
                event_line.setAttribute("x2", xpos);
                event_line.setAttribute("y1", y1);
                event_line.setAttribute("y2", y2);
                event_line.setAttribute("style", "stroke:black;stroke-width:1;");
                this._tracks_canvas.appendChild(event_line);
                last_painted_tick = event.start;
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
        playhead_line.setAttribute("y2", this._height);
        playhead_line.setAttribute("style", "stroke:black;stroke-width:2;");
        this._playhead_element = playhead_line;
        this._tracks_canvas.appendChild(playhead_line);
    }
    
}
    


