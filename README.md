# ~~Precision 5490~~ ThinkPad T16s Gen 6 AMD Linux notes

- keyd: find ID of internal keyboard with `keyd monitor`. Remember to check the list - the keyd virtual keyboard will show your keystrokes.
  - also, decide what to do about right Ctrl and that stupid Copilot key
- Need to fix a huge regression in libinput where thumb detection is much less useful...not sure why nobody seemed to notice that
- Internal microphone has a bad DC offset and low signal level. Not sure where to start with this; might boot Windows to test
- ~~Firefox has no GPU / video acceleration. It's using 1000% CPU watching fullscreen YouTube at 2x speed. (This might be a consequence of my moving the Precision's hard drive over; leftover Nvidia drivers or something?)~~
  - ~~Nope, even the daily build of 25.04 with kernel 6.14 doesn't work with GPU acceleration with the Firefox snap. It's a snap issue, it seems. Installing the tarball from Mozilla works fine.~~ Switched to the Mozilla PPA.

## Suspend issue
This was difficult to troubleshoot. It's possible not all of these steps were necessary.

The first thing I tried was `cat /proc/acpi/wakeup` and disabling all those, but that did not make a difference.

My last steps before getting it to work correctly were these:
`echo "disabled" | sudo tee /sys/bus/i2c/devices/i2c-ELAN901C\:00/power/wakeup`
`echo "disabled" | sudo tee /sys/bus/i2c/devices/i2c-ELAN0676\:00/power/wakeup`

Those two i2c devices are the touchscreen (901C) and what is listed in dmesg as a touchpad and a mouse (0676).

It's possible only one of those is necessary. Those steps were derived from https://askubuntu.com/questions/1133919/ubuntu-18-04-2-immediately-wakes-up-from-suspend but I also checked the i2c bus since everything in USB was already disabled.

For now I created a sleep hook, `/usr/lib/systemd/system-sleep/disable-wakeup`:

```
#!/bin/sh

case "$1" in
    pre)
        echo "disabled" | tee /sys/bus/i2c/devices/i2c-ELAN901C:00/power/wakeup
        echo "disabled" | tee /sys/bus/i2c/devices/i2c-ELAN0676:00/power/wakeup
        ;;
esac
```

**Update:** The laptop still wakes from sleep upon connecting or disconnecting the power cable from USB. I want to experiment some more with preventing this.

## Network Issues

I was having a terrible time connecting to my Spectrum router, but randomly. Gradually I learned that it was connecting at 6 GHz when I was in the living room near the router, but 5 GHz or 2.4 GHz in other rooms. The 6 GHz connection does NOT work correctly. No information yet about exactly why. The WiFi chip in this machine shows up in `lspci` as `c2:00.0 Network controller: Qualcomm Technologies, Inc WCN785x Wi-Fi 7(802.11be) 320MHz 2x2 [FastConnect 7800] (rev 01)`. It's very new, and I'm on kernel `6.11.0-19-generic #19~24.04.1-Ubuntu SMP PREEMPT_DYNAMIC Mon Feb 17 11:51:52 UTC 2 x86_64 x86_64 x86_64 GNU/Linux` which is not the very latest from upstream.

To work around the problem, in KDE Settings for WiFi, I went to the connection and chose the BSSID (in the popup menu) whose entry mentioned 5 GHz. I imagine that if I go in a more distant room where 2.4 GHz is stronger I'll have to manually change it over to 2.4.

(One of the confusing symptoms of this issue was that the WiFi would work fine in one room and I would carry the laptop into the living room, where the router happens to be. If the laptop went to sleep and resumed, it would restart the wireless connection, and introduce the issue, presumably because that's when it renegotiates with the Spectrum WiFi router which frequency to connect on. If I was in a physical location where the 6 GHz connection was strong, it would default to that and the problems would begin.)
