class trackwin
{
    constructor(info_frame, tracks_frame)
    {
        this._ruler_height = 30;
        this._track_y = this._ruler_height;
        this._pixels_per_tick = 0.2;
        this._track_height = 20;

        this._tracks_canvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        
        this._tracks_canvas.setAttribute("class", "trackwin-tracks-canvas");
        this._tracks_canvas.id = 'trackwin_tracks_canvas';

        tracks_frame.appendChild(this._tracks_canvas);
        
        var wh = this._tracks_canvas.getClientRects()[0];
        this._height = wh.height;
        this._width = wh.width;

        this._info_canvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        
        this._info_canvas.setAttribute("class", "trackwin-info-canvas");
        this._info_canvas.id = 'trackwin_info_canvas';

        info_frame.appendChild(this._info_canvas);
    }

    get tracks_canvas()
    {
        return this._tracks_canvas;
    }

    get height()
    {
        return this._height;
    }

    get width()
    {
        return this._width;
    }

    create_tracks(song)
    {
        var track_index = 0;
        var track_width;
        
        for (const track of song.tracks)
        {
            track_width = this.create_track(track_index, song.bars);
            track_index++;
        }
        
        var width_style = "width:" + (track_width + 100).toString() + ";";
        var height_style = "height:" + ((this._track_height * song.tracks.length) + this._track_y + 100).toString() + ";";

        this._tracks_canvas.setAttribute("style", width_style + height_style);
    }
    
    create_track(track_index, bars)
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
            this.tracks_canvas.appendChild(bar_rect);
            bar_index++;
        }

        return bar_index * width;
    }
}
    


