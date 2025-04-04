# ThinkPad T16s Gen 6 AMD Linux notes
---

### To Do

#### System / Kernel
- [ ] Fix thumb detection regression in `libinput` & submit patches upstream
- [ ] Investigate whether `powertop --autotune` needs to run at every power source change or just at startup. Conduct actual power testing.
- [ ] Consider fan control: goal is no fan running unless truly needed.
- [ ] Continue troubleshooting & debugging https://gitlab.freedesktop.org/drm/amd/-/issues/4100
- [ ] After a while, check to be sure that sleep hook is still necessary for the i2c devices (maybe kernel or other updates resolve this?)

#### Keyboard / Input
- [x] Keyd setup isn't working right for Ctrl+Alt+Arrow shortcuts – investigate.
- [x] Keyd doesn't detect internal keyboard correctly – possibly due to ID change.
- [x] Evaluate key mapping:
  - [x] Compose set to right Ctrl
  - [x] Copilot-0 = Num Lock
  - [x] Copilot + Arrows = switch desktops
- [x] Consider numeric keypad mapping via keyd (Copilot key for locking?).

#### Display / Mouse / Touch
- [x] Disable middle-click paste (Wayland: https://github.com/milaq/XMousePasteBlock).
- [x] Enable cursor hiding while typing on Wayland (https://github.com/jinliu/kwin-effect-hide-cursor).
  - May require KDE source headers not available in public APIs.
  - Worked to install the .tar.gz release; never figured out deps to enable building from source

#### Wayland vs X
- [x] Switch to Wayland?
  - [x] Tried https://github.com/taj-ny/InputActions (previously kwin-gestures).
  - [x] InputActions is slower than Fusuma – sticking with Fusuma.
  - [x] Disable built-in KWin gestures via InputActions `touchpad` config:
    ```yaml
    gestures:
      - type: swipe
        fingers: 3
        direction: any
        actions: []

      - type: swipe
        fingers: 4
        direction: any
        actions: []
    ```

- [x] Investigate if Fusuma needs `-d` in KDE Autostart (not `.xsessionrc`). Consider doing same for xbanish.

#### GTK Settings
- [x] Set both `~/.config/gtk-3.0/settings.ini` and `gtk-4.0/settings.ini`:
    ```ini
    [Settings]
    gtk-primary-button-warps-slider=false
    ```

#### Miscellaneous Issues
- [ ] Investigate why `systemctl restart keyd` causes Bluetooth to re-enable.
- [x] Investigate why `sudo` takes 10s and re-enables Bluetooth on OEM kernel. (not seeing anymore?)
- [ ] BIOS setting check: May want to look into UMA Framebuffer Size in future.
- [x] Possible to accept keyboard login password only without waiting for fprint to timeout, fail, or succeed?
  - See below for pam.d/common-auth settings
  - Annoyingly this isn't easy to do; see https://unix.stackexchange.com/questions/615555/pam-fingerprint-login-blocks-password
- [ ] Sort out internal microphone...prefer a solution that is firmware based for the DC offset thing (not sure if an ALSA filter will be sufficient dynamic range)
- [ ] Firefox and other windows don't raise; they just "need attention". Investigate https://www.bazile.org/writing/2025/kde_activate_window_on_attention.html or similar

---
### Resolved / No Longer Relevant
- **Wake on AC connect/disconnect**: wakes up briefly then sleeps again – acceptable behavior.
- **Fingerprint reader going missing after suspend**: possibly resolved by kernel 6.14.
- **Bluetooth turns on spontaneously after resume or systemctl keyd restart**: low power drain; not worth fixing.
- **Shortcut to toggle touchscreen**: working in Wayland using `qdbus`.
- **Crash-on-resume**: seems to have stopped as of 2025-04-04.
- **`amdgpu.dcdebugmask=0x200` kernel param**: redundant or already applied.

### PAM settings
note max-tries=3 now, plus only 5sec to mitigate the annoying delay
```
auth    [success=2 default=ignore]      pam_fprintd.so max-tries=3 timeout=5 # debug
auth    [success=1 default=ignore]      pam_unix.so nullok try_first_pass
# here's the fallback if no module succeeds
auth    requisite                       pam_deny.so
# prime the stack with a positive return value if there isn't one already;
# this avoids us returning an error just because nothing sets a success code
# since the modules above will each just jump around
auth    required                        pam_permit.so
# and here are more per-package modules (the "Additional" block)
auth    optional                        pam_cap.so 
# end of pam-auth-update config
```

---

## Older content

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
- Look into `/sys/bus/acpi/devices/PNP0C0A:00`

## Network Issues

I was having a terrible time connecting to my Spectrum router, but randomly. Gradually I learned that it was connecting at 6 GHz when I was in the living room near the router, but 5 GHz or 2.4 GHz in other rooms. The 6 GHz connection does NOT work correctly. No information yet about exactly why. The WiFi chip in this machine shows up in `lspci` as `c2:00.0 Network controller: Qualcomm Technologies, Inc WCN785x Wi-Fi 7(802.11be) 320MHz 2x2 [FastConnect 7800] (rev 01)`. It's very new, and I'm on kernel `6.11.0-19-generic #19~24.04.1-Ubuntu SMP PREEMPT_DYNAMIC Mon Feb 17 11:51:52 UTC 2 x86_64 x86_64 x86_64 GNU/Linux` which is not the very latest from upstream.

To work around the problem, in KDE Settings for WiFi, I went to the connection and chose the BSSID (in the popup menu) whose entry mentioned 5 GHz. I imagine that if I go in a more distant room where 2.4 GHz is stronger I'll have to manually change it over to 2.4.

(One of the confusing symptoms of this issue was that the WiFi would work fine in one room and I would carry the laptop into the living room, where the router happens to be. If the laptop went to sleep and resumed, it would restart the wireless connection, and introduce the issue, presumably because that's when it renegotiates with the Spectrum WiFi router which frequency to connect on. If I was in a physical location where the 6 GHz connection was strong, it would default to that and the problems would begin.)
