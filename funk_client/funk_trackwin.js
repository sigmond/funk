class trackwin
{
    constructor(info_frame, tracks_frame)
    {
        this._ruler_height = 30;
        this._track_y = this._ruler_height;
        this._pixels_per_tick = 0.05;
        this._track_height = 20;

        this._tracks_canvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        
        this._tracks_canvas.setAttribute("class", "trackwin-tracks-canvas");
        this._tracks_canvas.id = 'trackwin_tracks_canvas';

        tracks_frame.appendChild(this._tracks_canvas);
        
        var wh = this._tracks_canvas.getClientRects()[0];
        this._height = wh.height;
        this._tracks_width = wh.width;

        this._info_canvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        
        this._info_canvas.setAttribute("class", "trackwin-info-canvas");
        this._info_canvas.id = 'trackwin_info_canvas';

        info_frame.appendChild(this._info_canvas);

        var wh = this._info_canvas.getClientRects()[0];
        this._info_width = wh.width;
    }

    get tracks_canvas()
    {
        return this._tracks_canvas;
    }

    get info_canvas()
    {
        return this._info_canvas;
    }

    get height()
    {
        return this._height;
    }

    get tracks_width()
    {
        return this._tracks_width;
    }

    get info_width()
    {
        return this._info_width;
    }

    create_tracks(song)
    {
        var track_index = 0;
        var track_width = 0;
        var track_width_tmp;
        
        for (const track of song.tracks)
        {
            track_width_tmp = this.create_track_bars(track_index, song.bars);
            if (track_width_tmp > track_width)
            {
                track_width = track_width_tmp;
            }
            track_index++;
        }
        
        var width_style = "width:" + (track_width + 100).toString() + ";";
        var height_style = "height:" + ((this._track_height * song.tracks.length) + this._track_y + 100).toString() + ";";

        this._tracks_canvas.setAttribute("style", width_style + height_style);

        var wh = this._tracks_canvas.getClientRects()[0];
        this._height = wh.height;
        this._tracks_width = wh.width;


        track_index = 0;
        var info_width = 0;
        var info_width_tmp;

        for (const track of song.tracks)
        {
            info_width_tmp = this.create_track_info(track_index, track, song.tracknames[track_index]);
            if (info_width_tmp > info_width)
            {
                info_width = info_width_tmp;
            }
            track_index++;
        }

        width_style = "width:" + (info_width).toString() + ";";

        this._info_canvas.setAttribute("style", width_style);

        var wh = this._info_canvas.getClientRects()[0];
        this._info_width = wh.width;
    }

    create_rulers(song)
    {
        var tick;
        var next_seconds = 0;
        
        for (tick = 0; tick < song.ticks; tick++)
        {
            var seconds = song.tick2second(tick);

            if (seconds > next_seconds)
            {
                var width = 1;
                var xpos = parseInt(tick * this._pixels_per_tick);
                var ruler_line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                ruler_line.id = 'seconds_ruler_' + tick.toString();
                ruler_line.setAttribute("x1", xpos);
                ruler_line.setAttribute("x2", xpos);
                ruler_line.setAttribute("y1", 1);
                ruler_line.setAttribute("y2", (this._ruler_height / 2) - 1);
                ruler_line.setAttribute("style", "stroke:black;stroke-width:1;");
                this._tracks_canvas.appendChild(ruler_line);
                                        
                var ruler_text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                ruler_text.id = 'seconds_text_' + tick.toString();
                ruler_text.setAttribute("x", xpos + 2);
                ruler_text.setAttribute("y", 12);
                ruler_text.setAttribute("style", "fill:black;font-size:12px");
                var mins = parseInt(seconds / 60);
                var secs = parseInt(seconds) % 60;
                ruler_text.textContent = mins.toString() + ':' + secs.toString();
                this._tracks_canvas.appendChild(ruler_text);

                next_seconds += 5;
            }
            
        }


        var bar_index = 0;
        for (const bar of song.bars)
        {
            var width = 1;
            var bar_space = parseInt(bar.ticks * this._pixels_per_tick);
            var ruler_line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            ruler_line.id = 'bars_ruler_' + bar_index.toString();
            ruler_line.setAttribute("x1", bar_index * bar_space);
            ruler_line.setAttribute("x2", bar_index * bar_space);
            ruler_line.setAttribute("y1", (this._ruler_height / 2) + 1);
            ruler_line.setAttribute("y2", (this._ruler_height) - 2);
            ruler_line.setAttribute("style", "stroke:black;stroke-width:1;");
            this._tracks_canvas.appendChild(ruler_line);

            var ruler_text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            ruler_text.id = 'bars_text' + bar_index.toString();
            ruler_text.setAttribute("x", (bar_index * bar_space) + 2);
            ruler_text.setAttribute("y", 24);
            ruler_text.setAttribute("style", "fill:black;font-size:12px");
            ruler_text.textContent = (bar_index + 1).toString();
            this._tracks_canvas.appendChild(ruler_text);

            bar_index++;
        }

        return bar_index * width;
    }
    
    create_track_bars(track_index, bars)
    {
        var bar_index = 0;
        for (const bar of bars)
        {
            var width = parseInt(bar.ticks * this._pixels_per_tick);
            var bar_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

            bar_rect.id = 'track_' + track_index.toString() + '_' + bar_index.toString();
            bar_rect.setAttribute("height", this._track_height);
            bar_rect.setAttribute("width", width);
            bar_rect.setAttribute("x", bar_index * width);
            bar_rect.setAttribute("y", this._track_y + (track_index * this._track_height));
            bar_rect.setAttribute("style", "fill:blue;stroke:black;stroke-width:1;fill-opacity:0.1;stroke-opacity:1.0");
            this._tracks_canvas.appendChild(bar_rect);
            bar_index++;
        }

        return bar_index * width;
    }


    create_track_info(track_index, track, trackname)
    {
        var info_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        var width = this._info_width;
        
        info_rect.id = 'track_info' + track_index.toString();
        info_rect.setAttribute("height", this._track_height);
        info_rect.setAttribute("width", width);
        info_rect.setAttribute("x", 0);
        info_rect.setAttribute("y", this._track_y + (track_index * this._track_height));
        info_rect.setAttribute("style", "fill:blue;stroke:black;stroke-width:1;fill-opacity:0.1;stroke-opacity:1.0");
        this._info_canvas.appendChild(info_rect);

        var info_name_text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        info_name_text.id = 'track_name' + track_index.toString();
        info_name_text.setAttribute("x", 2);
        info_name_text.setAttribute("y", this._track_y + (track_index * this._track_height) + 12);
        info_name_text.setAttribute("style", "fill:black;font-size:12px");
        info_name_text.textContent = trackname;
        this._info_canvas.appendChild(info_name_text);
        
        return width;
    }
}
    


