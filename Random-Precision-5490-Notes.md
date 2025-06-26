Had to put this in `~/.config/mpv/mpv.conf` so that mpv would use the Intel GPU instead of firing up the discrete nVidia one:
```
vo=dmabuf-wayland
hwdec=vaapi
```

Also needed to set up full RPMfusion, sudo dnf install akmod-intel-ipu6, sudo ipu6-driver-select proprietary, sudo dnf swap ffmpeg-free ffmpeg --allowerasing (though Michael Tunnell had some easier thing to do instead on a video somewhere?)
